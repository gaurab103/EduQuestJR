/**
 * Drawing Canvas - Drawing motor game for kids.
 * Progressive levels: trace shapes → draw objects → creative challenges.
 * Real scoring: analyzes coverage of guide shapes and drawing effort.
 * Clear pass/fail feedback with criteria shown.
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import { getRounds, getFeedbackDelay } from './levelConfig';
import { useAudio } from '../context/AudioContext';
import { useTeaching } from './useTeaching';
import { DRAW_PROMPTS, GameImage } from './gameImages';
import styles from './GameCommon.module.css';

const COLORS = ['#ef4444', '#f97316', '#fbbf24', '#4ade80', '#38bdf8', '#a78bfa', '#ec4899', '#000000'];

function getPassThreshold(level) {
  if (level <= 5) return 2;   // Very forgiving: 2 strokes minimum
  if (level <= 10) return 3;
  if (level <= 15) return 4;
  if (level <= 20) return 5;
  return 6;
}

function getMinCoverage(level) {
  if (level <= 5) return 8;
  if (level <= 10) return 12;
  if (level <= 15) return 16;
  if (level <= 20) return 20;
  return 24;
}

function getCriteria(level) {
  const strokes = getPassThreshold(level);
  const cov = getMinCoverage(level);
  if (level <= 10) return `Draw at least ${strokes} strokes and cover ${cov}% of the guide to pass!`;
  return `Draw carefully — at least ${strokes} strokes and ${cov}% guide coverage!`;
}

export default function DrawingCanvas({ onComplete, level = 1, childName }) {
  const canvasRef = useRef(null);
  const guideRef = useRef(null);
  const [drawing, setDrawing] = useState(false);
  const [color, setColor] = useState('#000000');
  const [lineWidth, setLineWidth] = useState(4);
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [done, setDone] = useState(false);
  const [strokes, setStrokes] = useState(0);
  const { playSuccess, playCelebration, playClick, playWrong: playWrongSfx } = useAudio();
  const { teachAfterAnswer, readQuestion } = useTeaching();

  const totalRounds = getRounds(level);
  const challenges = DRAW_PROMPTS.slice(0, Math.min(level + 2, DRAW_PROMPTS.length));
  const currentChallenge = challenges[round % challenges.length];
  const minStrokes = getPassThreshold(level);
  const minCoverage = getMinCoverage(level);

  useEffect(() => {
    setLineWidth(level <= 5 ? 6 : level <= 15 ? 4 : 3);
  }, [level]);

  useEffect(() => {
    if (currentChallenge) {
      const cancelRead = readQuestion(`${childName ? childName + ', ' : ''}${currentChallenge.prompt}!`);
      return cancelRead;
    }
  }, [round, childName, currentChallenge]);

  const getCtx = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    return canvas.getContext('2d');
  }, []);

  function clearCanvas() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);

    // Draw guide shape for levels <= 15
    if (level <= 15 && currentChallenge) {
      drawGuide(ctx, canvas.offsetWidth, canvas.offsetHeight, currentChallenge.shape);
    }

    // Capture guide pixels for scoring
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    guideRef.current = imgData;
  }

  function drawGuide(ctx, w, h, shape) {
    ctx.strokeStyle = 'rgba(100, 100, 255, 0.15)';
    ctx.fillStyle = 'rgba(100, 100, 255, 0.06)';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 8]);
    const cx = w / 2;
    const cy = h / 2;
    const r = Math.min(w, h) * 0.3;

    ctx.beginPath();
    if (shape === 'circle') {
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
    } else if (shape === 'square') {
      ctx.rect(cx - r, cy - r, r * 2, r * 2);
    } else if (shape === 'triangle') {
      ctx.moveTo(cx, cy - r);
      ctx.lineTo(cx + r, cy + r);
      ctx.lineTo(cx - r, cy + r);
      ctx.closePath();
    } else if (shape === 'star') {
      for (let i = 0; i < 5; i++) {
        const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
    } else if (shape === 'heart') {
      ctx.moveTo(cx, cy + r * 0.6);
      ctx.bezierCurveTo(cx - r * 1.2, cy - r * 0.2, cx - r * 0.4, cy - r, cx, cy - r * 0.4);
      ctx.bezierCurveTo(cx + r * 0.4, cy - r, cx + r * 1.2, cy - r * 0.2, cx, cy + r * 0.6);
    }
    ctx.fill();
    ctx.stroke();
    ctx.setLineDash([]);
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = canvas.offsetWidth * 2;
    canvas.height = canvas.offsetHeight * 2;
    const ctx = canvas.getContext('2d');
    ctx.scale(2, 2);
    clearCanvas();
  }, [round, level]);

  function getPos(e) {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches?.[0] || e;
    return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
  }

  function startDraw(e) {
    e.preventDefault();
    setDrawing(true);
    const ctx = getCtx();
    if (!ctx) return;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }

  function draw(e) {
    e.preventDefault();
    if (!drawing) return;
    const ctx = getCtx();
    if (!ctx) return;
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  }

  function endDraw(e) {
    e.preventDefault();
    if (drawing) {
      setDrawing(false);
      setStrokes(s => s + 1);
    }
  }

  function analyzeCoverage() {
    const canvas = canvasRef.current;
    if (!canvas || !guideRef.current) return 0;
    const ctx = canvas.getContext('2d');
    const current = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    const guide = guideRef.current.data;

    let guidePixels = 0;
    let covered = 0;

    for (let i = 0; i < guide.length; i += 16) {
      const gR = guide[i], gG = guide[i + 1], gB = guide[i + 2];
      if (gR < 252 || gG < 252 || gB < 252) {
        guidePixels++;
        const cR = current[i], cG = current[i + 1], cB = current[i + 2];
        if (cR < 200 || cG < 200 || cB < 200) {
          const isGuideColor = (cR > 90 && cR < 110 && cB > 240);
          if (!isGuideColor) covered++;
        }
      }
    }

    if (guidePixels === 0) return strokes > 0 ? 50 : 0;
    return Math.round((covered / guidePixels) * 100);
  }

  function handleSubmit() {
    playClick();
    const coverage = analyzeCoverage();
    const passed = strokes >= minStrokes && (coverage >= minCoverage || level > 15);

    // Score: better coverage = more points
    const roundScore = passed ? Math.min(100, coverage * 2 + strokes * 5) : Math.max(5, coverage + strokes * 2);
    setScore(s => s + roundScore);

    if (passed) {
      setCorrect(c => c + 1);
      setFeedback({
        text: `Great drawing, ${childName || 'artist'}! ${strokes} strokes, ${coverage}% coverage!`,
        correct: true,
      });
      playSuccess();
      teachAfterAnswer(true, { type: 'shape', correctAnswer: currentChallenge?.shape, extra: 'Drawing shapes helps us learn!' });
    } else {
      setWrong(w => w + 1);
      const reason = strokes < minStrokes
        ? `Need at least ${minStrokes} strokes (you drew ${strokes})`
        : `Need ${minCoverage}% guide coverage (you got ${coverage}%)`;
      setFeedback({
        text: `Not quite! ${reason}. Keep practicing!`,
        correct: false,
      });
      playWrongSfx();
      teachAfterAnswer(false, { type: 'shape', correctAnswer: currentChallenge?.shape, extra: 'Drawing shapes helps us learn!' });
    }

    setTimeout(() => {
      setFeedback(null);
      setStrokes(0);
      if (round + 1 >= totalRounds) {
        setDone(true);
        playCelebration();
        const finalScore = score + roundScore;
        const accuracy = totalRounds > 0 ? Math.min(100, Math.round(((correct + (passed ? 1 : 0)) / totalRounds) * 100)) : 0;
        onComplete(finalScore, accuracy);
      } else {
        setRound(r => r + 1);
      }
    }, getFeedbackDelay(level) + 500);
  }

  if (done) {
    const finalAccuracy = totalRounds > 0 ? Math.round((correct / totalRounds) * 100) : 0;
    return (
      <div className={styles.container}>
        <div className={styles.celebration}>
          <span style={{ fontSize: '4rem' }}>🎨</span>
          <h2>Amazing Art, {childName || 'Artist'}!</h2>
          <p style={{ fontSize: '1.1rem', fontWeight: 700 }}>Score: {score}</p>
          <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', margin: '0.5rem 0' }}>
            <span style={{ color: '#22c55e', fontWeight: 800 }}>✅ Passed: {correct}</span>
            <span style={{ color: '#ef4444', fontWeight: 800 }}>❌ Failed: {wrong}</span>
          </div>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Accuracy: {finalAccuracy}%</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.hud}>
        <span>Lv {level} · Round {round + 1}/{totalRounds} · ✅ {correct} · ❌ {wrong} · ⭐ {score}</span>
      </div>

      {/* Challenge prompt */}
      <div style={{
        fontSize: '1.3rem',
        fontWeight: 900,
        textAlign: 'center',
        marginBottom: '0.25rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
      }}>
        <GameImage src={currentChallenge.img} alt={currentChallenge.prompt} size={48} />
        {currentChallenge.prompt}
      </div>

      {/* Criteria */}
      <p style={{
        fontSize: '0.72rem',
        color: 'var(--text-muted)',
        textAlign: 'center',
        marginBottom: '0.4rem',
        fontWeight: 600,
      }}>
        {getCriteria(level)}
      </p>

      {/* Color palette */}
      <div style={{
        display: 'flex',
        gap: '0.4rem',
        justifyContent: 'center',
        flexWrap: 'wrap',
        marginBottom: '0.5rem',
      }}>
        {COLORS.map(c => (
          <button
            key={c}
            type="button"
            onClick={() => { setColor(c); playClick(); }}
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: c,
              border: c === color ? '3px solid var(--text)' : '3px solid transparent',
              cursor: 'pointer',
              transition: 'transform 0.15s',
              transform: c === color ? 'scale(1.2)' : 'scale(1)',
              minHeight: 'auto',
              padding: 0,
            }}
          />
        ))}
      </div>

      {/* Stroke counter */}
      <p style={{ fontSize: '0.72rem', textAlign: 'center', color: strokes >= minStrokes ? 'var(--success)' : 'var(--text-muted)', fontWeight: 700, marginBottom: '0.3rem' }}>
        Strokes: {strokes}/{minStrokes} {strokes >= minStrokes ? '✓' : ''}
      </p>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        onMouseDown={startDraw}
        onMouseMove={draw}
        onMouseUp={endDraw}
        onMouseLeave={endDraw}
        onTouchStart={startDraw}
        onTouchMove={draw}
        onTouchEnd={endDraw}
        style={{
          width: '100%',
          maxWidth: '360px',
          height: '260px',
          borderRadius: '16px',
          border: '3px solid var(--sky-blue)',
          background: 'white',
          touchAction: 'none',
          cursor: 'crosshair',
        }}
      />

      {/* Actions */}
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', justifyContent: 'center' }}>
        <button
          type="button"
          onClick={() => { clearCanvas(); setStrokes(0); playClick(); }}
          className={styles.choiceBtn}
          style={{ fontSize: '0.85rem', padding: '0.6rem 1.2rem' }}
        >
          🗑️ Clear
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          className={styles.choiceBtn}
          style={{
            fontSize: '0.85rem',
            padding: '0.6rem 1.5rem',
            background: strokes >= minStrokes ? 'var(--success)' : 'var(--text-muted)',
            color: 'white',
            fontWeight: 900,
          }}
          disabled={strokes < 1}
        >
          ✅ Submit
        </button>
      </div>

      {/* Feedback */}
      {feedback && (
        <div className={feedback.correct ? styles.feedbackOk : styles.feedbackBad}
          style={{ marginTop: '0.5rem', fontSize: '0.9rem', padding: '0.75rem 1rem' }}>
          {feedback.text}
        </div>
      )}
    </div>
  );
}
