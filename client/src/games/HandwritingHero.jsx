/**
 * Handwriting Hero - Practice writing letters and numbers.
 * Progressive levels: uppercase → lowercase → numbers → words.
 * SMOOTH drawing with quadratic curve interpolation.
 * Proper DPR-aware canvas sizing, accurate coverage scoring.
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import { useNoRepeat } from './useNoRepeat';
import { getRounds, getFeedbackDelay } from './levelConfig';
import { useAudio } from '../context/AudioContext';
import { useTeaching } from './useTeaching';
import styles from './GameCommon.module.css';

const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz'.split('');
const NUMBERS = '0123456789'.split('');
const WORDS_3 = ['CAT', 'DOG', 'SUN', 'BIG', 'RED', 'HAT', 'CUP', 'RUN', 'FUN', 'MOM', 'DAD', 'HUG'];
const WORDS_4 = ['BEAR', 'STAR', 'FISH', 'DUCK', 'TREE', 'CAKE', 'PLAY', 'LOVE', 'SING', 'JUMP'];

function getCharPool(level) {
  if (level <= 5) return UPPERCASE.slice(0, 10);
  if (level <= 10) return UPPERCASE;
  if (level <= 15) return [...LOWERCASE.slice(0, 13), ...NUMBERS.slice(0, 5)];
  if (level <= 20) return [...LOWERCASE, ...NUMBERS];
  if (level <= 25) return WORDS_3;
  return WORDS_4;
}

function getPassThreshold(level) {
  if (level <= 5) return 12;
  if (level <= 10) return 16;
  if (level <= 15) return 20;
  if (level <= 20) return 25;
  return 30;
}

function getCriteria(level) {
  const t = getPassThreshold(level);
  if (level <= 5) return `Trace over the guide letter. Cover at least ${t}% to pass!`;
  if (level <= 10) return `Trace carefully. Cover at least ${t}% of the letter!`;
  if (level <= 15) return `Write neatly. Cover at least ${t}% of the guide!`;
  if (level <= 20) return `Write precisely. Cover at least ${t}%!`;
  return `Master level — cover at least ${t}% of the guide!`;
}

export default function HandwritingHero({ onComplete, level = 1, childName }) {
  const canvasRef = useRef(null);
  const guideDataRef = useRef(null);
  const isDrawingRef = useRef(false);
  const lastPosRef = useRef(null);
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [done, setDone] = useState(false);
  const [strokes, setStrokes] = useState(0);
  const { playSuccess, playCelebration, playClick, playWrong } = useAudio();
  const { teachAfterAnswer, readQuestion } = useTeaching();
  const { generate } = useNoRepeat();

  const totalRounds = getRounds(level);
  const passThreshold = getPassThreshold(level);
  const pool = getCharPool(level);
  const [chars, setChars] = useState([]);

  useEffect(() => {
    const picked = [];
    for (let i = 0; i < totalRounds; i++) {
      picked.push(generate(() => pool[Math.floor(Math.random() * pool.length)], (r) => String(r)));
    }
    setChars(picked);
  }, [level, totalRounds]);

  const currentChar = chars[round] || 'A';
  const isWord = currentChar.length > 1;

  useEffect(() => {
    if (currentChar) {
      window.speechSynthesis?.cancel();
      const msg = isWord
        ? `${childName ? childName + ', write' : 'Write'} the word "${currentChar}"!`
        : `${childName ? childName + ', write' : 'Write'} the letter "${currentChar}"!`;
      const cancelRead = readQuestion(msg);
      return cancelRead;
    }
  }, [round, chars.length]);

  // Initialize canvas with proper DPR scaling
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

    // Draw guide character
    ctx.fillStyle = 'rgba(100, 100, 255, 0.13)';
    const fontSize = isWord ? Math.min(80, (rect.width * 0.8) / currentChar.length) : Math.min(140, rect.height * 0.65);
    ctx.font = `900 ${fontSize}px "Fredoka", "Comic Sans MS", cursive`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(currentChar, rect.width / 2, rect.height / 2);

    // Capture guide pixels for scoring
    guideDataRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // Draw baseline
    ctx.strokeStyle = 'rgba(0,0,0,0.06)';
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 6]);
    const y = rect.height * 0.78;
    ctx.beginPath();
    ctx.moveTo(20, y);
    ctx.lineTo(rect.width - 20, y);
    ctx.stroke();
    ctx.setLineDash([]);
  }, [currentChar, isWord]);

  useEffect(() => {
    initCanvas();
    setStrokes(0);
    lastPosRef.current = null;
  }, [round, initCanvas]);

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
    ctx.strokeStyle = '#4f46e5';
    ctx.lineWidth = level <= 5 ? 7 : level <= 15 ? 6 : 5;
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

  // Attach touch listeners with passive: false
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

  function analyzeWriting() {
    const canvas = canvasRef.current;
    if (!canvas || !guideDataRef.current) return 0;
    const ctx = canvas.getContext('2d');
    const currentData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    const guideData = guideDataRef.current.data;

    let guidePixels = 0;
    let coveredPixels = 0;

    for (let i = 0; i < guideData.length; i += 16) {
      const gR = guideData[i], gG = guideData[i + 1], gB = guideData[i + 2];
      if (gR < 250 || gG < 250 || gB < 250) {
        guidePixels++;
        const cR = currentData[i], cG = currentData[i + 1], cB = currentData[i + 2];
        // User's ink is dark blue (#4f46e5) — check for any dark pixels that aren't guide-only
        if (cR < 120 && cB > 150) {
          coveredPixels++;
        } else if (cR < 200 && cG < 200 && cB < 200) {
          // Also count any dark stroke that isn't the original guide
          const isGuideOnly = (Math.abs(cR - gR) < 15 && Math.abs(cG - gG) < 15 && Math.abs(cB - gB) < 15);
          if (!isGuideOnly) coveredPixels++;
        }
      }
    }

    if (guidePixels === 0) return strokes > 0 ? 50 : 0;
    return Math.round((coveredPixels / guidePixels) * 100);
  }

  function handleSubmit() {
    playClick();
    const coverage = analyzeWriting();
    const passed = coverage >= passThreshold || (strokes >= 3 && coverage >= passThreshold * 0.6);
    const roundScore = passed ? Math.min(100, coverage * 2 + 20) : Math.max(10, coverage);
    setScore(s => s + roundScore);

    if (passed) {
      setCorrect(c => c + 1);
      setFeedback({ text: `Great job, ${childName || 'hero'}! ${coverage}% coverage! ✍️`, correct: true, coverage });
      playSuccess();
      teachAfterAnswer(true, { type: 'letter', correctAnswer: currentChar });
    } else {
      setWrong(w => w + 1);
      setFeedback({ text: `Keep trying! The letter is "${currentChar}". You covered ${coverage}% — need ${passThreshold}%.`, correct: false, coverage });
      playWrong();
      teachAfterAnswer(false, { type: 'letter', correctAnswer: currentChar });
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
    }, getFeedbackDelay(level, passed) + 400);
  }

  function handleSkip() {
    playWrong();
    setWrong(w => w + 1);
    setFeedback({ text: `Skipped — that's okay! Let's try the next one.`, correct: false });
    teachAfterAnswer(false, { type: 'letter', correctAnswer: currentChar });
    setTimeout(() => {
      setFeedback(null);
      if (round + 1 >= totalRounds) {
        setDone(true);
        const accuracy = totalRounds > 0 ? Math.min(100, Math.round((correct / totalRounds) * 100)) : 0;
        onComplete(score, accuracy);
      } else {
        setRound(r => r + 1);
      }
    }, getFeedbackDelay(level, false));
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
          <span style={{ fontSize: '4rem' }}>✍️</span>
          <h2>Great Writing, {childName || 'Hero'}!</h2>
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

  return (
    <div className={styles.container}>
      <div className={styles.hud}>
        <span>Lv {level} · Round {round + 1}/{totalRounds} · ✅ {correct} · ❌ {wrong} · ⭐ {score}</span>
      </div>

      {/* What to write */}
      <div style={{ fontSize: '1.2rem', fontWeight: 900, textAlign: 'center', marginBottom: '0.25rem' }}>
        ✍️ Write: <span style={{ fontSize: '2.2rem', color: '#4f46e5', fontFamily: '"Fredoka", "Comic Sans MS", cursive' }}>{currentChar}</span>
      </div>

      {/* Criteria hint */}
      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', marginBottom: '0.5rem', fontWeight: 600 }}>
        {getCriteria(level)}
      </p>

      {/* Stroke counter */}
      <p style={{ fontSize: '0.72rem', textAlign: 'center', color: strokes > 0 ? '#22c55e' : 'var(--text-muted)', fontWeight: 700, marginBottom: '0.3rem' }}>
        Strokes: {strokes} {strokes >= 1 ? '✓' : ''}
      </p>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        onMouseDown={startDraw}
        onMouseMove={draw}
        onMouseUp={endDraw}
        onMouseLeave={endDraw}
        style={{
          width: '100%', maxWidth: '400px', height: '260px',
          borderRadius: '16px', border: '3px solid #a78bfa',
          background: 'white', touchAction: 'none', cursor: 'crosshair',
          display: 'block', margin: '0 auto',
        }}
      />

      {/* Actions */}
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', justifyContent: 'center' }}>
        <button type="button" onClick={handleClear} className={styles.choiceBtn}
          style={{ fontSize: '0.9rem', padding: '0.7rem 1rem' }}>
          🗑️ Clear
        </button>
        <button type="button" onClick={handleSkip} className={styles.choiceBtn}
          style={{ fontSize: '0.9rem', padding: '0.7rem 1rem' }}>
          ⏭️ Skip
        </button>
        <button type="button" onClick={handleSubmit} className={styles.choiceBtn}
          style={{ fontSize: '0.9rem', padding: '0.7rem 1.5rem', background: '#22c55e', color: 'white', fontWeight: 900 }}
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
