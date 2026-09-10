import { readFile, writeFile, mkdir, mkdtemp, rm, copyFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { gzipSync, gunzipSync } from 'node:zlib';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const root = new URL('../public/runtime/', import.meta.url);
const manifest = JSON.parse(await readFile(new URL('manifest.json', root), 'utf8'));
const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');
await mkdir(new URL('bin/', root), { recursive: true });
// SHA-256 fallback for local HTTP development, where WebCrypto is unavailable.
// The same integrity verification applies on HTTPS and HTTP.
await mkdir(new URL('bin/hash/', root), { recursive: true });
for (const name of ['sha2.js', '_md.js', '_u64.js', 'utils.js', 'LICENSE']) {
  await copyFile(
    new URL(`../node_modules/@noble/hashes/${name}`, import.meta.url),
    new URL(`bin/hash/${name}`, root),
  );
}
const missing = [];
for (const [name, info] of Object.entries(manifest.files)) {
  try {
    const bytes = gunzipSync(
      await readFile(new URL(`bin/${name}.${info.sha256.slice(0, 12)}.gz`, root)),
    );
    if (digest(bytes) !== info.sha256) throw new Error('Checksum mismatch');
  } catch {
    missing.push(name);
  }
}
if (missing.length) {
  let temporary;
  let source = process.env.CPP_RUNTIME_SOURCE;
  try {
    if (!source) {
      temporary = await mkdtemp(join(tmpdir(), 'learn-cpp-runtime-'));
      source = temporary;
      const git = (args) =>
        execFileSync('git', args, { cwd: source, stdio: 'inherit', timeout: 180_000 });
      git(['init', '--quiet']);
      git(['remote', 'add', 'origin', 'https://github.com/binji/wasm-clang.git']);
      git(['fetch', '--depth', '1', 'origin', manifest.revision]);
      git(['checkout', '--quiet', 'FETCH_HEAD']);
    }
    for (const name of missing) {
      const bytes = await readFile(join(source, name));
      const info = manifest.files[name];
      if (digest(bytes) !== info.sha256) throw new Error(`Runtime integrity check failed: ${name}`);
      await writeFile(
        new URL(`bin/${name}.${info.sha256.slice(0, 12)}.gz`, root),
        gzipSync(bytes, { level: 9 }),
      );
    }
  } finally {
    if (temporary) await rm(temporary, { recursive: true, force: true });
  }
}
console.log('C++ runtime ready; all four SHA-256 checks passed.');
