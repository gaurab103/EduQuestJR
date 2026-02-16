/**
 * FingerTracePath - Kids trace a path/shape on a canvas.
 * SMOOTH drawing with quadratic curve interpolation.
 * Proper DPR-aware canvas, bigger drawing area, responsive.
 * Level 1-5: lines | 6-10: shapes | 11-15: letters | 16+: complex paths
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { useAudio } from '../context/AudioContext';
import { useTeaching } from './useTeaching';
import { useNoRepeat } from './useNoRepeat';
import { getRounds, getFeedbackDelay } from './levelConfig';
import styles from './GameCommon.module.css';

function getPassThreshold(level) {
  if (level <= 5) return 35;
  if (level <= 10) return 45;
  if (level <= 15) return 55;
  return 60;
}

function getLinePath(type) {
  const pts = [];
  if (type === 'horizontal') {
    for (let t = 0; t <= 1; t += 0.02) pts.push({ x: t * 0.8 + 0.1, y: 0.5 });
  } else if (type === 'vertical') {
    for (let t = 0; t <= 1; t += 0.02) pts.push({ x: 0.5, y: t * 0.8 + 0.1 });
  } else if (type === 'diagonal') {
    for (let t = 0; t <= 1; t += 0.02) pts.push({ x: t * 0.7 + 0.15, y: t * 0.7 + 0.15 });
  } else if (type === 'diagonal2') {
    for (let t = 0; t <= 1; t += 0.02) pts.push({ x: (1 - t) * 0.7 + 0.15, y: t * 0.7 + 0.15 });
  }
  return pts;
}

function getShapePath(shape) {
  const pts = [];
  const cx = 0.5, cy = 0.5, r = 0.32;
  if (shape === 'circle') {
    for (let i = 0; i <= 80; i++) {
      const a = (i / 80) * Math.PI * 2;
      pts.push({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });
    }
  } else if (shape === 'square') {
    const s = r * 1.3;
    for (let t = 0; t <= 1; t += 0.015) pts.push({ x: cx - s + t * 2 * s, y: cy - s });
    for (let t = 0; t <= 1; t += 0.015) pts.push({ x: cx + s, y: cy - s + t * 2 * s });
    for (let t = 0; t <= 1; t += 0.015) pts.push({ x: cx + s - t * 2 * s, y: cy + s });
    for (let t = 0; t <= 1; t += 0.015) pts.push({ x: cx - s, y: cy + s - t * 2 * s });
  } else if (shape === 'triangle') {
    const top = { x: cx, y: cy - r };
    const br = { x: cx + r, y: cy + r * 0.8 };
    const bl = { x: cx - r, y: cy + r * 0.8 };
    for (let t = 0; t <= 1; t += 0.015) pts.push({ x: top.x + (br.x - top.x) * t, y: top.y + (br.y - top.y) * t });
    for (let t = 0; t <= 1; t += 0.015) pts.push({ x: br.x + (bl.x - br.x) * t, y: br.y + (bl.y - br.y) * t });
    for (let t = 0; t <= 1; t += 0.015) pts.push({ x: bl.x + (top.x - bl.x) * t, y: bl.y + (top.y - bl.y) * t });
  }
  return pts;
}

function getLetterPath(letter) {
  const pts = [];
  const r = 0.28;
  if (letter === 'A') {
    for (let t = 0; t <= 1; t += 0.02) pts.push({ x: 0.35 + (0.5 - 0.35) * t, y: 0.85 + (0.15 - 0.85) * t });
    for (let t = 0; t <= 1; t += 0.02) pts.push({ x: 0.5 + (0.65 - 0.5) * t, y: 0.15 + (0.85 - 0.15) * t });
    for (let t = 0; t <= 1; t += 0.02) pts.push({ x: 0.42 + (0.58 - 0.42) * t, y: 0.5 });
  } else if (letter === 'B') {
    for (let t = 0; t <= 1; t += 0.02) pts.push({ x: 0.3, y: 0.15 + 0.7 * t });
    for (let t = 0; t <= 1; t += 0.02) { const a = -Math.PI / 2 + Math.PI * t; pts.push({ x: 0.3 + 0.2 * Math.cos(a), y: 0.33 + 0.18 * Math.sin(a) }); }
    for (let t = 0; t <= 1; t += 0.02) { const a = -Math.PI / 2 + Math.PI * t; pts.push({ x: 0.3 + 0.22 * Math.cos(a), y: 0.68 + 0.18 * Math.sin(a) }); }
  } else if (letter === 'C') {
    for (let i = 0; i <= 48; i++) {
      const a = Math.PI * 0.25 + (i / 48) * Math.PI * 1.5;
      pts.push({ x: 0.5 + r * Math.cos(a), y: 0.5 + r * Math.sin(a) });
    }
  } else if (letter === 'L') {
    for (let t = 0; t <= 1; t += 0.02) pts.push({ x: 0.35, y: 0.15 + 0.7 * t });
    for (let t = 0; t <= 1; t += 0.02) pts.push({ x: 0.35 + 0.35 * t, y: 0.85 });
  } else if (letter === 'O') {
    for (let i = 0; i <= 64; i++) {
      const a = (i / 64) * Math.PI * 2;
      pts.push({ x: 0.5 + r * Math.cos(a), y: 0.5 + r * Math.sin(a) });
    }
  } else if (letter === 'S') {
    for (let i = 0; i <= 48; i++) {
      const t = i / 48;
      const a = Math.PI * 0.5 - t * Math.PI * 2;
      const cy = t < 0.5 ? 0.35 : 0.65;
      const flip = t < 0.5 ? 1 : -1;
      pts.push({ x: 0.5 + flip * 0.18 * Math.cos(a), y: cy + 0.15 * Math.sin(a) });
    }
  } else {
    for (let i = 0; i <= 48; i++) {
      const a = (i / 48) * Math.PI * 2;
      pts.push({ x: 0.5 + r * Math.cos(a), y: 0.5 + r * Math.sin(a) });
    }
  }
  return pts;
}

function getComplexPath(type) {
  const pts = [];
  if (type === 'zigzag') {
    for (let i = 0; i <= 8; i++) {
      const t = i / 8;
      pts.push({ x: (i % 2) * 0.6 + 0.2, y: t * 0.8 + 0.1 });
    }
  } else if (type === 'spiral') {
    for (let t = 0; t <= 1; t += 0.008) {
      const r = 0.08 + t * 0.35;
      const a = t * Math.PI * 4;
      pts.push({ x: 0.5 + r * Math.cos(a), y: 0.5 + r * Math.sin(a) });
    }
  } else if (type === 'wave') {
    for (let t = 0; t <= 1; t += 0.01) {
      pts.push({ x: t * 0.8 + 0.1, y: 0.5 + 0.2 * Math.sin(t * Math.PI * 4) });
    }
  } else if (type === 'figure8') {
    for (let t = 0; t <= 1; t += 0.008) {
      const a = t * Math.PI * 2;
      pts.push({ x: 0.5 + 0.25 * Math.sin(a), y: 0.5 + 0.2 * Math.sin(a * 2) });
    }
  } else {
    for (let t = 0; t <= 1; t += 0.015) pts.push({ x: t * 0.7 + 0.15, y: t * 0.7 + 0.15 });
  }
  return pts;
}

function getTraceTarget(level, generate) {
  if (level <= 5) {
    return generate(() => ['horizontal', 'vertical', 'diagonal', 'diagonal2'][Math.floor(Math.random() * 4)], r => r);
  }
  if (level <= 10) {
    return generate(() => ['circle', 'square', 'triangle'][Math.floor(Math.random() * 3)], r => r);
  }
  if (level <= 15) {
    return generate(() => ['A', 'B', 'C', 'L', 'O', 'S'][Math.floor(Math.random() * 6)], r => r);
  }
  return generate(() => ['zigzag', 'spiral', 'wave', 'figure8'][Math.floor(Math.random() * 4)], r => r);
}

function getPromptText(target, level) {
  if (level <= 5) return 'Trace the line from start to end!';
  if (level <= 10) return `Trace the ${target}!`;
  if (level <= 15) return `Trace the letter ${target}!`;
  return `Trace the ${target} path!`;
}

export default function FingerTracePath({ onComplete, level = 1, childName, childAge }) {
  const { playSuccess, playWrong, playClick, playCelebration } = useAudio();
  const { teachAfterAnswer, readQuestion } = useTeaching();
  const { generate } = useNoRepeat();
  const canvasRef = useRef(null);
  const guideRef = useRef(null);
  const isDrawingRef = useRef(false);
  const lastPosRef = useRef(null);
  const [round, setRound] = useState(0);
  const [target, setTarget] = useState(null);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [done, setDone] = useState(false);
  const completedRef = useRef(false);

  const ROUNDS = getRounds(level);
  const threshold = getPassThreshold(level);

  const getPathPoints = useCallback(() => {
    if (!target) return [];
    if (level <= 5) return getLinePath(target);
    if (level <= 10) return getShapePath(target);
    if (level <= 15) return getLetterPath(target);
    return getComplexPath(target);
  }, [target, level]);

  useEffect(() => {
    window.speechSynthesis?.cancel();
    if (round >= ROUNDS && !completedRef.current) {
      completedRef.current = true;
      setDone(true);
      playCelebration();
      onComplete(score, Math.round((score / ROUNDS) * 100));
      return;
    }
    const newTarget = getTraceTarget(level, generate);
    setTarget(newTarget);
    setFeedback(null);
    const promptText = getPromptText(newTarget, level);
    const cancel = readQuestion(promptText);
    return cancel;
  }, [round, ROUNDS, level]);

  // Initialize canvas with proper DPR scaling
  const drawGuide = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const pts = getPathPoints();
    if (!pts.length) return;

    // White background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);

    // Draw guide path as dashed line
    ctx.strokeStyle = '#93c5fd';
    ctx.lineWidth = 8;
    ctx.setLineDash([14, 10]);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(pts[0].x * w, pts[0].y * h);
    for (let i = 1; i < pts.length; i++) {
      ctx.lineTo(pts[i].x * w, pts[i].y * h);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw start dot (green) and end dot (red)
    if (pts.length > 1) {
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.arc(pts[0].x * w, pts[0].y * h, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = '700 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('S', pts[0].x * w, pts[0].y * h);

      const last = pts[pts.length - 1];
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(last.x * w, last.y * h, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.fillText('E', last.x * w, last.y * h);
    }

    guideRef.current = { pts, w, h };
    lastPosRef.current = null;
  }, [getPathPoints]);

  useEffect(() => {
    if (!target) return;
    drawGuide();
  }, [target, drawGuide]);

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
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  }

  function doDraw(e) {
    e.preventDefault();
    e.stopPropagation();
    if (!isDrawingRef.current) return;
    const pos = getPos(e);
    if (!pos) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const last = lastPosRef.current;
    if (last) {
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
    isDrawingRef.current = false;
    lastPosRef.current = null;
  }

  // Attach touch listeners with passive: false
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const opts = { passive: false };
    canvas.addEventListener('touchstart', startDraw, opts);
    canvas.addEventListener('touchmove', doDraw, opts);
    canvas.addEventListener('touchend', endDraw, opts);
    canvas.addEventListener('touchcancel', endDraw, opts);
    return () => {
      canvas.removeEventListener('touchstart', startDraw, opts);
      canvas.removeEventListener('touchmove', doDraw, opts);
      canvas.removeEventListener('touchend', endDraw, opts);
      canvas.removeEventListener('touchcancel', endDraw, opts);
    };
  });

  function analyzeCoverage() {
    const canvas = canvasRef.current;
    const guide = guideRef.current;
    if (!canvas || !guide) return 0;

    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;
    const pts = guide.pts;
    const w = rect.width;
    const h = rect.height;

    const tolerance = 25 * dpr;
    let matched = 0;
    const step = Math.max(1, Math.floor(pts.length / 100));

    for (let i = 0; i < pts.length; i += step) {
      const px = Math.round(pts[i].x * w * dpr);
      const py = Math.round(pts[i].y * h * dpr);
      let found = false;
      // Check a grid around the point for green ink (user's stroke)
      for (let dy = -tolerance; dy <= tolerance && !found; dy += 3) {
        for (let dx = -tolerance; dx <= tolerance && !found; dx += 3) {
          const nx = px + dx;
          const ny = py + dy;
          if (nx < 0 || nx >= canvas.width || ny < 0 || ny >= canvas.height) continue;
          const idx = (ny * canvas.width + nx) * 4;
          const r = data[idx], g = data[idx + 1], b = data[idx + 2];
          // Green ink: #22c55e → R ~34, G ~197, B ~94
          if (g > 120 && r < 100 && b < 130) found = true;
        }
      }
      if (found) matched++;
    }

    const total = Math.ceil(pts.length / step);
    return total > 0 ? Math.round((matched / total) * 100) : 0;
  }

  function handleCheck() {
    if (feedback) return;
    playClick();
    const coverage = analyzeCoverage();
    const passed = coverage >= threshold;

    if (passed) {
      setScore(s => s + 1);
      setCorrect(c => c + 1);
      playSuccess();
      setFeedback({ correct: true, text: `Great tracing! ${coverage}% coverage!`, coverage });
      teachAfterAnswer(true, { type: 'shape', correctAnswer: target, extra: 'Tracing helps your hand control!' });
    } else {
      playWrong();
      setFeedback({ correct: false, text: `Need ${threshold}% coverage. You got ${coverage}%. Trace closer to the blue line!`, coverage });
      teachAfterAnswer(false, { type: 'shape', correctAnswer: target, extra: `Follow the blue dashed line from S to E!` });
    }

    const delay = getFeedbackDelay(level, passed);
    setTimeout(() => setRound(r => r + 1), delay);
  }

  function handleClear() {
    playClick();
    drawGuide();
  }

  if (done) {
    return (
      <div className={styles.container}>
        <div className={styles.celebration}>
          <span style={{ fontSize: '4rem' }}>✏️</span>
          <h2>Trace Master!</h2>
          <p style={{ fontSize: '1.1rem', fontWeight: 700 }}>Score: {score}/{ROUNDS}</p>
          <span style={{ color: 'var(--text-muted)', fontWeight: 800 }}>Accuracy: {Math.round((score / ROUNDS) * 100)}%</span>
        </div>
      </div>
    );
  }

  if (!target) return null;

  const promptText = getPromptText(target, level);

  return (
    <div className={styles.container}>
      <div className={styles.hud}>
        <span>Lv {level} · {round + 1}/{ROUNDS} · ✅ {correct} · ⭐ {score}</span>
      </div>
      <p className={styles.prompt}>{promptText}</p>
      <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'center', marginBottom: '0.5rem', fontWeight: 600 }}>
        Trace from <span style={{ color: '#22c55e', fontWeight: 800 }}>S</span> to <span style={{ color: '#ef4444', fontWeight: 800 }}>E</span> along the blue line. Need {threshold}% coverage.
      </p>
      <canvas
        ref={canvasRef}
        onMouseDown={startDraw}
        onMouseMove={doDraw}
        onMouseUp={endDraw}
        onMouseLeave={endDraw}
        style={{
          width: '100%', maxWidth: '400px', height: '300px',
          borderRadius: '16px', border: '3px solid #93c5fd',
          background: 'white', touchAction: 'none', cursor: 'crosshair',
          display: 'block', margin: '0 auto',
        }}
      />
      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap', marginTop: '0.75rem' }}>
        <button type="button" onClick={handleClear} className={styles.choiceBtn}
          style={{ fontSize: '0.9rem', padding: '0.7rem 1.2rem' }}>
          🗑️ Clear
        </button>
        <button type="button" onClick={handleCheck} className={styles.choiceBtn}
          style={{ fontSize: '0.9rem', padding: '0.7rem 1.5rem', background: '#3b82f6', color: 'white', fontWeight: 900 }}>
          ✓ Check
        </button>
      </div>
      {feedback && (
        <div className={feedback.correct ? styles.feedbackOk : styles.feedbackBad} style={{ marginTop: '0.75rem' }}>
          {feedback.text}
        </div>
      )}
    </div>
  );
}
