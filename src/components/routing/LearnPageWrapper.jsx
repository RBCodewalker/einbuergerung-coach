import { useParams, Navigate } from 'react-router-dom';
import { useQuiz } from '../../contexts/QuizContext';
import { LearnPage } from '../../pages/LearnPage';
import { useEffect } from 'react';
import { Container, Loader, Text, Stack } from '@mantine/core';

export function LearnPageWrapper() {
  const { questionIndex } = useParams();
  const { enhancedLearnSet, setCurrent, setMode, stateQuestions } = useQuiz();
  
  const index = parseInt(questionIndex, 10);
  
  useEffect(() => {
    setMode('learn');
  }, [setMode]);

  // Set current question (convert from 1-based to 0-based)
  useEffect(() => {
    if (!isNaN(index) && index >= 1 && index <= enhancedLearnSet.length) {
      setCurrent(index - 1);
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

  // Validate question index
  if (isNaN(index) || index < 1 || index > enhancedLearnSet.length) {
    return <Navigate to="/not-found" replace />;
  }

  return <LearnPage />;
}