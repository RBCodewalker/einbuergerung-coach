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
  const [isMobile] = useState(() => aiExplanationService.isMobile);

  useEffect(() => {
    // Start loading the AI model immediately when app starts
    const initializeAI = async () => {
      if (aiExplanationService.isInitialized) {
        setIsModelReady(true);
        return;
      }

      setIsModelLoading(true);
      const initialProgress = isMobile 
        ? 'KI-Modell wird geladen... (kann auf Mobilgeräten länger dauern)'
        : 'KI-Modell wird geladen...';
      setLoadingProgress(initialProgress);
      
      let progressInterval;
      
      try {
        // Hook into the service's progress reporting with better mobile support
        progressInterval = setInterval(() => {
          const progress = aiExplanationService.initializationProgress;
          if (progress > 0) {
            const progressText = isMobile
              ? `Lädt... ${progress}% (Mobilgerät erkannt)`
              : `Lädt... ${progress}%`;
            setLoadingProgress(progressText);
          }
        }, 500);

        await aiExplanationService.initialize();
        
        clearInterval(progressInterval);
        
        setIsModelReady(true);
        const successMessage = isMobile 
          ? 'KI-Modell erfolgreich geladen! (funktioniert auf Ihrem Mobilgerät)'
          : 'KI-Modell erfolgreich geladen!';
        setLoadingProgress(successMessage);
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setLoadingProgress('');
        }, 3000);
        
      } catch (error) {
        console.error('Failed to initialize AI model:', error);
        
        const errorMessage = isMobile
          ? 'KI-Funktionen sind auf Mobilgeräten möglicherweise nicht verfügbar. Die App funktioniert weiterhin ohne KI-Erklärungen.'
          : 'KI-Modell konnte nicht geladen werden. Die App funktioniert weiterhin ohne KI-Erklärungen.';
        
        setLoadingError(errorMessage);
        setLoadingProgress('');
        
        if (progressInterval) {
          clearInterval(progressInterval);
        }
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
    isMobile,
  };

  return (
    <AIContext.Provider value={value}>
      {children}
    </AIContext.Provider>
  );
}