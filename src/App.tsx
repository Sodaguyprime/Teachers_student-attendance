import { useEffect, useState } from 'react';
import { ScanPage } from './pages/ScanPage.js';
import { SessionPage } from './pages/SessionPage.js';
import { TeacherHome } from './pages/TeacherHome.js';

/**
 * Three screens, so the router is a switch rather than a dependency.
 *   /            teacher dashboard
 *   /session/:id live session
 *   /s/:id       what a student's phone opens
 */
export function App() {
  const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const scan = path.match(/^\/s\/([\w-]+)\/?$/);
  if (scan?.[1]) return <ScanPage sessionId={scan[1]} />;

  const session = path.match(/^\/session\/([\w-]+)\/?$/);
  if (session?.[1]) return <SessionPage sessionId={session[1]} onNavigate={navigate(setPath)} />;

  return <TeacherHome onNavigate={navigate(setPath)} />;
}

function navigate(setPath: (p: string) => void) {
  return (to: string) => {
    window.history.pushState({}, '', to);
    setPath(to);
  };
}
