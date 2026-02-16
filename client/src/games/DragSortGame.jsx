/**
 * DragSortGame - Kids drag items into correct order by tap-to-swap.
 * Level 1-5: 3 numbers (1-10) smallest to largest
 * Level 6-10: 4 letters alphabetically
 * Level 11-15: 4 items by size (small→extra large) with visual size
 * Level 16+: 5 items various categories
 * Tap A then B = swap positions. "Check" to verify.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { useAudio } from '../context/AudioContext';
import { useTeaching } from './useTeaching';
import { useNoRepeat } from './useNoRepeat';
import { getRounds, getFeedbackDelay } from './levelConfig';
import styles from './GameCommon.module.css';

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

const SIZE_ITEMS = [
  { label: 'Small', size: 1, emoji: '🐜' },
  { label: 'Medium', size: 2, emoji: '🐕' },
  { label: 'Large', size: 3, emoji: '🐘' },
  { label: 'Extra Large', size: 4, emoji: '🦣' },
];

const CATEGORY_ITEMS = [
  { label: '1', value: 1 }, { label: '2', value: 2 }, { label: '3', value: 3 },
  { label: '4', value: 4 }, { label: '5', value: 5 }, { label: '6', value: 6 },
  { label: '7', value: 7 }, { label: '8', value: 8 }, { label: '9', value: 9 },
  { label: '10', value: 10 },
  { label: 'A', value: 'A' }, { label: 'B', value: 'B' }, { label: 'C', value: 'C' },
  { label: 'D', value: 'D' }, { label: 'E', value: 'E' }, { label: 'F', value: 'F' },
  { label: 'Red', value: 'red', color: '#ef4444' },
  { label: 'Blue', value: 'blue', color: '#38bdf8' },
  { label: 'Green', value: 'green', color: '#22c55e' },
  { label: 'Yellow', value: 'yellow', color: '#fbbf24' },
];

function getItemCount(level) {
  if (level <= 5) return 3;
  if (level <= 10) return 4;
  if (level <= 15) return 4;
  return 5;
}

function getItems(level, generate) {
  if (level <= 5) {
    return generate(
      () => {
        const nums = [];
        while (nums.length < 3) {
          const n = 1 + Math.floor(Math.random() * 10);
          if (!nums.includes(n)) nums.push(n);
        }
        return nums.map(n => ({ type: 'number', label: String(n), value: n, correctOrder: (a, b) => a.value - b.value }));
      },
      (r) => r.map(x => x.value).join('-')
    );
  }
  if (level <= 10) {
    return generate(
      () => {
        const letters = [];
        const pool = LETTERS.split('');
        while (letters.length < 4) {
          const i = Math.floor(Math.random() * pool.length);
          const l = pool.splice(i, 1)[0];
          if (l) letters.push({ type: 'letter', label: l, value: l.charCodeAt(0), correctOrder: (a, b) => a.value - b.value });
        }
        return letters;
      },
      (r) => r.map(x => x.label).join('-')
    );
  }
  if (level <= 15) {
    return generate(
      () => {
        const shuffled = [...SIZE_ITEMS].sort(() => Math.random() - 0.5);
        return shuffled.map(x => ({
          type: 'size',
          label: x.label,
          emoji: x.emoji,
          value: x.size,
          correctOrder: (a, b) => a.value - b.value,
        }));
      },
      (r) => r.map(x => x.label).join('-')
    );
  }
  return generate(
    () => getCategoryItems(),
    (r) => r.map(x => x.value).join('-')
  );
}

function getPromptText(level) {
  if (level <= 5) return 'Put these in order! Smallest first!';
  if (level <= 10) return 'Put the letters in ABC order!';
  if (level <= 15) return 'Put these in order! Smallest to biggest!';
  return 'Put these in the correct order!';
}

export default function DragSortGame({ onComplete, level = 1, childName, childAge }) {
  const { playSuccess, playWrong, playClick, playCelebration } = useAudio();
  const { teachAfterAnswer, readQuestion } = useTeaching();
  const { generate } = useNoRepeat(level);
  const [round, setRound] = useState(0);
  const [items, setItems] = useState([]);
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [done, setDone] = useState(false);
  const completedRef = useRef(false);

  const ROUNDS = getRounds(level);
  const itemCount = getItemCount(level);

  const correctOrder = useCallback(() => {
    if (!items.length) return [];
    const sorted = [...items].sort((a, b) => {
      if (a.correctOrder) return a.correctOrder(a, b);
      return (a.value < b.value ? -1 : a.value > b.value ? 1 : 0);
    });
    return sorted;
  }, [items]);

  useEffect(() => {
    window.speechSynthesis?.cancel();
    if (round >= ROUNDS && !completedRef.current) {
      completedRef.current = true;
      setDone(true);
      playCelebration();
      onComplete(score, Math.round((score / ROUNDS) * 100));
      return;
    }
    setItems(getItems(level, generate));
    setSelectedIdx(null);
    setFeedback(null);
    const promptText = getPromptText(level);
    const cancel = readQuestion(promptText);
    return cancel;
  }, [round, ROUNDS, level, itemCount, generate, score]);

  function handleItemClick(idx) {
    if (feedback) return;
    playClick();

    if (selectedIdx === null) {
      setSelectedIdx(idx);
      return;
    }
    if (selectedIdx === idx) {
      setSelectedIdx(null);
      return;
    }
    const next = [...items];
    [next[selectedIdx], next[idx]] = [next[idx], next[selectedIdx]];
    setItems(next);
    setSelectedIdx(null);
  }

  function handleCheck() {
    if (feedback) return;
    playClick();

    const sorted = correctOrder();
    const currentValues = items.map(i => i.value);
    const targetValues = sorted.map(i => i.value);

    const correct = JSON.stringify(currentValues) === JSON.stringify(targetValues);

    if (correct) {
      setScore(s => s + 1);
      playSuccess();
      setFeedback({ correct: true });
      teachAfterAnswer(true, { type: 'word', correctAnswer: sorted.map(i => i.label).join(', '), extra: 'Great sorting!' });
    } else {
      playWrong();
      setFeedback({ correct: false, correctOrder: sorted });
      teachAfterAnswer(false, { correctAnswer: sorted.map(i => i.label).join(', '), extra: 'Check the order and try again!' });
    }

    const delay = getFeedbackDelay(level, correct);
    setTimeout(() => setRound(r => r + 1), delay);
  }

  if (done) {
    return (
      <div className={styles.container}>
        <div className={styles.celebration}>
          <span style={{ fontSize: '4rem' }}>📋</span>
          <h2>Sort Master!</h2>
          <p style={{ fontSize: '1.1rem', fontWeight: 700 }}>Score: {score}</p>
          <span style={{ color: 'var(--text-muted)', fontWeight: 800 }}>Accuracy: {Math.round((score / ROUNDS) * 100)}%</span>
        </div>
      </div>
    );
  }

  if (!items.length) return null;

  const sorted = correctOrder();
  const isWrong = (idx) => {
    if (!feedback || feedback.correct) return false;
    return items[idx]?.value !== sorted[idx]?.value;
  };

  return (
    <div className={styles.container}>
      <div className={styles.hud}>
        <span>Lv {level} · {round + 1}/{ROUNDS} · ⭐ {score}</span>
      </div>
      <p className={styles.prompt}>{getPromptText(level)}</p>
      <div className={styles.targetArea} style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'center', marginBottom: '1rem' }}>
        {items.map((item, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleItemClick(idx)}
            disabled={!!feedback}
            className={`${styles.choiceBtn} ${isWrong(idx) ? styles.wrong : ''}`}
            style={{
              minWidth: level <= 15 && item.emoji ? 90 : 80,
              minHeight: 72,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.25rem',
              fontSize: '1.5rem',
              borderColor: selectedIdx === idx ? 'var(--primary)' : undefined,
              boxShadow: selectedIdx === idx ? '0 0 20px rgba(56,189,248,0.4)' : undefined,
            }}
          >
            {item.emoji && <span>{item.emoji}</span>}
            <span style={{ fontWeight: 900 }}>{item.label}</span>
            {level <= 15 && item.emoji && item.label && (
              <span style={{ fontSize: '0.7rem', fontWeight: 700, opacity: 0.8 }}>{item.label}</span>
            )}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={handleCheck}
        className={styles.choiceBtn}
        style={{
          minWidth: 120,
          minHeight: 60,
          background: 'var(--primary)',
          color: 'white',
          fontWeight: 900,
          fontSize: '1.1rem',
        }}
      >
        ✓ Check
      </button>
      {feedback && !feedback.correct && (
        <div className={styles.feedbackBad} style={{ marginTop: '1rem' }}>
          Correct order: {feedback.correctOrder?.map(i => i.label).join(' → ')}
        </div>
      )}
      {feedback && feedback.correct && (
        <div className={styles.feedbackOk} style={{ marginTop: '1rem' }}>✓ Correct order!</div>
      )}
    </div>
  );
}
