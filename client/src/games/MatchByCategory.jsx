import { useState, useEffect, useRef } from 'react';
import { useAudio } from '../context/AudioContext';
import { getRounds, getChoiceCount, getFeedbackDelay } from './levelConfig';
import { FRUIT_IMAGES, VEGGIE_IMAGES, GameImage } from './gameImages';
import styles from './GameCommon.module.css';

const FRUITS = Object.entries(FRUIT_IMAGES).map(([name, img]) => ({ name, img, cat: 'fruit' }));
const VEGGIES = Object.entries(VEGGIE_IMAGES).map(([name, img]) => ({ name, img, cat: 'veggie' }));

export default function MatchByCategory({ onComplete, level = 1 }) {
  const { playSuccess, playWrong, playClick } = useAudio();
  const [round, setRound] = useState(0);
  const [target, setTarget] = useState(null);
  const [options, setOptions] = useState([]);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const completedRef = useRef(false);
  const ROUNDS = getRounds(level);
  const CHOICES = getChoiceCount(level);
  const delay = getFeedbackDelay(level);

  useEffect(() => {
    if (round >= ROUNDS && !completedRef.current) {
      completedRef.current = true;
      onComplete(score, Math.round((score / ROUNDS) * 100));
      return;
    }
    const cat = Math.random() > 0.5 ? 'fruit' : 'veggie';
    const pool = cat === 'fruit' ? FRUITS : VEGGIES;
    const other = cat === 'fruit' ? VEGGIES : FRUITS;
    const targetItem = pool[Math.floor(Math.random() * pool.length)];
    const opts = [targetItem];
    const used = new Set([targetItem.name]);
    while (opts.length < CHOICES) {
      const item = other[Math.floor(Math.random() * other.length)];
      if (!used.has(item.name)) { opts.push(item); used.add(item.name); }
    }
    setTarget(targetItem);
    setOptions(opts.sort(() => Math.random() - 0.5));
    setFeedback(null);
  }, [round, score, ROUNDS, CHOICES]);

  function handlePick(item) {
    if (feedback !== null) return;
    playClick();
    const correct = item.name === target?.name;
    if (correct) { setScore(s => s + 1); setStreak(s => s + 1); playSuccess(); }
    else { setStreak(0); playWrong(); }
    setFeedback(correct ? 'correct' : 'wrong');
    setTimeout(() => setRound(r => r + 1), delay);
  }

  if (round >= ROUNDS) return <div className={styles.container}>Calculating your rewards...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.progress}>
        <span>Lv {level} · Round {round + 1}/{ROUNDS}</span><span>·</span>
        <span>Find the {target?.cat}! Score: {score}</span>
        {streak >= 2 && <span>· 🔥 {streak}</span>}
      </div>
      <p className={styles.prompt}>Tap the <strong>{target?.cat}</strong> that matches:</p>
      <div className={styles.targetArea}>
        {target && <GameImage src={target.img} alt={target.name} size={64} />}
        <strong style={{ display: 'block', marginTop: '0.25rem' }}>{target?.name}</strong>
      </div>
      <div className={styles.choices}>
        {options.map((item, i) => (
          <button key={i} type="button" onClick={() => handlePick(item)}
            className={`${styles.choiceBtn}`}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem', padding: '0.5rem' }}
            disabled={feedback !== null}>
            <GameImage src={item.img} alt={item.name} size={44} />
            <span style={{ fontSize: '0.72rem', fontWeight: 700 }}>{item.name}</span>
          </button>
        ))}
      </div>
      {feedback && <p className={feedback === 'correct' ? styles.feedbackOk : styles.feedbackBad}>
        {feedback === 'correct' ? (streak >= 3 ? '🔥 Category Master!' : '✓ Correct!') : 'Try again!'}
      </p>}
    </div>
  );
}
