import { ArrowRight } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import { useProgress } from '../hooks/useProgress';
import { progressStore } from '../lib/progress-store';
export default function Welcome() {
  const progress = useProgress();
  if (progress.started) return <Navigate to="/home" replace />;
  return (
    <main className="welcome">
      <span className="wordmark">C++ / LEARN</span>
      <div className="welcome-grid">
        <div>
          <h1>
            Learn
            <br />
            <span>C++</span>
          </h1>
          <p className="welcome-copy">
            Build skills.
            <br />
            Solve problems.
            <br />
            Create what’s next.
          </p>
          <Link className="button primary" to="/home" onClick={progressStore.start}>
            Start Learning <ArrowRight size={18} />
          </Link>
          <p className="welcome-footnote">Your own pace. Your progress, saved here.</p>
        </div>
        <div className="code-sculpture" aria-hidden="true">
          <strong>
            C<span>++</span>
          </strong>
          <code>
            int main() &#123;
            <br />
            &nbsp; return 0;
            <br />
            &#125;
          </code>
        </div>
      </div>
    </main>
  );
}
