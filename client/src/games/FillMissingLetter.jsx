import { useState, useEffect, useRef } from 'react';
import { useTeaching } from './useTeaching';
import { useNoRepeat } from './useNoRepeat';
import { useQuestionTimer } from './useQuestionTimer';
import styles from './GameCommon.module.css';
import { getRounds, getChoiceCount, getFeedbackDelay, getRoundDifficultyFactor } from './levelConfig';
import { useAudio } from '../context/AudioContext';

const WORDS_FIRST = [
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
  { word: 'pen', blank: 0, letter: 'p' },
  { word: 'ten', blank: 0, letter: 't' },
  { word: 'hen', blank: 0, letter: 'h' },
  { word: 'man', blank: 0, letter: 'm' },
  { word: 'van', blank: 0, letter: 'v' },
];

const WORDS_LAST = [
  { word: 'cat', blank: 2, letter: 't' },
  { word: 'dog', blank: 2, letter: 'g' },
  { word: 'sun', blank: 2, letter: 'n' },
  { word: 'run', blank: 2, letter: 'n' },
  { word: 'bat', blank: 2, letter: 't' },
  { word: 'hat', blank: 2, letter: 't' },
  { word: 'rat', blank: 2, letter: 't' },
  { word: 'mat', blank: 2, letter: 't' },
  { word: 'bed', blank: 2, letter: 'd' },
  { word: 'red', blank: 2, letter: 'd' },
  { word: 'get', blank: 2, letter: 't' },
  { word: 'pet', blank: 2, letter: 't' },
  { word: 'hen', blank: 2, letter: 'n' },
  { word: 'ten', blank: 2, letter: 'n' },
  { word: 'pen', blank: 2, letter: 'n' },
  { word: 'man', blank: 2, letter: 'n' },
  { word: 'van', blank: 2, letter: 'n' },
  { word: 'web', blank: 2, letter: 'b' },
  { word: 'see', blank: 2, letter: 'e' },
  { word: 'got', blank: 2, letter: 't' },
];

const WORDS_MIDDLE = [
  { word: 'cat', blank: 1, letter: 'a' },
  { word: 'dog', blank: 1, letter: 'o' },
  { word: 'run', blank: 1, letter: 'u' },
  { word: 'bed', blank: 1, letter: 'e' },
  { word: 'hat', blank: 1, letter: 'a' },
  { word: 'rat', blank: 1, letter: 'a' },
  { word: 'mat', blank: 1, letter: 'a' },
  { word: 'sit', blank: 1, letter: 'i' },
  { word: 'pet', blank: 1, letter: 'e' },
  { word: 'net', blank: 1, letter: 'e' },
  { word: 'get', blank: 1, letter: 'e' },
  { word: 'hen', blank: 1, letter: 'e' },
  { word: 'pen', blank: 1, letter: 'e' },
  { word: 'sun', blank: 1, letter: 'u' },
  { word: 'cup', blank: 1, letter: 'u' },
  { word: 'bat', blank: 1, letter: 'a' },
  { word: 'bug', blank: 1, letter: 'u' },
  { word: 'big', blank: 1, letter: 'i' },
  { word: 'top', blank: 1, letter: 'o' },
  { word: 'hot', blank: 1, letter: 'o' },
];

const WORDS_TWO = [
  { word: 'c_t', blank: 1, letter: 'a' },
  { word: 'd_g', blank: 1, letter: 'o' },
  { word: 's_n', blank: 1, letter: 'u' },
  { word: 'r_n', blank: 1, letter: 'u' },
  { word: 'b_t', blank: 1, letter: 'a' },
  { word: 'h_t', blank: 1, letter: 'a' },
  { word: 'b_d', blank: 1, letter: 'e' },
  { word: 'r_d', blank: 1, letter: 'e' },
  { word: 'g_t', blank: 1, letter: 'e' },
  { word: 'p_t', blank: 1, letter: 'e' },
  { word: 'n_t', blank: 1, letter: 'e' },
  { word: 'm_n', blank: 1, letter: 'a' },
  { word: 'p_n', blank: 1, letter: 'e' },
  { word: 't_n', blank: 1, letter: 'e' },
  { word: 'h_n', blank: 1, letter: 'e' },
  { word: 'c_p', blank: 1, letter: 'u' },
  { word: 'b_g', blank: 1, letter: 'u' },
  { word: 'b_n', blank: 1, letter: 'i' },
];

function getMode(level, round) {
  if (level <= 5) return 0; // First letter _AT
  if (level <= 10) return round % 2; // 0: first, 1: last
  if (level <= 15) return round % 3; // 0: first, 1: last, 2: middle
  return round % 4; // add 3: two letters
}


