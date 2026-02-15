import { useState, useRef, useCallback } from 'react';

/**
 * Tracks session start time and provides a complete callback for submitting results.
 * Usage: start when game loads, call complete(score, accuracy) when game ends.
 */
export function useGameSession() {
  const [isActive, setIsActive] = useState(false);
  const startTimeRef = useRef(null);

  const start = useCallback(() => {
    startTimeRef.current = Date.now();
    setIsActive(true);
  }, []);

  const getTimeSpentSeconds = useCallback(() => {
    if (!startTimeRef.current) return 0;
    return Math.floor((Date.now() - startTimeRef.current) / 1000);
  }, []);

  const end = useCallback(() => {
    setIsActive(false);
    return getTimeSpentSeconds();
  }, [getTimeSpentSeconds]);

  return { isActive, start, end, getTimeSpentSeconds };
}
