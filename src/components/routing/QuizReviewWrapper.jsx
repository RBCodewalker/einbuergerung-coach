import { Navigate } from 'react-router-dom';
import { useQuiz } from '../../contexts/QuizContext';
import { ReviewPage } from '../../pages/ReviewPage';
import { useEffect } from 'react';

export function QuizReviewWrapper() {
  const { mode, setMode, setShowReview, showReview } = useQuiz();
  
  useEffect(() => {
    if (mode !== 'quiz') {
      setMode('quiz');
    }
    if (!showReview) {
      setShowReview(true);
    }
  }, [setMode, setShowReview, mode, showReview]);

  return <ReviewPage />;
}