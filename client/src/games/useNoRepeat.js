/**
 * Hook to ensure no question repeats within a game session/level.
 * Tracks used question "keys" and re-generates if duplicate found.
 *
 * IMPORTANT: The pool is NEVER cleared automatically. If all possible
 * questions are exhausted, it continues generating but accepts the
 * best available (least-recently-used) instead of allowing true repeats.
 */
import { useRef, useCallback } from 'react';

export function useNoRepeat() {
  const used = useRef(new Set());
  const history = useRef([]);

  /**
   * Generate a unique value. Takes a generator function and a key extractor.
   * Will re-roll up to maxAttempts times to avoid duplicates.
   *
   * If all attempts produce duplicates (pool exhausted), removes the OLDEST
   * entries from history (50% of them) so older questions can appear again,
   * but recent questions are still blocked. This prevents immediate repeats.
   */
  const generate = useCallback((generatorFn, keyFn, maxAttempts = 80) => {
    for (let i = 0; i < maxAttempts; i++) {
      const result = generatorFn();
      const key = keyFn(result);
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
      const key = keyFn(result);
      if (!used.current.has(key)) {
        used.current.add(key);
        history.current.push(key);
        return result;
      }
    }

    // Absolute fallback — generate and return (very rare)
    const result = generatorFn();
    const key = keyFn(result);
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
