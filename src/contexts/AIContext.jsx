import React, { createContext, useContext, useState, useEffect } from 'react';
import { aiExplanationService } from '../services/aiExplanations';

const AIContext = createContext();

export function useAI() {
  const context = useContext(AIContext);
  if (!context) {
    throw new Error('useAI must be used within AIProvider');
  }
  return context;
}

export function AIProvider({ children }) {
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [isModelReady, setIsModelReady] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState('');
  const [loadingError, setLoadingError] = useState(null);

  useEffect(() => {
    // Start loading the AI model immediately when app starts
    const initializeAI = async () => {
      if (aiExplanationService.isInitialized) {
        setIsModelReady(true);
        return;
      }

      setIsModelLoading(true);
      setLoadingProgress('KI-Modell wird geladen...');
      
      try {
        // Hook into the service's progress reporting
        const originalConsoleLog = console.log;
        console.log = (message) => {
          if (typeof message === 'string' && message.includes('WebLLM loading progress:')) {
            setLoadingProgress(message.replace('WebLLM loading progress: ', ''));
          }
          originalConsoleLog(message);
        };

        await aiExplanationService.initialize();
        
        // Restore console.log
        console.log = originalConsoleLog;
        
        setIsModelReady(true);
        setLoadingProgress('KI-Modell erfolgreich geladen!');
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setLoadingProgress('');
        }, 3000);
        
      } catch (error) {
        console.error('Failed to initialize AI model:', error);
        setLoadingError('KI-Modell konnte nicht geladen werden. Fallback-Erklärungen werden verwendet.');
        setLoadingProgress('');
      } finally {
        setIsModelLoading(false);
      }
    };

    // Small delay to let the app render first
    setTimeout(initializeAI, 1000);
  }, []);

  const value = {
    isModelLoading,
    isModelReady,
    loadingProgress,
    loadingError,
  };

  return (
    <AIContext.Provider value={value}>
      {children}
    </AIContext.Provider>
  );
}