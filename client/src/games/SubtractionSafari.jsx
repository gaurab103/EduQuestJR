import { useState, useEffect, useRef } from 'react';
import styles from './GameCommon.module.css';
import { getRounds, getChoiceCount, getFeedbackDelay } from './levelConfig';
import { useAudio } from '../context/AudioContext';

function getMaxNum(level) {
  if (level <= 5) return 10;
  if (level <= 10) return 15;
  if (level <= 15) return 20;
  return 30;
}

function getProblem(level) {
  const maxNum = getMaxNum(level);
  const choiceCount = getChoiceCount(level);
  const a = Math.floor(Math.random() * (maxNum - 1)) + 2;
  const b = Math.floor(Math.random() * (a - 1)) + 1;
  const diff = a - b;
  const wrong = new Set([diff]);
  while (wrong.size < choiceCount) {
    const offset = Math.floor(Math.random() * 9) - 4;
    wrong.add(Math.max(0, diff + offset));
  }
  return { a, b, diff, options: [...wrong].sort(() => Math.random() - 0.5) };
}

export default function SubtractionSafari({ onComplete, level = 1 }) {
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

  function handleAnswer(num) {
    if (feedback !== null || !problem) return;
    playClick();
    const correct = num === problem.diff;
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
  if (!problem) return <div className={styles.container}>Loading…</div>;

  return (
    <div className={styles.container}>
      <div className={styles.progress}>Lv {level} · Round {round + 1} of {ROUNDS} · Score: {score}{streak > 1 ? ` · Streak: ${streak}` : ''}</div>
      <p className={styles.prompt}>What is {problem.a} − {problem.b}?</p>
      <div className={styles.choices}>
        {problem.options.map((num) => (
          <button
            key={num}
            type="button"
            onClick={() => handleAnswer(num)}
            className={`${styles.choiceBtn} ${styles.choiceNumber}`}
            disabled={feedback !== null}
          >
            {num}
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
