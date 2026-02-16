import { useState, useEffect, useRef } from 'react';
import { useAudio } from '../context/AudioContext';
import { getRounds, getFeedbackDelay } from './levelConfig';
import { useTeaching } from './useTeaching';
import styles from './GameCommon.module.css';

const COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#eab308', '#a855f7'];
const SHAPES = [
  { name: 'circle', emoji: '⭕', fill: 'circle' },
  { name: 'square', emoji: '🟦', fill: 'square' },
  { name: 'star', emoji: '⭐', fill: 'star' },
];

export default function ColorInsideShape({ onComplete, level = 1 }) {
  const { playSuccess, playWrong, playClick } = useAudio();
  const { teachAfterAnswer, readQuestion } = useTeaching();
  const [round, setRound] = useState(0);
  const [targetColor, setTargetColor] = useState(null);
  const [targetShape, setTargetShape] = useState(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const completedRef = useRef(false);
  const ROUNDS = getRounds(level);

  useEffect(() => {
    window.speechSynthesis?.cancel();
    if (round >= ROUNDS && !completedRef.current) {
      completedRef.current = true;
      const accuracy = Math.round((score / ROUNDS) * 100);
      onComplete(score, accuracy);
      return;
    }
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
    setTargetColor(color);
    setTargetShape(shape);
    setFeedback(null);
    const cancelRead = readQuestion(`Color inside the ${shape.name}`);
    return cancelRead;
  }, [round, score, ROUNDS]);

  function handlePick(color) {
    if (feedback !== null) return;
    playClick();
    const correct = color === targetColor;
    if (correct) { setScore((s) => s + 1); setStreak((s) => s + 1); playSuccess(); }
    else { setStreak(0); playWrong(); }
    teachAfterAnswer(correct, { type: 'shape', correctAnswer: targetShape?.name });
    setFeedback(correct ? 'correct' : 'wrong');
    const delay = getFeedbackDelay(level, correct);
    setTimeout(() => setRound((r) => r + 1), delay);
  }

  if (round >= ROUNDS) return <div className={styles.container}>Calculating your rewards…</div>;

  return (
    <div className={styles.container}>
      <div className={styles.progress}>
        <span>Lv {level} · Round {round + 1}/{ROUNDS}</span><span>·</span><span>Pick the color! Score: {score}</span>
        {streak >= 2 && <span>· 🔥 {streak}</span>}
      </div>
      <p className={styles.prompt}>Color inside the {targetShape?.name}:</p>
      <div className={styles.colorShapeTarget} style={{ color: targetColor }}>
        {targetShape?.emoji}
      </div>
      <div className={styles.colorGrid}>
        {COLORS.map((c, i) => (
          <button
            key={i}
            type="button"
            onClick={() => handlePick(c)}
            className={`${styles.colorBtn} ${feedback && c === targetColor ? styles.correct : ''}`}
            style={{ backgroundColor: c }}
            disabled={feedback !== null}
          />
        ))}
      </div>
      {feedback === 'correct' && <p className={styles.feedbackOk}>{streak >= 3 ? '🔥 Color Expert!' : '✓ Nice coloring!'}</p>}
      {feedback === 'wrong' && (
        <div className={styles.feedbackBad}>
          <p>✗ The answer is <strong>{targetColor}</strong></p>
        </div>
      )}
    </div>
  );
}
