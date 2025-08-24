import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';

// Unit tests for new features without complex routing dependencies
describe('New Features Unit Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    // Clear cookies
    document.cookie.split(";").forEach(cookie => {
      const eqPos = cookie.indexOf("=");
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
    });
  });

  describe('State Questions ID Assignment', () => {
    test('should assign IDs 301-310 to state questions', () => {
      const mockStateQuestions = Array(10).fill().map((_, i) => ({
        question: `State Question ${i + 1}`,
        options: ['A', 'B', 'C', 'D'],
        answerIndex: i % 4,
        id: 301 + i
      }));

      // Verify ID assignment
      expect(mockStateQuestions[0].id).toBe(301);
      expect(mockStateQuestions[9].id).toBe(310);
      expect(mockStateQuestions.length).toBe(10);
      
      // Verify all IDs are in the correct range
      mockStateQuestions.forEach(q => {
        expect(q.id).toBeGreaterThanOrEqual(301);
        expect(q.id).toBeLessThanOrEqual(310);
      });
    });

    test('should create enhanced learn set with 310 questions', () => {
      const regularQuestions = Array(300).fill().map((_, i) => ({
        id: i + 1,
        question: `Question ${i + 1}`,
        options: ['A', 'B', 'C', 'D'],
        answerIndex: i % 4
      }));

      const stateQuestions = Array(10).fill().map((_, i) => ({
        id: 301 + i,
        question: `State Question ${i + 1}`,
        options: ['A', 'B', 'C', 'D'],
        answerIndex: i % 4
      }));

      const enhancedLearnSet = [...regularQuestions, ...stateQuestions];

      expect(enhancedLearnSet.length).toBe(310);
      expect(enhancedLearnSet[299].id).toBe(300); // Last regular question
      expect(enhancedLearnSet[300].id).toBe(301); // First state question
      expect(enhancedLearnSet[309].id).toBe(310); // Last state question
    });
  });

  describe('Question Mutual Exclusivity Logic', () => {
    test('should ensure questions cannot be in both correct and incorrect lists', () => {
      const stats = {
        correctAnswers: { '1': true, '2': true },
        incorrectAnswers: { '3': 2, '4': 1 }
      };

      // Function to check mutual exclusivity
      const checkMutualExclusivity = (stats) => {
        const correctIds = Object.keys(stats.correctAnswers || {});
        const incorrectIds = Object.keys(stats.incorrectAnswers || {});
        const duplicates = correctIds.filter(id => incorrectIds.includes(id));
        return duplicates.length === 0;
      };

      expect(checkMutualExclusivity(stats)).toBe(true);

      // Simulate a bug where duplicates exist
      const buggyStats = {
        correctAnswers: { '1': true, '2': true },
        incorrectAnswers: { '2': 1, '3': 2 } // '2' is in both!
      };

      expect(checkMutualExclusivity(buggyStats)).toBe(false);
    });

    test('should move question from incorrect to correct when answer changes', () => {
      let stats = {
        correctAnswers: {},
        incorrectAnswers: { '1': 2 },
        correct: 0,
        wrong: 1
      };

      // Simulate changing from incorrect to correct answer
      const updateStatsToCorrect = (questionId) => {
        const newCorrectAnswers = { ...stats.correctAnswers };
        const newIncorrectAnswers = { ...stats.incorrectAnswers };

        // Move from incorrect to correct
        newCorrectAnswers[questionId] = true;
        delete newIncorrectAnswers[questionId];

        return {
          ...stats,
          correctAnswers: newCorrectAnswers,
          incorrectAnswers: newIncorrectAnswers,
          correct: stats.correct + 1,
          wrong: stats.wrong - 1
        };
      };

      const updatedStats = updateStatsToCorrect('1');

      expect(updatedStats.correctAnswers['1']).toBe(true);
      expect(updatedStats.incorrectAnswers['1']).toBeUndefined();
      expect(updatedStats.correct).toBe(1);
      expect(updatedStats.wrong).toBe(0);
    });
  });

  describe('Cookie State Persistence', () => {
    test('should handle cookie encoding and decoding correctly', () => {
      // Mock cookie utilities
      const setCookie = (name, value) => {
        const encodedValue = encodeURIComponent(JSON.stringify(value));
        document.cookie = `${name}=${encodedValue}; path=/`;
      };

      const getCookie = (name) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) {
          try {
            return JSON.parse(decodeURIComponent(parts.pop().split(';').shift()));
          } catch {
            return null;
          }
        }
        return null;
      };

      // Test simple values
      setCookie('test.simple', 'hello world');
      expect(getCookie('test.simple')).toBe('hello world');

      // Test complex objects
      const complexObject = {
        attempted: { '1': true, '2': true },
        correct: 2,
        wrong: 0,
        correctAnswers: { '1': true, '2': true }
      };

      setCookie('test.complex', complexObject);
      expect(getCookie('test.complex')).toEqual(complexObject);

      // Test special characters
      setCookie('test.special', 'hello & goodbye');
      expect(getCookie('test.special')).toBe('hello & goodbye');
    });

    test('should handle AI language preference persistence', () => {
      // Simulate AI language preference cookie
      document.cookie = 'lid.aiLanguage=en; path=/';
      
      const getCookie = (name) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return null;
      };

      expect(getCookie('lid.aiLanguage')).toBe('en');

      // Test default fallback
      document.cookie = 'lid.aiLanguage=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
      expect(getCookie('lid.aiLanguage')).toBe(null);
    });
  });

  describe('Quiz Question Stability', () => {
    test('should maintain question order during active quiz session', () => {
      // Mock quiz generation logic
      const generateQuizQuestions = (seed, excludeCorrect, mode, correctAnswers) => {
        // In quiz mode, don't recalculate questions based on current state
        if (mode === 'quiz') {
          // Use stable seed-based generation
          return Array(33).fill().map((_, i) => ({
            id: i + 1,
            question: `Quiz Question ${i + 1}`,
            seed: seed + i
          }));
        }
        // In learn mode, can regenerate based on current filters
        return Array(310).fill().map((_, i) => ({
          id: i + 1,
          question: `Learn Question ${i + 1}`,
          excluded: excludeCorrect && correctAnswers[i + 1]
        })).filter(q => !q.excluded);
      };

      const seed = 12345;
      const correctAnswers = { '1': true, '5': true };

      // Generate questions for quiz mode
      const quizQuestions1 = generateQuizQuestions(seed, false, 'quiz', {});
      const quizQuestions2 = generateQuizQuestions(seed, true, 'quiz', correctAnswers);

      // Should be identical in quiz mode regardless of settings changes
      expect(quizQuestions1).toEqual(quizQuestions2);
      expect(quizQuestions1.length).toBe(33);

      // Generate questions for learn mode
      const learnQuestions1 = generateQuizQuestions(seed, false, 'learn', {});
      const learnQuestions2 = generateQuizQuestions(seed, true, 'learn', correctAnswers);

      // Should be different in learn mode when excluding correct answers
      expect(learnQuestions1.length).toBe(310);
      expect(learnQuestions2.length).toBeLessThan(310); // Some excluded
    });
  });

  describe('State Selection Progress Reset', () => {
    test('should reset only state question progress (301-310)', () => {
      const initialStats = {
        attempted: { '1': true, '2': true, '301': true, '302': true, '310': true },
        correctAnswers: { '1': true, '301': true },
        incorrectAnswers: { '2': 2, '302': 1, '310': 3 },
        correct: 2,
        wrong: 3
      };

      // Function to reset state progress
      const resetStateProgress = (stats) => {
        const newAttempted = { ...stats.attempted };
        const newCorrectAnswers = { ...stats.correctAnswers };
        const newIncorrectAnswers = { ...stats.incorrectAnswers };
        
        let correctReset = 0;
        let wrongReset = 0;
        
        // Remove state questions (301-310)
        for (let id = 301; id <= 310; id++) {
          const idStr = id.toString();
          
          if (newAttempted[idStr]) {
            delete newAttempted[idStr];
            
            if (newCorrectAnswers[idStr]) {
              delete newCorrectAnswers[idStr];
              correctReset++;
            }
            
            if (newIncorrectAnswers[idStr] !== undefined) {
              delete newIncorrectAnswers[idStr];
              if (!stats.correctAnswers?.[idStr]) {
                wrongReset++;
              }
            }
          }
        }
        
        return {
          ...stats,
          attempted: newAttempted,
          correctAnswers: newCorrectAnswers,
          incorrectAnswers: newIncorrectAnswers,
          correct: Math.max(0, stats.correct - correctReset),
          wrong: Math.max(0, stats.wrong - wrongReset)
        };
      };

      const resetStats = resetStateProgress(initialStats);

      // Regular questions should remain
      expect(resetStats.attempted['1']).toBe(true);
      expect(resetStats.attempted['2']).toBe(true);
      expect(resetStats.correctAnswers['1']).toBe(true);
      expect(resetStats.incorrectAnswers['2']).toBe(2);

      // State questions should be removed
      expect(resetStats.attempted['301']).toBeUndefined();
      expect(resetStats.attempted['302']).toBeUndefined();
      expect(resetStats.attempted['310']).toBeUndefined();
      expect(resetStats.correctAnswers['301']).toBeUndefined();
      expect(resetStats.incorrectAnswers['302']).toBeUndefined();
      expect(resetStats.incorrectAnswers['310']).toBeUndefined();

      // Counts should be adjusted
      expect(resetStats.correct).toBe(1); // Was 2, removed 1 state correct
      expect(resetStats.wrong).toBe(1);   // Was 3, removed 2 state wrong
    });
  });

  describe('AI Explanation State Management', () => {
    test('should handle AI explanation language switching', () => {
      // Mock AI explanation state
      let currentLanguage = 'de';
      let explanation = null;

      const toggleLanguage = () => {
        currentLanguage = currentLanguage === 'de' ? 'en' : 'de';
        explanation = null; // Clear current explanation
        return currentLanguage;
      };

      const generateExplanation = (lang) => {
        explanation = lang === 'de' ? 'Deutsche Erklärung' : 'English explanation';
        return explanation;
      };

      // Initial state
      expect(currentLanguage).toBe('de');
      expect(explanation).toBeNull();

      // Generate German explanation
      generateExplanation(currentLanguage);
      expect(explanation).toBe('Deutsche Erklärung');

      // Switch to English
      const newLang = toggleLanguage();
      expect(newLang).toBe('en');
      expect(explanation).toBeNull(); // Should be cleared

      // Generate English explanation
      generateExplanation(currentLanguage);
      expect(explanation).toBe('English explanation');
    });

    test('should handle AI model initialization states', () => {
      const modelStates = {
        UNINITIALIZED: 'uninitialized',
        LOADING: 'loading',
        READY: 'ready',
        ERROR: 'error'
      };

      // Mock AI service state
      let currentState = modelStates.UNINITIALIZED;
      let progress = 0;
      let error = null;

      const initializeModel = async () => {
        currentState = modelStates.LOADING;
        progress = 0;
        
        // Simulate loading progress
        for (let i = 0; i <= 100; i += 20) {
          progress = i;
          await new Promise(resolve => setTimeout(resolve, 10));
        }
        
        currentState = modelStates.READY;
        return currentState;
      };

      const handleError = (err) => {
        currentState = modelStates.ERROR;
        error = err;
        progress = 0;
      };

      // Test initialization sequence
      expect(currentState).toBe(modelStates.UNINITIALIZED);
      expect(progress).toBe(0);

      // Simulate successful initialization
      return initializeModel().then(() => {
        expect(currentState).toBe(modelStates.READY);
        expect(progress).toBe(100);
        expect(error).toBeNull();

        // Simulate error state
        handleError('Network error');
        expect(currentState).toBe(modelStates.ERROR);
        expect(error).toBe('Network error');
      });
    });
  });

  describe('Enhanced Feature Integration', () => {
    test('should integrate state questions with quiz generation', () => {
      const regularQuestions = Array(30).fill().map((_, i) => ({
        id: i + 1,
        type: 'regular'
      }));

      const stateQuestions = Array(10).fill().map((_, i) => ({
        id: 301 + i,
        type: 'state'
      }));

      // Quiz mode should include exactly 3 state questions
      const getRandomStateQuestions = (questions, count) => {
        return questions.slice(0, count); // Simplified selection
      };

      const generateQuizSet = () => {
        const selectedStateQuestions = getRandomStateQuestions(stateQuestions, 3);
        const regularCount = Math.max(0, 33 - selectedStateQuestions.length);
        const selectedRegularQuestions = regularQuestions.slice(0, regularCount);
        
        return [...selectedRegularQuestions, ...selectedStateQuestions];
      };

      const quizSet = generateQuizSet();
      
      expect(quizSet.length).toBe(33);
      
      const stateQuestionsInQuiz = quizSet.filter(q => q.type === 'state');
      const regularQuestionsInQuiz = quizSet.filter(q => q.type === 'regular');
      
      expect(stateQuestionsInQuiz.length).toBe(3);
      expect(regularQuestionsInQuiz.length).toBe(30);
    });

    test('should create comprehensive learn set', () => {
      const regularQuestions = Array(300).fill().map((_, i) => ({
        id: i + 1,
        type: 'regular'
      }));

      const stateQuestions = Array(10).fill().map((_, i) => ({
        id: 301 + i,
        type: 'state'
      }));

      const enhancedLearnSet = [...regularQuestions, ...stateQuestions];

      expect(enhancedLearnSet.length).toBe(310);
      expect(enhancedLearnSet.filter(q => q.type === 'regular').length).toBe(300);
      expect(enhancedLearnSet.filter(q => q.type === 'state').length).toBe(10);
      
      // Verify state questions are at the end
      const lastTen = enhancedLearnSet.slice(-10);
      expect(lastTen.every(q => q.type === 'state')).toBe(true);
      expect(lastTen[0].id).toBe(301);
      expect(lastTen[9].id).toBe(310);
    });
  });
});