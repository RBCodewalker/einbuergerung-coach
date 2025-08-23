import { useState, useEffect, useMemo } from 'react';
import { DEMO_DATA, QUESTIONS_URL, QUIZ_COUNT } from '../constants';
import { mulberry32 } from '../utils/random';

export function useQuizData() {
  const [allData, setAllData] = useState(DEMO_DATA);

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch(QUESTIONS_URL);
        if (response.ok) {
          const json = await response.json();
          if (Array.isArray(json) && json.length > 0) {
            setAllData(json);
          }
        }
      } catch (error) {
        console.error('Failed to load questions:', error);
        setAllData(DEMO_DATA);
      }
    };

    loadData();
  }, []);

  const learnSet = useMemo(() => 
    allData.filter(q => 
      q && 
      q.options?.length === 4 && 
      q.answerIndex !== null && 
      q.answerIndex !== undefined
    ), [allData]
  );

  const getQuizSet = useMemo(() => (seed, correctAnswers = {}) => {
    // Filter out correctly answered questions if needed
    const availableQuestions = Object.keys(correctAnswers).length > 0 
      ? learnSet.filter(q => !correctAnswers[q.id])
      : learnSet;
    
    const list = [...availableQuestions];
    const rng = mulberry32(seed || Date.now());
    
    // Fisher-Yates shuffle
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    
    return list.slice(0, Math.min(QUIZ_COUNT, list.length));
  }, [learnSet]);

  return {
    allData,
    learnSet,
    getQuizSet
  };
}