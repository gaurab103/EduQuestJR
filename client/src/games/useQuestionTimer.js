/**
 * Tracks when a question/round started so games can detect "answered too fast".
 * When kids answer wrong in under ~2.5s, we use "Take your time!" style feedback
 * and longer teaching delays.
 */
import { useRef, useCallback } from 'react';

const TOO_FAST_MS = 2500;

export function useQuestionTimer() {
  const startRef = useRef(Date.now());

  const markStart = useCallback(() => {
    startRef.current = Date.now();
  }, []);

  const isAnsweredTooFast = useCallback(() => {
    return Date.now() - startRef.current < TOO_FAST_MS;
  }, []);

  return { markStart, isAnsweredTooFast };
}
