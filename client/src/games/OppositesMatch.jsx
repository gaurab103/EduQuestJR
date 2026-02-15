import { useState, useEffect, useRef } from 'react';
import styles from './GameCommon.module.css';
import { getRounds, getChoiceCount, getFeedbackDelay } from './levelConfig';
import { useAudio } from '../context/AudioContext';

const OPPOSITES = [
  { word: 'hot', correct: 'cold', wrong: ['warm', 'sun', 'fire', 'heat'] },
  { word: 'big', correct: 'small', wrong: ['tall', 'round', 'large', 'huge'] },
  { word: 'up', correct: 'down', wrong: ['high', 'low', 'top', 'above'] },
  { word: 'fast', correct: 'slow', wrong: ['quick', 'run', 'race', 'speed'] },
  { word: 'happy', correct: 'sad', wrong: ['fun', 'mad', 'glad', 'smile'] },
  { word: 'open', correct: 'closed', wrong: ['shut', 'free', 'wide', 'door'] },
  { word: 'day', correct: 'night', wrong: ['sun', 'dark', 'light', 'noon'] },
  { word: 'wet', correct: 'dry', wrong: ['water', 'cold', 'rain', 'moist'] },
];

export default function OppositesMatch({ onComplete, level = 1 }) {
  const { playSuccess, playWrong, playClick } = useAudio();
  const [round, setRound] = useState(0);
  const [item, setItem] = useState(null);
  const [options, setOptions] = useState([]);
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
    const i = OPPOSITES[Math.floor(Math.random() * OPPOSITES.length)];
    const wrongCount = choiceCount - 1;
    const shuffled = [...i.wrong].sort(() => Math.random() - 0.5).slice(0, wrongCount);
    const opts = [i.correct, ...shuffled].sort(() => Math.random() - 0.5);
    setItem(i);
    setOptions(opts);
    setFeedback(null);
  }, [round, score, ROUNDS, choiceCount]);

  function handlePick(opt) {
    if (feedback !== null) return;
    playClick();
    const correct = opt === item?.correct;
    if (correct) {
      setScore((s) => s + 1);
      setStreak((s) => s + 1);
      playSuccess();
    } else {
      setStreak(0);
      playWrong();
    }
    setFeedback(correct ? 'correct' : 'wrong');
    setTimeout(() => setRound((r) => r + 1), feedbackDelay);
  }

  if (round >= ROUNDS) return <div className={styles.container}>Calculating your rewards…</div>;

  return (
    <div className={styles.container}>
      <div className={styles.progress}>Lv {level} · Round {round + 1}/{ROUNDS} · Find the opposite! Score: {score}{streak > 1 ? ` · Streak: ${streak}` : ''}</div>
      <p className={styles.prompt}>What is the opposite of "{item?.word}"?</p>
      <div className={styles.choices}>
        {options.map((opt, i) => (
          <button key={i} type="button" onClick={() => handlePick(opt)} className={`${styles.choiceBtn} ${styles.choiceNumber}`} disabled={feedback !== null}>{opt}</button>
        ))}
      </div>
      {feedback && <p className={feedback === 'correct' ? styles.feedbackOk : styles.feedbackBad}>{feedback === 'correct' ? '✓ Correct!' : 'Try again!'}</p>}
    </div>
  );
}
