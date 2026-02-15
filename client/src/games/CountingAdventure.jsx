import { useState, useEffect, useRef } from 'react';
import { useAudio } from '../context/AudioContext';
import { ai as aiApi } from '../api/client';
import { getRounds, getMaxNumber, getChoiceCount, getFeedbackDelay } from './levelConfig';
import { COUNTING_THEMES, GameImage } from './gameImages';
import styles from './GameCommon.module.css';

export default function CountingAdventure({ onComplete, level = 1, childAge }) {
  const { playSuccess, playWrong, playClick } = useAudio();
  const [round, setRound] = useState(0);
  const [count, setCount] = useState(0);
  const [options, setOptions] = useState([]);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [currentObj, setCurrentObj] = useState(null);
  const [theme, setTheme] = useState(COUNTING_THEMES[0]);
  const [streak, setStreak] = useState(0);
  const [hint, setHint] = useState('');
  const [showHint, setShowHint] = useState(false);
  const completedRef = useRef(false);
  const ROUNDS = getRounds(level);
  const MAX_COUNT = getMaxNumber(level);
  const CHOICES = getChoiceCount(level);
  const delay = getFeedbackDelay(level);

  useEffect(() => { setTheme(COUNTING_THEMES[Math.floor(Math.random() * COUNTING_THEMES.length)]); }, []);

  useEffect(() => {
    if (round >= ROUNDS && !completedRef.current) {
      completedRef.current = true;
      onComplete(score, Math.round((score / ROUNDS) * 100));
      return;
    }
    const n = Math.floor(Math.random() * MAX_COUNT) + 1;
    const wrong = new Set([n]);
    while (wrong.size < CHOICES) {
      const w = Math.floor(Math.random() * MAX_COUNT) + 1;
      if (w !== n) wrong.add(w);
    }
    setCount(n);
    setOptions([...wrong].sort(() => Math.random() - 0.5));
    setCurrentObj(theme.objects[Math.floor(Math.random() * theme.objects.length)]);
    setFeedback(null);
    setShowHint(false);
    setHint('');
  }, [round, ROUNDS, MAX_COUNT, CHOICES, theme]);

  function handleAnswer(selected) {
    if (feedback !== null) return;
    playClick();
    const correct = selected === count;
    if (correct) { setScore(s => s + 1); setStreak(s => s + 1); playSuccess(); }
    else { setStreak(0); playWrong(); }
    setFeedback(correct ? 'correct' : 'wrong');
    setTimeout(() => setRound(r => r + 1), delay);
  }

  async function requestHint() {
    setShowHint(true);
    try {
      const res = await aiApi.hint('counting-adventure', `Count: ${count}`, score, Math.round((score / Math.max(1, round)) * 100), childAge || 5);
      setHint(res.hint || 'Count each one carefully!');
    } catch (_) { setHint('Count each one slowly!'); }
  }

  if (round >= ROUNDS) return <div className={styles.container}><p className={styles.prompt}>Calculating rewards...</p></div>;

  return (
    <div className={styles.container}>
      <div className={styles.progress}>
        <span>Lv {level} · {round + 1}/{ROUNDS}</span><span>·</span><span>⭐ {score}</span>
        {streak >= 2 && <span>· 🔥 {streak}</span>}
      </div>
      <p className={styles.prompt}>
        How many <strong>{currentObj?.name || 'items'}</strong> are there?
      </p>
      <div className={styles.countDisplay}>
        {Array.from({ length: count }, (_, i) => (
          <span key={i} className={styles.countEmoji}>
            {currentObj ? (
              <GameImage src={currentObj.img} alt={currentObj.name} size={level <= 10 ? 48 : 40} />
            ) : '⭐'}
          </span>
        ))}
      </div>
      {!showHint && feedback === null && (
        <button type="button" onClick={requestHint} style={{ background:'none',border:'none',color:'var(--primary)',fontSize:'0.85rem',fontWeight:700,cursor:'pointer',marginBottom:'0.75rem',padding:'0.25rem 0.5rem',minHeight:'auto' }}>🐻 Need a hint?</button>
      )}
      {showHint && hint && (
        <div style={{ background:'rgba(56,189,248,0.08)',padding:'0.5rem 0.75rem',borderRadius:'12px',fontSize:'0.85rem',fontWeight:600,marginBottom:'0.75rem' }}>🐻 {hint}</div>
      )}
      <div className={styles.choices}>
        {options.map(num => (
          <button key={num} type="button" onClick={() => handleAnswer(num)}
            className={`${styles.choiceBtn} ${styles.choiceNumber} ${feedback !== null ? (num === count ? styles.correct : feedback === 'wrong' ? styles.wrong : '') : ''}`}
            disabled={feedback !== null}>{num}</button>
        ))}
      </div>
      {feedback && (
        <p className={feedback === 'correct' ? styles.feedbackOk : styles.feedbackBad}>
          {feedback === 'correct' ? (streak >= 3 ? '🔥 Amazing streak!' : '✓ Correct!') : `It was ${count}! Keep going!`}
        </p>
      )}
    </div>
  );
}
