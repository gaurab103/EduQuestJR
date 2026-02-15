import { useState, useEffect, useRef } from 'react';
import { useAudio } from '../context/AudioContext';
import { useTeaching } from './useTeaching';
import { getRounds, getChoiceCount, getFeedbackDelay } from './levelConfig';
import { BIG_SMALL_PAIRS, GameImage } from './gameImages';
import styles from './GameCommon.module.css';

function getSizeDiff(level) {
  if (level <= 3) return [100, 48];
  if (level <= 6) return [96, 52];
  if (level <= 10) return [88, 56];
  if (level <= 15) return [84, 60];
  if (level <= 20) return [78, 62];
  return [74, 64];
}

function getQuestionTypes(level) {
  if (level <= 5) return ['big', 'small'];
  if (level <= 10) return ['big', 'small', 'big', 'big'];
  return ['big', 'small', 'big', 'small'];
}

export default function BigVsSmall({ onComplete, level = 1 }) {
  const { playSuccess, playWrong, playClick } = useAudio();
  const { teachAfterAnswer, readQuestion } = useTeaching();
  const [round, setRound] = useState(0);
  const [ask, setAsk] = useState('big');
  const [pair, setPair] = useState(null);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [streak, setStreak] = useState(0);
  const [swapped, setSwapped] = useState(false);
  const completedRef = useRef(false);
  const ROUNDS = getRounds(level);
  const [bigSize, smallSize] = getSizeDiff(level);
  const delay = getFeedbackDelay(level);

  useEffect(() => {
    if (round >= ROUNDS && !completedRef.current) {
      completedRef.current = true;
      onComplete(score, Math.round((score / ROUNDS) * 100));
      return;
    }
    const p = BIG_SMALL_PAIRS[Math.floor(Math.random() * BIG_SMALL_PAIRS.length)];
    const types = getQuestionTypes(level);
    const q = types[Math.floor(Math.random() * types.length)];
    setPair(p);
    setAsk(q);
    setSwapped(Math.random() > 0.5);
    setFeedback(null);
    readQuestion('Tap the ' + (q === 'big' ? 'bigger' : 'smaller') + ' one!');
  }, [round, ROUNDS, level, readQuestion]);

  function handlePick(choice) {
    if (feedback !== null) return;
    playClick();
    const correct = choice === ask;
    if (correct) { setScore(s => s + 1); setStreak(s => s + 1); playSuccess(); }
    else { setStreak(0); playWrong(); }
    setFeedback(correct ? 'correct' : 'wrong');
    const correctItem = ask === 'big' ? pair.big : pair.small;
    const selectedItem = choice === 'left' ? (swapped ? pair.small : pair.big) : (swapped ? pair.big : pair.small);
    teachAfterAnswer(correct, { type: 'animal', answer: selectedItem.name, correctAnswer: correctItem.name });
    setTimeout(() => setRound(r => r + 1), delay);
  }

  if (round >= ROUNDS) return <div className={styles.container}><p className={styles.prompt}>Calculating your rewards...</p></div>;
  if (!pair) return null;

  const leftIs = swapped ? 'small' : 'big';
  const rightIs = swapped ? 'big' : 'small';
  const leftItem = swapped ? pair.small : pair.big;
  const rightItem = swapped ? pair.big : pair.small;
  const leftSize = swapped ? smallSize : bigSize;
  const rightSize = swapped ? bigSize : smallSize;

  return (
    <div className={styles.container}>
      <div className={styles.progress}>
        <span>Level {level} · Round {round + 1} / {ROUNDS}</span>
        <span>·</span>
        <span>⭐ {score}</span>
        {streak >= 2 && <span>· 🔥 {streak}</span>}
      </div>

      <p className={styles.prompt}>
        Tap the {ask === 'big' ? <strong style={{ color: 'var(--primary)' }}>BIGGER</strong> : <strong style={{ color: 'var(--accent)' }}>SMALLER</strong>} one!
      </p>

      <div style={{
        display: 'flex',
        gap: '1.5rem',
        justifyContent: 'center',
        alignItems: 'flex-end',
        marginBottom: '1.5rem',
        minHeight: '140px',
      }}>
        <button
          type="button"
          onClick={() => handlePick(leftIs)}
          className={styles.choiceBtn}
          disabled={feedback !== null}
          style={{
            width: `${leftSize + 40}px`,
            height: `${leftSize + 40}px`,
            minWidth: `${leftSize + 40}px`,
            minHeight: `${leftSize + 40}px`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0.5rem',
            borderColor: feedback !== null
              ? (leftIs === ask ? 'var(--success)' : 'var(--coral-pink)')
              : 'var(--sky-blue)',
            background: feedback !== null && leftIs === ask
              ? 'rgba(74, 222, 128, 0.15)' : 'var(--card-bg)',
            transition: 'all 0.2s',
            flexDirection: 'column',
            gap: '0.25rem',
          }}
        >
          <GameImage src={leftItem.img} alt={leftItem.name} size={leftSize} />
          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)' }}>{leftItem.name}</span>
        </button>

        <button
          type="button"
          onClick={() => handlePick(rightIs)}
          className={styles.choiceBtn}
          disabled={feedback !== null}
          style={{
            width: `${rightSize + 40}px`,
            height: `${rightSize + 40}px`,
            minWidth: `${rightSize + 40}px`,
            minHeight: `${rightSize + 40}px`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0.5rem',
            borderColor: feedback !== null
              ? (rightIs === ask ? 'var(--success)' : 'var(--coral-pink)')
              : 'var(--sky-blue)',
            background: feedback !== null && rightIs === ask
              ? 'rgba(74, 222, 128, 0.15)' : 'var(--card-bg)',
            transition: 'all 0.2s',
            flexDirection: 'column',
            gap: '0.25rem',
          }}
        >
          <GameImage src={rightItem.img} alt={rightItem.name} size={rightSize} />
          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)' }}>{rightItem.name}</span>
        </button>
      </div>

      {feedback && (
        <p className={feedback === 'correct' ? styles.feedbackOk : styles.feedbackBad}>
          {feedback === 'correct'
            ? streak >= 3 ? '🔥 Size Expert!' : '✓ Correct!'
            : `The ${ask === 'big' ? 'bigger' : 'smaller'} one was the ${ask === 'big' ? pair.big.name : pair.small.name}!`}
        </p>
      )}
    </div>
  );
}
