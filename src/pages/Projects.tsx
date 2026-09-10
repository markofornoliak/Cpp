import { Link, useParams } from 'react-router-dom';
import { ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { projects, projectById, exerciseById } from '../content';
import { useProgress } from '../hooks/useProgress';
import { progressStore } from '../lib/progress-store';
import NotFound from './NotFound';
export default function Projects() {
  const { projectId } = useParams(),
    progress = useProgress();
  if (projectId) {
    const p = projectById[projectId];
    if (!p) return <NotFound />;
    const complete = projectId in progress.completedProjects;
    return (
      <article className="reading-page">
        <Link to="/projects" className="back-link">
          <ArrowLeft size={16} /> All projects
        </Link>
        <header className="page-heading">
          <p className="eyebrow">
            {p.difficulty} PROJECT · {p.duration}
          </p>
          <h1>{p.title}</h1>
          <p className="lead">{p.description}</p>
          {complete && (
            <p className="success-text">
              <CheckCircle2 size={18} /> Verified — all tests passed
            </p>
          )}
        </header>
        <section className="theory-section">
          <h2>The brief</h2>
          <p>{exerciseById[p.exerciseId].description}</p>
        </section>
        <section className="theory-section">
          <h2>What it should do</h2>
          <ul className="requirements">
            {p.requirements.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </section>
        <section className="theory-section">
          <h2>A path to the finish</h2>
          <p className="muted">
            Use these milestones to organize your work. Passing the project tests verifies
            completion.
          </p>
          <div className="milestones">
            {p.milestones.map((m, index) => (
              <label key={m}>
                <input
                  type="checkbox"
                  checked={(progress.projectMilestones[projectId] ?? []).includes(index)}
                  onChange={() => progressStore.toggleMilestone(projectId, index)}
                />
                <span>{m}</span>
              </label>
            ))}
          </div>
        </section>
        <div className="concept-tags">
          {p.concepts.map((c) => (
            <span key={c}>{c}</span>
          ))}
        </div>
        <div className="project-cta">
          <Link className="button primary" to={`/practice/${p.exerciseId}`}>
            {complete
              ? 'Revisit your project'
              : progress.drafts[p.exerciseId]
                ? 'Continue building'
                : 'Open project workspace'}{' '}
            <ArrowRight size={18} />
          </Link>
        </div>
      </article>
    );
  }
  return (
    <div className="page">
      <header className="page-heading">
        <p className="eyebrow">FROM IDEAS TO WORKING PROGRAMS</p>
        <h1>Build something real.</h1>
        <p className="lead">Bring the pieces together. Make something you understand.</p>
      </header>
      <div className="project-grid">
        {projects.map((p, index) => (
          <Link key={p.id} className="project-card" to={`/projects/${p.id}`}>
            <div className="project-card-top">
              <span>PROJECT {String(index + 1).padStart(2, '0')}</span>
              {p.id in progress.completedProjects ? (
                <CheckCircle2 className="success-text" size={20} aria-label="Verified complete" />
              ) : (
                <span>{p.duration}</span>
              )}
            </div>
            <div className="project-glyph" aria-hidden="true">
              {['+ − × ÷', '? → !', '{ name }', 'Aa / 01'][index]}
            </div>
            <h2>{p.title}</h2>
            <p>{p.description}</p>
            <div className="project-card-bottom">
              <span>{p.difficulty}</span>
              <ArrowRight size={19} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
