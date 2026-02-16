/**
 * SyllableClap - "How many syllables in 'elephant'?" Kid picks 1, 2, 3, or 4.
 * Literacy / Free - teaches phonological awareness.
 */
import { useState, useEffect, useRef } from 'react';
import styles from './GameCommon.module.css';
import { useAudio } from '../context/AudioContext';
import { getRounds, getChoiceCount, getFeedbackDelay } from './levelConfig';
import { useTeaching } from './useTeaching';
import { useNoRepeat } from './useNoRepeat';

const WORDS = [
  { word: 'cat', syllables: 1 }, { word: 'dog', syllables: 1 }, { word: 'sun', syllables: 1 },
  { word: 'ball', syllables: 1 }, { word: 'tree', syllables: 1 }, { word: 'book', syllables: 1 },
  { word: 'fish', syllables: 1 }, { word: 'bird', syllables: 1 }, { word: 'star', syllables: 1 },
  { word: 'moon', syllables: 1 }, { word: 'cup', syllables: 1 }, { word: 'hat', syllables: 1 },
  { word: 'pen', syllables: 1 }, { word: 'key', syllables: 1 }, { word: 'box', syllables: 1 },
  { word: 'apple', syllables: 2 }, { word: 'tiger', syllables: 2 }, { word: 'rabbit', syllables: 2 },
  { word: 'water', syllables: 2 }, { word: 'happy', syllables: 2 }, { word: 'sunny', syllables: 2 },
  { word: 'candy', syllables: 2 }, { word: 'flower', syllables: 2 }, { word: 'butter', syllables: 2 },
  { word: 'pencil', syllables: 2 }, { word: 'table', syllables: 2 }, { word: 'cookie', syllables: 2 },
  { word: 'candle', syllables: 2 }, { word: 'puppy', syllables: 2 }, { word: 'bottle', syllables: 2 },
  { word: 'elephant', syllables: 3 }, { word: 'banana', syllables: 3 }, { word: 'tomato', syllables: 3 },
  { word: 'octopus', syllables: 3 }, { word: 'butterfly', syllables: 3 }, { word: 'umbrella', syllables: 3 },
  { word: 'dinosaur', syllables: 3 }, { word: 'strawberry', syllables: 3 }, { word: 'caterpillar', syllables: 4 },
  { word: 'watermelon', syllables: 4 }, { word: 'television', syllables: 4 }, { word: 'alligator', syllables: 4 },
  { word: 'hippopotamus', syllables: 5 }, { word: 'beautiful', syllables: 3 }, { word: 'family', syllables: 3 },
  { word: 'animal', syllables: 3 }, { word: 'hospital', syllables: 3 }, { word: 'chocolate', syllables: 3 },
  { word: 'crocodile', syllables: 3 }, { word: 'ladybug', syllables: 3 }, { word: 'pineapple', syllables: 3 },
  { word: 'hamburger', syllables: 3 }, { word: 'dragon', syllables: 2 }, { word: 'monkey', syllables: 2 },
  { word: 'lion', syllables: 2 }, { word: 'turtle', syllables: 2 }, { word: 'penguin', syllables: 2 },
  { word: 'dolphin', syllables: 2 }, { word: 'panda', syllables: 2 }, { word: 'flower', syllables: 2 },
  { word: 'cloud', syllables: 1 }, { word: 'rain', syllables: 1 }, { word: 'snow', syllables: 1 },
  { word: 'fire', syllables: 1 }, { word: 'house', syllables: 1 }, { word: 'car', syllables: 1 },
  { word: 'phone', syllables: 1 }, { word: 'computer', syllables: 3 }, { word: 'beautiful', syllables: 3 },
  { word: 'wonderful', syllables: 3 }, { word: 'photograph', syllables: 3 }, { word: 'alphabet', syllables: 3 },
  { word: 'calendar', syllables: 3 }, { word: 'helicopter', syllables: 4 }, { word: 'avocado', syllables: 4 },
  { word: 'adventure', syllables: 3 }, { word: 'happiness', syllables: 3 },
];

function getWordPool(level) {
  if (level <= 5) return WORDS.filter((w) => w.syllables <= 2);
  if (level <= 10) return WORDS.filter((w) => w.syllables <= 3);
  if (level <= 15) return WORDS.filter((w) => w.syllables <= 4);
  return WORDS;
}

export default function SyllableClap({ onComplete, level = 1, childAge }) {
  const { playSuccess, playWrong, playClick } = useAudio();
  const { teachAfterAnswer, readQuestion } = useTeaching();
  const { generate } = useNoRepeat(level);
  const [round, setRound] = useState(0);
  const [currentWord, setCurrentWord] = useState(null);
  const [options, setOptions] = useState([]);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const completedRef = useRef(false);
  const ROUNDS = getRounds(level);
  const CHOICES = getChoiceCount(level);

  useEffect(() => {
    window.speechSynthesis?.cancel();
    if (round >= ROUNDS && !completedRef.current) {
      completedRef.current = true;
      onComplete(score, Math.round((score / ROUNDS) * 100));
      return;
    }
    const pool = getWordPool(level);
    const w = generate(() => pool[Math.floor(Math.random() * pool.length)], (r) => r.word);
    setCurrentWord(w);
    const wrong = new Set([w.syllables]);
    while (wrong.size < Math.min(CHOICES, 4)) {
      wrong.add(1 + Math.floor(Math.random() * 4));
    }
    setOptions([...wrong].sort(() => Math.random() - 0.5));
    setFeedback(null);
    const cancelRead = readQuestion(`How many syllables are in "${w.word}"? Clap it out!`);
    return cancelRead;
  }, [round, ROUNDS, level, CHOICES, generate]);

  function handlePick(n) {
    if (feedback !== null) return;
    playClick();
    const correct = n === currentWord?.syllables;
    if (correct) setScore((s) => s + 1);
    else playWrong();
    if (correct) playSuccess();
    setFeedback(correct ? 'correct' : 'wrong');
    teachAfterAnswer(correct, { type: 'word', correctAnswer: String(currentWord?.syllables), extra: `"${currentWord?.word}" has ${currentWord?.syllables} syllable${currentWord?.syllables > 1 ? 's' : ''}!` });
    const delay = getFeedbackDelay(level, correct);
    setTimeout(() => setRound((r) => r + 1), delay);
  }

  if (round >= ROUNDS) return <div className={styles.container}><p className={styles.prompt}>Calculating rewards...</p></div>;

  if (!currentWord) return null;

  return (
    <div className={styles.container}>
      <div className={styles.progress}>
        <span>Lv {level} · {round + 1}/{ROUNDS}</span><span>·</span><span>⭐ {score}</span>
      </div>
      <p className={styles.prompt}>How many syllables in <strong>"{currentWord.word}"</strong>?</p>
      <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>👏 Clap it out!</p>
      <div className={styles.choices}>
        {options.map((n) => (
          <button key={n} type="button" onClick={() => handlePick(n)} className={`${styles.choiceBtn} ${styles.choiceNumber} ${feedback !== null ? (n === currentWord.syllables ? styles.correct : styles.wrong) : ''}`} disabled={feedback !== null}>{n}</button>
        ))}
      </div>
      {feedback === 'correct' && <p className={styles.feedbackOk}>✓ Correct!</p>}
      {feedback === 'wrong' && (
        <div className={styles.feedbackBad}>
          <p>✗ The answer is <strong>{currentWord?.syllables}</strong></p>
        </div>
      )}
    </div>
  );
}
