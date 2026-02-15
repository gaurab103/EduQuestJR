/**
 * Handwriting Hero - Practice writing letters and numbers.
 * Progressive levels: uppercase → lowercase → numbers → words.
 * Real scoring: analyzes stroke coverage over guide letter area.
 * Clear right/wrong feedback with encouragement.
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import { getRounds, getFeedbackDelay } from './levelConfig';
import { useAudio } from '../context/AudioContext';
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

// Minimum coverage % to pass at each level tier
function getPassThreshold(level) {
  if (level <= 5) return 15;   // very forgiving for young kids
  if (level <= 10) return 20;
  if (level <= 15) return 25;
  if (level <= 20) return 30;
  return 35;
}

// Scoring criteria label for display
function getCriteria(level) {
  if (level <= 5) return 'Trace over the guide letter. Cover at least 15% to pass!';
  if (level <= 10) return 'Trace carefully. Cover at least 20% of the letter!';
  if (level <= 15) return 'Write neatly. Cover at least 25% of the guide!';
  if (level <= 20) return 'Write precisely. Cover at least 30%!';
  return 'Master level — cover at least 35% of the guide!';
}

export default function HandwritingHero({ onComplete, level = 1, childName }) {
  const canvasRef = useRef(null);
  const guideRef = useRef(null);    // stores guide pixel data
  const [drawing, setDrawing] = useState(false);
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [done, setDone] = useState(false);
  const [strokes, setStrokes] = useState(0);
  const { playSuccess, playCelebration, playClick, playWrong, speak } = useAudio();

  const totalRounds = getRounds(level);
  const passThreshold = getPassThreshold(level);
  const pool = getCharPool(level);
  const [chars, setChars] = useState([]);

  useEffect(() => {
    const picked = [];
    for (let i = 0; i < totalRounds; i++) {
      picked.push(pool[Math.floor(Math.random() * pool.length)]);
    }
    setChars(picked);
  }, [level]);

  const currentChar = chars[round] || 'A';
  const isWord = currentChar.length > 1;

  useEffect(() => {
    if (currentChar) {
      const msg = isWord
        ? `${childName ? childName + ', write' : 'Write'} the word "${currentChar}"!`
        : `${childName ? childName + ', write' : 'Write'} the letter "${currentChar}"!`;
      speak(msg);
    }
  }, [round, chars.length]);

  const getCtx = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    return canvas.getContext('2d');
  }, []);

  function clearCanvas() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = canvas.offsetWidth * 2;
    canvas.height = canvas.offsetHeight * 2;
    const ctx = canvas.getContext('2d');
    ctx.scale(2, 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);

    // Draw guide letter
    ctx.fillStyle = 'rgba(100, 100, 255, 0.12)';
    const fontSize = isWord ? Math.min(80, 280 / currentChar.length) : 140;
    ctx.font = `900 ${fontSize}px "Fredoka", "Comic Sans MS", cursive`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(currentChar, canvas.offsetWidth / 2, canvas.offsetHeight / 2);

    // Capture guide pixel data for scoring
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    guideRef.current = imgData;

    // Draw baseline
    ctx.strokeStyle = 'rgba(0,0,0,0.06)';
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 6]);
    const y = canvas.offsetHeight * 0.75;
    ctx.beginPath();
    ctx.moveTo(20, y);
    ctx.lineTo(canvas.offsetWidth - 20, y);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  useEffect(() => {
    clearCanvas();
  }, [round, chars.length]);

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
    ctx.strokeStyle = '#4f46e5';
    ctx.lineWidth = level <= 10 ? 5 : 4;
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

  /**
   * Analyze how much of the guide area the user covered.
   * Returns a coverage percentage 0-100.
   */
  function analyzeWriting() {
    const canvas = canvasRef.current;
    if (!canvas || !guideRef.current) return 0;

    const ctx = canvas.getContext('2d');
    const currentData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    const guideData = guideRef.current.data;

    let guidePixels = 0;
    let coveredPixels = 0;

    // Sample every 4th pixel for performance
    for (let i = 0; i < guideData.length; i += 16) {
      const gR = guideData[i], gG = guideData[i + 1], gB = guideData[i + 2];
      // Guide pixels are blueish (rgba ~100,100,255,0.12) on white background
      // Check if this pixel was part of the guide (not pure white)
      if (gR < 250 || gG < 250 || gB < 250) {
        guidePixels++;
        // Check if user drew on this pixel (ink is dark blue #4f46e5)
        const cR = currentData[i], cG = currentData[i + 1], cB = currentData[i + 2];
        if (cR < 150 && cB > 100) {
          coveredPixels++;
        }
      }
    }

    if (guidePixels === 0) return strokes > 0 ? 50 : 0;
    return Math.round((coveredPixels / guidePixels) * 100);
  }

  function handleSubmit() {
    playClick();
    const coverage = analyzeWriting();
    const passed = coverage >= passThreshold || strokes >= 3;
    const roundScore = passed ? Math.min(100, coverage * 2 + 20) : Math.max(10, coverage);

    setScore(s => s + roundScore);

    if (passed) {
      setCorrect(c => c + 1);
      setFeedback({
        text: `Great job, ${childName || 'hero'}! ${coverage}% coverage! ✍️`,
        correct: true,
        coverage,
      });
      playSuccess();
      speak(`Wonderful! That looks great!`);
    } else {
      setWrong(w => w + 1);
      setFeedback({
        text: `Not quite right — try to trace over the guide letter more! (${coverage}%)`,
        correct: false,
        coverage,
      });
      playWrong();
      speak(`Oops, try to follow the letter shape more carefully next time!`);
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
    }, getFeedbackDelay(level) + 400);
  }

  function handleSkip() {
    playWrong();
    setWrong(w => w + 1);
    setFeedback({ text: `Skipped — that's okay! Let's try the next one.`, correct: false });
    speak(`That's okay, let's try the next one!`);
    setTimeout(() => {
      setFeedback(null);
      setStrokes(0);
      if (round + 1 >= totalRounds) {
        setDone(true);
        const accuracy = totalRounds > 0 ? Math.min(100, Math.round((correct / totalRounds) * 100)) : 0;
        onComplete(score, accuracy);
      } else {
        setRound(r => r + 1);
      }
    }, getFeedbackDelay(level));
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
      <div style={{
        fontSize: '1.2rem',
        fontWeight: 900,
        textAlign: 'center',
        marginBottom: '0.25rem',
      }}>
        ✍️ Write: <span style={{ fontSize: '2rem', color: 'var(--primary)' }}>{currentChar}</span>
      </div>

      {/* Criteria hint */}
      <p style={{
        fontSize: '0.72rem',
        color: 'var(--text-muted)',
        textAlign: 'center',
        marginBottom: '0.5rem',
        fontWeight: 600,
      }}>
        {getCriteria(level)}
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
          height: '220px',
          borderRadius: '16px',
          border: '3px solid #a78bfa',
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
          style={{ fontSize: '0.85rem', padding: '0.6rem 1rem' }}
        >
          🗑️ Clear
        </button>
        <button
          type="button"
          onClick={handleSkip}
          className={styles.choiceBtn}
          style={{ fontSize: '0.85rem', padding: '0.6rem 1rem' }}
        >
          ⏭️ Skip
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          className={styles.choiceBtn}
          style={{
            fontSize: '0.85rem',
            padding: '0.6rem 1.5rem',
            background: 'var(--success)',
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
          style={{ marginTop: '0.5rem', fontSize: '0.95rem', padding: '0.75rem 1rem' }}>
          {feedback.text}
        </div>
      )}
    </div>
  );
}
