/**
 * FingerTracePath - Kids trace a path/shape on a canvas.
 * Uses HTML5 Canvas with dotted guide path and coverage-based scoring.
 * Level 1-5: lines | 6-10: shapes | 11-15: letters | 16+: complex paths
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { useAudio } from '../context/AudioContext';
import { useTeaching } from './useTeaching';
import { useNoRepeat } from './useNoRepeat';
import { getRounds, getFeedbackDelay } from './levelConfig';
import styles from './GameCommon.module.css';

const CANVAS_SIZE = 300;

function getPassThreshold(level) {
  if (level <= 5) return 40;
  if (level <= 10) return 50;
  return 60;
}

// Path generators return arrays of {x, y} in 0-1 normalized coords
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
  const cx = 0.5, cy = 0.5, r = 0.35;
  if (shape === 'circle') {
    for (let i = 0; i <= 64; i++) {
      const a = (i / 64) * Math.PI * 2;
      pts.push({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });
    }
  } else if (shape === 'square') {
    const s = r * 1.4;
    for (let t = 0; t <= 1; t += 0.02) pts.push({ x: cx - s + t * 2 * s, y: cy - s });
    for (let t = 0; t <= 1; t += 0.02) pts.push({ x: cx + s, y: cy - s + t * 2 * s });
    for (let t = 0; t <= 1; t += 0.02) pts.push({ x: cx + s - t * 2 * s, y: cy + s });
    for (let t = 0; t <= 1; t += 0.02) pts.push({ x: cx - s, y: cy + s - t * 2 * s });
  } else if (shape === 'triangle') {
    pts.push({ x: cx, y: cy - r });
    pts.push({ x: cx + r, y: cy + r * 0.8 });
    pts.push({ x: cx - r, y: cy + r * 0.8 });
    pts.push({ x: cx, y: cy - r });
  }
  return pts;
}

function getLetterPath(letter) {
  const pts = [];
  const cx = 0.5, cy = 0.5, r = 0.3;
  if (letter === 'A') {
    pts.push({ x: 0.35, y: 0.85 }); pts.push({ x: 0.5, y: 0.15 }); pts.push({ x: 0.65, y: 0.85 });
    pts.push({ x: 0.42, y: 0.5 }); pts.push({ x: 0.58, y: 0.5 });
  } else if (letter === 'B') {
    pts.push({ x: 0.3, y: 0.15 }); pts.push({ x: 0.3, y: 0.85 });
    pts.push({ x: 0.3, y: 0.5 }); pts.push({ x: 0.6, y: 0.35 }); pts.push({ x: 0.6, y: 0.5 });
    pts.push({ x: 0.3, y: 0.5 }); pts.push({ x: 0.6, y: 0.65 }); pts.push({ x: 0.6, y: 0.85 }); pts.push({ x: 0.3, y: 0.85 });
  } else if (letter === 'C') {
    for (let i = 0; i <= 48; i++) {
      const a = Math.PI * 0.25 + (i / 48) * Math.PI * 1.5;
      pts.push({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });
    }
  } else if (letter === 'L') {
    pts.push({ x: 0.35, y: 0.15 }); pts.push({ x: 0.35, y: 0.85 }); pts.push({ x: 0.7, y: 0.85 });
  } else if (letter === 'O') {
    for (let i = 0; i <= 48; i++) {
      const a = (i / 48) * Math.PI * 2;
      pts.push({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });
    }
  } else {
    for (let i = 0; i <= 24; i++) {
      const a = (i / 24) * Math.PI * 2;
      pts.push({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });
    }
  }
  return pts;
}

function getComplexPath(type) {
  const pts = [];
  if (type === 'zigzag') {
    for (let i = 0; i <= 6; i++) {
      pts.push({ x: (i % 2) * 0.6 + 0.2, y: (i / 6) * 0.8 + 0.1 });
    }
  } else if (type === 'spiral') {
    for (let t = 0; t <= 1; t += 0.01) {
      const r = 0.1 + t * 0.35;
      const a = t * Math.PI * 4;
      pts.push({ x: 0.5 + r * Math.cos(a), y: 0.5 + r * Math.sin(a) });
    }
  } else if (type === 'wave') {
    for (let t = 0; t <= 1; t += 0.02) {
      pts.push({ x: t * 0.8 + 0.1, y: 0.5 + 0.25 * Math.sin(t * Math.PI * 4) });
    }
  } else {
    for (let t = 0; t <= 1; t += 0.02) pts.push({ x: t * 0.7 + 0.15, y: t * 0.7 + 0.15 });
  }
  return pts;
}

function getTraceTarget(level, generate) {
  if (level <= 5) {
    return generate(
      () => ['horizontal', 'vertical', 'diagonal', 'diagonal2'][Math.floor(Math.random() * 4)],
      (r) => r
    );
  }
  if (level <= 10) {
    return generate(
      () => ['circle', 'square', 'triangle'][Math.floor(Math.random() * 3)],
      (r) => r
    );
  }
  if (level <= 15) {
    return generate(
      () => ['A', 'B', 'C', 'L', 'O'][Math.floor(Math.random() * 5)],
      (r) => r
    );
  }
  return generate(
    () => ['zigzag', 'spiral', 'wave'][Math.floor(Math.random() * 3)],
    (r) => r
  );
}

function getPromptText(target, level) {
  if (level <= 5) return 'Trace the line from start to end!';
  if (level <= 10) return `Trace the ${target}!`;
  if (level <= 15) return `Trace the letter ${target}!`;
  return 'Trace the path from start to end!';
}

export default function FingerTracePath({ onComplete, level = 1, childName, childAge }) {
  const { playSuccess, playWrong, playClick, playCelebration } = useAudio();
  const { teachAfterAnswer, readQuestion } = useTeaching();
  const { generate } = useNoRepeat();
  const canvasRef = useRef(null);
  const guideRef = useRef(null);
  const [round, setRound] = useState(0);
  const [target, setTarget] = useState(null);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [done, setDone] = useState(false);
  const [drawing, setDrawing] = useState(false);
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
  }, [round, ROUNDS, level, generate, score]);

  const drawGuide = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const pts = getPathPoints();
    if (!pts.length) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#7dd3fc';
    ctx.lineWidth = 6;
    ctx.setLineDash([12, 8]);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(pts[0].x * canvas.width, pts[0].y * canvas.height);
    for (let i = 1; i < pts.length; i++) {
      ctx.lineTo(pts[i].x * canvas.width, pts[i].y * canvas.height);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    guideRef.current = { data: imgData.data, pts };
  }, [getPathPoints]);

  useEffect(() => {
    if (!target) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = CANVAS_SIZE;
    canvas.height = CANVAS_SIZE;
    drawGuide();
  }, [target, drawGuide]);

  function getPos(e) {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const t = e.touches?.[0] || e;
    return { x: (t.clientX - rect.left) * scaleX, y: (t.clientY - rect.top) * scaleY };
  }

  function startDraw(e) {
    e.preventDefault();
    setDrawing(true);
    const pos = getPos(e);
    if (!pos) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  }

  function doDraw(e) {
    e.preventDefault();
    if (!drawing) return;
    const pos = getPos(e);
    if (!pos) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  }

  function endDraw(e) {
    e.preventDefault();
    setDrawing(false);
  }

  function analyzeCoverage() {
    const canvas = canvasRef.current;
    const guide = guideRef.current;
    if (!canvas || !guide) return 0;

    const ctx = canvas.getContext('2d');
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;
    const pts = guide.pts;

    const tolerance = 20;
    let matched = 0;
    const step = Math.max(1, Math.floor(pts.length / 80));

    for (let i = 0; i < pts.length; i += step) {
      const px = Math.round(pts[i].x * canvas.width);
      const py = Math.round(pts[i].y * canvas.height);
      let found = false;
      for (let dy = -tolerance; dy <= tolerance && !found; dy++) {
        for (let dx = -tolerance; dx <= tolerance && !found; dx++) {
          const nx = px + dx;
          const ny = py + dy;
          if (nx < 0 || nx >= canvas.width || ny < 0 || ny >= canvas.height) continue;
          const idx = (ny * canvas.width + nx) * 4;
          const r = data[idx], g = data[idx + 1], b = data[idx + 2];
          if (g > 150 && r < 100 && b < 100) found = true;
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
      setFeedback({ correct: false, text: `Need ${threshold}% coverage. You got ${coverage}%. Try again!`, coverage });
      teachAfterAnswer(false, { type: 'shape', correctAnswer: target, extra: `Trace closer to the guide to reach ${threshold}%!` });
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
          <p style={{ fontSize: '1.1rem', fontWeight: 700 }}>Score: {score}</p>
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
      <div className={styles.targetArea}>
        <canvas
          ref={canvasRef}
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          onMouseDown={startDraw}
          onMouseMove={doDraw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={startDraw}
          onTouchMove={doDraw}
          onTouchEnd={endDraw}
          className={styles.traceCanvas}
          style={{
            width: '100%',
            maxWidth: CANVAS_SIZE,
            height: CANVAS_SIZE,
            touchAction: 'none',
            cursor: 'crosshair',
          }}
        />
      </div>
      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap', marginTop: '1rem' }}>
        <button
          type="button"
          onClick={handleClear}
          className={styles.choiceBtn}
          style={{ minWidth: 80, minHeight: 60 }}
        >
          🗑️ Clear
        </button>
        <button
          type="button"
          onClick={handleCheck}
          className={styles.choiceBtn}
          style={{
            minWidth: 100,
            minHeight: 60,
            background: 'var(--primary)',
            color: 'white',
            fontWeight: 900,
          }}
        >
          ✓ Check
        </button>
      </div>
      {feedback && (
        <div className={feedback.correct ? styles.feedbackOk : styles.feedbackBad} style={{ marginTop: '1rem' }}>
          {feedback.text}
        </div>
      )}
    </div>
  );
}
