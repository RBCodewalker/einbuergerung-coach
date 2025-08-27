import { useState, useEffect, useCallback, useRef } from 'react';
import { setStorageData, getStorageData, validateStorageIntegrity } from '../utils/storage';

/**
 * Enhanced storage hook with robust persistence and validation
 */
export function useStorageState(key, initialValue, enabled = true, validator = null) {
  // Track if this is the initial render to prevent saving initial value
  const isInitialRender = useRef(true);
  
  // Initialize state with data from storage or fallback to initial value
  const [value, setValue] = useState(() => {
    if (!enabled) return initialValue;
    
    try {
      // Use validator if provided to ensure data integrity
      const storedValue = validator 
        ? validateStorageIntegrity(key, validator)
        : getStorageData(key);
        
      return storedValue !== null ? storedValue : initialValue;
    } catch (error) {
      console.error(`Failed to initialize ${key}:`, error);
      return initialValue;
    }
  });

  // Save to storage whenever value changes (except initial render)
  useEffect(() => {
    if (!enabled) return;
    
    // Skip saving on initial render to prevent overwriting stored values
    if (isInitialRender.current) {
      isInitialRender.current = false;
      return;
    }
    
    try {
      const success = setStorageData(key, value, enabled);
      if (!success) {
        console.warn(`Failed to persist ${key} to storage`);
      }
    } catch (error) {
      console.error(`Failed to save ${key}:`, error);
    }
  }, [key, value, enabled]);

  // Enhanced setValue with error handling and validation
  const setValueWithValidation = useCallback((newValue) => {
    setValue(prevValue => {
      try {
        const resolvedValue = typeof newValue === 'function' 
          ? newValue(prevValue) 
          : newValue;
        
        // Run validator if provided
        if (validator && !validator(resolvedValue)) {
          console.warn(`Validation failed for ${key}, rejecting update`);
          return prevValue; // Return previous value unchanged
        }
        
        return resolvedValue;
      } catch (error) {
        console.error(`Failed to update ${key}:`, error);
        return prevValue; // Return previous value unchanged
      }
    });
  }, [key, validator]);

  // Force sync from storage (useful for cross-tab updates)
  const syncFromStorage = useCallback(() => {
    if (!enabled) return;
    
    try {
      const storedValue = validator 
        ? validateStorageIntegrity(key, validator)
        : getStorageData(key);
        
      if (storedValue !== null) {
        setValue(storedValue);
      }
    } catch (error) {
      console.error(`Failed to sync ${key} from storage:`, error);
    }
  }, [key, enabled, validator]);

  return [value, setValueWithValidation, { syncFromStorage }];
}