import { executeCpp } from './core.mjs';

const cacheName = 'learn-cpp-runtime-v1';
async function cachedFetch(url) {
  let cache;
  try {
    cache = await caches.open(cacheName);
    const hit = await cache.match(url);
    if (hit) return hit;
  } catch {
    /* Private browsing may block Cache Storage. */
  }
  const response = await fetch(url);
  if (!response.ok)
    throw new Error('The compiler could not be downloaded. Check your connection and try again.');
  try {
    await cache?.put(url, response.clone());
  } catch {
    /* A full cache must not prevent execution. */
  }
  return response;
}
self.onmessage = async (event) => {
  const request = event.data;
  try {
    const manifestUrl = new URL('manifest.json', import.meta.url);
    let manifest;
    try {
      const response = await fetch(manifestUrl);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      manifest = await response.json();
    } catch (error) {
      throw new Error(
        `Compiler files could not be loaded (${error instanceof Error ? error.message : 'network error'}). Check your connection and reload the page. Asset: ${manifestUrl.pathname}`,
      );
    }
    const readBuffer = async (name) => {
      const info = manifest.files[name];
      const url = new URL(`bin/${name}.${info.sha256.slice(0, 12)}.gz`, import.meta.url);
      let compressed;
      try {
        compressed = await cachedFetch(url);
      } catch {
        throw new Error(
          `The ${name === 'sysroot.tar' ? 'standard library' : name} compiler component could not be downloaded. Check your connection and try again.`,
        );
      }
      const transport = new Uint8Array(await compressed.arrayBuffer());
      // Some static hosts set Content-Encoding on .gz responses, so fetch has
      // already decompressed the body. Others serve the gzip bytes unchanged.
      const bytes =
        transport[0] === 0x1f && transport[1] === 0x8b
          ? await new Response(
              new Blob([transport]).stream().pipeThrough(new DecompressionStream('gzip')),
            ).arrayBuffer()
          : transport.buffer;
      const digestBytes = crypto.subtle
        ? new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))
        : (await import('./bin/hash/sha2.js')).sha256(new Uint8Array(bytes));
      const digest = [...digestBytes].map((n) => n.toString(16).padStart(2, '0')).join('');
      if (digest !== info.sha256) {
        try {
          await (await caches.open(cacheName)).delete(url);
        } catch {
          /* Retry fetch next time. */
        }
        throw new Error('Compiler integrity check failed. Run again to download a clean copy.');
      }
      return bytes;
    };
    const result = await executeCpp(request, {
      readBuffer,
      phase: (data) => self.postMessage({ type: 'phase', ...data }),
    });
    self.postMessage({ type: 'result', result });
  } catch (error) {
    self.postMessage({
      type: 'result',
      result: {
        status: 'unavailable',
        stdout: '',
        stderr: error instanceof Error ? error.message : 'Compiler unavailable.',
        results: [],
      },
    });
  }
};
