import { useState, useEffect, useRef } from 'react';
import { useAudio } from '../context/AudioContext';
import { useTeaching } from './useTeaching';
import { getRounds, getChoiceCount, getFeedbackDelay } from './levelConfig';
import styles from './GameCommon.module.css';

const COLORS = [
  { name: 'Red', hex: '#ef4444' },
  { name: 'Blue', hex: '#3b82f6' },
  { name: 'Green', hex: '#22c55e' },
  { name: 'Yellow', hex: '#eab308' },
  { name: 'Purple', hex: '#a855f7' },
  { name: 'Orange', hex: '#f97316' },
];

export default function TapTheColor({ onComplete, level = 1 }) {
  const { playSuccess, playWrong, playClick } = useAudio();
  const { teachAfterAnswer, readQuestion } = useTeaching();
  const [round, setRound] = useState(0);
  const [target, setTarget] = useState(null);
  const [options, setOptions] = useState([]);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [streak, setStreak] = useState(0);
  const completedRef = useRef(false);
  const ROUNDS = getRounds(level);
  const CHOICE_COUNT = Math.min(getChoiceCount(level), COLORS.length);
  const feedbackDelay = getFeedbackDelay(level);

  useEffect(() => {
    if (round >= ROUNDS && !completedRef.current) {
      completedRef.current = true;
      const accuracy = Math.round((score / ROUNDS) * 100);
      onComplete(score, accuracy);
      return;
    }
    const pool = [...COLORS].sort(() => Math.random() - 0.5);
    const targetColor = pool[0];
    const opts = pool.slice(0, CHOICE_COUNT);
    setTarget(targetColor);
    setOptions(opts.sort(() => Math.random() - 0.5));
    setFeedback(null);
    readQuestion('Tap the color: ' + targetColor.name);
  }, [round, score, ROUNDS, CHOICE_COUNT, readQuestion]);

  function handleChoice(c) {
    if (feedback !== null) return;
    playClick();
    const correct = c.name === target?.name;
    if (correct) {
      setScore((s) => s + 1);
      setStreak((s) => s + 1);
      playSuccess();
    } else {
      setStreak(0);
      playWrong();
    }
    setFeedback(correct ? 'correct' : 'wrong');
    teachAfterAnswer(correct, { type: 'color', answer: c.name, correctAnswer: target?.name });
    setTimeout(() => setRound((r) => r + 1), feedbackDelay);
  }

  if (round >= ROUNDS) return <div className={styles.container}>Calculating your rewards…</div>;

  return (
    <div className={styles.container}>
      <div className={styles.progress}>
        <span>Lv {level}</span>
        <span>·</span>
        <span>Round {round + 1} of {ROUNDS}</span>
        <span>·</span>
        <span>Score: {score}</span>
        {streak >= 2 && <span>· 🔥 {streak}</span>}
      </div>
      <p className={styles.prompt}>Tap the color: <strong>{target?.name}</strong></p>
      <div className={styles.colorGrid}>
        {options.map((c) => (
          <button
            key={c.name}
            type="button"
            onClick={() => handleChoice(c)}
            className={`${styles.colorBtn} ${
              feedback !== null
                ? c.name === target?.name
                  ? styles.correct
                  : feedback === 'wrong' && c.name !== target?.name
                  ? styles.wrong
                  : ''
                : ''
            }`}
            style={{ backgroundColor: c.hex }}
            disabled={feedback !== null}
          />
        ))}
      </div>
      {feedback && (
        <p className={feedback === 'correct' ? styles.feedbackOk : styles.feedbackBad}>
          {feedback === 'correct'
            ? streak >= 3 ? '🔥 Color Master!' : '✓ Correct!'
            : 'Try again next round!'}
        </p>
      )}
    </div>
  );
}
