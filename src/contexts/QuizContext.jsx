import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useStorageState } from '../hooks/useStorageState';
import { useQuizData } from '../hooks/useQuizData';
import { useQuizTimer } from '../hooks/useQuizTimer';
import { useApp } from './AppContext';
import { loadStateQuestions, getRandomStateQuestions, DEFAULT_STATE } from '../utils/stateQuestions';
import { migrateFromCookies } from '../utils/storage';

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

  // Migrate from cookies to localStorage on first load
  useEffect(() => {
    migrateFromCookies();
  }, []);

  // Stats validator to ensure data integrity - backward compatible
  const statsValidator = (stats) => {
    return stats && 
           typeof stats === 'object' && 
           typeof stats.correct === 'number' && 
           typeof stats.wrong === 'number' &&
           typeof stats.totalSessions === 'number' &&
           typeof stats.attempted === 'object' &&
           typeof stats.correctAnswers === 'object' &&
           typeof stats.incorrectAnswers === 'object' &&
           typeof stats.learnedQuestions === 'object';
           // flaggedQuestions is optional for backward compatibility
  };

  // Quiz state - using robust storage for critical data
  const [mode, setMode] = useStorageState('lid.mode', 'dashboard', cookiesEnabled);
  const [quizSeed, setQuizSeed] = useState(0);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useStorageState('lid.answers', [], cookiesEnabled);
  const [flags, setFlags] = useStorageState('lid.flags', [], cookiesEnabled);
  const [showReview, setShowReview] = useState(false);
  const [showTimeUpModal, setShowTimeUpModal] = useState(false);
  const [quizDuration, setQuizDuration] = useStorageState('lid.quizDuration', 0, cookiesEnabled);
  const [excludeCorrect, setExcludeCorrect] = useStorageState('lid.excludeCorrect', false, cookiesEnabled);
  const [selectedState, setSelectedState] = useStorageState('lid.selectedState', DEFAULT_STATE, cookiesEnabled);
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

  // Stats initialization with backward compatibility
  const statsInit = { 
    attempted: {}, 
    correct: 0, 
    wrong: 0, 
    totalSessions: 0,
    correctAnswers: {}, // Track which questions were answered correctly
    incorrectAnswers: {}, // Track which questions were answered incorrectly with their wrong choice
    learnedQuestions: {}, // Track questions marked as learned/reviewed
    flaggedQuestions: {} // Track questions flagged by user (persistent across sessions)
  };
  const [stats, setStats] = useStorageState('lid.stats', statsInit, cookiesEnabled, statsValidator);
  
  // Ensure flaggedQuestions exists for backward compatibility
  useEffect(() => {
    if (stats && typeof stats === 'object' && !stats.flaggedQuestions) {
      setStats(prevStats => ({
        ...prevStats,
        flaggedQuestions: {}
      }));
    }
  }, [stats, setStats]);

  // Data integrity check - ensure counts match unique questions and no overlaps
  useEffect(() => {
    if (!stats || !stats.correctAnswers || !stats.incorrectAnswers) return;
    
    const correctIds = Object.keys(stats.correctAnswers);
    const incorrectIds = Object.keys(stats.incorrectAnswers);
    const actualCorrect = correctIds.length;
    const actualWrong = incorrectIds.length;
    
    // Check for overlaps (questions in both correct and incorrect)
    const overlaps = correctIds.filter(id => stats.incorrectAnswers[id]);
    
    // Check if counts match actual unique question counts
    const countsMatch = stats.correct === actualCorrect && stats.wrong === actualWrong;
    
    if (overlaps.length > 0 || !countsMatch) {
      console.log('🔧 Data integrity fix needed:', {
        overlaps: overlaps.length,
        counts: { stored: { correct: stats.correct, wrong: stats.wrong }, actual: { correct: actualCorrect, wrong: actualWrong } }
      });
      
      setStats(prevStats => {
        const newCorrectAnswers = { ...prevStats.correctAnswers };
        const newIncorrectAnswers = { ...prevStats.incorrectAnswers };
        
        // Remove overlaps - keep in correct answers (prioritize correct)
        overlaps.forEach(id => {
          delete newIncorrectAnswers[id];
        });
        
        // Recalculate counts from actual data
        const finalCorrect = Object.keys(newCorrectAnswers).length;
        const finalWrong = Object.keys(newIncorrectAnswers).length;
        
        return {
          ...prevStats,
          correctAnswers: newCorrectAnswers,
          incorrectAnswers: newIncorrectAnswers,
          correct: finalCorrect,
          wrong: finalWrong
        };
      });
    }
  }, [stats?.correctAnswers, stats?.incorrectAnswers, stats?.correct, stats?.wrong, setStats]);
  const [migrationCompleted, setMigrationCompleted] = useStorageState('lid.migrationCompleted', false, cookiesEnabled);

  // One-time migration cleanup for existing users with duplicate question data
  useEffect(() => {
    // Skip if migration already completed or no stats exist
    if (migrationCompleted || !stats || (!stats.correctAnswers && !stats.incorrectAnswers)) {
      return;
    }

    // Skip if stats are empty (new user)
    if (stats.correct === 0 && stats.wrong === 0 && Object.keys(stats.attempted || {}).length === 0) {
      setMigrationCompleted(true);
      return;
    }

    const correctAnswers = stats.correctAnswers || {};
    const incorrectAnswers = stats.incorrectAnswers || {};
    const attempted = stats.attempted || {};
    const correctIds = Object.keys(correctAnswers);
    const incorrectIds = Object.keys(incorrectAnswers);
    const attemptedIds = Object.keys(attempted);
    const duplicates = correctIds.filter(id => incorrectIds.includes(id));
    
    // Check if there's any mismatch in the data that needs fixing
    const allAnsweredIds = new Set([...correctIds, ...incorrectIds]);
    const attemptedSet = new Set(attemptedIds);
    const missingFromAttempted = [...allAnsweredIds].filter(id => !attemptedSet.has(id));
    const extraInAttempted = attemptedIds.filter(id => !allAnsweredIds.has(id));
    
    const needsFixing = duplicates.length > 0 || missingFromAttempted.length > 0 || extraInAttempted.length > 0 ||
                       stats.correct !== (correctIds.length - duplicates.length) || 
                       stats.wrong !== incorrectIds.length;
    
    if (needsFixing) {
      console.log(`🔧 One-time migration: Fixing stats inconsistencies:`, {
        duplicatesFound: duplicates.length,
        missingFromAttempted: missingFromAttempted.length,
        extraInAttempted: extraInAttempted.length,
        beforeCounts: { correct: stats.correct, wrong: stats.wrong, attempted: attemptedIds.length }
      });
      
      setStats(prevStats => {
        const newCorrectAnswers = { ...correctAnswers };
        const newIncorrectAnswers = { ...incorrectAnswers };
        
        // For existing users with duplicates: keep in incorrect, remove from correct
        duplicates.forEach(id => {
          delete newCorrectAnswers[id];
        });
        
        // Recalculate counts based on cleaned data
        const finalCorrectCount = Object.keys(newCorrectAnswers).length;
        const finalWrongCount = Object.keys(newIncorrectAnswers).length;
        
        // Rebuild attempted to exactly match the questions that have answers
        const allUniqueQuestionIds = new Set([...Object.keys(newCorrectAnswers), ...Object.keys(newIncorrectAnswers)]);
        const newAttempted = {};
        allUniqueQuestionIds.forEach(id => {
          newAttempted[id] = true;
        });
        
        console.log(`✅ Migration completed. Fixed stats:`, {
          afterCounts: { correct: finalCorrectCount, wrong: finalWrongCount, attempted: Object.keys(newAttempted).length }
        });
        
        return {
          ...prevStats,
          correctAnswers: newCorrectAnswers,
          incorrectAnswers: newIncorrectAnswers,
          correct: finalCorrectCount,
          wrong: finalWrongCount,
          attempted: newAttempted
        };
      });
    } else {
      console.log(`✅ Stats are already consistent, no migration needed.`);
    }
    
    // Mark migration as completed to prevent future runs
    setMigrationCompleted(true);
  }, [stats, migrationCompleted, setStats, setMigrationCompleted]);

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
  }, [getQuizSet, quizSeed, excludeCorrect, mode, stats?.correctAnswers, stateQuestions]);
  
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
  const handleTimeUp = useCallback(() => {
    setShowTimeUpModal(true);
    // Inline completeQuiz logic to avoid circular dependency
    const newAttempted = { ...stats.attempted };
    questions.forEach((q, i) => {
      if (answers[i] !== -1) newAttempted[q.id] = true;
    });
    setStats(s => ({
      ...s,
      attempted: newAttempted,
      totalSessions: s.totalSessions + 1,
    }));
  }, [setShowTimeUpModal, stats.attempted, questions, answers, setStats]);

  const { remaining, resetTimer, formatTime } = useQuizTimer(
    quizDuration,
    mode === 'quiz' && !showReview,
    handleTimeUp
  );

  // Initialize quiz when mode changes
  useEffect(() => {
    if (mode !== 'quiz') return;
    
    // Only reset answers and initialize when truly starting a new quiz
    setAnswers(Array(questions.length).fill(-1));
    setFlags([]); // Simple reset, flagged questions will be handled separately
    
    setCurrent(0);
    setShowReview(false);
    setShowTimeUpModal(false);
    resetTimer();
  }, [mode, quizSeed, setAnswers, setFlags, resetTimer]);

  const handleAnswer = useCallback((answerIndex) => {
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
        
        // Always ensure mutual exclusivity - a question can only be in one category
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
          correct: Object.keys(newCorrectAnswers).length,
          wrong: Object.keys(newIncorrectAnswers).length,
          correctAnswers: newCorrectAnswers,
          incorrectAnswers: newIncorrectAnswers
        };
      });
    } else if (isPrevCorrect !== isNextCorrect) {
      // Answer correctness changed - update both categories and counts
      setStats(s => {
        const newCorrectAnswers = { ...s.correctAnswers };
        const newIncorrectAnswers = { ...s.incorrectAnswers };
        
        // Ensure mutual exclusivity when moving between categories
        if (isNextCorrect) {
          newCorrectAnswers[currentQA.id] = true;
          delete newIncorrectAnswers[currentQA.id]; // Remove from incorrect
        } else {
          newIncorrectAnswers[currentQA.id] = answerIndex;
          delete newCorrectAnswers[currentQA.id]; // Remove from correct
        }
        
        return {
          ...s,
          attempted: { ...s.attempted, [currentQA.id]: true },
          correct: Object.keys(newCorrectAnswers).length,
          wrong: Object.keys(newIncorrectAnswers).length,
          correctAnswers: newCorrectAnswers,
          incorrectAnswers: newIncorrectAnswers
        };
      });
    } else if (prev !== -1 && !isNextCorrect && answers[current] !== answerIndex) {
      // User changed their wrong answer to another wrong answer - update the stored wrong answer
      setStats(s => ({
        ...s,
        attempted: { ...s.attempted, [currentQA.id]: true },
        incorrectAnswers: {
          ...s.incorrectAnswers,
          [currentQA.id]: answerIndex
        }
      }));
    }
  }, [mode, answers, current, currentQA, setAnswers, setStats]);

  const handleNext = useCallback(() => {
    setCurrent(c => Math.min(c + 1, questions.length - 1));
  }, [questions.length, setCurrent]);

  const handlePrev = useCallback(() => {
    setCurrent(c => Math.max(c - 1, 0));
  }, [setCurrent]);

  const toggleFlag = useCallback(() => {
    const questionId = questions[current]?.id;
    if (!questionId) return;
    
    // Update the temporary session flags (for UI display)
    setFlags(f => 
      f.includes(current) 
        ? f.filter(x => x !== current) 
        : [...f, current]
    );
    
    // Update persistent flagged questions in stats
    setStats(s => {
      const newFlaggedQuestions = { ...s.flaggedQuestions };
      if (s.flaggedQuestions[questionId]) {
        delete newFlaggedQuestions[questionId];
      } else {
        newFlaggedQuestions[questionId] = Date.now(); // Store timestamp when flagged
      }
      
      return {
        ...s,
        flaggedQuestions: newFlaggedQuestions
      };
    });
  }, [questions, current, setFlags, setStats]);

  const completeQuiz = useCallback(() => {
    const newAttempted = { ...stats.attempted };
    questions.forEach((q, i) => {
      if (answers[i] !== -1) newAttempted[q.id] = true;
    });
    setStats(s => ({
      ...s,
      attempted: newAttempted,
      totalSessions: s.totalSessions + 1,
    }));
  }, [stats.attempted, questions, answers, setStats]);


  const startNewQuiz = useCallback(() => {
    setQuizSeed(Date.now());
    setAnswers([]); // Reset answers for new quiz
    setFlags([]); // Reset flags for new quiz  
    setMode('quiz');
  }, [setAnswers, setFlags]);

  const scoreSummary = useCallback(() => {
    let correct = 0, wrong = 0, empty = 0;
    
    // Handle case where answers array is not properly initialized
    if (!Array.isArray(answers) || answers.length !== questions.length) {
      console.warn('Answers array mismatch:', {
        answersLength: answers?.length || 0,
        questionsLength: questions.length,
        answersType: typeof answers
      });
      
      // If answers array is wrong size, treat all as empty
      return { correct: 0, wrong: 0, empty: questions.length, total: questions.length };
    }
    
    // Debug logging
    console.log('=== SCORE SUMMARY DEBUG ===');
    console.log('Questions length:', questions.length);
    console.log('Answers length:', answers.length);
    console.log('Answers array:', answers);
    
    questions.forEach((q, i) => {
      const userAnswer = answers[i];
      const correctAnswer = q.answerIndex;
      
      console.log(`Question ${i + 1}:`, {
        userAnswer,
        correctAnswer,
        status: userAnswer === -1 ? 'empty' : userAnswer === correctAnswer ? 'correct' : 'wrong'
      });
      
      if (userAnswer === -1 || userAnswer === undefined) empty++;
      else if (userAnswer === correctAnswer) correct++;
      else wrong++;
    });
    
    console.log('Final counts:', { correct, wrong, empty, total: questions.length });
    console.log('=== END DEBUG ===');
    
    return { correct, wrong, empty, total: questions.length };
  }, [answers, questions]);

  const markAsLearned = useCallback((questionId) => {
    setStats(s => ({
      ...s,
      learnedQuestions: {
        ...s.learnedQuestions,
        [questionId]: Date.now() // Store timestamp when marked as learned
      }
    }));
  }, [setStats]);

  const unmarkAsLearned = useCallback((questionId) => {
    setStats(s => {
      const newLearnedQuestions = { ...s.learnedQuestions };
      delete newLearnedQuestions[questionId];
      return {
        ...s,
        learnedQuestions: newLearnedQuestions
      };
    });
  }, [setStats]);

  // Utility function to get all unique quizzed questions (correct + incorrect, no duplicates)
  const getQuizzedQuestions = useCallback(() => {
    const correctIds = new Set(Object.keys(stats?.correctAnswers || {}));
    const incorrectIds = new Set(Object.keys(stats?.incorrectAnswers || {}));
    
    // Union of both sets ensures no duplicates
    const allQuizzedIds = new Set([...correctIds, ...incorrectIds]);
    
    return {
      totalQuizzed: allQuizzedIds.size,
      correctCount: correctIds.size,
      incorrectCount: incorrectIds.size,
      quizzedIds: Array.from(allQuizzedIds)
    };
  }, [stats?.correctAnswers, stats?.incorrectAnswers]);

  // Utility function to get flagged questions
  const getFlaggedQuestions = useCallback(() => {
    const flaggedIds = Object.keys(stats?.flaggedQuestions || {});
    return {
      totalFlagged: flaggedIds.length,
      flaggedIds: flaggedIds
    };
  }, [stats?.flaggedQuestions]);

  // Direct flag/unflag by question ID (for use outside quiz mode)
  const toggleFlagById = useCallback((questionId) => {
    setStats(s => {
      const newFlaggedQuestions = { ...s.flaggedQuestions };
      if (s.flaggedQuestions[questionId]) {
        delete newFlaggedQuestions[questionId];
      } else {
        newFlaggedQuestions[questionId] = Date.now();
      }
      
      return {
        ...s,
        flaggedQuestions: newFlaggedQuestions
      };
    });
  }, [setStats]);

  const value = useMemo(() => ({
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
    showTimeUpModal,
    setShowTimeUpModal,
    
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
    getQuizzedQuestions,
    getFlaggedQuestions,
    toggleFlagById,
  }), [
    learnSet,
    enhancedLearnSet,
    questions,
    currentQA,
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
    // remaining and formatTime removed from dependencies to prevent unnecessary re-renders
    showTimeUpModal,
    setShowTimeUpModal,
    handleAnswer,
    handleNext,
    handlePrev,
    toggleFlag,
    completeQuiz,
    startNewQuiz,
    scoreSummary,
    markAsLearned,
    unmarkAsLearned,
    getQuizzedQuestions,
    getFlaggedQuestions,
    toggleFlagById,
  ]);

  return (
    <QuizContext.Provider value={value}>
      {children}
    </QuizContext.Provider>
  );
}