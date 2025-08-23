import { useState, useEffect } from 'react';
import { setCookie, getCookie } from '../utils/cookies';

export function useCookieState(key, initialValue, enabled = true) {
  const [value, setValue] = useState(() => {
    if (!enabled) return initialValue;
    const cookieValue = getCookie(key);
    if (!cookieValue) return initialValue;
    try {
      return JSON.parse(cookieValue);
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    if (!enabled) return;
    try {
      setCookie(key, JSON.stringify(value));
    } catch (error) {
      console.error('Failed to set cookie:', error);
    }
  }, [key, value, enabled]);

  return [value, setValue];
}