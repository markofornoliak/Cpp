import { Check, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { modules, lessonById } from '../content';
import { useProgress } from '../hooks/useProgress';
import { nextLesson } from '../lib/progress-store';
export default function Learn() {
  const progress = useProgress(),
    current = nextLesson(progress);
  return (
    <div className="page">
      <header className="page-heading">
        <p className="eyebrow">THE C++17 PATH</p>
        <h1>Build your understanding.</h1>
        <p className="lead">From your first program to confident, modern C++.</p>
      </header>
      <div className="curriculum-meta">
        <span>6 chapters</span>
        <span>24 lessons</span>
      </div>
      <div className="curriculum">
        {modules.map((module) => {
          const done = module.lessonIds.filter((id) => id in progress.completedLessons).length;
          return (
            <section className="module" key={module.id} id={module.id}>
              <div className="module-heading">
                <span className="module-number">{String(module.number).padStart(2, '0')}</span>
                <div>
                  <h2>{module.title}</h2>
                  <p>{module.description}</p>
                </div>
                <span className="module-count">
                  {done}/{module.lessonIds.length}
                </span>
              </div>
              <div className="lesson-list">
                {module.lessonIds.map((id, index) => {
                  const lesson = lessonById[id],
                    completed = id in progress.completedLessons,
                    next = current.id === id;
                  return (
                    <Link
                      key={id}
                      to={`/lesson/${id}`}
                      className={`lesson-row ${next ? 'current' : ''}`}
                    >
                      <span className={`lesson-state ${completed ? 'completed' : ''}`}>
                        {completed ? (
                          <Check size={15} aria-label="Completed" />
                        ) : (
                          String(index + 1).padStart(2, '0')
                        )}
                      </span>
                      <span className="lesson-row-title">
                        {lesson.title}
                        {next && <span className="current-label">Up next</span>}
                      </span>
                      <span className="lesson-duration">{lesson.duration} min</span>
                      <ArrowUpRight size={17} />
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
