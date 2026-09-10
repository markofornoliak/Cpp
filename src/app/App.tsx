import { lazy, Suspense, useEffect } from 'react';
import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Shell from './Shell';
import ErrorBoundary from '../components/ErrorBoundary';
import Welcome from '../pages/Welcome';
import Home from '../pages/Home';
import Learn from '../pages/Learn';
import Practice from '../pages/Practice';
import Projects from '../pages/Projects';
import Progress from '../pages/Progress';
import Settings from '../pages/Settings';
import NotFound from '../pages/NotFound';
const Workspace = lazy(() => import('../features/practice/Workspace'));
const Lesson = lazy(() => import('../pages/Lesson'));
function PageTitle() {
  const { pathname } = useLocation();
  useEffect(() => {
    document.title =
      pathname === '/'
        ? 'Learn C++ — Build what’s next'
        : `${document.querySelector('h1')?.textContent ?? 'Learn'} · Learn C++`;
  }, [pathname]);
  return null;
}
export default function App() {
  return (
    <ErrorBoundary>
      <HashRouter>
        <Suspense
          fallback={
            <div className="page-loading" role="status">
              Opening your workspace…
            </div>
          }
        >
          <Routes>
            <Route path="/" element={<Welcome />} />
            <Route element={<Shell />}>
              <Route path="/home" element={<Home />} />
              <Route path="/learn" element={<Learn />} />
              <Route path="/lesson/:lessonId" element={<Lesson />} />
              <Route path="/practice" element={<Practice />} />
              <Route path="/practice/:exerciseId" element={<Workspace />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/projects/:projectId" element={<Projects />} />
              <Route path="/progress" element={<Progress />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/welcome" element={<Navigate to="/" replace />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
          <PageTitle />
        </Suspense>
      </HashRouter>
    </ErrorBoundary>
  );
}
