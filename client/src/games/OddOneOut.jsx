import { useState, useEffect, useRef } from 'react';
import { useAudio } from '../context/AudioContext';
import { useTeaching } from './useTeaching';
import { useNoRepeat } from './useNoRepeat';
import { getRounds, getFeedbackDelay } from './levelConfig';
import { ODD_ONE_OUT_SETS, ANIMAL_IMAGES, FRUIT_IMAGES, VEGGIE_IMAGES, GameImage } from './gameImages';
import styles from './GameCommon.module.css';

const SUBTLE_SETS = [
  { same: [{ name: 'dog', img: ANIMAL_IMAGES.dog }, { name: 'cat', img: ANIMAL_IMAGES.cat }, { name: 'bear', img: ANIMAL_IMAGES.bear }], odd: { name: 'fish', img: ANIMAL_IMAGES.fish }, hint: 'land vs sea' },
  { same: [{ name: 'apple', img: FRUIT_IMAGES.apple }, { name: 'banana', img: FRUIT_IMAGES.banana }, { name: 'strawberry', img: FRUIT_IMAGES.strawberry }], odd: { name: 'carrot', img: VEGGIE_IMAGES.carrot }, hint: 'fruit vs vegetable' },
  { same: [{ name: 'carrot', img: VEGGIE_IMAGES.carrot }, { name: 'broccoli', img: VEGGIE_IMAGES.broccoli }, { name: 'corn', img: VEGGIE_IMAGES.corn }], odd: { name: 'apple', img: FRUIT_IMAGES.apple }, hint: 'vegetable vs fruit' },
];

function getMode(level, round) {
  if (level <= 5) return 0; // Find the different one (visual)
  if (level <= 10) return round % 2; // 0: different one, 1: which doesn't belong
  if (level <= 15) return round % 3; // 0: different, 1: doesn't belong, 2: find TWO different
  return round % 4; // add 3: subtle differences
}

