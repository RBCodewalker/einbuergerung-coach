import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useCookieState } from '../hooks/useCookieState';
import { useQuizData } from '../hooks/useQuizData';
import { useQuizTimer } from '../hooks/useQuizTimer';
import { useApp } from './AppContext';
import { loadStateQuestions, getRandomStateQuestions, DEFAULT_STATE } from '../utils/stateQuestions';

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
  const [selectedState, setSelectedState] = useCookieState('lid.selectedState', DEFAULT_STATE, cookiesEnabled);
  const [stateQuestions, setStateQuestions] = useState([]);

  // Load state questions when selectedState changes (always load since we always have a default state)
  useEffect(() => {
    const loadState = async () => {
      try {
        const questions = await loadStateQuestions(selectedState);
        setStateQuestions(questions);
      } catch (error) {
        console.error('Failed to load state questions:', error);
        setStateQuestions([]);
      }
    };
    
    if (selectedState) {
      loadState();
    }
  }, [selectedState]);

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

  // Clean up any existing duplicates between correctAnswers and incorrectAnswers
  useEffect(() => {
    if (stats && (stats.correctAnswers || stats.incorrectAnswers)) {
      const correctIds = Object.keys(stats.correctAnswers || {});
      const incorrectIds = Object.keys(stats.incorrectAnswers || {});
      const duplicates = correctIds.filter(id => incorrectIds.includes(id));
      
      if (duplicates.length > 0) {
        console.log(`🔧 Cleaning up ${duplicates.length} duplicate question(s) in stats:`, duplicates);
        setStats(prevStats => {
          const newCorrectAnswers = { ...prevStats.correctAnswers };
          const newIncorrectAnswers = { ...prevStats.incorrectAnswers };
          
          // Remove duplicates from incorrectAnswers (keep in correct since that's the latest state)
          duplicates.forEach(id => {
            delete newIncorrectAnswers[id];
          });
          
          return {
            ...prevStats,
            correctAnswers: newCorrectAnswers,
            incorrectAnswers: newIncorrectAnswers
          };
        });
      }
    }
  }, [stats?.correctAnswers, stats?.incorrectAnswers, setStats]);

  // Quiz questions with state integration - always 33 total (30 general + 3 state for quiz mode)
  // CRITICAL BUG FIX: Never change quiz questions during an active quiz session
  const quizSet = useMemo(() => {
    // When in quiz mode, use the correctAnswers state from when quiz was STARTED, not current
    // This prevents questions from jumping when user selects answers during quiz
    const shouldExcludeCorrect = excludeCorrect && mode !== 'quiz';
    const correctAnswersToExclude = shouldExcludeCorrect ? stats?.correctAnswers || {} : {};
    const baseQuizSet = getQuizSet(quizSeed, correctAnswersToExclude);
    
    // Always include state questions when available
    if (stateQuestions.length > 0) {
      // Only filter state questions if we're not in quiz mode
      const availableStateQuestions = shouldExcludeCorrect 
        ? stateQuestions.filter(q => !correctAnswersToExclude[q.id])
        : stateQuestions;
      
      // Get 3 random state questions for quiz mode
      const selectedStateQuestions = getRandomStateQuestions(availableStateQuestions, 3);
      
      // Combine: take 30 regular questions + 3 state questions = 33 total
      const regularQuestions = baseQuizSet.slice(0, Math.max(0, 33 - selectedStateQuestions.length));
      return [...regularQuestions, ...selectedStateQuestions];
    }
    
    return baseQuizSet;
  }, [getQuizSet, quizSeed, excludeCorrect, mode, ...(mode !== 'quiz' ? [stats?.correctAnswers] : []), stateQuestions]);
  
  // Enhanced learn set that includes ALL state questions (always 310 total: 300 general + 10 state)
  const enhancedLearnSet = useMemo(() => {
    if (stateQuestions.length > 0) {
      return [...learnSet, ...stateQuestions];
    }
    return learnSet;
  }, [learnSet, stateQuestions]);
  
  const questions = mode === 'quiz' ? quizSet : enhancedLearnSet;
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
      // First time answering this question - ensure mutual exclusivity
      setStats(s => {
        const newCorrectAnswers = { ...s.correctAnswers };
        const newIncorrectAnswers = { ...s.incorrectAnswers };
        
        if (isNextCorrect) {
          newCorrectAnswers[currentQA.id] = true;
          delete newIncorrectAnswers[currentQA.id]; // Remove from incorrect if exists
        } else {
          newIncorrectAnswers[currentQA.id] = answerIndex;
          delete newCorrectAnswers[currentQA.id]; // Remove from correct if exists
        }
        
        return {
          ...s,
          attempted: { ...s.attempted, [currentQA.id]: true },
          correct: s.correct + (isNextCorrect ? 1 : 0),
          wrong: s.wrong + (!isNextCorrect ? 1 : 0),
          correctAnswers: newCorrectAnswers,
          incorrectAnswers: newIncorrectAnswers
        };
      });
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

  // Helper function to ensure stats integrity and mutual exclusivity
  const validateAndCleanStats = (stats) => {
    const correctIds = Object.keys(stats.correctAnswers || {});
    const incorrectIds = Object.keys(stats.incorrectAnswers || {});
    const duplicates = correctIds.filter(id => incorrectIds.includes(id));
    
    if (duplicates.length > 0) {
      const newCorrectAnswers = { ...stats.correctAnswers };
      const newIncorrectAnswers = { ...stats.incorrectAnswers };
      
      // Remove duplicates from incorrectAnswers (prioritize correct answers as latest state)
      duplicates.forEach(id => {
        delete newIncorrectAnswers[id];
      });
      
      return {
        ...stats,
        correctAnswers: newCorrectAnswers,
        incorrectAnswers: newIncorrectAnswers
      };
    }
    
    return stats;
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
    enhancedLearnSet, // Include the enhanced learn set with state questions
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
    selectedState,
    setSelectedState,
    stateQuestions,
    stats,
    setStats,
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