import { useParams, Navigate } from 'react-router-dom';
import { useQuiz } from '../../contexts/QuizContext';
import { AllQuestionsLearnPage } from '../../pages/AllQuestionsLearnPage';
import { CategorySpecificLearnPage } from '../../pages/CategorySpecificLearnPage';
import { useEffect } from 'react';
import { Container, Loader, Text, Stack } from '@mantine/core';

export function LearnModeWrapper() {
  const { mode, questionIndex } = useParams();
  const { enhancedLearnSet, setCurrent, setMode: setQuizMode, stateQuestions } = useQuiz();
  
  const index = parseInt(questionIndex, 10);
  
  
  useEffect(() => {
    setQuizMode('learn');
  }, [setQuizMode]);

  // Set current question (convert from 1-based to 0-based)
  useEffect(() => {
    if (!isNaN(index) && index >= 1 && index <= enhancedLearnSet.length) {
      setCurrent(index - 1);
    } else {
    }
  }, [index, setCurrent, enhancedLearnSet.length]);

  // Wait for state questions to load if we're accessing state question range (301+)
  if (index >= 301 && stateQuestions.length === 0) {
    return (
      <Container size="sm" mt="xl">
        <Stack align="center" gap="md">
          <Loader size="md" />
          <Text c="dimmed">Landesfragen werden geladen...</Text>
        </Stack>
      </Container>
    );
  }

  // Show loading state if data hasn't loaded yet (DEMO_DATA has only 2 questions)
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

  // Validate question index (only after data is loaded)
  if (isNaN(index) || index < 1 || index > enhancedLearnSet.length) {
    return <Navigate to="/not-found" replace />;
  }

  // Route based on mode
  if (mode === 'alle') {
    return <AllQuestionsLearnPage />;
  } else {
    // For category-specific learning (e.g., 'geschichte-1', 'politik-1', etc.)
    return <CategorySpecificLearnPage categoryMode={mode} />;
  }
}