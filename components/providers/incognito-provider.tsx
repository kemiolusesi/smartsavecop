'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';

interface IncognitoContextValue {
  incognito: boolean;
  setIncognito: (value: boolean) => void;
  toggleIncognito: () => void;
  maskValue: string;
}

const IncognitoContext = createContext<IncognitoContextValue | null>(null);
const STORAGE_KEY = 'smart-save-incognito';

export function IncognitoProvider({ children }: { children: React.ReactNode }) {
  const [incognito, setIncognitoState] = useState(false);

  useEffect(() => {
    setIncognitoState(window.localStorage.getItem(STORAGE_KEY) === 'true');
  }, []);

  const setIncognito = (value: boolean) => {
    setIncognitoState(value);
    window.localStorage.setItem(STORAGE_KEY, String(value));
  };

  const value = useMemo(
    () => ({
      incognito,
      setIncognito,
      toggleIncognito: () => setIncognito(!incognito),
      maskValue: '••••••',
    }),
    [incognito]
  );

  return <IncognitoContext.Provider value={value}>{children}</IncognitoContext.Provider>;
}

export function useIncognito() {
  const context = useContext(IncognitoContext);

  if (!context) {
    throw new Error('useIncognito must be used within IncognitoProvider');
  }

  return context;
}
