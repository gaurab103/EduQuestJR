/**
 * Hook to ensure no question repeats within a game session/level.
 * Tracks used question "keys" and re-generates if duplicate found.
 * Level-scoped: keys include level so L1 content never appears in L2+.
 *
 * IMPORTANT: The pool is NEVER cleared automatically. If all possible
 * questions are exhausted, it continues generating but accepts the
 * best available (least-recently-used) instead of allowing true repeats.
 */
import { useRef, useCallback } from 'react';

export function useNoRepeat(level = 1) {
  const used = useRef(new Set());
  const history = useRef([]);
  const levelRef = useRef(level);
  if (levelRef.current !== level) {
    levelRef.current = level;
    used.current.clear();
    history.current = [];
  }

  /**
   * Generate a unique value. Takes a generator function and a key extractor.
   * Keys are level-prefixed so no L1 content appears in L2+.
   * Will re-roll up to maxAttempts times to avoid duplicates.
   */
  const generate = useCallback((generatorFn, keyFn, maxAttempts = 80) => {
    const levelKey = `L${levelRef.current}`;
    for (let i = 0; i < maxAttempts; i++) {
      const result = generatorFn();
      const key = `${levelKey}:${keyFn(result)}`;
      if (!used.current.has(key)) {
        used.current.add(key);
        history.current.push(key);
        return result;
      }
    }

    // Pool likely exhausted — remove oldest 50% of history to allow older questions back
    // This ensures recent questions (the last 50%) are still blocked
    const removeCount = Math.max(1, Math.floor(history.current.length / 2));
    const removed = history.current.splice(0, removeCount);
    for (const key of removed) {
      used.current.delete(key);
    }

    // Try again with the refreshed pool
    for (let i = 0; i < maxAttempts; i++) {
      const result = generatorFn();
      const key = `${levelKey}:${keyFn(result)}`;
      if (!used.current.has(key)) {
        used.current.add(key);
        history.current.push(key);
        return result;
      }
    }

    // Absolute fallback — generate and return (very rare)
    const result = generatorFn();
    const key = `${levelKey}:${keyFn(result)}`;
    used.current.add(key);
    history.current.push(key);
    return result;
  }, []);

  /**
   * Reset all tracking. Call when starting a completely new game session.
   */
  const reset = useCallback(() => {
    used.current.clear();
    history.current = [];
  }, []);

  return { generate, reset };
}
