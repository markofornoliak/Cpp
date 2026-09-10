import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle2, Clock3 } from 'lucide-react';
import { lessonById, moduleById } from '../content';
import CodeBlock from '../components/CodeBlock';
import { progressStore } from '../lib/progress-store';
import { useProgress } from '../hooks/useProgress';
import NotFound from './NotFound';
export default function Lesson() {
  const { lessonId = '' } = useParams(),
    lesson = lessonById[lessonId],
    progress = useProgress();
  useEffect(() => {
    if (lesson) progressStore.visit(lesson.id);
  }, [lesson]);
  if (!lesson) return <NotFound />;
  const module = moduleById[lesson.moduleId],
    completed = lesson.id in progress.completedLessons;
  return (
    <article className="reading-page">
      <Link to="/learn" className="back-link">
        <ArrowLeft size={16} /> Learning path
      </Link>
      <header className="lesson-heading">
        <p className="eyebrow">
          CHAPTER {String(module.number).padStart(2, '0')} / {module.title}
        </p>
        <h1>{lesson.title}</h1>
        <p className="lead">{lesson.description}</p>
        <div className="lesson-meta">
          <span>
            Lesson {module.lessonIds.indexOf(lesson.id) + 1} of {module.lessonIds.length}
          </span>
          <span>
            <Clock3 size={15} /> {lesson.duration} min
          </span>
          {completed && (
            <span className="success-text">
              <CheckCircle2 size={16} /> Completed
            </span>
          )}
        </div>
      </header>
      <div className="objectives">
        <span>YOU WILL LEARN TO</span>
        {lesson.objectives.map((objective) => (
          <p key={objective}>{objective}</p>
        ))}
      </div>
      {lesson.blocks.map((block) => (
        <section key={block.title} className="theory-section">
          <h2>{block.title}</h2>
          {block.body.split('\n\n').map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
          {block.code && <CodeBlock code={block.code} />}
        </section>
      ))}
      <aside className="takeaway">
        <p className="eyebrow">TAKE THIS WITH YOU</p>
        <p>{lesson.takeaway}</p>
      </aside>
      <section className="lesson-practice">
        <div>
          <p className="eyebrow">{completed ? 'UNDERSTOOD. APPLIED.' : 'MAKE IT STICK'}</p>
          <h2>{completed ? 'Ready for the next idea.' : 'Turn understanding into code.'}</h2>
          <p className="muted">
            {completed
              ? 'Your solution passed the tests. You can revisit it anytime.'
              : 'Complete the exercise to finish this lesson and save your progress.'}
          </p>
        </div>
        <Link
          className="button primary"
          to={
            completed && lesson.nextId
              ? `/lesson/${lesson.nextId}`
              : `/practice/${lesson.exerciseIds[0]}`
          }
        >
          {completed && lesson.nextId
            ? 'Next lesson'
            : completed
              ? 'Review exercise'
              : 'Practice this lesson'}{' '}
          <ArrowRight size={18} />
        </Link>
        {completed && lesson.nextId && (
          <Link to={`/practice/${lesson.exerciseIds[0]}`} className="text-link">
            Review your solution
          </Link>
        )}
      </section>
      <nav className="lesson-pagination" aria-label="Lesson navigation">
        {lesson.previousId ? (
          <Link to={`/lesson/${lesson.previousId}`}>
            <ArrowLeft size={17} />
            <span>
              <small>Previous</small>
              {lessonById[lesson.previousId].title}
            </span>
          </Link>
        ) : (
          <span />
        )}
        {lesson.nextId ? (
          <Link to={`/lesson/${lesson.nextId}`}>
            <span>
              <small>Next</small>
              {lessonById[lesson.nextId].title}
            </span>
            <ArrowRight size={17} />
          </Link>
        ) : (
          <Link to="/progress">
            View your progress <ArrowRight size={17} />
          </Link>
        )}
      </nav>
    </article>
  );
}
