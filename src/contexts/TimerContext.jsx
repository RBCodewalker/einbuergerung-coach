import React, { createContext, useContext } from 'react';
import { useQuizTimer } from '../hooks/useQuizTimer';

const TimerContext = createContext();

export function useTimer() {
  const context = useContext(TimerContext);
  if (!context) {
    throw new Error('useTimer must be used within TimerProvider');
  }
  return context;
}

export function TimerProvider({ children, totalTimeInMinutes, isActive, onTimeUp }) {
  const { remaining, resetTimer, formatTime } = useQuizTimer(totalTimeInMinutes, isActive, onTimeUp);

  const value = React.useMemo(() => ({
    remaining,
    resetTimer,
    formatTime,
  }), [remaining, resetTimer, formatTime]);

  return (
    <TimerContext.Provider value={value}>
      {children}
    </TimerContext.Provider>
  );
}