import React, { createContext, useContext, useState } from 'react';
import { useCookieState } from '../hooks/useCookieState';
import { useMantineColorScheme } from '@mantine/core';
import { setCookie, getCookie } from '../utils/cookies';

const AppContext = createContext();

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}

export function AppProvider({ children }) {
  // Consent management
  const [consent, setConsent] = useState(() => getCookie('lid.consent') || 'ask');
  const cookiesEnabled = consent === 'all';

  // Theme management
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const [dark, setDark] = useCookieState('lid.dark', colorScheme === 'dark', true);

  const handleConsentChange = (newConsent) => {
    setConsent(newConsent);
    setCookie('lid.consent', newConsent);
  };

  const handleToggleDark = () => {
    setDark(d => !d);
    toggleColorScheme();
  };

  const value = {
    // Consent
    consent,
    cookiesEnabled,
    setConsent: handleConsentChange,
    
    // Theme
    colorScheme,
    dark,
    toggleDark: handleToggleDark,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}