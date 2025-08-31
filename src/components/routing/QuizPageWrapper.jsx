import React, { useEffect, useState } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { useQuiz } from '../../contexts/QuizContext';
import { QuizPage } from '../../pages/QuizPage';
import { Modal, Text, Button, Group, Container, Loader, Stack } from '@mantine/core';

function QuizPageWrapperComponent() {
  const { questionIndex } = useParams();
  const navigate = useNavigate();
  // Only get the values we actually need to avoid unnecessary re-renders from timer updates
  const quizContext = useQuiz();
  const { questions, setCurrent, setMode, mode, answers, startNewQuiz, enhancedLearnSet } = quizContext;
  const [showRedirectModal, setShowRedirectModal] = useState(false);
  
  const index = parseInt(questionIndex, 10);
  

  useEffect(() => {
    // Check if user is trying to access quiz without being in quiz mode
    if (mode !== 'quiz' || questions.length === 0) {
      setShowRedirectModal(true);
      return;
    }
  }, [mode, questions.length]);

  // Set current question (convert from 1-based to 0-based)
  useEffect(() => {
    if (mode === 'quiz' && !isNaN(index) && index >= 1 && index <= questions.length) {
      setCurrent(index - 1);
    }
  }, [index, setCurrent, mode, questions.length]);

  // Show loading state if core data hasn't loaded yet
  if (enhancedLearnSet.length <= 2) {
    return (
      <Container size="sm" mt="xl">
        <Stack align="center" gap="md">
          <Loader size="md" />
          <Text c="dimmed">Fragen werden geladen...</Text>
        </Stack>
      </Container>
    );
  }

  // Validate question index
  if (mode === 'quiz' && (isNaN(index) || index < 1 || index > questions.length)) {
    return <Navigate to="/not-found" replace />;
  }

  const handleStartNewQuiz = () => {
    setShowRedirectModal(false);
    startNewQuiz();
    setMode('quiz');
  };

  const handleGoHome = () => {
    setShowRedirectModal(false);
    navigate('/');
  };

  if (showRedirectModal) {
    return (
      <Modal
        opened={true}
        onClose={handleGoHome}
        title="Quiz-Session nicht gefunden"
        centered
      >
        <Text mb="md">
          Sie versuchen auf eine Quiz-Frage zuzugreifen, haben aber keine aktive Quiz-Session. 
          Möchten Sie ein neues Quiz starten?
        </Text>
        <Group justify="flex-end" gap="sm">
          <Button variant="outline" onClick={handleGoHome}>
            Zur Startseite
          </Button>
          <Button onClick={handleStartNewQuiz}>
            Neues Quiz starten
          </Button>
        </Group>
      </Modal>
    );
  }

  if (mode !== 'quiz') {
    return null; // Loading state
  }

  return <QuizPage />;
}

// Memoize the component to prevent re-renders when timer updates
export const QuizPageWrapper = React.memo(QuizPageWrapperComponent);