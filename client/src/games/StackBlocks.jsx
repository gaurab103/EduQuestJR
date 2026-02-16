/**
 * Stack Blocks - Motor skill game.
 * Kids stack blocks to match a target number AND target color pattern.
 * Higher levels: more blocks, must match color order, time pressure.
 */
import { useState, useEffect, useRef } from 'react';
import { useAudio } from '../context/AudioContext';
import { getRounds, getFeedbackDelay } from './levelConfig';
import { useTeaching } from './useTeaching';
import styles from './GameCommon.module.css';

const COLORS = [
  { name: 'Red', hex: '#ef4444' },
  { name: 'Blue', hex: '#3b82f6' },
  { name: 'Green', hex: '#22c55e' },
  { name: 'Yellow', hex: '#eab308' },
  { name: 'Purple', hex: '#a855f7' },
];

function getTarget(level, roundNum) {
  const base = level <= 5 ? 3 : level <= 10 ? 4 : level <= 15 ? 5 : 6;
  return base + Math.floor(roundNum / 2);
}

function generatePattern(count, level) {
  // For levels <= 5, any color is fine (no pattern match)
  // For levels 6+, must match specific color pattern
  const pool = COLORS.slice(0, level <= 10 ? 3 : level <= 20 ? 4 : 5);
  return Array.from({ length: count }, (_, i) => pool[i % pool.length]);
}

export default function StackBlocks({ onComplete, level = 1 }) {
  const { playSuccess, playWrong, playClick, playCelebration } = useAudio();
  const { teachAfterAnswer, readQuestion } = useTeaching();
  const [round, setRound] = useState(0);
  const [stack, setStack] = useState([]);
  const [target, setTarget] = useState(3);
  const [pattern, setPattern] = useState([]);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const completedRef = useRef(false);
  const ROUNDS = getRounds(level);
  const delay = getFeedbackDelay(level);
  const mustMatchPattern = level > 5;

  useEffect(() => {
    if (round >= ROUNDS && !completedRef.current) {
      completedRef.current = true;
      const accuracy = ROUNDS > 0 ? Math.round((correct / ROUNDS) * 100) : 0;
      onComplete(score, accuracy);
      return;
    }
    const t = getTarget(level, round);
    setTarget(t);
    setPattern(generatePattern(t, level));
    setStack([]);
    setFeedback(null);
    const cancelRead = readQuestion(`Stack ${t} blocks${level > 5 ? ' matching the pattern!' : '!'}`);
    return cancelRead;
  }, [round, level]);

  function handleAdd() {
    if (feedback !== null || stack.length >= target) return;
    playClick();
    const newStack = [...stack, selectedColor];
    setStack(newStack);

    if (newStack.length >= target) {
      // Check correctness
      let passed = true;
      if (mustMatchPattern) {
        for (let i = 0; i < newStack.length; i++) {
          if (newStack[i].hex !== pattern[i].hex) {
            passed = false;
            break;
          }
        }
      }

      if (passed) {
        setScore(s => s + target * 5);
        setCorrect(c => c + 1);
        setFeedback('correct');
        playSuccess();
        teachAfterAnswer(true, { type: 'math', extra: 'Stacking blocks helps us learn patterns and counting!' });
      } else {
        setWrong(w => w + 1);
        setFeedback('wrong');
        playWrong();
        teachAfterAnswer(false, { type: 'math', extra: 'Stacking blocks helps us learn patterns and counting!' });
      }
      setTimeout(() => setRound(r => r + 1), delay + 300);
    }
  }

  function handleUndo() {
    if (stack.length === 0 || feedback !== null) return;
    playClick();
    setStack(s => s.slice(0, -1));
  }

  if (round >= ROUNDS) return <div className={styles.container}>Calculating your rewards...</div>;

  const availableColors = COLORS.slice(0, level <= 10 ? 3 : level <= 20 ? 4 : 5);

  return (
    <div className={styles.container}>
      <div className={styles.hud}>
        <span>Lv {level} · Round {round + 1}/{ROUNDS} · ✅ {correct} · ❌ {wrong} · ⭐ {score}</span>
      </div>

      <p className={styles.prompt}>
        Stack {target} blocks{mustMatchPattern ? ' matching the pattern!' : '!'}
      </p>

      {/* Target pattern preview (for levels > 5) */}
      {mustMatchPattern && (
        <div style={{ display: 'flex', gap: '3px', justifyContent: 'center', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', marginRight: '0.3rem' }}>Pattern:</span>
          {pattern.map((c, i) => (
            <div key={i} style={{
              width: 20, height: 20, borderRadius: 4,
              background: c.hex,
              border: '1px solid rgba(0,0,0,0.1)',
            }} />
          ))}
        </div>
      )}

      {/* Stack area */}
      <div className={styles.stackArea} style={{ minHeight: '120px', display: 'flex', flexDirection: 'column-reverse', alignItems: 'center', gap: '2px' }}>
        {stack.map((c, i) => {
          const isWrong = mustMatchPattern && pattern[i] && c.hex !== pattern[i].hex;
          return (
            <div key={i} className={styles.stackBlock} style={{
              backgroundColor: c.hex,
              border: isWrong && feedback ? '2px solid #ef4444' : '2px solid rgba(0,0,0,0.1)',
              width: `${Math.max(40, 80 - i * 2)}px`,
              height: '24px',
              borderRadius: '6px',
              transition: 'all 0.2s',
            }} />
          );
        })}
        {stack.length === 0 && (
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Tap a color then "Add Block"</p>
        )}
      </div>

      <p style={{ fontSize: '0.72rem', textAlign: 'center', color: 'var(--text-muted)', fontWeight: 700, margin: '0.3rem 0' }}>
        {stack.length}/{target} blocks
      </p>

      {/* Color selector (for pattern matching levels) */}
      {mustMatchPattern && (
        <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center', marginBottom: '0.4rem' }}>
          {availableColors.map(c => (
            <button
              key={c.hex}
              type="button"
              onClick={() => { setSelectedColor(c); playClick(); }}
              style={{
                width: 36, height: 36, borderRadius: '50%',
                background: c.hex,
                border: selectedColor.hex === c.hex ? '3px solid var(--text)' : '3px solid transparent',
                cursor: 'pointer',
                transform: selectedColor.hex === c.hex ? 'scale(1.15)' : 'scale(1)',
                transition: 'transform 0.15s',
                minHeight: 'auto', padding: 0,
              }}
              disabled={feedback !== null}
            />
          ))}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
        <button
          type="button"
          onClick={handleUndo}
          className={styles.choiceBtn}
          style={{ fontSize: '0.85rem', padding: '0.6rem 1rem' }}
          disabled={stack.length === 0 || feedback !== null}
        >
          ↩️ Undo
        </button>
        <button
          type="button"
          onClick={handleAdd}
          className={styles.choiceBtn}
          style={{
            fontSize: '0.85rem',
            padding: '0.6rem 1.5rem',
            background: 'var(--primary)',
            color: 'white',
            fontWeight: 900,
          }}
          disabled={stack.length >= target || feedback !== null}
        >
          + Add Block
        </button>
      </div>

      {/* Feedback */}
      {feedback && (
        <p className={feedback === 'correct' ? styles.feedbackOk : styles.feedbackBad}
          style={{ marginTop: '0.5rem' }}>
          {feedback === 'correct'
            ? `✓ Perfect stack! +${target * 5} points!`
            : `✗ Wrong pattern! Look at the colors more carefully.`}
        </p>
      )}
    </div>
  );
}
