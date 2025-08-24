const STATES = [
  { key: 'baden-wuerttemberg', name: 'Baden-Württemberg' },
  { key: 'bayern', name: 'Bayern' },
  { key: 'berlin', name: 'Berlin' },
  { key: 'bremen', name: 'Bremen' }
];

export const DEFAULT_STATE = 'baden-wuerttemberg';
export const STATE_ID_START = 301;
export const STATE_ID_END = 310;

let stateQuestionsCache = new Map();

export const getAvailableStates = () => {
  return STATES;
};

export const getStateByKey = (key) => {
  return STATES.find(state => state.key === key);
};

export const loadStateQuestions = async (stateKey) => {
  if (stateQuestionsCache.has(stateKey)) {
    return stateQuestionsCache.get(stateKey);
  }

  try {
    const response = await fetch(`${process.env.PUBLIC_URL}/json/state-based/${stateKey}.json`);
    if (!response.ok) {
      throw new Error(`Failed to load ${stateKey} questions`);
    }
    
    const questions = await response.json();
    
    // Always assign IDs in the 301-310 range regardless of state
    const questionsWithIds = questions.map((question, index) => ({
      ...question,
      id: STATE_ID_START + index
    }));
    
    stateQuestionsCache.set(stateKey, questionsWithIds);
    return questionsWithIds;
  } catch (error) {
    console.error(`Error loading state questions for ${stateKey}:`, error);
    return [];
  }
};

export const getRandomStateQuestions = (stateQuestions, count = 3) => {
  if (!stateQuestions || stateQuestions.length === 0) {
    return [];
  }
  
  const shuffled = [...stateQuestions].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, stateQuestions.length));
};

export const clearStateQuestionsCache = () => {
  stateQuestionsCache.clear();
};

export const getStateImagePath = (question, stateKey) => {
  if (!question.image) return null;
  return `${process.env.PUBLIC_URL}/images/${stateKey}/image-${question.id}.png`;
};