/**
 * Hook to ensure no question repeats within a game session.
 * Tracks used question "keys" and re-generates if duplicate found.
 */
import { useRef, useCallback } from 'react';

export function useNoRepeat() {
  const used = useRef(new Set());

  /**
   * Generate a unique value. Takes a generator function and a key extractor.
   * Will re-roll up to maxAttempts times to avoid duplicates.
   * If pool is exhausted, clears history and starts fresh.
   */
  const generate = useCallback((generatorFn, keyFn, maxAttempts = 50) => {
    for (let i = 0; i < maxAttempts; i++) {
      const result = generatorFn();
      const key = keyFn(result);
      if (!used.current.has(key)) {
        used.current.add(key);
        return result;
      }
    }
    used.current.clear();
    const result = generatorFn();
    used.current.add(keyFn(result));
    return result;
  }, []);

  const reset = useCallback(() => {
    used.current.clear();
  }, []);

  return { generate, reset };
}
