import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { exercises, modules, lessonById } from '../content';
import { useProgress } from '../hooks/useProgress';
export default function Practice() {
  const progress = useProgress(),
    [filter, setFilter] = useState('all');
  const items = exercises.filter(
    (e) => !e.projectId && (filter === 'all' || lessonById[e.lessonId].moduleId === filter),
  );
  return (
    <div className="page">
      <header className="page-heading">
        <p className="eyebrow">THINK IT THROUGH. RUN IT.</p>
        <h1>Make the code yours.</h1>
        <p className="lead">Small problems. Real C++. A clearer understanding.</p>
      </header>
      <div className="list-toolbar">
        <span>{items.length} exercises</span>
        <label>
          Chapter{' '}
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All chapters</option>
            {modules.map((m) => (
              <option key={m.id} value={m.id}>
                {m.title}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="exercise-list">
        {items.map((e, index) => (
          <Link key={e.id} to={`/practice/${e.id}`} className="exercise-row">
            <span className="exercise-index">
              {e.id in progress.completedExercises ? (
                <CheckCircle2 className="success-text" size={20} aria-label="Completed" />
              ) : (
                String(index + 1).padStart(2, '0')
              )}
            </span>
            <div>
              <h2>{e.title}</h2>
              <p>{lessonById[e.lessonId].title}</p>
            </div>
            <span className="difficulty">{e.difficulty}</span>
            <ArrowUpRight size={19} />
          </Link>
        ))}
      </div>
      <p className="quiet-note">
        Practice runs on your device. The compiler downloads when you first run code.
      </p>
    </div>
  );
}
