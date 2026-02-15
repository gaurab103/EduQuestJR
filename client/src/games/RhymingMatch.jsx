import { useState, useEffect, useRef } from 'react';
import styles from './GameCommon.module.css';
import { getRounds, getChoiceCount, getFeedbackDelay } from './levelConfig';
import { useAudio } from '../context/AudioContext';
import { RHYME_IMAGES, GameImage } from './gameImages';

const RHYMES = [
  { word: 'cat', options: ['hat', 'dog', 'run', 'mat', 'bat'], img: RHYME_IMAGES.cat },
  { word: 'sun', options: ['fun', 'car', 'tree', 'run', 'bun'], img: RHYME_IMAGES.sun },
  { word: 'ball', options: ['tall', 'fish', 'blue', 'call', 'fall'], img: RHYME_IMAGES.ball },
  { word: 'dog', options: ['fog', 'cat', 'red', 'log', 'jog'], img: RHYME_IMAGES.dog },
  { word: 'tree', options: ['bee', 'car', 'hat', 'see', 'free'], img: RHYME_IMAGES.tree },
  { word: 'hat', options: ['cat', 'mat', 'rat', 'sat', 'bat'], img: RHYME_IMAGES.hat },
  { word: 'fish', options: ['dish', 'sun', 'bed', 'wish', 'swish'], img: RHYME_IMAGES.fish },
  { word: 'bed', options: ['red', 'fed', 'led', 'sad', 'head'], img: RHYME_IMAGES.bed },
];

function getOptionsForLevel(item, count) {
  const correct = item.options[0];
  const wrong = item.options.slice(1).sort(() => Math.random() - 0.5).slice(0, count - 1);
  return [correct, ...wrong].sort(() => Math.random() - 0.5);
}

export default function RhymingMatch({ onComplete, level = 1 }) {
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
      onComplete(score, Math.round((score / ROUNDS) * 100));
      return;
    }
    const r = RHYMES[Math.floor(Math.random() * RHYMES.length)];
    setItem(r);
    setOptions(getOptionsForLevel(r, choiceCount));
    setFeedback(null);
  }, [round, score, ROUNDS, choiceCount]);

  function handlePick(opt) {
    if (feedback !== null) return;
    playClick();
    const correct = item?.options[0] === opt;
    if (correct) { setScore(s => s + 1); setStreak(s => s + 1); playSuccess(); }
    else { setStreak(0); playWrong(); }
    setFeedback(correct ? 'correct' : 'wrong');
    setTimeout(() => setRound(r => r + 1), feedbackDelay);
  }

  if (round >= ROUNDS) return <div className={styles.container}>Calculating your rewards...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.progress}>
        <span>Lv {level} · Round {round + 1}/{ROUNDS}</span><span>·</span>
        <span>Score: {score}</span>
        {streak > 1 && <span>· 🔥 {streak}</span>}
      </div>
      <p className={styles.prompt}>Which rhymes with "<strong>{item?.word}</strong>"?</p>
      <div className={styles.targetArea} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
        {item?.img && <GameImage src={item.img} alt={item.word} size={56} />}
        <strong style={{ fontSize: '1.5rem' }}>{item?.word}</strong>
      </div>
      <div className={styles.choices}>
        {options.map((opt, i) => (
          <button key={i} type="button" onClick={() => handlePick(opt)}
            className={`${styles.choiceBtn} ${styles.choiceNumber}`}
            disabled={feedback !== null}>{opt}</button>
        ))}
      </div>
      {feedback && <p className={feedback === 'correct' ? styles.feedbackOk : styles.feedbackBad}>
        {feedback === 'correct' ? '✓ Correct!' : `The answer was "${item?.options[0]}"!`}
      </p>}
    </div>
  );
}
