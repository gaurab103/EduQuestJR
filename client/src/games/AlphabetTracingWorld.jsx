import { useState, useEffect, useRef } from 'react';
import { useAudio } from '../context/AudioContext';
import { getRounds, getChoiceCount, getFeedbackDelay } from './levelConfig';
import styles from './GameCommon.module.css';

const ALL_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

function getLetterPool(level) {
  if (level <= 10) return ALL_LETTERS.slice(0, 13);
  if (level <= 20) return ALL_LETTERS.slice(0, 20);
  return ALL_LETTERS;
}

export default function AlphabetTracingWorld({ onComplete, level = 1 }) {
  const { playSuccess, playWrong, playClick } = useAudio();
  const [round, setRound] = useState(0);
  const [target, setTarget] = useState('');
  const [options, setOptions] = useState([]);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [streak, setStreak] = useState(0);
  const completedRef = useRef(false);
  const ROUNDS = getRounds(level);
  const CHOICE_COUNT = getChoiceCount(level);
  const letterPool = getLetterPool(level);

  useEffect(() => {
    window.speechSynthesis?.cancel();
    if (round >= ROUNDS && !completedRef.current) {
      completedRef.current = true;
      const accuracy = Math.round((score / ROUNDS) * 100);
      onComplete(score, accuracy);
      return;
    }
    const targetLetter = letterPool[Math.floor(Math.random() * letterPool.length)];
    const opts = new Set([targetLetter]);
    while (opts.size < CHOICE_COUNT) {
      opts.add(letterPool[Math.floor(Math.random() * letterPool.length)]);
    }
    setTarget(targetLetter);
    setOptions([...opts].sort(() => Math.random() - 0.5));
    setFeedback(null);
  }, [round, score, ROUNDS, CHOICE_COUNT, letterPool]);

  function handleChoice(letter) {
    if (feedback !== null) return;
    playClick();
    const correct = letter === target;
    if (correct) {
      setScore((s) => s + 1);
      setStreak((s) => s + 1);
      playSuccess();
    } else {
      setStreak(0);
      playWrong();
    }
    setFeedback(correct ? 'correct' : 'wrong');
    const delay = getFeedbackDelay(level, correct);
    setTimeout(() => setRound((r) => r + 1), delay);
  }

  if (round >= ROUNDS) return <div className={styles.container}>Calculating your rewards…</div>;

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
      <p className={styles.prompt}>Tap the letter:</p>
      <div className={styles.targetArea}>
        <span className={styles.targetLetter} aria-label={`Letter ${target}`}>{target}</span>
      </div>
      <div className={styles.choices}>
        {options.map((letter) => (
          <button
            key={letter}
            type="button"
            onClick={() => handleChoice(letter)}
            className={`${styles.choiceBtn} ${styles.choiceNumber} ${
              feedback !== null
                ? letter === target
                  ? styles.correct
                  : feedback === 'wrong' && letter !== target
                  ? styles.wrong
                  : ''
                : ''
            }`}
            disabled={feedback !== null}
          >
            {letter}
          </button>
        ))}
      </div>
      {feedback === 'correct' && (
        <p className={styles.feedbackOk}>{streak >= 3 ? '🔥 Letter Master!' : '✓ Correct!'}</p>
      )}
      {feedback === 'wrong' && (
        <div className={styles.feedbackBad}>
          <p>✗ The answer is <strong>{target}</strong></p>
        </div>
      )}
    </div>
  );
}
