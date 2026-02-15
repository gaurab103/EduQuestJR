import { useState, useEffect, useRef } from 'react';
import styles from './GameCommon.module.css';
import { getRounds, getChoiceCount, getFeedbackDelay } from './levelConfig';
import { useAudio } from '../context/AudioContext';

const WORDS = [
  { word: 'cat', blank: 0, letter: 'c' },
  { word: 'dog', blank: 0, letter: 'd' },
  { word: 'sun', blank: 0, letter: 's' },
  { word: 'run', blank: 0, letter: 'r' },
  { word: 'bat', blank: 0, letter: 'b' },
  { word: 'hat', blank: 0, letter: 'h' },
  { word: 'rat', blank: 0, letter: 'r' },
  { word: 'mat', blank: 0, letter: 'm' },
  { word: 'sat', blank: 0, letter: 's' },
  { word: 'fat', blank: 0, letter: 'f' },
  { word: 'bed', blank: 0, letter: 'b' },
  { word: 'red', blank: 0, letter: 'r' },
  { word: 'get', blank: 0, letter: 'g' },
  { word: 'net', blank: 0, letter: 'n' },
  { word: 'pet', blank: 0, letter: 'p' },
];

export default function FillMissingLetter({ onComplete, level = 1 }) {
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
      const accuracy = Math.round((score / ROUNDS) * 100);
      onComplete(score, accuracy);
      return;
    }
    const w = WORDS[Math.floor(Math.random() * WORDS.length)];
    const opts = new Set([w.letter]);
    const letters = 'abcdefghijklmnopqrstuvwxyz';
    while (opts.size < choiceCount) opts.add(letters[Math.floor(Math.random() * 26)]);
    setItem(w);
    setOptions([...opts].sort(() => Math.random() - 0.5));
    setFeedback(null);
  }, [round, score, ROUNDS, choiceCount]);

  function handlePick(letter) {
    if (feedback !== null) return;
    playClick();
    const correct = letter === item?.letter;
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

  const display = item ? item.word.split('').map((l, i) => (i === item.blank ? '_' : l)).join('') : '';

  return (
    <div className={styles.container}>
      <div className={styles.progress}>Lv {level} · Round {round + 1}/{ROUNDS} · Fill the missing letter! Score: {score}{streak > 1 ? ` · Streak: ${streak}` : ''}</div>
      <p className={styles.prompt}>What letter makes the word?</p>
      <div className={styles.targetArea}>
        <span className={styles.targetLetter}>{display}</span>
      </div>
      <div className={styles.choices}>
        {options.map((l, i) => (
          <button key={i} type="button" onClick={() => handlePick(l)} className={`${styles.choiceBtn} ${styles.choiceNumber}`} disabled={feedback !== null}>{l.toUpperCase()}</button>
        ))}
      </div>
      {feedback && <p className={feedback === 'correct' ? styles.feedbackOk : styles.feedbackBad}>{feedback === 'correct' ? '✓ Correct!' : 'Try again!'}</p>}
    </div>
  );
}
