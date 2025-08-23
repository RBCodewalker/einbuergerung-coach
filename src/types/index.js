/**
 * @typedef {Object} Question
 * @property {number} id - Unique identifier for the question
 * @property {string} question - The question text
 * @property {string[]} options - Array of 4 answer options
 * @property {number} answerIndex - Index of the correct answer (0-3)
 * @property {string} [image] - Optional image URL or reference
 */

/**
 * @typedef {Object} QuizStats
 * @property {Object.<number, boolean>} attempted - Map of question IDs that have been attempted
 * @property {number} correct - Total number of correct answers
 * @property {number} wrong - Total number of wrong answers
 * @property {number} totalSessions - Total number of quiz sessions completed
 */

/**
 * @typedef {Object} ScoreSummary
 * @property {number} correct - Number of correct answers in current session
 * @property {number} wrong - Number of wrong answers in current session
 * @property {number} empty - Number of unanswered questions in current session
 * @property {number} total - Total number of questions in current session
 */

/**
 * @typedef {'dashboard' | 'learn' | 'quiz'} AppMode
 */

/**
 * @typedef {'ask' | 'necessary' | 'all'} ConsentType
 */

export {};