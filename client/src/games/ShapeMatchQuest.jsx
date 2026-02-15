import { useState, useEffect, useRef } from 'react';
import { useAudio } from '../context/AudioContext';
import { ai as aiApi } from '../api/client';
import { getRounds, getChoiceCount, getFeedbackDelay } from './levelConfig';
import styles from './GameCommon.module.css';

const SHAPES = [
  { id: 'circle', label: 'Circle', emoji: '⭕' },
  { id: 'square', label: 'Square', emoji: '🟦' },
  { id: 'triangle', label: 'Triangle', emoji: '🔺' },
  { id: 'star', label: 'Star', emoji: '⭐' },
  { id: 'heart', label: 'Heart', emoji: '❤️' },
  { id: 'diamond', label: 'Diamond', emoji: '💎' },
  { id: 'moon', label: 'Moon', emoji: '🌙' },
  { id: 'sun', label: 'Sun', emoji: '☀️' },
];

export default function ShapeMatchQuest({ onComplete, level = 1, childName, childAge }) {
  const { playSuccess, playWrong, playClick } = useAudio();
  const [round, setRound] = useState(0);
  const [target, setTarget] = useState(null);
  const [choices, setChoices] = useState([]);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [streak, setStreak] = useState(0);
  const [hint, setHint] = useState('');
  const [showHint, setShowHint] = useState(false);
  const completedRef = useRef(false);
  const ROUNDS = getRounds(level);
  const CHOICE_COUNT = getChoiceCount(level);
  const feedbackDelay = getFeedbackDelay(level);

  useEffect(() => {
    if (round >= ROUNDS && !completedRef.current) {
      completedRef.current = true;
      const accuracy = Math.round((score / ROUNDS) * 100);
      onComplete(score, accuracy);
      return;
    }
    const pool = [...SHAPES].sort(() => Math.random() - 0.5);
    const targetShape = pool[0];
    const options = pool.slice(0, CHOICE_COUNT).sort(() => Math.random() - 0.5);
    setTarget(targetShape);
    setChoices(options);
    setFeedback(null);
    setShowHint(false);
    setHint('');
  }, [round, score, ROUNDS, CHOICE_COUNT]);

  function handleChoice(choice) {
    if (feedback !== null) return;
    playClick();
    const correct = choice.id === target.id;
    if (correct) {
      setScore((s) => s + 1);
      setStreak(s => s + 1);
      playSuccess();
    } else {
      setStreak(0);
      playWrong();
    }
    setFeedback(correct ? 'correct' : 'wrong');
    setTimeout(() => setRound((r) => r + 1), feedbackDelay);
  }

  async function requestHint() {
    setShowHint(true);
    try {
      const res = await aiApi.hint('shape-match-quest', `Find ${target?.label}`, score, Math.round((score / Math.max(1, round)) * 100), childAge || 5);
      setHint(res.hint || `Look for the ${target?.label}!`);
    } catch (_) {
      setHint(`Look carefully for the ${target?.label}!`);
    }
  }

  if (round >= ROUNDS) return <div className={styles.container}><p className={styles.prompt}>Calculating your rewards...</p></div>;

  return (
    <div className={styles.container}>
      <div className={styles.progress}>
        <span>Lv {level}</span>
        <span>·</span>
        <span>Round {round + 1} / {ROUNDS}</span>
        <span>·</span>
        <span>⭐ {score}</span>
        {streak >= 2 && <span>· 🔥 {streak}</span>}
      </div>

      <p className={styles.prompt}>
        Find the <strong>{target?.label}</strong>!
      </p>

      <div className={styles.targetArea}>
        <span className={styles.targetEmoji} aria-label={target?.label}>
          {target?.emoji}
        </span>
      </div>

      {!showHint && feedback === null && (
        <button
          type="button"
          onClick={requestHint}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--primary)',
            fontSize: '0.85rem',
            fontWeight: 700,
            cursor: 'pointer',
            marginBottom: '0.75rem',
            padding: '0.25rem 0.5rem',
            minHeight: 'auto',
          }}
        >
          🐻 Need a hint?
        </button>
      )}
      {showHint && hint && (
        <div style={{
          background: 'rgba(56, 189, 248, 0.08)',
          padding: '0.5rem 0.75rem',
          borderRadius: '12px',
          fontSize: '0.85rem',
          fontWeight: 600,
          marginBottom: '0.75rem',
        }}>
          🐻 {hint}
        </div>
      )}

      <div className={styles.choices}>
        {choices.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => handleChoice(c)}
            className={`${styles.choiceBtn} ${
              feedback !== null
                ? c.id === target?.id
                  ? styles.correct
                  : feedback === 'wrong' && c.id !== target?.id
                  ? styles.wrong
                  : ''
                : ''
            }`}
            disabled={feedback !== null}
          >
            <span className={styles.choiceEmoji}>{c.emoji}</span>
          </button>
        ))}
      </div>

      {feedback && (
        <p className={feedback === 'correct' ? styles.feedbackOk : styles.feedbackBad}>
          {feedback === 'correct'
            ? streak >= 3 ? '🔥 Shape Master!' : '✓ Correct!'
            : `That was ${target?.label}. Keep going!`}
        </p>
      )}
    </div>
  );
}
