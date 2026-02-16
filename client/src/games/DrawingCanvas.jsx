/**
 * Drawing Canvas - Drawing motor game for kids.
 * Progressive levels: trace shapes → draw objects → creative challenges.
 * SMOOTH drawing with quadratic curve interpolation.
 * Proper touch handling, responsive canvas, clear scoring.
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import { useNoRepeat } from './useNoRepeat';
import { getRounds, getFeedbackDelay } from './levelConfig';
import { useAudio } from '../context/AudioContext';
import { useTeaching } from './useTeaching';
import { DRAW_PROMPTS, GameImage } from './gameImages';
import styles from './GameCommon.module.css';

const COLORS = ['#ef4444', '#f97316', '#fbbf24', '#4ade80', '#38bdf8', '#a78bfa', '#ec4899', '#1e293b'];

function getPassThreshold(level) {
  if (level <= 5) return 2;
  if (level <= 10) return 3;
  if (level <= 15) return 4;
  if (level <= 20) return 5;
  return 6;
}

function getMinCoverage(level) {
  if (level <= 5) return 6;
  if (level <= 10) return 10;
  if (level <= 15) return 14;
  if (level <= 20) return 18;
  return 22;
}

function getCriteria(level) {
  const strokes = getPassThreshold(level);
  const cov = getMinCoverage(level);
  if (level <= 10) return `Draw at least ${strokes} strokes and cover ${cov}% of the guide`;
  return `Draw carefully — at least ${strokes} strokes and ${cov}% coverage`;
}

export default function DrawingCanvas({ onComplete, level = 1, childName }) {
  const canvasRef = useRef(null);
  const guideDataRef = useRef(null);
  const isDrawingRef = useRef(false);
  const lastPosRef = useRef(null);
  const [color, setColor] = useState('#1e293b');
  const [lineWidth, setLineWidth] = useState(6);
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [done, setDone] = useState(false);
  const [strokes, setStrokes] = useState(0);
  const { playSuccess, playCelebration, playClick, playWrong: playWrongSfx } = useAudio();
  const { teachAfterAnswer, readQuestion, getRecommendedDelayBeforeNext } = useTeaching();
  const { generate } = useNoRepeat(level);

  const totalRounds = getRounds(level);
  const challenges = DRAW_PROMPTS.slice(0, Math.min(level + 2, DRAW_PROMPTS.length));
  const [currentChallenge, setCurrentChallenge] = useState(null);
  const displayChallenge = currentChallenge ?? challenges[0];
  const minStrokes = getPassThreshold(level);
  const minCoverage = getMinCoverage(level);

  useEffect(() => {
    setLineWidth(level <= 5 ? 8 : level <= 15 ? 6 : 5);
  }, [level]);

  useEffect(() => {
    if (round >= totalRounds) return;
    const c = generate(
      () => challenges[Math.floor(Math.random() * challenges.length)],
      (r) => r.prompt
    );
    setCurrentChallenge(c);
  }, [round, totalRounds]);

  useEffect(() => {
    if (displayChallenge) {
      window.speechSynthesis?.cancel();
      const cancelRead = readQuestion(`${childName ? childName + ', ' : ''}${displayChallenge.prompt}!`);
      return cancelRead;
    }
  }, [round, childName]);

  // Initialize and resize canvas properly
  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    // White background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, rect.width, rect.height);

    // Draw guide shape for levels <= 15
    if (level <= 15 && displayChallenge) {
      drawGuide(ctx, rect.width, rect.height, displayChallenge.shape);
    }

    // Capture guide pixels
    guideDataRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
  }, [level, displayChallenge]);

  useEffect(() => {
    initCanvas();
    setStrokes(0);
    lastPosRef.current = null;
  }, [round, initCanvas]);

  function drawGuide(ctx, w, h, shape) {
    ctx.strokeStyle = 'rgba(100, 100, 255, 0.18)';
    ctx.fillStyle = 'rgba(100, 100, 255, 0.07)';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 8]);
    const cx = w / 2, cy = h / 2;
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
        if (i === 0) ctx.moveTo(cx + r * Math.cos(angle), cy + r * Math.sin(angle));
        else ctx.lineTo(cx + r * Math.cos(angle), cy + r * Math.sin(angle));
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

  function getPos(e) {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches?.[0] || e;
    return {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top,
    };
  }

  function startDraw(e) {
    e.preventDefault();
    e.stopPropagation();
    isDrawingRef.current = true;
    const pos = getPos(e);
    if (!pos) return;
    lastPosRef.current = pos;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  }

  function draw(e) {
    e.preventDefault();
    e.stopPropagation();
    if (!isDrawingRef.current) return;
    const pos = getPos(e);
    if (!pos) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const last = lastPosRef.current;
    if (last) {
      // Smooth quadratic curve through midpoint
      const midX = (last.x + pos.x) / 2;
      const midY = (last.y + pos.y) / 2;
      ctx.quadraticCurveTo(last.x, last.y, midX, midY);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(midX, midY);
    }
    lastPosRef.current = pos;
  }

  function endDraw(e) {
    e.preventDefault();
    if (isDrawingRef.current) {
      isDrawingRef.current = false;
      lastPosRef.current = null;
      setStrokes(s => s + 1);
    }
  }

  // Attach touch listeners with passive: false for smooth touch drawing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const opts = { passive: false };
    canvas.addEventListener('touchstart', startDraw, opts);
    canvas.addEventListener('touchmove', draw, opts);
    canvas.addEventListener('touchend', endDraw, opts);
    canvas.addEventListener('touchcancel', endDraw, opts);
    return () => {
      canvas.removeEventListener('touchstart', startDraw, opts);
      canvas.removeEventListener('touchmove', draw, opts);
      canvas.removeEventListener('touchend', endDraw, opts);
      canvas.removeEventListener('touchcancel', endDraw, opts);
    };
  });

  function analyzeCoverage() {
    const canvas = canvasRef.current;
    if (!canvas || !guideDataRef.current) return 0;
    const ctx = canvas.getContext('2d');
    const current = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    const guide = guideDataRef.current.data;

    let guidePixels = 0;
    let covered = 0;

    for (let i = 0; i < guide.length; i += 16) {
      const gR = guide[i], gG = guide[i + 1], gB = guide[i + 2];
      if (gR < 252 || gG < 252 || gB < 252) {
        guidePixels++;
        const cR = current[i], cG = current[i + 1], cB = current[i + 2];
        if (cR < 220 || cG < 220 || cB < 220) {
          const isGuideOnly = (Math.abs(cR - gR) < 10 && Math.abs(cG - gG) < 10 && Math.abs(cB - gB) < 10);
          if (!isGuideOnly) covered++;
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
    const roundScore = passed ? Math.min(100, coverage * 2 + strokes * 5) : Math.max(5, coverage + strokes * 2);
    setScore(s => s + roundScore);

    if (passed) {
      setCorrect(c => c + 1);
      setFeedback({ text: `Great drawing, ${childName || 'artist'}! ${strokes} strokes, ${coverage}% coverage!`, correct: true });
      playSuccess();
      teachAfterAnswer(true, { type: 'shape', correctAnswer: displayChallenge?.shape, extra: 'Drawing shapes helps us learn!' });
    } else {
      setWrong(w => w + 1);
      const reason = strokes < minStrokes
        ? `Need at least ${minStrokes} strokes (you drew ${strokes})`
        : `Need ${minCoverage}% guide coverage (you got ${coverage}%)`;
      setFeedback({ text: `Keep trying! ${reason}.`, correct: false });
      playWrongSfx();
      teachAfterAnswer(false, { type: 'shape', correctAnswer: displayChallenge?.shape, extra: 'Try to trace over the guide shape!' });
    }

    setTimeout(() => {
      setFeedback(null);
      if (round + 1 >= totalRounds) {
        setDone(true);
        playCelebration();
        const finalScore = score + roundScore;
        const accuracy = totalRounds > 0 ? Math.min(100, Math.round(((correct + (passed ? 1 : 0)) / totalRounds) * 100)) : 0;
        onComplete(finalScore, accuracy);
      } else {
        setRound(r => r + 1);
      }
    }, getFeedbackDelay(level, passed) + 500);
  }

  function handleClear() {
    playClick();
    initCanvas();
    setStrokes(0);
    lastPosRef.current = null;
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
      <div style={{ fontSize: '1.3rem', fontWeight: 900, textAlign: 'center', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
        <GameImage src={displayChallenge.img} alt={displayChallenge.prompt} size={48} />
        {displayChallenge.prompt}
      </div>

      {/* Criteria */}
      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', marginBottom: '0.4rem', fontWeight: 600 }}>
        {getCriteria(level)}
      </p>

      {/* Color palette */}
      <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '0.4rem' }}>
        {COLORS.map(c => (
          <button key={c} type="button" onClick={() => { setColor(c); playClick(); }}
            style={{
              width: 32, height: 32, borderRadius: '50%', background: c,
              border: c === color ? '3px solid var(--text)' : '3px solid transparent',
              cursor: 'pointer', transition: 'transform 0.15s',
              transform: c === color ? 'scale(1.2)' : 'scale(1)',
              minHeight: 'auto', padding: 0,
            }}
          />
        ))}
      </div>

      {/* Stroke counter */}
      <p style={{ fontSize: '0.75rem', textAlign: 'center', color: strokes >= minStrokes ? '#22c55e' : 'var(--text-muted)', fontWeight: 700, marginBottom: '0.3rem' }}>
        Strokes: {strokes}/{minStrokes} {strokes >= minStrokes ? '✓' : ''}
      </p>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        onMouseDown={startDraw}
        onMouseMove={draw}
        onMouseUp={endDraw}
        onMouseLeave={endDraw}
        style={{
          width: '100%', maxWidth: '400px', height: '280px',
          borderRadius: '16px', border: '3px solid var(--sky-blue)',
          background: 'white', touchAction: 'none', cursor: 'crosshair',
          display: 'block', margin: '0 auto',
        }}
      />

      {/* Actions */}
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', justifyContent: 'center' }}>
        <button type="button" onClick={handleClear} className={styles.choiceBtn}
          style={{ fontSize: '0.9rem', padding: '0.7rem 1.2rem' }}>
          🗑️ Clear
        </button>
        <button type="button" onClick={handleSubmit} className={styles.choiceBtn}
          style={{ fontSize: '0.9rem', padding: '0.7rem 1.5rem', background: strokes >= minStrokes ? '#22c55e' : '#94a3b8', color: 'white', fontWeight: 900 }}
          disabled={strokes < 1}>
          ✅ Submit
        </button>
      </div>

      {/* Feedback */}
      {feedback && (
        <div className={feedback.correct ? styles.feedbackOk : styles.feedbackBad}
          style={{ marginTop: '0.5rem', fontSize: '0.95rem', padding: '0.75rem 1rem' }}>
          {feedback.text}
        </div>
      )}
    </div>
  );
}
