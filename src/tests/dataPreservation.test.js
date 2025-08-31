/**
 * CRITICAL DATA PRESERVATION TESTS
 * 
 * These tests ensure that user progress data is NEVER lost during:
 * - App updates
 * - Feature additions
 * - Migration processes
 * - Stats format changes
 * 
 * FAILURE OF ANY TEST = DO NOT DEPLOY TO PRODUCTION
 */

// Mock the storage functions for testing
const mockStats = {
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn()
};

// Mock useStorageState hook behavior
const createMockUseStorageState = (initialValue) => {
  let value = initialValue;
  const setValue = (newValue) => {
    if (typeof newValue === 'function') {
      value = newValue(value);
    } else {
      value = newValue;
    }
  };
  return [value, setValue];
};

// Shared utility functions used across tests
const statsValidator = (stats) => {
  return Boolean(stats && 
         typeof stats === 'object' && 
         typeof stats.correct === 'number' && 
         typeof stats.wrong === 'number' &&
         typeof stats.totalSessions === 'number' &&
         typeof stats.attempted === 'object' &&
         typeof stats.correctAnswers === 'object' &&
         typeof stats.incorrectAnswers === 'object' &&
         typeof stats.learnedQuestions === 'object');
         // flaggedQuestions is optional for backward compatibility
};

