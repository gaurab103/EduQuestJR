import { useState, useEffect, useRef } from 'react';
import { useAudio } from '../context/AudioContext';
import { useTeaching } from './useTeaching';
import { getRounds, getMaxNumber, getFeedbackDelay } from './levelConfig';
import { FRUIT_IMAGES, GameImage } from './gameImages';
import styles from './GameCommon.module.css';

const ITEM_POOL = Object.entries(FRUIT_IMAGES).map(([name, img]) => ({ name, img }));

export default function MoreOrLess({ onComplete, level = 1 }) {
  const { playSuccess, playWrong, playClick } = useAudio();
  const { teachAfterAnswer, readQuestion } = useTeaching();
  const [round, setRound] = useState(0);
  const [left, setLeft] = useState(0);
  const [right, setRight] = useState(0);
  const [ask, setAsk] = useState('more');
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [currentItem, setCurrentItem] = useState(ITEM_POOL[0]);
  const completedRef = useRef(false);
  const ROUNDS = getRounds(level);
  const MAX_NUM = getMaxNumber(level);
  const delay = getFeedbackDelay(level);

  useEffect(() => {
    if (round >= ROUNDS && !completedRef.current) {
      completedRef.current = true;
      onComplete(score, Math.round((score / ROUNDS) * 100));
      return;
    }
    const a = Math.floor(Math.random() * MAX_NUM) + 1;
    let b = Math.floor(Math.random() * MAX_NUM) + 1;
    while (b === a) b = Math.floor(Math.random() * MAX_NUM) + 1;
    setLeft(a);
    setRight(b);
    const q = Math.random() > 0.5 ? 'more' : 'less';
    setAsk(q);
    const item = ITEM_POOL[Math.floor(Math.random() * ITEM_POOL.length)];
    setCurrentItem(item);
    setFeedback(null);
    readQuestion('Tap the group with ' + q + ' ' + item.name + 's:');
  }, [round, score, ROUNDS, MAX_NUM, readQuestion]);

  function handlePick(choice) {
    if (feedback !== null) return;
    playClick();
    const correct =
      (ask === 'more' && left > right && choice === 'left') ||
      (ask === 'more' && right > left && choice === 'right') ||
      (ask === 'less' && left < right && choice === 'left') ||
      (ask === 'less' && right < left && choice === 'right');
    if (correct) { setScore(s => s + 1); setStreak(s => s + 1); playSuccess(); }
    else { setStreak(0); playWrong(); }
    setFeedback(correct ? 'correct' : 'wrong');
    const correctSide = (ask === 'more' && left > right) || (ask === 'less' && left < right) ? 'left' : 'right';
    const correctCount = correctSide === 'left' ? left : right;
    teachAfterAnswer(correct, { type: 'math', extra: 'The side with ' + correctCount + ' had ' + ask + '!' });
    setTimeout(() => setRound(r => r + 1), delay);
  }

  if (round >= ROUNDS) return <div className={styles.container}>Calculating your rewards...</div>;

  const imgSize = level <= 10 ? 32 : 28;

  return (
    <div className={styles.container}>
      <div className={styles.progress}>
        <span>Lv {level} · Round {round + 1}/{ROUNDS}</span><span>·</span>
        <span>Which has {ask}? Score: {score}</span>
        {streak >= 2 && <span>· 🔥 {streak}</span>}
      </div>
      <p className={styles.prompt}>Tap the group with <strong>{ask}</strong> {currentItem.name}s:</p>
      <div className={styles.moreLessRow}>
        <button type="button" onClick={() => handlePick('left')} className={styles.moreLessBtn} disabled={feedback !== null}>
          {Array.from({ length: left }, (_, i) => (
            <GameImage key={i} src={currentItem.img} alt={currentItem.name} size={imgSize} />
          ))}
        </button>
        <button type="button" onClick={() => handlePick('right')} className={styles.moreLessBtn} disabled={feedback !== null}>
          {Array.from({ length: right }, (_, i) => (
            <GameImage key={i} src={currentItem.img} alt={currentItem.name} size={imgSize} />
          ))}
        </button>
      </div>
      {feedback && <p className={feedback === 'correct' ? styles.feedbackOk : styles.feedbackBad}>
        {feedback === 'correct' ? (streak >= 3 ? '🔥 Count Master!' : '✓ Correct!') : 'Try again!'}
      </p>}
    </div>
  );
}
