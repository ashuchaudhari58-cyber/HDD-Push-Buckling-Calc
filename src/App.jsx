import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary.jsx';
import { Layout } from './components/Layout.jsx';
import { useStore } from './state/store.jsx';
import Home from './pages/Home.jsx';
import ProjectPage from './pages/ProjectPage.jsx';
import Inputs from './pages/Inputs.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import Steps from './pages/Steps.jsx';
import Results from './pages/Results.jsx';
import Structural from './pages/Structural.jsx';
import Clamp from './pages/Clamp.jsx';
import Validation from './pages/Validation.jsx';
import Basis from './pages/Basis.jsx';
import Projects from './pages/Projects.jsx';
import Credits from './pages/Credits.jsx';

const Report = lazy(() => import('./pages/Report.jsx'));

export default function App() {
  const { results } = useStore();
  const loc = useLocation();
  return (
    <Layout>
      {!results ? (
        <div className="page"><div className="callout fail">The calculation could not run with the current inputs. Open <b>Design inputs</b> and correct the highlighted fields.</div></div>
      ) : (
        <ErrorBoundary resetKey={loc.pathname}>
        <Suspense fallback={<div className="page muted">Loading…</div>}>
          <Routes>
            <Route path="/" element={<Navigate to="/home" replace />} />
            <Route path="/home" element={<Home />} />
            <Route path="/project" element={<ProjectPage />} />
            <Route path="/inputs" element={<Inputs />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/steps" element={<Steps />} />
            <Route path="/results" element={<Results />} />
            <Route path="/structural" element={<Structural />} />
            <Route path="/clamp" element={<Clamp />} />
            <Route path="/validation" element={<Validation />} />
            <Route path="/basis" element={<Basis />} />
            <Route path="/report" element={<Report />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/credits" element={<Credits />} />
            <Route path="*" element={<Navigate to="/home" replace />} />
          </Routes>
        </Suspense>
        </ErrorBoundary>
      )}
    </Layout>
  );
}
