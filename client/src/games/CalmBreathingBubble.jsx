import { useState, useEffect, useRef } from 'react';
import { useAudio } from '../context/AudioContext';
import { getRounds, getFeedbackDelay } from './levelConfig';
import { useTeaching } from './useTeaching';
import styles from './GameCommon.module.css';

const BUBBLE_COUNT = 6;

function getBubbleCount(level) {
  if (level <= 5) return 4;
  if (level <= 15) return 5;
  return 6;
}

export default function CalmBreathingBubble({ onComplete, level = 1 }) {
  const { playSuccess, playWrong, playClick } = useAudio();
  const { teachAfterAnswer, readQuestion } = useTeaching();
  const [round, setRound] = useState(0);
  const [target, setTarget] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const completedRef = useRef(false);
  const ROUNDS = getRounds(level);
  const bubbleCount = getBubbleCount(level);

  useEffect(() => {
    window.speechSynthesis?.cancel();
    if (round >= ROUNDS && !completedRef.current) {
      completedRef.current = true;
      const accuracy = Math.round((score / ROUNDS) * 100);
      onComplete(score, accuracy);
      return;
    }
    setTarget(Math.floor(Math.random() * bubbleCount));
    setFeedback(null);
    const cancelRead = readQuestion('Tap the glowing bubble. Breathe slowly and stay calm!');
    return cancelRead;
  }, [round, score, ROUNDS, bubbleCount]);

  function handlePop(i) {
    if (feedback !== null) return;
    playClick();
    const correct = i === target;
    if (correct) { setScore((s) => s + 1); setStreak((s) => s + 1); playSuccess(); }
    else { setStreak(0); playWrong(); }
    teachAfterAnswer(correct, { type: 'word', extra: 'Taking deep breaths helps us feel calm!' });
    setFeedback(correct ? 'correct' : 'wrong');
    const delay = getFeedbackDelay(level, correct);
    setTimeout(() => setRound((r) => r + 1), delay);
  }

  if (round >= ROUNDS) return <div className={styles.container}>Calculating your rewards…</div>;

  return (
    <div className={styles.container}>
      <div className={styles.progress}>
        <span>Lv {level} · Round {round + 1}/{ROUNDS}</span><span>·</span><span>Breathe & tap! Score: {score}</span>
        {streak >= 2 && <span>· 🔥 {streak}</span>}
      </div>
      <p className={styles.prompt}>Tap the glowing bubble ☁️</p>
      <div className={styles.bubbleRow}>
        {Array.from({ length: bubbleCount }, (_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => handlePop(i)}
            className={`${styles.bubbleBtn} ${i === target ? styles.bubbleGlow : ''}`}
            disabled={feedback !== null}
          >
            ☁️
          </button>
        ))}
      </div>
      {feedback === 'correct' && <p className={styles.feedbackOk}>{streak >= 3 ? '🔥 Calm streak!' : '✓ Nice and calm!'}</p>}
      {feedback === 'wrong' && (
        <div className={styles.feedbackBad}>
          <p>✗ The answer is <strong>the glowing bubble</strong></p>
        </div>
      )}
    </div>
  );
}
