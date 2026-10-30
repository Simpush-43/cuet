import { HashRouter, Routes, Route } from 'react-router-dom';
import { ProgressProvider } from './context/ProgressContext.jsx';
import { ContentProvider } from './context/ContentContext.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import Layout from './components/Layout.jsx';
import Home from './pages/Home.jsx';
import SubjectPage from './pages/SubjectPage.jsx';
import ChapterPage from './pages/ChapterPage.jsx';
import ProgressPage from './pages/ProgressPage.jsx';
import AdminPage from './pages/AdminPage.jsx';

export default function App() {
  return (
    <AuthProvider>
      <ContentProvider>
        <ProgressProvider>
          <HashRouter>
            <Routes>
              <Route element={<Layout />}>
                <Route index element={<Home />} />
                <Route path="subject/:subjectId" element={<SubjectPage />} />
                <Route path="chapter/:chapterId" element={<ChapterPage />} />
                <Route path="progress" element={<ProgressPage />} />
                <Route path="admin" element={<AdminPage />} />
                <Route path="*" element={<Home />} />
              </Route>
            </Routes>
          </HashRouter>
        </ProgressProvider>
      </ContentProvider>
    </AuthProvider>
  );
}
