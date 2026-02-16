import { useState, useEffect, useRef } from 'react';
import { useAudio } from '../context/AudioContext';
import { useNoRepeat } from './useNoRepeat';
import { getRounds, getFeedbackDelay } from './levelConfig';
import { useTeaching } from './useTeaching';
import styles from './GameCommon.module.css';

const BALLOONS = ['🔴', '🔵', '🟢', '🟡', '🟣', '🟠'];
const BALLOON_TO_COLOR = { '🔴': 'red', '🔵': 'blue', '🟢': 'green', '🟡': 'yellow', '🟣': 'purple', '🟠': 'orange' };

export default function BalloonPop({ onComplete, level = 1 }) {
  const { playSuccess, playWrong, playClick } = useAudio();
  const { teachAfterAnswer, readQuestion } = useTeaching();
  const { generate } = useNoRepeat();
  const [round, setRound] = useState(0);
  const [target, setTarget] = useState('');
  const [items, setItems] = useState([]);
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
    const t = generate(
      () => BALLOONS[Math.floor(Math.random() * BALLOONS.length)],
      (r) => r
    );
    const arr = [...Array(9)].map(() => BALLOONS[Math.floor(Math.random() * BALLOONS.length)]);
    const idx = Math.floor(Math.random() * 9);
    arr[idx] = t;
    setTarget(t);
    setItems(arr);
    setFeedback(null);
    const cancelRead = readQuestion(`Pop this one: ${t}`);
    return cancelRead;
  }, [round, score, ROUNDS]);

  function handlePop(emoji) {
    if (feedback !== null) return;
    playClick();
    const correct = emoji === target;
    if (correct) { setScore((s) => s + 1); setStreak((s) => s + 1); playSuccess(); }
    else { setStreak(0); playWrong(); }
    teachAfterAnswer(correct, { type: 'color', correctAnswer: BALLOON_TO_COLOR[target] || target });
    setFeedback(correct ? 'correct' : 'wrong');
    const delay = getFeedbackDelay(level, correct);
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
      {feedback === 'correct' && (
        <p className={styles.feedbackOk}>{streak >= 3 ? '🔥 Pop Master!' : '✓ Pop!'}</p>
      )}
      {feedback === 'wrong' && (
        <div className={styles.feedbackBad}>
          <p>✗ The answer is <strong>{target}</strong></p>
        </div>
      )}
    </div>
  );
}
