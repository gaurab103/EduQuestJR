import { useState, useEffect, useRef } from 'react';
import { useAudio } from '../context/AudioContext';
import { getRounds, getFeedbackDelay } from './levelConfig';
import styles from './GameCommon.module.css';

const BALLOONS = ['🔴', '🔵', '🟢', '🟡', '🟣', '🟠'];

export default function BalloonPop({ onComplete, level = 1 }) {
  const { playSuccess, playWrong, playClick } = useAudio();
  const [round, setRound] = useState(0);
  const [target, setTarget] = useState('');
  const [items, setItems] = useState([]);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const completedRef = useRef(false);
  const ROUNDS = getRounds(level);
  const delay = getFeedbackDelay(level);

  useEffect(() => {
    if (round >= ROUNDS && !completedRef.current) {
      completedRef.current = true;
      const accuracy = Math.round((score / ROUNDS) * 100);
      onComplete(score, accuracy);
      return;
    }
    const t = BALLOONS[Math.floor(Math.random() * BALLOONS.length)];
    const arr = [...Array(9)].map(() => BALLOONS[Math.floor(Math.random() * BALLOONS.length)]);
    const idx = Math.floor(Math.random() * 9);
    arr[idx] = t;
    setTarget(t);
    setItems(arr);
    setFeedback(null);
  }, [round, score, ROUNDS]);

  function handlePop(emoji) {
    if (feedback !== null) return;
    playClick();
    const correct = emoji === target;
    if (correct) { setScore((s) => s + 1); setStreak((s) => s + 1); playSuccess(); }
    else { setStreak(0); playWrong(); }
    setFeedback(correct ? 'correct' : 'wrong');
    setTimeout(() => setRound((r) => r + 1), delay);
  }

  if (round >= ROUNDS) return <div className={styles.container}>Calculating your rewards…</div>;

  return (
    <div className={styles.container}>
      <div className={styles.progress}>
        <span>Lv {level} · Round {round + 1}/{ROUNDS}</span><span>·</span><span>Pop the match! Score: {score}</span>
        {streak >= 2 && <span>· 🔥 {streak}</span>}
      </div>
      <p className={styles.prompt}>Pop this one: <span style={{ fontSize: '2rem' }}>{target}</span></p>
      <div className={styles.balloonGrid}>
        {items.map((emoji, i) => (
          <button
            key={i}
            type="button"
            onClick={() => handlePop(emoji)}
            className={styles.balloonBtn}
            disabled={feedback !== null}
          >
            {emoji}
          </button>
        ))}
      </div>
      {feedback && (
        <p className={feedback === 'correct' ? styles.feedbackOk : styles.feedbackBad}>
          {feedback === 'correct' ? (streak >= 3 ? '🔥 Pop Master!' : '✓ Pop!') : 'Try again next round!'}
        </p>
      )}
    </div>
  );
}
