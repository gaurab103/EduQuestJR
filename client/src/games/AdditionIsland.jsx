import { useState, useEffect, useRef } from 'react';
import { useAudio } from '../context/AudioContext';
import { useTeaching } from './useTeaching';
import { getRounds, getChoiceCount, getFeedbackDelay } from './levelConfig';
import styles from './GameCommon.module.css';

function getMaxForAddition(level) {
  if (level <= 5) return 9;
  if (level <= 10) return 15;
  if (level <= 15) return 20;
  return 30;
}

function getProblem(level) {
  const max = getMaxForAddition(level);
  const a = Math.floor(Math.random() * max) + 1;
  const b = Math.floor(Math.random() * max) + 1;
  const sum = a + b;
  const choiceCount = getChoiceCount(level);
  const wrong = new Set([sum]);
  const maxWrong = Math.min(max * 2, 50);
  while (wrong.size < choiceCount) {
    wrong.add(Math.floor(Math.random() * maxWrong) + 1);
  }
  return { a, b, sum, options: [...wrong].sort(() => Math.random() - 0.5) };
}

export default function AdditionIsland({ onComplete, level = 1 }) {
  const { playSuccess, playWrong, playClick } = useAudio();
  const { teachAfterAnswer, readQuestion } = useTeaching();
  const [round, setRound] = useState(0);
  const [problem, setProblem] = useState(null);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [streak, setStreak] = useState(0);
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
    const p = getProblem(level);
    setProblem(p);
    setFeedback(null);
    if (p) readQuestion('What is ' + p.a + ' plus ' + p.b + '?');
  }, [round, score, ROUNDS, level, readQuestion]);

  function handleAnswer(num) {
    if (feedback !== null || !problem) return;
    playClick();
    const correct = num === problem.sum;
    if (correct) {
      setScore((s) => s + 1);
      setStreak((s) => s + 1);
      playSuccess();
    } else {
      setStreak(0);
      playWrong();
    }
    setFeedback(correct ? 'correct' : 'wrong');
    teachAfterAnswer(correct, { type: 'math', answer: num, correctAnswer: problem.sum, extra: `${problem.a} plus ${problem.b} equals ${problem.a + problem.b}!` });
    setTimeout(() => setRound((r) => r + 1), feedbackDelay);
  }

  if (round >= ROUNDS) return <div className={styles.container}>Calculating your rewards…</div>;
  if (!problem) return <div className={styles.container}>Loading…</div>;

  return (
    <div className={styles.container}>
      <div className={styles.progress}>
        <span>Lv {level}</span>
        <span>·</span>
        <span>Round {round + 1} of {ROUNDS}</span>
        <span>·</span>
        <span>Score: {score}</span>
        {streak >= 2 && <span>· 🔥 {streak}</span>}
      </div>
      <p className={styles.prompt}>What is {problem.a} + {problem.b}?</p>
      <div className={styles.choices}>
        {problem.options.map((num) => (
          <button
            key={num}
            type="button"
            onClick={() => handleAnswer(num)}
            className={`${styles.choiceBtn} ${styles.choiceNumber} ${
              feedback !== null
                ? num === problem.sum
                  ? styles.correct
                  : styles.wrong
                : ''
            }`}
            disabled={feedback !== null}
          >
            {num}
          </button>
        ))}
      </div>
      {feedback && (
        <p className={feedback === 'correct' ? styles.feedbackOk : styles.feedbackBad}>
          {feedback === 'correct'
            ? streak >= 3 ? '🔥 Math Master!' : '✓ Correct!'
            : 'Try again next round!'}
        </p>
      )}
    </div>
  );
}
