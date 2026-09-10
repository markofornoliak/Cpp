import { parentPort, workerData } from 'node:worker_threads';
import { readFile } from 'node:fs/promises';
import { gunzipSync } from 'node:zlib';
import { executeCpp } from '../public/runtime/core.mjs';
const manifest = JSON.parse(
  await readFile(new URL('../public/runtime/manifest.json', import.meta.url), 'utf8'),
);
const result = await executeCpp(workerData, {
  readBuffer: async (name) => {
    const info = manifest.files[name];
    const bytes = gunzipSync(
      await readFile(
        new URL(`../public/runtime/bin/${name}.${info.sha256.slice(0, 12)}.gz`, import.meta.url),
      ),
    );
    return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
  },
  phase: (phase) => parentPort.postMessage({ type: 'phase', phase }),
});
parentPort.postMessage({ type: 'result', result });
