import { useState, useEffect, useRef } from 'react';
import styles from './GameCommon.module.css';
import { getRounds, getChoiceCount, getFeedbackDelay, getMaxNumber } from './levelConfig';
import { useAudio } from '../context/AudioContext';

function getProblem(level) {
  const maxNum = getMaxNumber(level);
  const choiceCount = getChoiceCount(level);
  const seqLen = 4;
  const start = Math.floor(Math.random() * Math.max(1, maxNum - seqLen)) + 1;
  const seq = [start, start + 1, start + 2, start + 3];
  const blank = Math.floor(Math.random() * seqLen);
  const answer = seq[blank];
  const opts = new Set([answer]);
  while (opts.size < choiceCount) opts.add(Math.max(1, answer + (Math.floor(Math.random() * 9) - 4)));
  return { seq, blank, answer, options: [...opts].sort(() => Math.random() - 0.5) };
}

export default function MissingNumber({ onComplete, level = 1 }) {
  const { playSuccess, playWrong, playClick } = useAudio();
  const [round, setRound] = useState(0);
  const [problem, setProblem] = useState(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const completedRef = useRef(false);
  const ROUNDS = getRounds(level);
  const feedbackDelay = getFeedbackDelay(level);

  useEffect(() => {
    if (round >= ROUNDS && !completedRef.current) {
      completedRef.current = true;
      const accuracy = Math.round((score / ROUNDS) * 100);
      onComplete(score, accuracy);
      return;
    }
    setProblem(getProblem(level));
    setFeedback(null);
  }, [round, score, ROUNDS, level]);

  function handleAnswer(n) {
    if (feedback !== null || !problem) return;
    playClick();
    const correct = n === problem.answer;
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
  if (!problem) return null;

  return (
    <div className={styles.container}>
      <div className={styles.progress}>Lv {level} · Round {round + 1}/{ROUNDS} · Fill the missing number! Score: {score}{streak > 1 ? ` · Streak: ${streak}` : ''}</div>
      <p className={styles.prompt}>What number goes in the blank?</p>
      <div className={styles.sequenceArea}>
        {problem.seq.map((n, i) => (
          i === problem.blank ? (
            <span key={i} className={styles.sequenceItem} style={{ background: '#e5e7eb' }}>?</span>
          ) : (
            <span key={i} className={styles.sequenceItem}>{n}</span>
          )
        ))}
      </div>
      <div className={styles.choices}>
        {problem.options.map((n) => (
          <button key={n} type="button" onClick={() => handleAnswer(n)} className={`${styles.choiceBtn} ${styles.choiceNumber}`} disabled={feedback !== null}>{n}</button>
        ))}
      </div>
      {feedback && <p className={feedback === 'correct' ? styles.feedbackOk : styles.feedbackBad}>{feedback === 'correct' ? '✓ Correct!' : 'Try again!'}</p>}
    </div>
  );
}
