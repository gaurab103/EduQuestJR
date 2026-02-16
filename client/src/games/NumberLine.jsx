/**
 * NumberLine - "What number goes here?" 0—?—10. Higher levels: larger numbers, "between" questions.
 * Numeracy / Free
 */
import { useState, useEffect, useRef } from 'react';
import styles from './GameCommon.module.css';
import { useAudio } from '../context/AudioContext';
import { getRounds, getChoiceCount, getFeedbackDelay, getMaxNumber } from './levelConfig';
import { useTeaching } from './useTeaching';
import { useNoRepeat } from './useNoRepeat';

function getMode(level, round) {
  if (level <= 5) return 0;
  if (level <= 10) return round % 2;
  if (level <= 15) return round % 3;
  return round % 4;
}

export default function NumberLine({ onComplete, level = 1, childAge }) {
  const { playSuccess, playWrong, playClick } = useAudio();
  const { teachAfterAnswer, readQuestion } = useTeaching();
  const { generate } = useNoRepeat();
  const [round, setRound] = useState(0);
  const [answer, setAnswer] = useState(0);
  const [options, setOptions] = useState([]);
  const [prevNum, setPrevNum] = useState(0);
  const [nextNum, setNextNum] = useState(0);
  const [betweenA, setBetweenA] = useState(0);
  const [betweenB, setBetweenB] = useState(0);
  const [mode, setModeState] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const completedRef = useRef(false);
  const ROUNDS = getRounds(level);
  const MAX = getMaxNumber(level);
  const CHOICES = getChoiceCount(level);
  const delay = getFeedbackDelay(level);

  useEffect(() => {
    if (round >= ROUNDS && !completedRef.current) {
      completedRef.current = true;
      onComplete(score, Math.round((score / ROUNDS) * 100));
      return;
    }
    const m = getMode(level, round);
    setModeState(m);

    if (m === 0) {
      const gap = Math.min(10, Math.max(5, Math.floor(MAX / 2)));
      const start = Math.floor(Math.random() * Math.max(1, MAX - gap - 1));
      const ans = start + Math.floor(gap / 2);
      const wrong = new Set([ans]);
      while (wrong.size < CHOICES) {
        const w = start + Math.floor(Math.random() * gap);
        if (w >= 0 && w <= MAX) wrong.add(w);
      }
      setPrevNum(start);
      setNextNum(start + gap);
      setAnswer(ans);
      setOptions([...wrong].sort(() => Math.random() - 0.5));
      setBetweenA(0);
      setBetweenB(0);
      const cancelRead = readQuestion(`What number goes between ${start} and ${start + gap}?`);
      return cancelRead;
    }

    if (m === 1) {
      const mid = Math.floor(MAX / 2);
      const ans = Math.floor(Math.random() * (MAX - 2)) + 1;
      const prev = ans - 1;
      const next = ans + 1;
      const wrong = new Set([ans]);
      while (wrong.size < CHOICES) wrong.add(Math.max(0, ans + (Math.floor(Math.random() * 5) - 2)));
      setPrevNum(prev);
      setNextNum(next);
      setAnswer(ans);
      setOptions([...wrong].sort(() => Math.random() - 0.5));
      setBetweenA(0);
      setBetweenB(0);
      const cancelRead = readQuestion(`What number comes between ${prev} and ${next}?`);
      return cancelRead;
    }

    if (m === 2) {
      const ans = Math.floor(Math.random() * MAX) + 1;
      const wrong = new Set([ans]);
      while (wrong.size < CHOICES) wrong.add(Math.max(0, Math.min(MAX, ans + (Math.floor(Math.random() * 7) - 3))));
      setPrevNum(0);
      setNextNum(MAX);
      setAnswer(ans);
      setOptions([...wrong].sort(() => Math.random() - 0.5));
      setBetweenA(0);
      setBetweenB(0);
      const cancelRead = readQuestion(`What number goes here on the number line?`);
      return cancelRead;
    }

    if (m === 3) {
      const a = Math.floor(Math.random() * (MAX - 2)) + 1;
      const b = a + 2 + Math.floor(Math.random() * 3);
      const ans = a + 1;
      const wrong = new Set([ans]);
      while (wrong.size < CHOICES) wrong.add(Math.max(0, ans + (Math.floor(Math.random() * 5) - 2)));
      setBetweenA(a);
      setBetweenB(b);
      setPrevNum(a);
      setNextNum(b);
      setAnswer(ans);
      setOptions([...wrong].sort(() => Math.random() - 0.5));
      const cancelRead = readQuestion(`Which number is between ${a} and ${b}?`);
      return cancelRead;
    }

    setFeedback(null);
  }, [round, ROUNDS, level, MAX, CHOICES, generate]);

  function handlePick(n) {
    if (feedback !== null) return;
    playClick();
    const correct = n === answer;
    if (correct) setScore((s) => s + 1);
    else playWrong();
    if (correct) playSuccess();
    setFeedback(correct ? 'correct' : 'wrong');
    teachAfterAnswer(correct, { type: 'math', correctAnswer: String(answer), extra: `${answer} is in the middle!` });
    setTimeout(() => setRound((r) => r + 1), delay);
  }

  if (round >= ROUNDS) return <div className={styles.container}><p className={styles.prompt}>Calculating rewards...</p></div>;

  let promptText = '';
  let displayLine = null;
  if (mode === 0) promptText = `What number goes between ${prevNum} and ${nextNum}?`;
  else if (mode === 1) promptText = `What number comes between ${prevNum} and ${nextNum}?`;
  else if (mode === 2) promptText = 'What number goes here?';
  else promptText = `Which number is between ${betweenA} and ${betweenB}?`;

  if (mode === 2) {
    displayLine = (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '1.5rem', fontWeight: 800 }}>{prevNum}</span>
        <span style={{ fontSize: '1.5rem' }}>—</span>
        <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)' }}>?</span>
        <span style={{ fontSize: '1.5rem' }}>—</span>
        <span style={{ fontSize: '1.5rem', fontWeight: 800 }}>{nextNum}</span>
      </div>
    );
  } else {
    const nums = [];
    for (let i = prevNum; i <= nextNum; i++) {
      if (i === answer) nums.push(<span key={i} style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)' }}>?</span>);
      else nums.push(<span key={i} style={{ fontSize: '1rem', fontWeight: 700 }}>{i}</span>);
      if (i < nextNum) nums.push(<span key={`dash-${i}`} style={{ fontSize: '1rem' }}>—</span>);
    }
    displayLine = <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>{nums}</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.progress}>
        <span>Lv {level} · {round + 1}/{ROUNDS}</span><span>·</span><span>⭐ {score}</span>
      </div>
      <p className={styles.prompt}>{promptText}</p>
      {displayLine}
      <div className={styles.choices}>
        {options.map((n) => (
          <button key={n} type="button" onClick={() => handlePick(n)} className={`${styles.choiceBtn} ${styles.choiceNumber} ${feedback !== null ? (n === answer ? styles.correct : styles.wrong) : ''}`} disabled={feedback !== null}>{n}</button>
        ))}
      </div>
      {feedback && <p className={feedback === 'correct' ? styles.feedbackOk : styles.feedbackBad}>{feedback === 'correct' ? '✓ Correct!' : `The answer was ${answer}!`}</p>}
    </div>
  );
}
