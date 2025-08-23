import { useState, useEffect, useRef, useCallback } from 'react';

export function useQuizTimer(totalTimeInMinutes, isActive, onTimeUp) {
  const [remaining, setRemaining] = useState(0);
  const timerRef = useRef(null);
  const onTimeUpRef = useRef(onTimeUp);

  useEffect(() => {
    onTimeUpRef.current = onTimeUp;
  }, [onTimeUp]);

  useEffect(() => {
    if (!isActive || totalTimeInMinutes <= 0) return;
    
    const totalSeconds = totalTimeInMinutes * 60;
    setRemaining(totalSeconds);
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    timerRef.current = setInterval(() => {
      setRemaining((prevRemaining) => {
        if (prevRemaining <= 1) {
          onTimeUpRef.current?.();
          return 0;
        }
        return prevRemaining - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [totalTimeInMinutes, isActive]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const resetTimer = useCallback(() => {
    if (totalTimeInMinutes > 0) {
      setRemaining(totalTimeInMinutes * 60);
    } else {
      setRemaining(0);
    }
  }, [totalTimeInMinutes]);

  const pauseTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  }, []);

  const resumeTimer = useCallback(() => {
    if (!isActive || remaining <= 0) return;
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    timerRef.current = setInterval(() => {
      setRemaining((prevRemaining) => {
        if (prevRemaining <= 1) {
          onTimeUpRef.current?.();
          return 0;
        }
        return prevRemaining - 1;
      });
    }, 1000);
  }, [isActive, remaining]);

  // Format remaining time as MM:SS
  const formatTime = useCallback((seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }, []);

  return { 
    remaining, 
    resetTimer, 
    pauseTimer, 
    resumeTimer, 
    formatTime: formatTime(remaining)
  };
}