export default function OddOneOut({ onComplete, level = 1 }) {
  const { playSuccess, playWrong, playClick } = useAudio();
  const { teachAfterAnswer, readQuestion, getRecommendedDelayBeforeNext } = useTeaching();
  const { generate } = useNoRepeat(level);
  const [round, setRound] = useState(0);
  const [items, setItems] = useState([]);
  const [oddIndices, setOddIndices] = useState([]);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [selected, setSelected] = useState([]);
  const [mode, setModeState] = useState(0);
  const [streak, setStreak] = useState(0);
  const completedRef = useRef(false);
  const ROUNDS = getRounds(level);

  useEffect(() => {
    window.speechSynthesis?.cancel();
    if (round >= ROUNDS && !completedRef.current) {
      completedRef.current = true;
      onComplete(score, Math.round((score / ROUNDS) * 100));
      return;
    }
    const m = getMode(level, round);
    setModeState(m);
    setSelected([]);

    if (m <= 1) {
      const set = generate(
        () => ODD_ONE_OUT_SETS[Math.floor(Math.random() * ODD_ONE_OUT_SETS.length)],
        (r) => r.odd?.name
      );
      const count = level <= 5 ? 3 : level <= 15 ? 4 : 5;
      const arr = [];
      for (let i = 0; i < count - 1; i++) arr.push({ ...set.same, isOdd: false });
      arr.push({ ...set.odd, isOdd: true });
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      setItems(arr);
      setOddIndices([arr.findIndex(a => a.isOdd)]);
      setFeedback(null);
      const q = m === 0 ? 'Which one is different?' : 'Which one doesn\'t belong?';
      const cancelRead = readQuestion(q);
      return cancelRead;
    }

    if (m === 2) {
      const set = generate(
        () => ODD_ONE_OUT_SETS[Math.floor(Math.random() * ODD_ONE_OUT_SETS.length)],
        (r) => `${m}-${r.odd?.name}`
      );
      const arr = [
        { ...set.same, isOdd: false },
        { ...set.same, isOdd: false },
        { ...set.same, isOdd: false },
        { ...set.odd, isOdd: true },
        { ...set.odd, isOdd: true },
      ];
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      const odds = arr.map((a, i) => a.isOdd ? i : -1).filter(i => i >= 0);
      setItems(arr);
      setOddIndices(odds);
      setFeedback(null);
      const cancelRead = readQuestion('Find the TWO that are different!');
      return cancelRead;
    }

    if (m === 3) {
      const set = generate(
        () => SUBTLE_SETS[Math.floor(Math.random() * SUBTLE_SETS.length)],
        (r) => r.odd?.name
      );
      const arr = set.same.map(s => ({ ...s, isOdd: false }));
      arr.push({ ...set.odd, isOdd: true });
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      setItems(arr);
      setOddIndices([arr.findIndex(a => a.isOdd)]);
      setFeedback(null);
      const cancelRead = readQuestion('Which one doesn\'t belong?');
      return cancelRead;
    }

    setFeedback(null);
  }, [round, score, ROUNDS, level]);

  function handleChoice(idx) {
    if (feedback !== null) return;
    playClick();

    if (mode === 2) {
      const newSelected = selected.includes(idx) ? selected.filter(i => i !== idx) : [...selected, idx];
      setSelected(newSelected);
      if (newSelected.length === 2) {
        const correct = newSelected.every(i => oddIndices.includes(i));
        if (correct) { setScore(s => s + 1); setStreak(s => s + 1); playSuccess(); }
        else { setStreak(0); playWrong(); }
        setFeedback(correct ? 'correct' : 'wrong');
        const oddNames = oddIndices.map(i => items[i]?.name).join(' and ');
        teachAfterAnswer(correct, { type: 'animal', answer: newSelected.map(i => items[i]?.name).join(', '), correctAnswer: oddNames, extra: 'The different ones were ' + oddNames + '!' });
        const delay = getRecommendedDelayBeforeNext(getFeedbackDelay(level, correct));
        setTimeout(() => setRound(r => r + 1), delay);
      }
      return;
    }

    const correct = idx === oddIndices[0];
    const oddItem = items[oddIndices[0]];
    if (correct) { setScore(s => s + 1); setStreak(s => s + 1); playSuccess(); }
    else { setStreak(0); playWrong(); }
    setFeedback(correct ? 'correct' : 'wrong');
    teachAfterAnswer(correct, { type: 'animal', answer: items[idx]?.name, correctAnswer: oddItem?.name, extra: 'The different one was the ' + (oddItem?.name || 'odd one') + '!' });
    const delay = getRecommendedDelayBeforeNext(getFeedbackDelay(level, correct));
    setTimeout(() => setRound(r => r + 1), delay);
  }

  if (round >= ROUNDS) return <div className={styles.container}>Calculating your rewards...</div>;

  const promptText = mode === 0 ? 'Which one is different?' : mode === 1 ? 'Which one doesn\'t belong?' : mode === 2 ? 'Find the TWO that are different!' : 'Which one doesn\'t belong?';

  return (
    <div className={styles.container}>
      <div className={styles.progress}>
        <span>Lv {level} · Round {round + 1}/{ROUNDS}</span><span>·</span><span>Score: {score}</span>
        {streak >= 2 && <span>· 🔥 {streak}</span>}
      </div>
      <p className={styles.prompt}>{promptText}</p>
      <div className={styles.choices}>
        {items.map((item, i) => (
          <button
            key={i}
            type="button"
            onClick={() => handleChoice(i)}
            className={`${styles.choiceBtn} ${
              feedback !== null && (mode === 2 ? oddIndices.includes(i) : i === oddIndices[0]) ? styles.correct : ''
            } ${feedback !== null && (mode === 2 ? !oddIndices.includes(i) && selected.includes(i) : i !== oddIndices[0]) ? styles.wrong : ''}
            ${mode === 2 && selected.includes(i) && feedback === null ? styles.correct : ''}`}
            disabled={feedback !== null}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.2rem',
              padding: '0.5rem',
              borderColor: mode === 2 && selected.includes(i) ? 'var(--primary)' : undefined,
            }}
          >
            <GameImage src={item.img} alt={item.name} size={48} />
            <span style={{ fontSize: '0.68rem', fontWeight: 700 }}>{item.name}</span>
          </button>
        ))}
      </div>
      {mode === 2 && selected.length === 1 && feedback === null && (
        <p style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--primary)' }}>Now tap the other one!</p>
      )}
      {feedback === 'correct' && (
        <p className={styles.feedbackOk}>{streak >= 3 ? '🔥 Expert!' : '✓ Correct!'}</p>
      )}
      {feedback === 'wrong' && (
        <div className={styles.feedbackBad}>
          <p>✗ The answer is <strong>{mode === 2 ? oddIndices.map(i => items[i]?.name).join(' and ') : items[oddIndices[0]]?.name}</strong></p>
        </div>
      )}
    </div>
  );
}
