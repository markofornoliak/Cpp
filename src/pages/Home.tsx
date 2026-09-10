import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Terminal, FolderCode } from 'lucide-react';
import { lessons, moduleById } from '../content';
import { useProgress } from '../hooks/useProgress';
import { nextLesson } from '../lib/progress-store';
import ProgressBar from '../components/ProgressBar';
export default function Home() {
  const progress = useProgress(),
    next = nextLesson(progress),
    module = moduleById[next.moduleId];
  const count = Object.keys(progress.completedLessons).length,
    percent = Math.round((count / lessons.length) * 100),
    finished = count === lessons.length;
  return (
    <div className="page home-page">
      <header className="page-heading">
        <h1>Learn C++</h1>
      </header>
      <section className="home-progress" aria-label="Your progress">
        <div>
          <span>
            <strong>{count}</strong> of {lessons.length} lessons completed
          </span>
          <span>{percent}%</span>
        </div>
        <ProgressBar value={percent} label="Overall lesson completion" />
      </section>
      <section className="continue-panel">
        <div className="continue-text">
          <p className="eyebrow">
            {finished
              ? 'THE NEXT CHALLENGE'
              : count || progress.recentLessons.length
                ? 'CONTINUE LEARNING'
                : 'YOUR FIRST CHAPTER'}
          </p>
          <p className="chapter-number">
            {finished
              ? 'From knowledge to practice'
              : `Chapter ${String(module.number).padStart(2, '0')} · ${module.title}`}
          </p>
          <h2>{finished ? 'Build something of your own.' : next.title}</h2>
          <p className="muted">
            {finished
              ? 'Put your skills to work in a complete C++ project.'
              : `Lesson ${module.lessonIds.indexOf(next.id) + 1} of ${module.lessonIds.length} · ${next.duration} min`}
          </p>
          <Link className="button primary" to={finished ? '/projects' : `/lesson/${next.id}`}>
            {finished
              ? 'Explore projects'
              : count || progress.recentLessons.length
                ? 'Continue Learning'
                : 'Begin first lesson'}{' '}
            <ArrowRight size={18} />
          </Link>
        </div>
        <div className="continue-symbol" aria-hidden="true">
          <code>{'{ }'}</code>
        </div>
      </section>
      <div className="section-heading">
        <h2>Explore</h2>
      </div>
      <div className="gateway-list">
        {[
          {
            to: '/learn',
            title: 'The learning path',
            description: 'Six chapters. One solid foundation.',
            Icon: BookOpen,
          },
          {
            to: '/practice',
            title: 'A little practice',
            description: 'Turn an idea into working code.',
            Icon: Terminal,
          },
          {
            to: '/projects',
            title: 'Something you can build',
            description: 'Four projects with a purpose.',
            Icon: FolderCode,
          },
        ].map(({ to, title, description, Icon }) => (
          <Link to={to} className="gateway" key={to}>
            <Icon size={23} strokeWidth={1.5} />
            <div>
              <h3>{title}</h3>
              <p>{description}</p>
            </div>
            <ArrowRight size={19} />
          </Link>
        ))}
      </div>
    </div>
  );
}
