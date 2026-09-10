import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { lessons, exercises, modules, lessonById, projects } from '../content';
import { useProgress } from '../hooks/useProgress';
import { nextLesson } from '../lib/progress-store';
import ProgressBar from '../components/ProgressBar';
export default function Progress() {
  const p = useProgress(),
    completed = Object.keys(p.completedLessons).length;
  const practiceCount = exercises.filter(
    (e) => !e.projectId && e.id in p.completedExercises,
  ).length;
  return (
    <div className="page">
      <header className="page-heading">
        <p className="eyebrow">KNOWLEDGE YOU CAN BUILD ON</p>
        <h1>Your progress.</h1>
        <p className="lead">
          {completed
            ? 'Every solved problem is another idea understood.'
            : 'Your first step is still ahead. Make it a small one.'}
        </p>
      </header>
      <div className="progress-stats">
        <div>
          <strong>
            {completed}
            <span> / {lessons.length}</span>
          </strong>
          <p>Lessons completed</p>
        </div>
        <div>
          <strong>
            {practiceCount}
            <span> / {exercises.filter((e) => !e.projectId).length}</span>
          </strong>
          <p>Exercises accepted</p>
        </div>
        <div>
          <strong>
            {Object.keys(p.completedProjects).length}
            <span> / {projects.length}</span>
          </strong>
          <p>Projects verified</p>
        </div>
      </div>
      <section className="progress-modules">
        <h2>Your learning path</h2>
        {modules.map((m) => {
          const count = m.lessonIds.filter((id) => id in p.completedLessons).length;
          return (
            <div className="module-progress" key={m.id}>
              <div>
                <Link to={`/learn#${m.id}`}>{m.title}</Link>
                <span>
                  {count} of {m.lessonIds.length}
                </span>
              </div>
              <ProgressBar
                value={Math.round((count / m.lessonIds.length) * 100)}
                label={`${m.title} completion`}
              />
            </div>
          );
        })}
      </section>
      <section className="recent-section">
        <div className="section-heading">
          <h2>Recently explored</h2>
        </div>
        {p.recentLessons.length ? (
          p.recentLessons.map((id) => (
            <Link key={id} to={`/lesson/${id}`} className="recent-row">
              <div>
                <h3>{lessonById[id].title}</h3>
                <span>
                  {id in p.completedLessons ? 'Completed · revisit the idea' : 'In progress'}
                </span>
              </div>
              <ArrowRight size={18} />
            </Link>
          ))
        ) : (
          <div className="empty-state">
            <h3>A clear place to begin.</h3>
            <p>Read your first lesson, try the exercise, and see your progress take shape here.</p>
            <Link className="button primary" to={`/lesson/${nextLesson(p).id}`}>
              Begin first lesson <ArrowRight size={18} />
            </Link>
          </div>
        )}
      </section>
      <p className="quiet-note">
        Progress is saved in this browser on this device. Clearing browser data removes it.
      </p>
    </div>
  );
}
