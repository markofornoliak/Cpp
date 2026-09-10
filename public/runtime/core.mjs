import { MemFS, Tar } from './memfs.mjs';

class ProcessExit extends Error {
  constructor(code) {
    super(`Program exited with code ${code}.`);
    this.code = code;
  }
}

// This is the complete capability boundary. Learner Wasm receives an in-memory
// filesystem and basic WASI calls. No DOM, network, JavaScript, or host files.
async function runModule(module, fs, args) {
  let memory;
  const encoder = new TextEncoder();
  const strings = args.map((arg) => encoder.encode(arg + '\0'));
  const write32 = (offset, value) => new DataView(memory.buffer).setUint32(offset, value, true);
  const wasi = {
    ...fs.exports,
    proc_exit: (code) => {
      throw new ProcessExit(code);
    },
    environ_sizes_get: (count, size) => {
      write32(count, 0);
      write32(size, 0);
      return 0;
    },
    environ_get: () => 0,
    args_sizes_get: (count, size) => {
      write32(count, strings.length);
      write32(
        size,
        strings.reduce((n, s) => n + s.length, 0),
      );
      return 0;
    },
    args_get: (pointers, buffer) => {
      for (const arg of strings) {
        write32(pointers, buffer);
        new Uint8Array(memory.buffer, buffer, arg.length).set(arg);
        pointers += 4;
        buffer += arg.length;
      }
      return 0;
    },
    random_get: (pointer, length) => {
      const bytes = new Uint8Array(memory.buffer, pointer, length);
      for (let i = 0; i < bytes.length; i += 65536)
        crypto.getRandomValues(bytes.subarray(i, i + 65536));
      return 0;
    },
    clock_time_get: (_clock, _precision, pointer) => {
      new DataView(memory.buffer).setBigUint64(pointer, BigInt(Date.now()) * 1000000n, true);
      return 0;
    },
    poll_oneoff: () => 52,
  };
  const instance = await WebAssembly.instantiate(module, { wasi_unstable: wasi });
  memory = instance.exports.memory;
  fs.hostMem = {
    get buffer() {
      return memory.buffer;
    },
    check() {},
    read32: (offset) => new DataView(memory.buffer).getUint32(offset, true),
    write32,
    readStr: (offset, length) =>
      new TextDecoder().decode(new Uint8Array(memory.buffer, offset, length)),
    write: (offset, bytes) => new Uint8Array(memory.buffer, offset, bytes.length).set(bytes),
  };
  try {
    instance.exports._start();
    return 0;
  } catch (error) {
    if (error instanceof ProcessExit) return error.code;
    throw error;
  }
}

export async function executeCpp({ code, inputs }, { readBuffer, phase = () => {} }) {
  let stage = 'loading';
  let stdout = '',
    stderr = '';
  const outputLimit = 65536;
  const write = (text, fd) => {
    if (stdout.length + stderr.length + text.length > outputLimit)
      throw new Error('Output exceeded 64 KB. Check for an endless printing loop.');
    if (fd === 2) stderr += text;
    else stdout += text;
  };
  try {
    phase({ stage });
    const modules = new Map();
    const compileStreaming = async (name) => {
      if (!modules.has(name)) modules.set(name, WebAssembly.compile(await readBuffer(name)));
      return modules.get(name);
    };
    const fs = new MemFS({ compileStreaming, hostWrite: write, memfsFilename: 'memfs' });
    const [clang, lld, archive] = await Promise.all([
      compileStreaming('clang'),
      compileStreaming('lld'),
      readBuffer('sysroot.tar'),
      fs.ready,
    ]);
    new Tar(archive).untar(fs);
    fs.addFile('main.cpp', new TextEncoder().encode(code));
    stage = 'compiling';
    phase({ stage });
    const compilerExit = await runModule(clang, fs, [
      'clang',
      '-cc1',
      '-emit-obj',
      '-disable-free',
      '-isysroot',
      '/',
      '-internal-isystem',
      '/include/c++/v1',
      '-internal-isystem',
      '/include',
      '-internal-isystem',
      '/lib/clang/8.0.1/include',
      '-std=c++17',
      '-O0',
      '-Wall',
      '-ferror-limit',
      '5',
      '-fmessage-length',
      '100',
      '-o',
      'main.o',
      '-x',
      'c++',
      'main.cpp',
    ]);
    if (compilerExit) return { status: 'compiler-error', stdout: '', stderr, results: [] };
    const linkerExit = await runModule(lld, fs, [
      'wasm-ld',
      '--no-threads',
      '--max-memory=134217728',
      '-z',
      'stack-size=1048576',
      '-Llib/wasm32-wasi',
      'lib/wasm32-wasi/crt1.o',
      'main.o',
      '-lc',
      '-lc++',
      '-lc++abi',
      'lib/clang/8.0.1/lib/wasi/libclang_rt.builtins-wasm32.a',
      '-o',
      'main.wasm',
    ]);
    if (linkerExit) return { status: 'compiler-error', stdout: '', stderr, results: [] };
    const program = await WebAssembly.compile(fs.getFileContents('main.wasm').slice());
    const diagnostics = stderr;
    const results = [];
    for (let index = 0; index < inputs.length; index++) {
      stage = 'running';
      phase({ stage, index });
      stdout = '';
      stderr = '';
      const runFs = new MemFS({
        compileStreaming,
        hostWrite: write,
        memfsFilename: 'memfs',
        stdinStr: inputs[index],
      });
      await runFs.ready;
      const exitCode = await runModule(program, runFs, ['main.wasm']);
      results.push({ stdout, stderr, exitCode });
      if (exitCode)
        return {
          status: 'runtime-error',
          stdout,
          stderr: stderr || `Program exited with code ${exitCode}.`,
          results,
        };
    }
    return { status: 'success', stdout: results[0]?.stdout ?? '', stderr: diagnostics, results };
  } catch (error) {
    return {
      status:
        stage === 'loading'
          ? 'unavailable'
          : stage === 'compiling'
            ? 'compiler-error'
            : 'runtime-error',
      stdout,
      stderr: `${stderr}\n${error instanceof Error ? error.message : 'Execution failed.'}`.trim(),
      results: [],
    };
  }
}
