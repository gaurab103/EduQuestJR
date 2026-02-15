import React, { createContext, useContext, useState, useEffect } from 'react';

const ChildModeContext = createContext(null);

const ADULT_PIN_KEY = 'eduquest_adult_pin';
const MODE_KEY = 'eduquest_mode';

const DEFAULT_PIN = '1234';

export function ChildModeProvider({ children }) {
  const [isAdultMode, setIsAdultMode] = useState(() => {
    const saved = localStorage.getItem(MODE_KEY);
    return saved === 'adult';
  });

  const storedPin = () => localStorage.getItem(ADULT_PIN_KEY) || DEFAULT_PIN;

  const enterAdultMode = (pin) => {
    if (pin === storedPin()) {
      setIsAdultMode(true);
      localStorage.setItem(MODE_KEY, 'adult');
      return true;
    }
    return false;
  };

  const exitAdultMode = () => {
    setIsAdultMode(false);
    localStorage.setItem(MODE_KEY, 'child');
  };

  const setPin = (newPin) => {
    if (newPin && newPin.length >= 4) {
      localStorage.setItem(ADULT_PIN_KEY, newPin);
      return true;
    }
    return false;
  };

  const value = {
    isAdultMode,
    enterAdultMode,
    exitAdultMode,
    setPin,
  };

  return (
    <ChildModeContext.Provider value={value}>
      {children}
    </ChildModeContext.Provider>
  );
}

export function useChildMode() {
  const ctx = useContext(ChildModeContext);
  if (!ctx) return { isAdultMode: false, enterAdultMode: () => false, exitAdultMode: () => {}, setPin: () => false };
  return ctx;
}