export default function FillMissingLetter({ onComplete, level = 1 }) {
  const { playSuccess, playWrong, playClick } = useAudio();
  const { teachAfterAnswer, readQuestion, getRecommendedDelayBeforeNext } = useTeaching();
  const { markStart, isAnsweredTooFast } = useQuestionTimer();
  const { generate } = useNoRepeat(level);
  const [round, setRound] = useState(0);
  const [item, setItem] = useState(null);
  const [options, setOptions] = useState([]);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [mode, setModeState] = useState(0);
  const completedRef = useRef(false);
  const ROUNDS = getRounds(level);
  const choiceCount = getChoiceCount(level);

  useEffect(() => {
    window.speechSynthesis?.cancel();
    if (round >= ROUNDS && !completedRef.current) {
      completedRef.current = true;
      const accuracy = Math.round((score / ROUNDS) * 100);
      onComplete(score, accuracy);
      return;
    }
    const m = getMode(level, round);
    setModeState(m);

    const pools = [WORDS_FIRST, WORDS_LAST, WORDS_MIDDLE, WORDS_TWO];
    const factor = getRoundDifficultyFactor(level, round, ROUNDS);
    const pool = pools[m];
    const poolSize = Math.max(1, Math.floor(pool.length * (0.5 + 0.5 * factor)));
    const subPool = pool.slice(0, poolSize);
    const w = generate(
      () => subPool[Math.floor(Math.random() * subPool.length)],
      (r) => `${m}-${r.word}`
    );

    const letter = w.letter;
    const opts = new Set([letter]);
    const letters = 'abcdefghijklmnopqrstuvwxyz';
    while (opts.size < choiceCount) opts.add(letters[Math.floor(Math.random() * 26)]);
    setItem(w);
    setOptions([...opts].sort(() => Math.random() - 0.5));
    setFeedback(null);
    markStart();

    const prompts = [
      'What letter makes the word?',
      'What letter completes the word?',
      'Fill in the missing letter!',
      'What letter goes in the blank?',
    ];
    const cancelRead = readQuestion(prompts[m] || prompts[0]);
    return cancelRead;
  }, [round, score, ROUNDS, choiceCount, level]);

  function handlePick(letter) {
    if (feedback !== null) return;
    playClick();
    const correctLetter = item?.letter;
    const correct = letter === correctLetter;
    if (correct) {
      setScore((s) => s + 1);
      setStreak((s) => s + 1);
      playSuccess();
    } else {
      setStreak(0);
      playWrong();
    }
    setFeedback(correct ? 'correct' : 'wrong');
    const answeredTooFast = !correct && isAnsweredTooFast();
    teachAfterAnswer(correct, { type: 'letter', answer: letter, correctAnswer: correctLetter, answeredTooFast, word: item?.word, blank: item?.blank });
    const delay = getRecommendedDelayBeforeNext(getFeedbackDelay(level, correct, answeredTooFast));
    setTimeout(() => setRound((r) => r + 1), delay);
  }

  if (round >= ROUNDS) return <div className={styles.container}>Calculating your rewards…</div>;

  const display = item
    ? (item.word || '').split('').map((l, i) => (i === item.blank ? '_' : l)).join('')
    : '';
  const correctLetter = item?.letter;

  return (
    <div className={styles.container}>
      <div className={styles.progress}>Lv {level} · Round {round + 1}/{ROUNDS} · Fill the missing letter! Score: {score}{streak > 1 ? ` · Streak: ${streak}` : ''}</div>
      <p className={styles.prompt}>
        {mode === 0 && 'What is the first letter?'}
        {mode === 1 && 'What is the last letter?'}
        {mode === 2 && 'What letter goes in the middle?'}
        {mode === 3 && 'What letter makes the word?'}
      </p>
      <div className={styles.targetArea}>
        <span className={styles.targetLetter}>{display}</span>
      </div>
      <div className={styles.choices}>
        {options.map((l, i) => (
          <button key={i} type="button" onClick={() => handlePick(l)} className={`${styles.choiceBtn} ${styles.choiceNumber} ${feedback !== null && l === correctLetter ? styles.correct : ''} ${feedback !== null && l !== correctLetter ? styles.wrong : ''}`} disabled={feedback !== null}>{l.toUpperCase()}</button>
        ))}
      </div>
      {feedback === 'correct' && <p className={styles.feedbackOk}>✓ Correct!</p>}
      {feedback === 'wrong' && (
        <div className={styles.feedbackBad}>
          <p>✗ The answer is <strong>{correctLetter}</strong></p>
        </div>
      )}
    </div>
  );
}
