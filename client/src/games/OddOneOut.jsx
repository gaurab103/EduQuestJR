import { useState, useEffect, useRef } from 'react';
import { useAudio } from '../context/AudioContext';
import { getRounds, getFeedbackDelay } from './levelConfig';
import { ODD_ONE_OUT_SETS, GameImage } from './gameImages';
import styles from './GameCommon.module.css';

export default function OddOneOut({ onComplete, level = 1 }) {
  const { playSuccess, playWrong, playClick } = useAudio();
  const [round, setRound] = useState(0);
  const [items, setItems] = useState([]);
  const [oddIndex, setOddIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const completedRef = useRef(false);
  const ROUNDS = getRounds(level);
  const delay = getFeedbackDelay(level);

  useEffect(() => {
    if (round >= ROUNDS && !completedRef.current) {
      completedRef.current = true;
      onComplete(score, Math.round((score / ROUNDS) * 100));
      return;
    }
    const set = ODD_ONE_OUT_SETS[Math.floor(Math.random() * ODD_ONE_OUT_SETS.length)];
    const count = level <= 5 ? 3 : level <= 15 ? 4 : 5;
    const arr = [];
    for (let i = 0; i < count - 1; i++) arr.push({ ...set.same, isOdd: false });
    arr.push({ ...set.odd, isOdd: true });
    // Shuffle
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    setItems(arr);
    setOddIndex(arr.findIndex(a => a.isOdd));
    setFeedback(null);
  }, [round, score, ROUNDS, level]);

  function handleChoice(idx) {
    if (feedback !== null) return;
    playClick();
    const correct = idx === oddIndex;
    if (correct) { setScore(s => s + 1); playSuccess(); }
    else { playWrong(); }
    setFeedback(correct ? 'correct' : 'wrong');
    setTimeout(() => setRound(r => r + 1), delay);
  }

  if (round >= ROUNDS) return <div className={styles.container}>Calculating your rewards...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.progress}>
        <span>Lv {level} · Round {round + 1}/{ROUNDS}</span><span>·</span><span>Score: {score}</span>
      </div>
      <p className={styles.prompt}>Which one is different?</p>
      <div className={styles.choices}>
        {items.map((item, i) => (
          <button
            key={i}
            type="button"
            onClick={() => handleChoice(i)}
            className={`${styles.choiceBtn} ${
              feedback !== null && i === oddIndex ? styles.correct : ''
            } ${feedback !== null && i !== oddIndex ? styles.wrong : ''}`}
            disabled={feedback !== null}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem', padding: '0.5rem' }}
          >
            <GameImage src={item.img} alt={item.name} size={48} />
            <span style={{ fontSize: '0.68rem', fontWeight: 700 }}>{item.name}</span>
          </button>
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
