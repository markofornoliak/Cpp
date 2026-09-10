import { useState } from 'react';
import { useProgress } from '../hooks/useProgress';
import { progressStore } from '../lib/progress-store';
import ConfirmDialog from '../components/ConfirmDialog';
export default function Settings() {
  const p = useProgress(),
    [confirm, setConfirm] = useState(false),
    [message, setMessage] = useState('');
  return (
    <div className="reading-page">
      <header className="page-heading">
        <p className="eyebrow">YOUR WORKSPACE</p>
        <h1>Settings</h1>
      </header>
      <section className="settings-section">
        <h2>Code editor</h2>
        <label className="setting-row">
          <span>Text size</span>
          <select
            value={p.preferences.editorFontSize}
            onChange={(e) =>
              progressStore.setPreferences({ editorFontSize: Number(e.target.value) })
            }
          >
            <option value={14}>14 px</option>
            <option value={16}>16 px</option>
            <option value={18}>18 px</option>
          </select>
        </label>
        <label className="setting-row">
          <span>Wrap long lines</span>
          <input
            type="checkbox"
            checked={p.preferences.wrapCode}
            onChange={(e) => progressStore.setPreferences({ wrapCode: e.target.checked })}
          />
        </label>
      </section>
      <section className="settings-section">
        <h2>Your learning data</h2>
        <p>
          Lessons, solutions, and project milestones are saved in this browser. No account is
          needed. Your code stays on your device.
        </p>
        <p className="muted">
          Private browsing or clearing site data can remove saved progress. There is no
          synchronization between devices.
        </p>
        <button className="button secondary" onClick={() => setConfirm(true)}>
          Reset learning progress
        </button>
        <p role="status" className="success-text">
          {message}
        </p>
      </section>
      <section className="settings-section">
        <h2>About the compiler</h2>
        <p>
          Practice uses real Clang/LLVM and C++17, compiled to WebAssembly. The compiler downloads
          on your first run and is cached when browser storage allows.
        </p>
        <p className="muted">
          Programs use prepared standard input. Threads, network access, operating system features,
          and C++ exceptions are unavailable. Each test has a 3-second run limit and a 128 MiB
          program memory limit.
        </p>
        <a
          className="text-link"
          href="https://github.com/markofornoliak/Cpp"
          target="_blank"
          rel="noreferrer"
        >
          Source code and documentation ↗
        </a>
      </section>
      {confirm && (
        <ConfirmDialog
          title="Start fresh?"
          confirm="Reset progress"
          onClose={() => setConfirm(false)}
          onConfirm={() => {
            progressStore.reset();
            setConfirm(false);
            setMessage('Learning progress and saved code have been reset.');
          }}
        >
          <p>
            This removes completed lessons, accepted exercises, projects, milestones, and saved code
            from this browser. Editor preferences are kept. This cannot be undone.
          </p>
        </ConfirmDialog>
      )}
    </div>
  );
}
