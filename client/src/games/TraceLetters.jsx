/**
 * Trace Letters - Letter tracing motor skill game.
 * Real scoring: pixel coverage analysis of the guide letter.
 * Clear pass/fail with criteria displayed.
 */
import { useState, useEffect, useRef } from 'react';
import { useAudio } from '../context/AudioContext';
import { useNoRepeat } from './useNoRepeat';
import { getRounds, getFeedbackDelay } from './levelConfig';
import { useTeaching } from './useTeaching';
import styles from './GameCommon.module.css';

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function getPassThreshold(level) {
  if (level <= 5) return 15;
  if (level <= 10) return 20;
  if (level <= 15) return 25;
  if (level <= 20) return 30;
  return 35;
}

function getMinPoints(level) {
  if (level <= 5) return 8;
  if (level <= 10) return 15;
  if (level <= 15) return 25;
  return 35;
}

export default function TraceLetters({ onComplete, level = 1, childName }) {
  const { playSuccess, playWrong, playClick, playCelebration } = useAudio();
  const { teachAfterAnswer, readQuestion } = useTeaching();
  const { generate } = useNoRepeat();
  const [round, setRound] = useState(0);
  const [letter, setLetter] = useState('');
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [streak, setStreak] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [done, setDone] = useState(false);
  const canvasRef = useRef(null);
  const guideDataRef = useRef(null);
  const completedRef = useRef(false);
  const drawingRef = useRef(false);
  const pathRef = useRef([]);
  const startedRef = useRef(false);
  const ROUNDS = getRounds(level);
  const threshold = getPassThreshold(level);
  const minPoints = getMinPoints(level);

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
    setLetter(generate(
      () => LETTERS[Math.floor(Math.random() * LETTERS.length)],
      (r) => r
    ));
    setFeedback(null);
    pathRef.current = [];
    startedRef.current = false;
  }, [round, ROUNDS]);

  // Draw the guide letter and save reference pixel data
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !letter) return;
    const ctx = canvas.getContext('2d');

    // Clear
    ctx.fillStyle = '#fef3e2';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw guide letter
    ctx.fillStyle = '#6d28d9';
    ctx.font = 'bold 140px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.globalAlpha = 0.18;
    ctx.fillText(letter, canvas.width / 2, canvas.height / 2);
    ctx.globalAlpha = 1;

    // Save guide data for later comparison
    guideDataRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // Setup stroke style
    ctx.strokeStyle = '#8b5cf6';
    ctx.lineWidth = level <= 5 ? 16 : level <= 10 ? 12 : 8;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, [letter, level]);

  useEffect(() => {
    if (letter) {
      const cancelRead = readQuestion(`Trace the letter ${letter}!`);
      return cancelRead;
    }
  }, [letter]);

  const handleStart = (e) => {
    if (feedback !== null) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    playClick();
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
    const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;
    drawingRef.current = true;
    startedRef.current = true;
    pathRef.current = [...pathRef.current, { x, y }];
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const handleMove = (e) => {
    if (!drawingRef.current || feedback !== null) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
    const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;
    const ctx = canvas.getContext('2d');
    ctx.lineTo(x, y);
    ctx.stroke();
    pathRef.current.push({ x, y });
  };

  const handleEnd = () => {
    drawingRef.current = false;
  };

  function analyzeCoverage() {
    const canvas = canvasRef.current;
    if (!canvas || !guideDataRef.current) return 0;
    const ctx = canvas.getContext('2d');
    const current = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    const guide = guideDataRef.current.data;

    let guidePixels = 0;
    let covered = 0;

    // Sample every 4th pixel for speed
    for (let i = 0; i < guide.length; i += 16) {
      const gR = guide[i], gG = guide[i + 1], gB = guide[i + 2];
      // Guide pixel is not pure background (#fef3e2 = 254,243,226)
      if (gR < 250 || gG < 240 || gB < 222) {
        guidePixels++;
        const cR = current[i], cG = current[i + 1], cB = current[i + 2];
        // Current pixel is noticeably different from guide (user drew here)
        const diff = Math.abs(cR - gR) + Math.abs(cG - gG) + Math.abs(cB - gB);
        if (diff > 60) covered++;
      }
    }

    if (guidePixels === 0) return pathRef.current.length > 10 ? 50 : 0;
    return Math.round((covered / guidePixels) * 100);
  }

  const handleDone = () => {
    if (feedback !== null) return;
    const coverage = analyzeCoverage();
    const points = pathRef.current.length;
    const passed = startedRef.current && points >= minPoints && coverage >= threshold;

    if (passed) {
      const roundScore = Math.min(10, Math.floor(coverage / 10));
      setScore(s => s + roundScore);
      setCorrect(c => c + 1);
      setStreak(s => s + 1);
      setFeedback({ type: 'correct', coverage, points });
      playSuccess();
      teachAfterAnswer(true, { type: 'letter', correctAnswer: letter });
    } else {
      setWrong(w => w + 1);
      setStreak(0);
      const reason = !startedRef.current || points < minPoints
        ? 'Not enough drawing — trace the letter more carefully!'
        : `Only ${coverage}% coverage — need at least ${threshold}%.`;
      setFeedback({ type: 'wrong', reason, coverage, points });
      playWrong();
      teachAfterAnswer(false, { type: 'letter', correctAnswer: letter });
    }
    const delay = getFeedbackDelay(level, passed) + 300;
    setTimeout(() => setRound(r => r + 1), delay);
  };

  const handleClear = () => {
    if (feedback !== null) return;
    playClick();
    pathRef.current = [];
    startedRef.current = false;
    // Redraw guide
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fef3e2';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#6d28d9';
    ctx.font = 'bold 140px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.globalAlpha = 0.18;
    ctx.fillText(letter, canvas.width / 2, canvas.height / 2);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = '#8b5cf6';
    ctx.lineWidth = level <= 5 ? 16 : level <= 10 ? 12 : 8;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  };

  if (done) {
    const finalAccuracy = ROUNDS > 0 ? Math.round((correct / ROUNDS) * 100) : 0;
    return (
      <div className={styles.container}>
        <div className={styles.celebration}>
          <span style={{ fontSize: '4rem' }}>✍️</span>
          <h2>Great Tracing, {childName || 'Writer'}!</h2>
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

      <p className={styles.prompt}>
        Trace the letter <strong style={{ fontSize: '1.5rem', color: '#6d28d9' }}>{letter}</strong>
      </p>

      {/* Criteria */}
      <p style={{
        fontSize: '0.72rem',
        color: 'var(--text-muted)',
        textAlign: 'center',
        marginBottom: '0.4rem',
        fontWeight: 600,
      }}>
        Cover at least {threshold}% of the letter with {minPoints}+ trace points to pass
      </p>

      <canvas
        ref={canvasRef}
        width={320}
        height={240}
        className={styles.traceCanvas}
        onMouseDown={handleStart}
        onMouseMove={handleMove}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onTouchStart={handleStart}
        onTouchMove={handleMove}
        onTouchEnd={handleEnd}
        style={{ touchAction: 'none' }}
      />

      {/* Progress indicators */}
      <p style={{
        fontSize: '0.72rem',
        textAlign: 'center',
        fontWeight: 700,
        color: pathRef.current.length >= minPoints ? 'var(--success)' : 'var(--text-muted)',
        margin: '0.3rem 0',
      }}>
        Trace points: {pathRef.current.length}/{minPoints} {pathRef.current.length >= minPoints ? '✓' : ''}
      </p>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
        <button
          type="button"
          onClick={handleClear}
          className={styles.choiceBtn}
          style={{ fontSize: '0.85rem', padding: '0.6rem 1rem' }}
          disabled={feedback !== null}
        >
          🗑️ Clear
        </button>
        <button
          type="button"
          onClick={handleDone}
          className={styles.choiceBtn}
          style={{
            fontSize: '0.85rem',
            padding: '0.6rem 1.5rem',
            background: startedRef.current ? 'var(--success)' : 'var(--text-muted)',
            color: 'white',
            fontWeight: 900,
          }}
          disabled={feedback !== null || !startedRef.current}
        >
          ✅ Submit
        </button>
      </div>

      {/* Feedback */}
      {feedback && (
        <div className={feedback.type === 'correct' ? styles.feedbackOk : styles.feedbackBad}
          style={{ marginTop: '0.5rem', fontSize: '0.85rem', padding: '0.6rem 1rem' }}>
          {feedback.type === 'correct'
            ? `${streak >= 3 ? '🔥 Trace Master!' : '✓ Great tracing!'} Coverage: ${feedback.coverage}%`
            : (<><p>✗ The answer is <strong>{letter}</strong></p></>)
          }
        </div>
      )}
    </div>
  );
}
