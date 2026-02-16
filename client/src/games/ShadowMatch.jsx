/**
 * Shadow Match - Match shapes to their shadows.
 * Progressive difficulty with more shapes and distractors at higher levels.
 * Full audio feedback for correct and wrong answers.
 */
import { useState, useEffect, useRef } from 'react';
import { useAudio } from '../context/AudioContext';
import { useNoRepeat } from './useNoRepeat';
import { getRounds, getFeedbackDelay } from './levelConfig';
import { useTeaching } from './useTeaching';
import styles from './GameCommon.module.css';

const SHAPES = [
  { name: 'Circle', emoji: '⭕', shadow: '⚫' },
  { name: 'Star', emoji: '⭐', shadow: '★' },
  { name: 'Heart', emoji: '❤️', shadow: '🖤' },
  { name: 'Square', emoji: '🟦', shadow: '⬛' },
  { name: 'Triangle', emoji: '🔺', shadow: '▲' },
  { name: 'Diamond', emoji: '💎', shadow: '◆' },
  { name: 'Moon', emoji: '🌙', shadow: '🌑' },
  { name: 'Cloud', emoji: '☁️', shadow: '🌫️' },
];

function getChoiceCount(level) {
  if (level <= 5) return 3;
  if (level <= 10) return 4;
  if (level <= 15) return 5;
  return 6;
}

function getShapePool(level) {
  if (level <= 5) return SHAPES.slice(0, 4);
  if (level <= 10) return SHAPES.slice(0, 6);
  return SHAPES;
}

export default function ShadowMatch({ onComplete, level = 1, childName }) {
  const { playSuccess, playWrong, playClick, playCelebration } = useAudio();
  const { teachAfterAnswer, readQuestion, getRecommendedDelayBeforeNext } = useTeaching();
  const { generate } = useNoRepeat(level);
  const [round, setRound] = useState(0);
  const [target, setTarget] = useState(null);
  const [choices, setChoices] = useState([]);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [streak, setStreak] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [selected, setSelected] = useState(null);
  const [done, setDone] = useState(false);
  const completedRef = useRef(false);
  const ROUNDS = getRounds(level);
  const choiceCount = getChoiceCount(level);

  useEffect(() => {
    window.speechSynthesis?.cancel();
    if (round >= ROUNDS && !completedRef.current) {
      completedRef.current = true;
      setDone(true);
      playCelebration();
      const accuracy = ROUNDS > 0 ? Math.round((correct / ROUNDS) * 100) : 0;
      onComplete(score, accuracy);
      return;
    }
    const pool = getShapePool(level);
    const targetShape = generate(
      () => {
        const shuffled = [...pool].sort(() => Math.random() - 0.5);
        return shuffled[0];
      },
      (r) => r.name
    );
    const shuffled = [targetShape, ...pool.filter(p => p.name !== targetShape.name)].sort(() => Math.random() - 0.5);
    const opts = shuffled.slice(0, choiceCount);
    // Make sure target is in the choices
    if (!opts.find(o => o.name === targetShape.name)) {
      opts[Math.floor(Math.random() * opts.length)] = targetShape;
    }
    setTarget(targetShape);
    setChoices(opts.sort(() => Math.random() - 0.5));
    setFeedback(null);
    setSelected(null);
  }, [round, ROUNDS, level]);

  useEffect(() => {
    if (target) {
      const cancelRead = readQuestion('Which shape matches this shadow?');
      return cancelRead;
    }
  }, [target]);

  function handleChoice(c) {
    if (feedback !== null) return;
    playClick();
    setSelected(c.name);
    const isCorrect = c.name === target?.name;

    if (isCorrect) {
      const streakBonus = streak >= 2 ? 5 : 0;
      const points = 10 + streakBonus;
      setScore(s => s + points);
      setCorrect(cr => cr + 1);
      setStreak(s => s + 1);
      setFeedback({ type: 'correct', shape: c.name, points });
      playSuccess();
      teachAfterAnswer(true, { type: 'shape', correctAnswer: target?.name?.toLowerCase() });
    } else {
      setWrong(w => w + 1);
      setStreak(0);
      setFeedback({ type: 'wrong', shape: c.name, answer: target.name });
      playWrong();
      teachAfterAnswer(false, { type: 'shape', correctAnswer: target?.name?.toLowerCase() });
    }

    const delay = getRecommendedDelayBeforeNext(getFeedbackDelay(level, isCorrect));
    setTimeout(() => setRound(r => r + 1), delay);
  }

  if (done) {
    const finalAccuracy = ROUNDS > 0 ? Math.round((correct / ROUNDS) * 100) : 0;
    return (
      <div className={styles.container}>
        <div className={styles.celebration}>
          <span style={{ fontSize: '4rem' }}>🔮</span>
          <h2>Shadow Master, {childName || 'Detective'}!</h2>
          <p style={{ fontSize: '1.1rem', fontWeight: 700 }}>Score: {score}</p>
          <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', margin: '0.5rem 0' }}>
            <span style={{ color: '#22c55e', fontWeight: 800 }}>✅ Correct: {correct}</span>
            <span style={{ color: '#ef4444', fontWeight: 800 }}>❌ Wrong: {wrong}</span>
          </div>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Accuracy: {finalAccuracy}%</p>
        </div>
      </div>
    );
  }

  if (round >= ROUNDS) return <div className={styles.container}>Calculating your rewards...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.hud}>
        <span>Lv {level} · Round {round + 1}/{ROUNDS} · ✅ {correct} · ❌ {wrong} · ⭐ {score}</span>
        {streak >= 2 && <span> · 🔥 {streak}</span>}
      </div>

      <p className={styles.prompt}>Which shape matches this shadow?</p>

      {/* Shadow target */}
      <div className={styles.targetArea}>
        <span className={styles.targetEmoji} style={{ fontSize: '4rem', filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))' }}>
          {target?.shadow}
        </span>
      </div>

      {/* Choices */}
      <div className={styles.choices}>
        {choices.map((c) => {
          let bg = 'transparent';
          let border = '3px solid var(--border)';
          if (feedback && selected === c.name) {
            if (feedback.type === 'correct') { bg = 'rgba(34,197,94,0.15)'; border = '3px solid #22c55e'; }
            else { bg = 'rgba(239,68,68,0.15)'; border = '3px solid #ef4444'; }
          }
          if (feedback && feedback.type === 'wrong' && c.name === target?.name) {
            bg = 'rgba(34,197,94,0.1)';
            border = '3px solid #22c55e';
          }

          return (
            <button
              key={c.name}
              type="button"
              onClick={() => handleChoice(c)}
              className={`${styles.choiceBtn} ${styles.choiceEmoji}`}
              disabled={feedback !== null}
              style={{ background: bg, border, transition: 'all 0.2s', fontSize: '2rem' }}
            >
              {c.emoji}
              <span style={{ fontSize: '0.65rem', display: 'block', fontWeight: 700, marginTop: '0.2rem' }}>
                {c.name}
              </span>
            </button>
          );
        })}
      </div>

      {/* Feedback */}
      {feedback && (
        <div className={feedback.type === 'correct' ? styles.feedbackOk : styles.feedbackBad}
          style={{ marginTop: '0.5rem', fontSize: '0.85rem', padding: '0.6rem 1rem' }}>
          {feedback.type === 'correct'
            ? `✓ Correct! It's ${feedback.shape}! +${feedback.points} points${streak >= 3 ? ' 🔥' : ''}`
            : (<><p>✗ The answer is <strong>{target?.name}</strong></p></>)
          }
        </div>
      )}
    </div>
  );
}
