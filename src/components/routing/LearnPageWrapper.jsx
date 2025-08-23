import { useParams, Navigate } from 'react-router-dom';
import { useQuiz } from '../../contexts/QuizContext';
import { LearnPage } from '../../pages/LearnPage';
import { useEffect } from 'react';

export function LearnPageWrapper() {
  const { questionIndex } = useParams();
  const { learnSet, setCurrent, setMode } = useQuiz();
  
  const index = parseInt(questionIndex, 10);
  
  useEffect(() => {
    setMode('learn');
  }, [setMode]);

  // Set current question (convert from 1-based to 0-based)
  useEffect(() => {
    if (!isNaN(index) && index >= 1 && index <= learnSet.length) {
      setCurrent(index - 1);
    }
  }, [index, setCurrent, learnSet.length]);

  // Validate question index
  if (isNaN(index) || index < 1 || index > learnSet.length) {
    return <Navigate to="/not-found" replace />;
  }

  return <LearnPage />;
}