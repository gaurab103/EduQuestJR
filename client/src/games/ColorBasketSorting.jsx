import { useState, useEffect, useRef } from 'react';
import styles from './GameCommon.module.css';
import { getRounds, getChoiceCount, getFeedbackDelay } from './levelConfig';
import { useAudio } from '../context/AudioContext';
import { useTeaching } from './useTeaching';

const COLORS = [
  { name: 'Red', hex: '#ef4444', emoji: '🔴' },
  { name: 'Blue', hex: '#3b82f6', emoji: '🔵' },
  { name: 'Green', hex: '#22c55e', emoji: '🟢' },
  { name: 'Yellow', hex: '#eab308', emoji: '🟡' },
];

export default function ColorBasketSorting({ onComplete, level = 1 }) {
  const { playSuccess, playWrong, playClick } = useAudio();
  const { teachAfterAnswer, readQuestion } = useTeaching();
  const [round, setRound] = useState(0);
  const [targetColor, setTargetColor] = useState(null);
  const [items, setItems] = useState([]);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const completedRef = useRef(false);
  const ROUNDS = getRounds(level);
  const choiceCount = getChoiceCount(level);
  const feedbackDelay = getFeedbackDelay(level);

  useEffect(() => {
    if (round >= ROUNDS && !completedRef.current) {
      completedRef.current = true;
      const accuracy = Math.round((score / ROUNDS) * 100);
      onComplete(score, accuracy);
      return;
    }
    const target = COLORS[Math.floor(Math.random() * COLORS.length)];
    const others = COLORS.filter((c) => c.name !== target.name);
    const wrongCount = Math.max(1, choiceCount - 2);
    const wrongItems = others.slice(0, wrongCount);
    const mix = [
      target, target,
      ...wrongItems,
    ].sort(() => Math.random() - 0.5);
    setTargetColor(target);
    setItems(mix);
    setFeedback(null);
    const cancelRead = readQuestion(`Tap the ${target.name} colored item`);
    return cancelRead;
  }, [round, score, ROUNDS, choiceCount]);

  function handlePick(item) {
    if (feedback !== null) return;
    playClick();
    const correct = item.name === targetColor?.name;
    if (correct) {
      setScore((s) => s + 1);
      setStreak((s) => s + 1);
      playSuccess();
    } else {
      setStreak(0);
      playWrong();
    }
    teachAfterAnswer(correct, { type: 'color', correctAnswer: targetColor?.name?.toLowerCase() });
    setFeedback(correct ? 'correct' : 'wrong');
    setTimeout(() => setRound((r) => r + 1), feedbackDelay);
  }

  if (round >= ROUNDS) return <div className={styles.container}>Calculating your rewards…</div>;

  return (
    <div className={styles.container}>
      <div className={styles.progress}>Lv {level} · Round {round + 1}/{ROUNDS} · Put items in the {targetColor?.name} basket! Score: {score}{streak > 1 ? ` · Streak: ${streak}` : ''}</div>
      <p className={styles.prompt}>Tap the {targetColor?.name} colored item:</p>
      <div className={styles.colorGrid}>
        {items.map((c, i) => (
          <button
            key={i}
            type="button"
            onClick={() => handlePick(c)}
            className={`${styles.colorBtn} ${feedback && c.name === targetColor?.name ? styles.correct : ''}`}
            style={{ backgroundColor: c.hex }}
            disabled={feedback !== null}
          />
        ))}
      </div>
      {feedback && (
        <p className={feedback === 'correct' ? styles.feedbackOk : styles.feedbackBad}>
          {feedback === 'correct' ? '✓ Correct!' : 'Try again next round!'}
        </p>
      )}
    </div>
  );
}
