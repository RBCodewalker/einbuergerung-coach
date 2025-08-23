import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useCookieState } from '../hooks/useCookieState';
import { useQuizData } from '../hooks/useQuizData';
import { useQuizTimer } from '../hooks/useQuizTimer';
import { useApp } from './AppContext';

const QuizContext = createContext();

export function useQuiz() {
  const context = useContext(QuizContext);
  if (!context) {
    throw new Error('useQuiz must be used within QuizProvider');
  }
  return context;
}

export function QuizProvider({ children }) {
  const { cookiesEnabled } = useApp();
  const { learnSet, getQuizSet } = useQuizData();

  // Quiz state
  const [mode, setMode] = useCookieState('lid.mode', 'dashboard', cookiesEnabled);
  const [quizSeed, setQuizSeed] = useState(0);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useCookieState('lid.answers', [], cookiesEnabled);
  const [flags, setFlags] = useCookieState('lid.flags', [], cookiesEnabled);
  const [showReview, setShowReview] = useState(false);
  const [quizDuration, setQuizDuration] = useCookieState('lid.quizDuration', 0, cookiesEnabled); // in minutes
  const [excludeCorrect, setExcludeCorrect] = useCookieState('lid.excludeCorrect', false, cookiesEnabled);

  // Stats
  const statsInit = { 
    attempted: {}, 
    correct: 0, 
    wrong: 0, 
    totalSessions: 0,
    correctAnswers: {}, // Track which questions were answered correctly
    incorrectAnswers: {}, // Track which questions were answered incorrectly with their wrong choice
    learnedQuestions: {} // Track questions marked as learned/reviewed
  };
  const [stats, setStats] = useCookieState('lid.stats', statsInit, cookiesEnabled);

  // Quiz questions
  const quizSet = useMemo(() => {
    const correctAnswersToExclude = excludeCorrect ? stats?.correctAnswers || {} : {};
    return getQuizSet(quizSeed, correctAnswersToExclude);
  }, [getQuizSet, quizSeed, excludeCorrect, stats?.correctAnswers]);
  const questions = mode === 'quiz' ? quizSet : learnSet;
  const currentQA = questions[current];
  const progress = questions.length ? ((current + 1) / questions.length) * 100 : 0;

  // Timer
  const handleTimeUp = () => {
    setShowReview(true);
    completeQuiz();
  };

  const { remaining, resetTimer, formatTime } = useQuizTimer(
    quizDuration,
    mode === 'quiz' && !showReview,
    handleTimeUp
  );

  // Initialize quiz when mode changes
  useEffect(() => {
    if (mode !== 'quiz') return;
    setAnswers(Array(questions.length).fill(-1));
    setFlags([]);
    setCurrent(0);
    setShowReview(false);
    resetTimer();
  }, [mode, quizSeed, questions.length, setAnswers, setFlags, resetTimer]);

  const handleAnswer = (answerIndex) => {
    if (mode !== 'quiz') return;
    
    const prev = answers[current] ?? -1;
    const next = [...answers];
    next[current] = answerIndex;
    setAnswers(next);

    // Update stats
    const isPrevCorrect = prev !== -1 && prev === currentQA.answerIndex;
    const isNextCorrect = answerIndex === currentQA.answerIndex;

    if (prev === -1) {
      setStats(s => ({
        ...s,
        attempted: { ...s.attempted, [currentQA.id]: true },
        correct: s.correct + (isNextCorrect ? 1 : 0),
        wrong: s.wrong + (!isNextCorrect ? 1 : 0),
        correctAnswers: isNextCorrect 
          ? { ...s.correctAnswers, [currentQA.id]: true }
          : { ...s.correctAnswers },
        incorrectAnswers: !isNextCorrect 
          ? { ...s.incorrectAnswers, [currentQA.id]: answerIndex }
          : { ...s.incorrectAnswers }
      }));
    } else if (isPrevCorrect !== isNextCorrect) {
      setStats(s => {
        const newCorrectAnswers = { ...s.correctAnswers };
        const newIncorrectAnswers = { ...s.incorrectAnswers };
        
        if (isNextCorrect) {
          newCorrectAnswers[currentQA.id] = true;
          delete newIncorrectAnswers[currentQA.id];
        } else {
          newIncorrectAnswers[currentQA.id] = answerIndex;
          delete newCorrectAnswers[currentQA.id];
        }
        
        return {
          ...s,
          correct: s.correct + (isNextCorrect ? 1 : -1),
          wrong: s.wrong + (isNextCorrect ? -1 : 1),
          correctAnswers: newCorrectAnswers,
          incorrectAnswers: newIncorrectAnswers
        };
      });
    }
  };

  const handleNext = () => {
    setCurrent(c => Math.min(c + 1, questions.length - 1));
  };

  const handlePrev = () => {
    setCurrent(c => Math.max(c - 1, 0));
  };

  const toggleFlag = () => {
    setFlags(f => 
      f.includes(current) 
        ? f.filter(x => x !== current) 
        : [...f, current]
    );
  };

  const completeQuiz = () => {
    const newAttempted = { ...stats.attempted };
    questions.forEach((q, i) => {
      if (answers[i] !== -1) newAttempted[q.id] = true;
    });
    setStats(s => ({
      ...s,
      attempted: newAttempted,
      totalSessions: s.totalSessions + 1,
    }));
  };

  const startNewQuiz = () => {
    setQuizSeed(Date.now());
    setMode('quiz');
  };

  const scoreSummary = () => {
    let correct = 0, wrong = 0, empty = 0;
    questions.forEach((q, i) => {
      if (answers[i] === -1) empty++;
      else if (answers[i] === q.answerIndex) correct++;
      else wrong++;
    });
    return { correct, wrong, empty, total: questions.length };
  };

  const markAsLearned = (questionId) => {
    setStats(s => ({
      ...s,
      learnedQuestions: {
        ...s.learnedQuestions,
        [questionId]: Date.now() // Store timestamp when marked as learned
      }
    }));
  };

  const unmarkAsLearned = (questionId) => {
    setStats(s => {
      const newLearnedQuestions = { ...s.learnedQuestions };
      delete newLearnedQuestions[questionId];
      return {
        ...s,
        learnedQuestions: newLearnedQuestions
      };
    });
  };

  const value = {
    // Data
    learnSet,
    questions,
    currentQA,
    
    // State
    mode,
    setMode,
    current,
    setCurrent,
    answers,
    flags,
    showReview,
    setShowReview,
    quizDuration,
    setQuizDuration,
    excludeCorrect,
    setExcludeCorrect,
    stats,
    progress,
    remaining,
    formatTime,
    
    // Actions
    handleAnswer,
    handleNext,
    handlePrev,
    toggleFlag,
    completeQuiz,
    startNewQuiz,
    scoreSummary,
    markAsLearned,
    unmarkAsLearned,
  };

  return (
    <QuizContext.Provider value={value}>
      {children}
    </QuizContext.Provider>
  );
}