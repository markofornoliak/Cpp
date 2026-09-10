import { Worker } from 'node:worker_threads';
import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const exercises = JSON.parse(
  await readFile(new URL('../src/content/exercises.json', import.meta.url), 'utf8'),
);
const solutions = JSON.parse(
  await readFile(new URL('../validation/solutions.json', import.meta.url), 'utf8'),
);
const curriculum = JSON.parse(
  await readFile(new URL('../src/content/curriculum.json', import.meta.url), 'utf8'),
);
function execute(code, inputs) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('./runtime-test-worker.mjs', import.meta.url), {
      workerData: { code, inputs },
    });
    let timer = setTimeout(() => {
      void worker.terminate();
      reject(new Error('Compiler setup timed out'));
    }, 45000);
    worker.on('message', (message) => {
      if (message.type === 'phase' && message.phase.stage === 'running') {
        clearTimeout(timer);
        timer = setTimeout(() => {
          void worker.terminate();
          resolve({ status: 'timeout' });
        }, 3000);
      }
      if (message.type === 'result') {
        clearTimeout(timer);
        void worker.terminate();
        resolve(message.result);
      }
    });
    worker.on('error', (error) => {
      clearTimeout(timer);
      reject(error);
    });
  });
}
const normalize = (value) => value.trim().replace(/\s+/g, ' ');
let cases = 0;
for (const exercise of exercises) {
  const result = await execute(
    solutions[exercise.id],
    exercise.tests.map((test) => test.input),
  );
  assert.equal(result.status, 'success', `${exercise.id}: ${result.stderr}`);
  exercise.tests.forEach((test, i) => {
    assert.equal(
      normalize(result.results[i].stdout),
      normalize(test.output),
      `${exercise.id}, test ${i + 1}`,
    );
    cases++;
  });
  console.log(`PASS ${exercise.id} (${exercise.tests.length} cases)`);
}
for (const lesson of curriculum.lessons) {
  for (const block of lesson.blocks.filter((block) => block.code)) {
    const result = await execute(block.code, ['3 2']);
    assert.equal(result.status, 'success', `${lesson.id} example: ${result.stderr}`);
  }
}
assert.equal((await execute('int main() { broken }', [''])).status, 'compiler-error');
assert.equal((await execute('int main() { return 7; }', [''])).status, 'runtime-error');
assert.equal(
  (await execute('int main() { volatile int x=0; for (;;) { x = 1; } }', [''])).status,
  'timeout',
);
const noisy = await execute(
  '#include <iostream>\nint main(){for(int i=0;i<70000;++i)std::cout<<"x";}',
  [''],
);
assert.equal(noisy.status, 'runtime-error');
assert.match(noisy.stderr, /64 KB/);
const unicode = await execute(
  '#include <iostream>\n#include <string>\nint main(){std::string s;std::getline(std::cin,s);std::cout<<s;std::cerr<<"diagnostic";}',
  ['Grüße Київ'],
);
assert.equal(unicode.results[0].stdout, 'Grüße Київ');
assert.equal(unicode.results[0].stderr, 'diagnostic');
console.log(
  `Verified ${exercises.length} reference solutions, ${cases} cases, 24 lesson examples, errors, timeouts, output limits, UTF-8 and stderr.`,
);
