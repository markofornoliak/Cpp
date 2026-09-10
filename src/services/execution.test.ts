import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BrowserCodeExecutionService, compilerSummary, grade } from './execution';
import { exerciseById } from '../content';
import type { ExecutionResult } from '../types/learning';
class TestWorker {
  static latest: TestWorker;
  onmessage?: (event: { data: unknown }) => void;
  onerror?: () => void;
  terminate = vi.fn();
  postMessage = vi.fn();
  constructor(public url: string) {
    TestWorker.latest = this;
  }
  emit(data: unknown) {
    this.onmessage?.({ data });
  }
}
beforeEach(() => {
  vi.stubEnv('BASE_URL', '/Cpp/');
  vi.stubGlobal('Worker', TestWorker);
  vi.stubGlobal('DecompressionStream', class {});
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
describe('execution service', () => {
  it('uses the Pages base path and releases the worker on completion', async () => {
    const pending = new BrowserCodeExecutionService().execute(
      'code',
      ['5 7'],
      new AbortController().signal,
      vi.fn(),
    );
    expect(TestWorker.latest.url).toBe('/Cpp/runtime/worker.mjs');
    const result = {
      status: 'success',
      stdout: '12',
      stderr: '',
      results: [{ stdout: '12', stderr: '', exitCode: 0 }],
    };
    TestWorker.latest.emit({ type: 'result', result });
    expect(await pending).toEqual(result);
    expect(TestWorker.latest.terminate).toHaveBeenCalledOnce();
  });
  it('cancels an active compilation', async () => {
    const abort = new AbortController();
    const pending = new BrowserCodeExecutionService().execute('code', [''], abort.signal, vi.fn());
    abort.abort();
    expect((await pending).status).toBe('cancelled');
    expect(TestWorker.latest.terminate).toHaveBeenCalledOnce();
  });
  it('terminates an endless program with a per-test deadline', async () => {
    vi.useFakeTimers();
    const pending = new BrowserCodeExecutionService().execute(
      'code',
      [''],
      new AbortController().signal,
      vi.fn(),
    );
    TestWorker.latest.emit({ type: 'phase', stage: 'running', index: 0 });
    await vi.advanceTimersByTimeAsync(3001);
    expect((await pending).status).toBe('timeout');
    expect(TestWorker.latest.terminate).toHaveBeenCalledOnce();
  });
  it('handles worker failures and unsupported browsers honestly', async () => {
    const pending = new BrowserCodeExecutionService().execute(
      'code',
      [''],
      new AbortController().signal,
      vi.fn(),
    );
    TestWorker.latest.onerror?.();
    expect((await pending).status).toBe('unavailable');
    vi.stubGlobal('Worker', undefined);
    expect(
      (
        await new BrowserCodeExecutionService().execute(
          'code',
          [''],
          new AbortController().signal,
          vi.fn(),
        )
      ).status,
    ).toBe('unavailable');
  });
  it('requires every test to pass and does not accept only the sample', () => {
    const exercise = exerciseById['practice-input-operators'];
    const output: ExecutionResult = {
      status: 'success',
      stdout: '12',
      stderr: '',
      results: [{ stdout: '12', stderr: '', exitCode: 0 }],
    };
    expect(grade(exercise, output).status).toBe('wrong-answer');
    output.results = exercise.tests.map((test) => ({
      stdout: `  ${test.output}\n`,
      stderr: '',
      exitCode: 0,
    }));
    expect(grade(exercise, output).status).toBe('accepted');
    output.status = 'compiler-error';
    expect(grade(exercise, output).status).toBe('compiler-error');
  });
  it('extracts a useful compiler line without hiding raw details', () => {
    expect(compilerSummary("main.cpp:6:12: error: expected ';' after expression\ncode")).toBe(
      "Line 6: expected ';' after expression",
    );
  });
});
