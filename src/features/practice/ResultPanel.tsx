import { Link } from 'react-router-dom';
import { CheckCircle2, CircleAlert, ArrowRight, LoaderCircle } from 'lucide-react';
import type { ExerciseResult } from '../../types/learning';
import type { ExecutionPhase } from '../../services/execution';
import { compilerSummary } from '../../services/execution';
export default function ResultPanel({
  phase,
  result,
  submitted,
  nextId,
  projectId,
  stale,
}: {
  phase: ExecutionPhase | null;
  result: ExerciseResult | null;
  submitted: boolean;
  nextId?: string;
  projectId?: string;
  stale: boolean;
}) {
  if (phase)
    return (
      <section className="result-panel" aria-live="polite" aria-busy="true">
        <div className="result-title">
          <LoaderCircle className="spin" size={20} />
          <h3>
            {phase.stage === 'loading'
              ? 'Preparing the compiler…'
              : phase.stage === 'compiling'
                ? 'Compiling your C++…'
                : submitted
                  ? `Running test ${(phase.index ?? 0) + 1}…`
                  : 'Running your program…'}
          </h3>
        </div>
        {phase.stage === 'loading' && (
          <p>
            The first run downloads the compiler. Later runs use the browser cache when available.
          </p>
        )}
      </section>
    );
  if (!result)
    return (
      <section className="result-panel empty-result">
        <h3>Output</h3>
        <p>Run your code to see its output. Submit when you’re ready to check all tests.</p>
      </section>
    );
  const status = result.status;
  const title = {
    success: 'Program finished',
    accepted: 'Accepted',
    'wrong-answer': 'Wrong answer',
    'compiler-error': 'Compiler error',
    'runtime-error': 'Runtime error',
    timeout: 'Execution timeout',
    unavailable: 'Compiler unavailable',
    cancelled: 'Execution cancelled',
  }[status];
  const error = !['success', 'accepted', 'cancelled'].includes(status);
  return (
    <section
      className={`result-panel ${status === 'accepted' ? 'accepted' : error ? 'result-error' : ''}`}
      aria-live="polite"
    >
      <div className="result-title">
        {status === 'accepted' ? (
          <CheckCircle2 size={21} />
        ) : error ? (
          <CircleAlert size={21} />
        ) : null}
        <h3>{title}</h3>
        {stale && <span className="result-stale">Code changed since this result</span>}
      </div>
      {submitted && (status === 'accepted' || status === 'wrong-answer') && (
        <p>
          {result.passed} of {result.total} tests passed.
          {status === 'accepted'
            ? projectId
              ? ' Project verified and saved.'
              : ' Lesson completed and saved.'
            : ' Check the input boundaries and output format, then try again.'}
        </p>
      )}
      {status === 'compiler-error' && <p>{compilerSummary(result.output.stderr)}</p>}
      {['runtime-error', 'timeout', 'unavailable', 'cancelled'].includes(status) && (
        <p>{result.output.stderr}</p>
      )}
      {(!submitted || status === 'wrong-answer') && status === 'success' && (
        <>
          <label>Standard output</label>
          <pre>{result.output.stdout || '(no output)'}</pre>
        </>
      )}
      {!submitted && result.output.results[0]?.stderr && (
        <details>
          <summary>Standard error</summary>
          <pre>{result.output.results[0].stderr}</pre>
        </details>
      )}
      {!submitted && status === 'runtime-error' && result.output.stdout && (
        <pre>{result.output.stdout}</pre>
      )}
      {result.output.stderr && ['compiler-error', 'success'].includes(status) && (
        <details>
          <summary>{status === 'success' ? 'Compiler warnings' : 'Compiler details'}</summary>
          <pre>{result.output.stderr}</pre>
        </details>
      )}
      {status === 'wrong-answer' && (
        <p className="muted">
          Additional test inputs and expected outputs stay hidden. Use Run with your own input to
          investigate.
        </p>
      )}
      {status === 'accepted' && !stale && (
        <Link
          className="button primary"
          to={projectId ? `/projects/${projectId}` : nextId ? `/lesson/${nextId}` : '/progress'}
        >
          {projectId ? 'View verified project' : nextId ? 'Next lesson' : 'View your progress'}{' '}
          <ArrowRight size={17} />
        </Link>
      )}
    </section>
  );
}
