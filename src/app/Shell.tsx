import { useEffect, useRef } from 'react';
import { NavLink, Link, Outlet, useLocation } from 'react-router-dom';
import { House, BookOpen, Terminal, FolderCode, ChartNoAxesColumn, Settings } from 'lucide-react';
import { progressStore } from '../lib/progress-store';
import { useProgress } from '../hooks/useProgress';
const navigation = [
  { to: '/home', name: 'Home', icon: House },
  { to: '/learn', name: 'Learn', icon: BookOpen },
  { to: '/practice', name: 'Practice', icon: Terminal },
  { to: '/projects', name: 'Projects', icon: FolderCode },
  { to: '/progress', name: 'Progress', icon: ChartNoAxesColumn },
];
export default function Shell() {
  const location = useLocation();
  const main = useRef<HTMLElement>(null);
  useProgress();
  const warning = progressStore.getWarning();
  useEffect(() => {
    main.current?.focus({ preventScroll: true });
    const anchor = location.hash ? document.getElementById(location.hash.slice(1)) : null;
    if (anchor) anchor.scrollIntoView();
    else window.scrollTo(0, 0);
  }, [location.pathname, location.hash]);
  return (
    <div className="app-shell">
      <a
        href="#main-content"
        className="skip-link"
        onClick={(event) => {
          event.preventDefault();
          main.current?.focus();
        }}
      >
        Skip to content
      </a>
      <aside className="sidebar">
        <Link to="/home" className="brand" aria-label="Learn C++ home">
          <span className="brand-mark">
            C<span>++</span>
          </span>
          <span className="brand-name">Learn C++</span>
        </Link>
        <nav aria-label="Main navigation">
          {navigation.map(({ to, name, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              aria-label={name}
              className={({ isActive }) =>
                isActive || (to === '/learn' && location.pathname.startsWith('/lesson'))
                  ? 'nav-link active'
                  : 'nav-link'
              }
            >
              <Icon size={20} strokeWidth={1.7} />
              <span>{name}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <span className="course-edition">THE C++17 PATH</span>
          <NavLink to="/settings" className="nav-link settings-link" aria-label="Settings">
            <Settings size={19} strokeWidth={1.7} />
            <span>Settings</span>
          </NavLink>
        </div>
      </aside>
      <header className="mobile-header">
        <Link className="brand" to="/home">
          <span className="brand-mark">
            C<span>++</span>
          </span>
          <span>Learn C++</span>
        </Link>
        <Link className="icon-button" to="/settings" aria-label="Settings">
          <Settings size={21} />
        </Link>
      </header>
      <main id="main-content" className="main-content" ref={main} tabIndex={-1}>
        {warning && (
          <div className="storage-warning" role="status">
            {warning}
          </div>
        )}
        <Outlet />
      </main>
    </div>
  );
}