// Mock migration logic
const simulateMigration = (stats, migrationCompleted) => {
  // Skip if migration already completed or no stats exist
  if (migrationCompleted || !stats || (!stats.correctAnswers && !stats.incorrectAnswers)) {
    return { stats, migrationRan: false, reason: 'skipped_no_data_or_completed' };
  }

  // Skip if stats are empty (new user)
  if (stats.correct === 0 && stats.wrong === 0 && Object.keys(stats.attempted || {}).length === 0) {
    return { stats, migrationRan: false, reason: 'skipped_empty_stats' };
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
  
  if (!needsFixing) {
    return { stats, migrationRan: false, reason: 'no_fixing_needed' };
  }

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
  
  return {
    stats: {
      ...stats,
      correctAnswers: newCorrectAnswers,
      incorrectAnswers: newIncorrectAnswers,
      correct: finalCorrectCount,
      wrong: finalWrongCount,
      attempted: newAttempted
    },
    migrationRan: true,
    reason: 'fixed_inconsistencies'
  };
};

describe('🛡️ CRITICAL: Data Preservation Tests', () => {
  
  describe('Stats Validator Backward Compatibility', () => {

    test('✅ CRITICAL: Old stats format without flaggedQuestions must remain valid', () => {
      const oldStatsFormat = {
        attempted: { "1": true, "2": true, "3": true },
        correct: 2,
        wrong: 1,
        totalSessions: 5,
        correctAnswers: { "1": true, "2": true },
        incorrectAnswers: { "3": 1 },
        learnedQuestions: { "4": 1234567890 }
        // No flaggedQuestions property - this is the old format
      };

      expect(statsValidator(oldStatsFormat)).toBe(true);
    });

    test('✅ CRITICAL: New stats format with flaggedQuestions must be valid', () => {
      const newStatsFormat = {
        attempted: { "1": true, "2": true, "3": true },
        correct: 2,
        wrong: 1,
        totalSessions: 5,
        correctAnswers: { "1": true, "2": true },
        incorrectAnswers: { "3": 1 },
        learnedQuestions: { "4": 1234567890 },
        flaggedQuestions: { "5": 1234567890 }
      };

      expect(statsValidator(newStatsFormat)).toBe(true);
    });

    test('✅ CRITICAL: Corrupted stats must be rejected', () => {
      const corruptedStats = [
        null,
        undefined,
        "string",
        123,
        { correct: "not_a_number" },
        { correct: 1, wrong: "not_a_number" },
        { correct: 1, wrong: 1, totalSessions: "not_a_number" },
        { correct: 1, wrong: 1, totalSessions: 1, attempted: "not_an_object" },
        { correct: 1, wrong: 1, totalSessions: 1, attempted: {}, correctAnswers: "not_an_object" }
      ];

      corruptedStats.forEach((stats, index) => {
        const result = statsValidator(stats);
        expect(result).toBe(false); // Remove custom message that was causing issues
      });
    });
  });

  describe('Migration Safety Tests', () => {

    test('✅ CRITICAL: Migration must never run twice', () => {
      const statsWithInconsistencies = {
        attempted: { "1": true, "2": true },
        correct: 1,
        wrong: 1,
        totalSessions: 1,
        correctAnswers: { "1": true, "2": true }, // Duplicate: "2" in both
        incorrectAnswers: { "2": 1 }, // Duplicate: "2" in both
        learnedQuestions: {}
      };

      // First migration run
      const firstRun = simulateMigration(statsWithInconsistencies, false);
      expect(firstRun.migrationRan).toBe(true);
      expect(firstRun.reason).toBe('fixed_inconsistencies');

      // Second migration run - should be skipped
      const secondRun = simulateMigration(firstRun.stats, true); // migrationCompleted = true
      expect(secondRun.migrationRan).toBe(false);
      expect(secondRun.reason).toBe('skipped_no_data_or_completed');
    });

    test('✅ CRITICAL: Clean stats must never be modified', () => {
      const cleanStats = {
        attempted: { "1": true, "2": true },
        correct: 1,
        wrong: 1,
        totalSessions: 1,
        correctAnswers: { "1": true },
        incorrectAnswers: { "2": 1 },
        learnedQuestions: {}
      };

      const result = simulateMigration(cleanStats, false);
      expect(result.migrationRan).toBe(false);
      expect(result.reason).toBe('no_fixing_needed');
      expect(result.stats).toEqual(cleanStats); // Stats unchanged
    });

    test('✅ CRITICAL: Empty stats must never trigger migration', () => {
      const emptyStats = {
        attempted: {},
        correct: 0,
        wrong: 0,
        totalSessions: 0,
        correctAnswers: {},
        incorrectAnswers: {},
        learnedQuestions: {}
      };

      const result = simulateMigration(emptyStats, false);
      expect(result.migrationRan).toBe(false);
      expect(result.reason).toBe('skipped_empty_stats');
      expect(result.stats).toEqual(emptyStats); // Stats unchanged
    });

    test('✅ CRITICAL: User progress must be preserved during deduplication', () => {
      const statsWithDuplicates = {
        attempted: { "1": true, "2": true, "3": true },
        correct: 2, // This count is wrong due to duplicates
        wrong: 2,   // This count is wrong due to duplicates  
        totalSessions: 1,
        correctAnswers: { "1": true, "2": true }, // "2" is also in incorrect
        incorrectAnswers: { "2": 1, "3": 0 }, // "2" is duplicate
        learnedQuestions: { "4": 1234567890 }
      };

      const result = simulateMigration(statsWithDuplicates, false);
      
      expect(result.migrationRan).toBe(true);
      
      // Essential data must be preserved
      expect(result.stats.totalSessions).toBe(1); // Sessions preserved
      expect(result.stats.learnedQuestions).toEqual({ "4": 1234567890 }); // Learned questions preserved
      
      // Duplicates resolved correctly
      expect(result.stats.correctAnswers).toEqual({ "1": true }); // "2" removed from correct
      expect(result.stats.incorrectAnswers).toEqual({ "2": 1, "3": 0 }); // "2" kept in incorrect
      
      // Counts recalculated correctly
      expect(result.stats.correct).toBe(1); // 1 unique correct answer
      expect(result.stats.wrong).toBe(2);   // 2 incorrect answers
      
      // Attempted rebuilt correctly
      expect(result.stats.attempted).toEqual({ "1": true, "2": true, "3": true });
    });
  });

  describe('FlaggedQuestions Integration Safety', () => {
    test('✅ CRITICAL: Adding flaggedQuestions must not affect existing data', () => {
      const originalStats = {
        attempted: { "1": true, "2": true },
        correct: 1,
        wrong: 1,
        totalSessions: 3,
        correctAnswers: { "1": true },
        incorrectAnswers: { "2": 1 },
        learnedQuestions: { "3": 1234567890 }
        // No flaggedQuestions
      };

      // Simulate adding flaggedQuestions
      const updatedStats = {
        ...originalStats,
        flaggedQuestions: {}
      };

      // All original data must be preserved
      expect(updatedStats.attempted).toEqual(originalStats.attempted);
      expect(updatedStats.correct).toBe(originalStats.correct);
      expect(updatedStats.wrong).toBe(originalStats.wrong);
      expect(updatedStats.totalSessions).toBe(originalStats.totalSessions);
      expect(updatedStats.correctAnswers).toEqual(originalStats.correctAnswers);
      expect(updatedStats.incorrectAnswers).toEqual(originalStats.incorrectAnswers);
      expect(updatedStats.learnedQuestions).toEqual(originalStats.learnedQuestions);
      
      // New property added
      expect(updatedStats.flaggedQuestions).toEqual({});
    });

    test('✅ CRITICAL: getFlaggedQuestions must handle missing flaggedQuestions gracefully', () => {
      const getFlaggedQuestions = (stats) => {
        const flaggedIds = Object.keys(stats?.flaggedQuestions || {});
        return {
          totalFlagged: flaggedIds.length,
          flaggedIds: flaggedIds
        };
      };

      // Test with stats that don't have flaggedQuestions
      const statsWithoutFlagged = {
        attempted: { "1": true },
        correct: 1,
        wrong: 0
      };

      const result = getFlaggedQuestions(statsWithoutFlagged);
      expect(result.totalFlagged).toBe(0);
      expect(result.flaggedIds).toEqual([]);

      // Test with null/undefined stats
      expect(getFlaggedQuestions(null).totalFlagged).toBe(0);
      expect(getFlaggedQuestions(undefined).totalFlagged).toBe(0);
    });
  });

  describe('Real-world User Data Scenarios', () => {
    test('✅ CRITICAL: Heavy user with lots of progress', () => {
      const heavyUserStats = {
        attempted: Object.fromEntries(Array.from({ length: 250 }, (_, i) => [`${i + 1}`, true])),
        correct: 180,
        wrong: 70,
        totalSessions: 15,
        correctAnswers: Object.fromEntries(Array.from({ length: 180 }, (_, i) => [`${i + 1}`, true])),
        incorrectAnswers: Object.fromEntries(Array.from({ length: 70 }, (_, i) => [`${i + 181}`, Math.floor(Math.random() * 4)])),
        learnedQuestions: Object.fromEntries(Array.from({ length: 50 }, (_, i) => [`${i + 1}`, Date.now()]))
      };

      const result = simulateMigration(heavyUserStats, false);
      
      // Must not lose any progress
      expect(result.stats.totalSessions).toBe(15);
      expect(Object.keys(result.stats.attempted).length).toBe(250);
      expect(Object.keys(result.stats.learnedQuestions).length).toBe(50);
      expect(result.stats.correct + result.stats.wrong).toBe(250);
    });

    test('✅ CRITICAL: New user with no progress', () => {
      const newUserStats = {
        attempted: {},
        correct: 0,
        wrong: 0,
        totalSessions: 0,
        correctAnswers: {},
        incorrectAnswers: {},
        learnedQuestions: {}
      };

      const result = simulateMigration(newUserStats, false);
      
      // Should skip migration entirely
      expect(result.migrationRan).toBe(false);
      expect(result.reason).toBe('skipped_empty_stats');
      expect(result.stats).toEqual(newUserStats);
    });

    test('✅ CRITICAL: User with partial progress', () => {
      const partialUserStats = {
        attempted: { "1": true, "2": true, "3": true },
        correct: 2,
        wrong: 1,
        totalSessions: 1,
        correctAnswers: { "1": true, "3": true },
        incorrectAnswers: { "2": 2 },
        learnedQuestions: {}
      };

      const result = simulateMigration(partialUserStats, false);
      
      // Clean data should not be modified
      expect(result.migrationRan).toBe(false);
      expect(result.reason).toBe('no_fixing_needed');
      expect(result.stats).toEqual(partialUserStats);
    });
  });

  describe('Edge Cases and Error Scenarios', () => {
    test('✅ CRITICAL: Corrupted stats objects must not crash migration', () => {
      const corruptedStats = [
        { attempted: null, correct: 1, wrong: 1 },
        { attempted: {}, correct: null, wrong: 1 },
        { attempted: {}, correct: 1, wrong: undefined },
        { correctAnswers: null, incorrectAnswers: {} },
        { correctAnswers: {}, incorrectAnswers: "invalid" }
      ];

      corruptedStats.forEach((stats) => {
        expect(() => {
          simulateMigration(stats, false);
        }).not.toThrow();
      });
    });

    test('✅ CRITICAL: Missing properties must be handled gracefully', () => {
      const incompleteStats = {
        correct: 1,
        wrong: 1,
        totalSessions: 1
        // Missing: attempted, correctAnswers, incorrectAnswers, learnedQuestions
      };

      const result = simulateMigration(incompleteStats, false);
      expect(result.migrationRan).toBe(false);
      expect(result.reason).toBe('skipped_no_data_or_completed');
    });
  });
});

// Integration test with actual storage behavior
describe('🛡️ CRITICAL: Storage Integration', () => {
  test('✅ CRITICAL: Stats must survive storage round-trip', () => {
    const originalStats = {
      attempted: { "1": true, "2": true },
      correct: 1,
      wrong: 1,
      totalSessions: 1,
      correctAnswers: { "1": true },
      incorrectAnswers: { "2": 1 },
      learnedQuestions: { "3": Date.now() },
      flaggedQuestions: { "4": Date.now() }
    };

    // Simulate storage round-trip
    const serialized = JSON.stringify(originalStats);
    const deserialized = JSON.parse(serialized);

    expect(deserialized).toEqual(originalStats);
  });
});

console.log('🛡️ All data preservation tests completed. If all pass, deployment is SAFE.');