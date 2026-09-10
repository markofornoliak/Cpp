import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Play, Send, RotateCcw, CheckCircle2, Download } from 'lucide-react';
import { exerciseById, lessonById } from '../../content';
import { useProgress } from '../../hooks/useProgress';
import { progressStore } from '../../lib/progress-store';
import { executionService, grade } from '../../services/execution';
import type { ExecutionPhase } from '../../services/execution';
import type { Exercise, ExerciseResult } from '../../types/learning';
import NotFound from '../../pages/NotFound';
import CodeEditor from './CodeEditor';
import ResultPanel from './ResultPanel';
import ConfirmDialog from '../../components/ConfirmDialog';
function ExerciseWorkspace({ exercise }: { exercise: Exercise }) {
  const progress = useProgress();
  const [code, setCode] = useState(progress.drafts[exercise.id] ?? exercise.starterCode);
  const [input, setInput] = useState(exercise.sampleInput),
    [phase, setPhase] = useState<ExecutionPhase | null>(null);
  const [result, setResult] = useState<ExerciseResult | null>(null),
    [submitted, setSubmitted] = useState(false),
    [ranCode, setRanCode] = useState(''),
    [confirm, setConfirm] = useState(false);
  const controller = useRef<AbortController | null>(null),
    mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      controller.current?.abort();
    };
  }, []);
  function updateCode(value: string) {
    setCode(value);
    progressStore.saveDraft(exercise.id, value);
  }
  async function execute(submit: boolean) {
    if (controller.current) return;
    const abort = new AbortController();
    controller.current = abort;
    setSubmitted(submit);
    setResult(null);
    setRanCode(code);
    const output = await executionService.execute(
      code,
      submit ? exercise.tests.map((test) => test.input) : [input],
      abort.signal,
      (p) => {
        if (mounted.current) setPhase(p);
      },
    );
    if (!mounted.current) return;
    const outcome = submit
      ? grade(exercise, output)
      : { status: output.status, passed: 0, total: 0, output };
    if (outcome.status === 'accepted') progressStore.accept(exercise.id);
    setResult(outcome);
    setPhase(null);
    controller.current = null;
  }
  function downloadCode() {
    const url = URL.createObjectURL(new Blob([code], { type: 'text/plain' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `${exercise.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.cpp`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const lesson = lessonById[exercise.lessonId];
  return (
    <div className="workspace-page">
      <Link
        className="back-link"
        to={exercise.projectId ? `/projects/${exercise.projectId}` : `/lesson/${exercise.lessonId}`}
      >
        <ArrowLeft size={16} />
        {exercise.projectId ? 'Project brief' : lesson.title}
      </Link>
      <header className="workspace-heading">
        <div>
          <p className="eyebrow">
            {exercise.projectId ? 'PROJECT WORKSPACE' : 'PRACTICE'} / {exercise.difficulty}
          </p>
          <h1>{exercise.title}</h1>
        </div>
        {exercise.id in progress.completedExercises && (
          <span className="completion-tag">
            <CheckCircle2 size={17} /> Completed
          </span>
        )}
      </header>
      <div className="workspace-grid">
        <section className="task-panel">
          <h2>The task</h2>
          <p>{exercise.description}</p>
          <div className="sample-block">
            <div>
              <h3>Example input</h3>
              <pre>{exercise.sampleInput || '(no input)'}</pre>
            </div>
            <div>
              <h3>Expected output</h3>
              <pre>{exercise.sampleOutput || '(empty output)'}</pre>
            </div>
          </div>
          <details className="hints">
            <summary>A little help</summary>
            <ol>
              {exercise.hints.map((hint) => (
                <li key={hint}>{hint}</li>
              ))}
            </ol>
          </details>
        </section>
        <div className="code-workspace">
          <section className="editor-panel" aria-label="Code workspace">
            <div className="editor-toolbar">
              <span>
                main.cpp <small>C++17</small>
              </span>
              <div>
                <button
                  className="icon-button"
                  onClick={downloadCode}
                  aria-label="Download C++ source"
                >
                  <Download size={17} />
                </button>
                <button
                  className="icon-button"
                  onClick={() => setConfirm(true)}
                  disabled={!!phase}
                  aria-label="Reset starter code"
                >
                  <RotateCcw size={17} />
                </button>
              </div>
            </div>
            <CodeEditor
              value={code}
              onChange={updateCode}
              fontSize={progress.preferences.editorFontSize}
              wrap={progress.preferences.wrapCode}
            />
            <div className="editor-footer">
              <span>
                {progressStore.getWarning() ? 'Saved for this session' : 'Saved on this device'}
              </span>
              <span id="editor-help">Tab moves to the next control.</span>
            </div>
          </section>
          <div className="stdin-panel">
            <label htmlFor="standard-input">
              Standard input <span>Used by Run</span>
            </label>
            <textarea
              id="standard-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              maxLength={20000}
              rows={3}
              spellCheck={false}
            />
          </div>
          <div className="execution-actions">
            {phase ? (
              <button className="button secondary" onClick={() => controller.current?.abort()}>
                Cancel execution
              </button>
            ) : (
              <button className="button secondary" onClick={() => void execute(false)}>
                <Play size={17} />
                Run
              </button>
            )}
            <button
              className="button primary"
              disabled={!!phase}
              onClick={() => void execute(true)}
            >
              <Send size={17} />
              Submit solution
            </button>
          </div>
          <ResultPanel
            phase={phase}
            result={result}
            submitted={submitted}
            nextId={lesson.nextId}
            projectId={exercise.projectId}
            stale={!!result && code !== ranCode}
          />
          <details className="runtime-note">
            <summary>How practice works</summary>
            <p>
              Your code compiles and runs on this device. The first run downloads about 19 MB of
              compiler files. Provide all input before running; interactive terminal prompts are not
              supported.
            </p>
            <p>
              Submit runs the sample and additional tests. Whitespace between output tokens is
              ignored. Tests check program behavior; they do not prove which language construct you
              used. Each test is limited to 3 seconds and 128 MiB of program memory. C++17, without
              exceptions or threads.
            </p>
          </details>
        </div>
      </div>
      {confirm && (
        <ConfirmDialog
          title="Restore starter code?"
          confirm="Restore code"
          onClose={() => setConfirm(false)}
          onConfirm={() => {
            updateCode(exercise.starterCode);
            setConfirm(false);
          }}
        >
          <p>
            This replaces the saved code for this exercise with its starting code. Your completed
            lessons and accepted results remain.
          </p>
        </ConfirmDialog>
      )}
    </div>
  );
}
export default function Workspace() {
  const { exerciseId = '' } = useParams(),
    exercise = exerciseById[exerciseId];
  return exercise ? <ExerciseWorkspace key={exercise.id} exercise={exercise} /> : <NotFound />;
}
