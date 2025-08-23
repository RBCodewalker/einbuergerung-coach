import { Container, Group, Text } from '@mantine/core';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import { AppProvider, useApp } from './contexts/AppContext';
import { QuizProvider } from './contexts/QuizContext';
import { ThemeToggle } from './components/ui/ThemeToggle';
import { ConsentPage } from './pages/ConsentPage';
import { DashboardPage } from './pages/DashboardPage';
import { ReviewCorrectPage } from './pages/ReviewCorrectPage';
import { ReviewIncorrectPage } from './pages/ReviewIncorrectPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { LearnPageWrapper } from './components/routing/LearnPageWrapper';
import { QuizPageWrapper } from './components/routing/QuizPageWrapper';
import { QuizReviewWrapper } from './components/routing/QuizReviewWrapper';
import { HomeButton } from './components/ui/HomeButton';

function AppContent() {
  const { consent } = useApp();

  if (consent === 'ask') {
    return <ConsentPage />;
  }

  return (
    <Container 
      size="xl" 
      style={{ 
        minHeight: '100vh',
        margin: '0 auto',
        maxWidth: '1200px',
        width: '100%',
        paddingLeft: 'var(--mantine-spacing-md)',
        paddingRight: 'var(--mantine-spacing-md)',
      }} 
      py="md"
    >
      <Group justify="space-between" align="center" mb="xl" wrap="wrap">
        <HomeButton />
        <ThemeToggle />
      </Group>

      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/learn/:questionIndex" element={<LearnPageWrapper />} />
        <Route path="/quiz/:questionIndex" element={<QuizPageWrapper />} />
        <Route path="/quiz/review" element={<QuizReviewWrapper />} />
        <Route path="/review-correct" element={<ReviewCorrectPage />} />
        <Route path="/review-incorrect" element={<ReviewIncorrectPage />} />
        <Route path="/not-found" element={<NotFoundPage />} />
        <Route path="*" element={<Navigate to="/not-found" replace />} />
      </Routes>

      <Text size="xs" c="dimmed" mt="xl" ta="center">
        Die Fragen stammen vom{" "}
        <a
          href="https://www.bamf.de/SharedDocs/Anlagen/DE/Integration/Einbuergerung/gesamtfragenkatalog-lebenindeutschland.html?nn=282388"
          target="_blank"
          rel="noopener noreferrer"
          style={{ textDecoration: "underline" }}
        >
          © 2025 Bundesamt für Migration und Flüchtlinge (BAMF)
        </a>
        .
      </Text>
    </Container>
  );
}

function App() {
  return (
    <Router>
      <AppProvider>
        <QuizProvider>
          <AppContent />
        </QuizProvider>
      </AppProvider>
    </Router>
  );
}

export default App;