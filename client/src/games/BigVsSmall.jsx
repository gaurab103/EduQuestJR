import { useState, useEffect, useRef } from 'react';
import { useAudio } from '../context/AudioContext';
import { useTeaching } from './useTeaching';
import { useNoRepeat } from './useNoRepeat';
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

function getMode(level, round) {
  if (level <= 5) return 0; // Which is bigger?
  if (level <= 10) return round % 2; // 0: bigger, 1: smaller
  if (level <= 15) return round % 4; // 0: bigger, 1: smaller, 2: biggest of 3, 3: smallest of 3
  return round % 8; // 0-3 same + 4: heavier, 5: lighter, 6: taller, 7: shorter
}

export default function BigVsSmall({ onComplete, level = 1 }) {
  const { playSuccess, playWrong, playClick } = useAudio();
  const { teachAfterAnswer, readQuestion } = useTeaching();
  const { generate } = useNoRepeat(level);
  const [round, setRound] = useState(0);
  const [ask, setAsk] = useState('big');
  const [pair, setPair] = useState(null);
  const [triple, setTriple] = useState(null);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [streak, setStreak] = useState(0);
  const [swapped, setSwapped] = useState(false);
  const [mode, setModeState] = useState(0);
  const completedRef = useRef(false);
  const ROUNDS = getRounds(level);
  const [bigSize, smallSize] = getSizeDiff(level);

  useEffect(() => {
    window.speechSynthesis?.cancel();
    if (round >= ROUNDS && !completedRef.current) {
      completedRef.current = true;
      onComplete(score, Math.round((score / ROUNDS) * 100));
      return;
    }
    const m = getMode(level, round);
    setModeState(m);

    if (m <= 1) {
      const p = generate(
        () => BIG_SMALL_PAIRS[Math.floor(Math.random() * BIG_SMALL_PAIRS.length)],
        (r) => `${m}-${r.big?.name}-${r.small?.name}`
      );
      setPair(p);
      setTriple(null);
      const q = m === 0 ? 'big' : 'small';
      setAsk(q);
      setSwapped(Math.random() > 0.5);
      setFeedback(null);
      const cancelRead = readQuestion('Tap the ' + (q === 'big' ? 'bigger' : 'smaller') + ' one!');
      return cancelRead;
    }

    if (m === 2) {
      const pool = generate(
        () => [...BIG_SMALL_PAIRS].sort(() => Math.random() - 0.5).slice(0, 6),
        (r) => `${m}-${r.map(x => x.big?.name).join('-')}`
      );
      const three = [
        { ...pool[0].big, size: 72, order: 2 },
        { ...pool[1].small, size: 48, order: 0 },
        { ...pool[2].big, size: 88, order: 1 },
      ].sort(() => Math.random() - 0.5);
      three.forEach((t, i) => { t.index = i; t.isBiggest = t.size === 88; });
      setTriple(three);
      setPair(null);
      setFeedback(null);
      const cancelRead = readQuestion('Which is the BIGGEST?');
      return cancelRead;
    }

    if (m === 3) {
      const pool = generate(
        () => [...BIG_SMALL_PAIRS].sort(() => Math.random() - 0.5).slice(0, 4),
        (r) => `${m}-${r.map(x => x.big?.name).join('-')}`
      );
      const three = [
        { ...pool[0].big, size: 84, order: 2 },
        { ...pool[1].small, size: 44, order: 0 },
        { ...pool[2].big, size: 64, order: 1 },
      ].sort(() => Math.random() - 0.5);
      three.forEach((t, i) => { t.index = i; t.correctOrder = t.size === 44; });
      setTriple(three);
      setPair(null);
      setFeedback(null);
      const cancelRead = readQuestion('Tap the SMALLEST one!');
      return cancelRead;
    }

    if (m >= 4) {
      const heavyLight = BIG_SMALL_PAIRS.filter((_, i) => [0, 5, 10].includes(i));
      const tallShort = BIG_SMALL_PAIRS.filter((_, i) => [1, 7, 11].includes(i));
      const pool = generate(
        () => (m <= 5 ? heavyLight : tallShort)[Math.floor(Math.random() * 3)],
        (r) => `${m}-${r.big?.name}-${r.small?.name}`
      );
      const q = m === 4 ? 'heavier' : m === 5 ? 'lighter' : m === 6 ? 'taller' : 'shorter';
      setPair(pool);
      setTriple(null);
      setAsk(q === 'heavier' || q === 'taller' ? 'big' : 'small');
      setSwapped(Math.random() > 0.5);
      setFeedback(null);
      const cancelRead = readQuestion('Which is ' + q + '?');
      return cancelRead;
    }

    setFeedback(null);
  }, [round, ROUNDS, level]);

  function handlePick(choice) {
    if (feedback !== null) return;
    playClick();
    let correct = false;
    if (mode <= 1 && pair) {
      correct = choice === ask;
    } else if (mode === 2 && triple) {
      correct = choice === 'biggest';
    } else if (mode === 3 && triple) {
      correct = choice === 'smallest';
    } else if (mode >= 4 && pair) {
      correct = choice === ask;
    }
    if (correct) { setScore(s => s + 1); setStreak(s => s + 1); playSuccess(); }
    else { setStreak(0); playWrong(); }
    setFeedback(correct ? 'correct' : 'wrong');
    const correctItem = mode <= 1 || mode >= 4 ? (ask === 'big' ? pair?.big : pair?.small) : (mode === 2 ? triple?.find(t => t.isBiggest) : triple?.find(t => t.correctOrder));
    const selectedItem = mode <= 1 || mode >= 4 ? (choice === 'left' ? (swapped ? pair?.small : pair?.big) : (swapped ? pair?.big : pair?.small)) : null;
    teachAfterAnswer(correct, { type: 'animal', answer: selectedItem?.name || choice, correctAnswer: correctItem?.name });
    const delay = getFeedbackDelay(level, correct);
    setTimeout(() => setRound(r => r + 1), delay);
  }

  function handleTriplePick(idx, isBiggest) {
    if (feedback !== null) return;
    playClick();
    const correct = isBiggest;
    if (correct) { setScore(s => s + 1); setStreak(s => s + 1); playSuccess(); }
    else { setStreak(0); playWrong(); }
    setFeedback(correct ? 'correct' : 'wrong');
    teachAfterAnswer(correct, { type: 'animal', answer: triple[idx]?.name, correctAnswer: triple?.find(t => t.isBiggest)?.name });
    const delay = getFeedbackDelay(level, correct);
    setTimeout(() => setRound(r => r + 1), delay);
  }

  function handleSmallestPick(idx, isSmallest) {
    if (feedback !== null) return;
    playClick();
    const correct = isSmallest;
    if (correct) { setScore(s => s + 1); setStreak(s => s + 1); playSuccess(); }
    else { setStreak(0); playWrong(); }
    setFeedback(correct ? 'correct' : 'wrong');
    teachAfterAnswer(correct, { type: 'animal', answer: triple[idx]?.name, correctAnswer: triple?.find(t => t.correctOrder)?.name });
    const delay = getFeedbackDelay(level, correct);
    setTimeout(() => setRound(r => r + 1), delay);
  }

  if (round >= ROUNDS) return <div className={styles.container}><p className={styles.prompt}>Calculating your rewards...</p></div>;

  if (mode <= 1 && pair) {
    const leftIs = swapped ? 'small' : 'big';
    const rightIs = swapped ? 'big' : 'small';
    const leftItem = swapped ? pair.small : pair.big;
    const rightItem = swapped ? pair.big : pair.small;
    const leftSize = swapped ? smallSize : bigSize;
    const rightSize = swapped ? bigSize : smallSize;
    const promptLabel = mode === 0 ? 'BIGGER' : 'SMALLER';

    return (
      <div className={styles.container}>
        <div className={styles.progress}>
          <span>Level {level} · Round {round + 1} / {ROUNDS}</span>
          <span>·</span>
          <span>⭐ {score}</span>
          {streak >= 2 && <span>· 🔥 {streak}</span>}
        </div>
        <p className={styles.prompt}>Tap the <strong style={{ color: 'var(--primary)' }}>{promptLabel}</strong> one!</p>
        <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', alignItems: 'flex-end', marginBottom: '1.5rem', minHeight: '140px' }}>
          <button type="button" onClick={() => handlePick(leftIs)} className={styles.choiceBtn} disabled={feedback !== null}
            style={{ width: `${leftSize + 40}px`, height: `${leftSize + 40}px`, minWidth: `${leftSize + 40}px`, minHeight: `${leftSize + 40}px`, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.5rem', borderColor: feedback !== null ? (leftIs === ask ? 'var(--success)' : 'var(--coral-pink)') : 'var(--sky-blue)', background: feedback !== null && leftIs === ask ? 'rgba(74, 222, 128, 0.15)' : 'var(--card-bg)', flexDirection: 'column', gap: '0.25rem' }}>
            <GameImage src={leftItem.img} alt={leftItem.name} size={leftSize} />
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)' }}>{leftItem.name}</span>
          </button>
          <button type="button" onClick={() => handlePick(rightIs)} className={styles.choiceBtn} disabled={feedback !== null}
            style={{ width: `${rightSize + 40}px`, height: `${rightSize + 40}px`, minWidth: `${rightSize + 40}px`, minHeight: `${rightSize + 40}px`, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.5rem', borderColor: feedback !== null ? (rightIs === ask ? 'var(--success)' : 'var(--coral-pink)') : 'var(--sky-blue)', background: feedback !== null && rightIs === ask ? 'rgba(74, 222, 128, 0.15)' : 'var(--card-bg)', flexDirection: 'column', gap: '0.25rem' }}>
            <GameImage src={rightItem.img} alt={rightItem.name} size={rightSize} />
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)' }}>{rightItem.name}</span>
          </button>
        </div>
        {feedback === 'correct' && (
          <p className={styles.feedbackOk}>{streak >= 3 ? '🔥 Size Expert!' : '✓ Correct!'}</p>
        )}
        {feedback === 'wrong' && (
          <div className={styles.feedbackBad}>
            <p>✗ The answer is <strong>{ask === 'big' ? pair.big.name : pair.small.name}</strong></p>
          </div>
        )}
      </div>
    );
  }

  if (mode === 2 && triple) {
    return (
      <div className={styles.container}>
        <div className={styles.progress}>
          <span>Level {level} · Round {round + 1} / {ROUNDS}</span><span>·</span><span>⭐ {score}</span>
          {streak >= 2 && <span>· 🔥 {streak}</span>}
        </div>
        <p className={styles.prompt}>Which is the <strong>BIGGEST</strong>?</p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', alignItems: 'flex-end', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          {triple.map((t, i) => (
            <button key={i} type="button" onClick={() => handleTriplePick(i, t.isBiggest)} className={styles.choiceBtn} disabled={feedback !== null}
              style={{ width: `${t.size + 30}px`, height: `${t.size + 50}px`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', padding: '0.5rem', borderColor: feedback !== null && t.isBiggest ? 'var(--success)' : feedback !== null ? 'var(--coral-pink)' : 'var(--sky-blue)' }}>
              <GameImage src={t.img} alt={t.name} size={t.size} />
              <span style={{ fontSize: '0.65rem', fontWeight: 700 }}>{t.name}</span>
            </button>
          ))}
        </div>
        {feedback === 'correct' && <p className={styles.feedbackOk}>✓ Correct!</p>}
        {feedback === 'wrong' && (
          <div className={styles.feedbackBad}>
            <p>✗ The answer is <strong>{triple?.find(t => t.isBiggest)?.name}</strong></p>
          </div>
        )}
      </div>
    );
  }

  if (mode === 3 && triple) {
    return (
      <div className={styles.container}>
        <div className={styles.progress}>
          <span>Level {level} · Round {round + 1} / {ROUNDS}</span><span>·</span><span>⭐ {score}</span>
          {streak >= 2 && <span>· 🔥 {streak}</span>}
        </div>
        <p className={styles.prompt}>Tap the <strong>SMALLEST</strong> one!</p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', alignItems: 'flex-end', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          {triple.map((t, i) => (
            <button key={i} type="button" onClick={() => handleSmallestPick(i, t.correctOrder)} className={styles.choiceBtn} disabled={feedback !== null}
              style={{ width: `${t.size + 30}px`, height: `${t.size + 50}px`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', padding: '0.5rem', borderColor: feedback !== null && t.correctOrder ? 'var(--success)' : feedback !== null ? 'var(--coral-pink)' : 'var(--sky-blue)' }}>
              <GameImage src={t.img} alt={t.name} size={t.size} />
              <span style={{ fontSize: '0.65rem', fontWeight: 700 }}>{t.name}</span>
            </button>
          ))}
        </div>
        {feedback === 'correct' && <p className={styles.feedbackOk}>✓ Correct!</p>}
        {feedback === 'wrong' && (
          <div className={styles.feedbackBad}>
            <p>✗ The answer is <strong>{triple?.find(t => t.correctOrder)?.name}</strong></p>
          </div>
        )}
      </div>
    );
  }

  if (mode >= 4 && pair) {
    const leftIs = swapped ? 'small' : 'big';
    const rightIs = swapped ? 'big' : 'small';
    const leftItem = swapped ? pair.small : pair.big;
    const rightItem = swapped ? pair.big : pair.small;
    const leftSize = swapped ? smallSize : bigSize;
    const rightSize = swapped ? bigSize : smallSize;
    const labels = ['heavier', 'lighter', 'taller', 'shorter'];
    const promptLabel = labels[mode - 4];

    return (
      <div className={styles.container}>
        <div className={styles.progress}>
          <span>Level {level} · Round {round + 1} / {ROUNDS}</span><span>·</span><span>⭐ {score}</span>
          {streak >= 2 && <span>· 🔥 {streak}</span>}
        </div>
        <p className={styles.prompt}>Which is <strong>{promptLabel}</strong>?</p>
        <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', alignItems: 'flex-end', marginBottom: '1.5rem', minHeight: '140px' }}>
          <button type="button" onClick={() => handlePick(leftIs)} className={styles.choiceBtn} disabled={feedback !== null}
            style={{ width: `${leftSize + 40}px`, height: `${leftSize + 40}px`, minWidth: `${leftSize + 40}px`, minHeight: `${leftSize + 40}px`, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.5rem', borderColor: feedback !== null ? (leftIs === ask ? 'var(--success)' : 'var(--coral-pink)') : 'var(--sky-blue)', background: feedback !== null && leftIs === ask ? 'rgba(74, 222, 128, 0.15)' : 'var(--card-bg)', flexDirection: 'column', gap: '0.25rem' }}>
            <GameImage src={leftItem.img} alt={leftItem.name} size={leftSize} />
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)' }}>{leftItem.name}</span>
          </button>
          <button type="button" onClick={() => handlePick(rightIs)} className={styles.choiceBtn} disabled={feedback !== null}
            style={{ width: `${rightSize + 40}px`, height: `${rightSize + 40}px`, minWidth: `${rightSize + 40}px`, minHeight: `${rightSize + 40}px`, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.5rem', borderColor: feedback !== null ? (rightIs === ask ? 'var(--success)' : 'var(--coral-pink)') : 'var(--sky-blue)', background: feedback !== null && rightIs === ask ? 'rgba(74, 222, 128, 0.15)' : 'var(--card-bg)', flexDirection: 'column', gap: '0.25rem' }}>
            <GameImage src={rightItem.img} alt={rightItem.name} size={rightSize} />
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)' }}>{rightItem.name}</span>
          </button>
        </div>
        {feedback === 'correct' && (
          <p className={styles.feedbackOk}>{streak >= 3 ? '🔥 Size Expert!' : '✓ Correct!'}</p>
        )}
        {feedback === 'wrong' && (
          <div className={styles.feedbackBad}>
            <p>✗ The answer is <strong>{ask === 'big' ? pair.big.name : pair.small.name}</strong></p>
          </div>
        )}
      </div>
    );
  }

  return null;
}
