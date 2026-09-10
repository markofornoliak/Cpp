import type { ExecutionResult, Exercise, ExerciseResult } from '../types/learning';
export interface ExecutionPhase {
  stage: 'loading' | 'compiling' | 'running';
  index?: number;
}
export interface CodeExecutionService {
  execute(
    code: string,
    inputs: string[],
    signal: AbortSignal,
    onPhase: (phase: ExecutionPhase) => void,
  ): Promise<ExecutionResult>;
}
const failure = (status: ExecutionResult['status'], stderr: string): ExecutionResult => ({
  status,
  stderr,
  stdout: '',
  results: [],
});
export class BrowserCodeExecutionService implements CodeExecutionService {
  execute(
    code: string,
    inputs: string[],
    signal: AbortSignal,
    onPhase: (phase: ExecutionPhase) => void,
  ): Promise<ExecutionResult> {
    if (signal.aborted) return Promise.resolve(failure('cancelled', 'Execution cancelled.'));
    if (code.length > 30000 || inputs.some((input) => input.length > 20000))
      return Promise.resolve(
        failure(
          'runtime-error',
          'Use at most 30,000 source characters and 20,000 input characters.',
        ),
      );
    if (
      typeof Worker === 'undefined' ||
      typeof WebAssembly === 'undefined' ||
      typeof DecompressionStream === 'undefined'
    )
      return Promise.resolve(
        failure(
          'unavailable',
          'This browser cannot load the C++ compiler. Use a current version of Chrome, Edge, Firefox, or Safari.',
        ),
      );
    return new Promise((resolve) => {
      let worker: Worker;
      let timer: ReturnType<typeof setTimeout>;
      let done = false;
      const finish = (result: ExecutionResult) => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        worker?.terminate();
        signal.removeEventListener('abort', cancel);
        resolve(result);
      };
      const cancel = () => finish(failure('cancelled', 'Execution cancelled. Your code is saved.'));
      const deadline = (ms: number, stage: ExecutionPhase['stage']) => {
        clearTimeout(timer);
        timer = setTimeout(
          () =>
            finish(
              failure(
                stage === 'loading' ? 'unavailable' : 'timeout',
                stage === 'loading'
                  ? 'The compiler download timed out. Check your connection, then try again.'
                  : stage === 'compiling'
                    ? 'Compilation exceeded 30 seconds. Simplify the source and try again.'
                    : 'The program exceeded 3 seconds. Check for an endless loop or excessive work.',
              ),
            ),
          ms,
        );
      };
      try {
        worker = new Worker(`${import.meta.env.BASE_URL}runtime/worker.mjs`, { type: 'module' });
        signal.addEventListener('abort', cancel, { once: true });
        worker.onmessage = (
          event: MessageEvent<{ type: string; result: ExecutionResult } & ExecutionPhase>,
        ) => {
          if (event.data.type === 'result') finish(event.data.result);
          else if (event.data.type === 'phase') {
            onPhase(event.data);
            deadline(
              event.data.stage === 'loading'
                ? 90000
                : event.data.stage === 'compiling'
                  ? 30000
                  : 3000,
              event.data.stage,
            );
          }
        };
        worker.onerror = () =>
          finish(
            failure(
              'unavailable',
              'The compiler worker could not start or ran out of memory. Close other tabs and try again.',
            ),
          );
        deadline(90000, 'loading');
        onPhase({ stage: 'loading' });
        worker.postMessage({ code, inputs });
      } catch {
        finish(
          failure(
            'unavailable',
            'The compiler could not start. Try reloading the page in a current browser.',
          ),
        );
      }
    });
  }
}
export const executionService = new BrowserCodeExecutionService();
export const normalizeOutput = (value: string) => value.trim().replace(/\s+/g, ' ');
export function grade(exercise: Exercise, output: ExecutionResult): ExerciseResult {
  if (output.status !== 'success')
    return { status: output.status, passed: 0, total: exercise.tests.length, output };
  const passed = exercise.tests.filter(
    (test, i) =>
      output.results[i]?.exitCode === 0 &&
      normalizeOutput(output.results[i].stdout) === normalizeOutput(test.output),
  ).length;
  return {
    status: passed === exercise.tests.length ? 'accepted' : 'wrong-answer',
    passed,
    total: exercise.tests.length,
    output,
  };
}
export function compilerSummary(details: string) {
  const match = details.match(/main\.cpp:(\d+):\d+: (?:fatal )?error: ([^\n]+)/);
  return match
    ? `Line ${match[1]}: ${match[2]}`
    : (details.split('\n').find((line) => line.trim()) ??
        'Compilation failed. Check the source and try again.');
}
