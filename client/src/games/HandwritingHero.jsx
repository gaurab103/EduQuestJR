/**
 * Handwriting Hero - Practice writing letters, numbers, words & sentences.
 *
 * LEVEL PROGRESSION:
 *   1-3:   Single uppercase letters (A-J)
 *   4-5:   All uppercase letters (A-Z)
 *   6-8:   Lowercase letters (a-z)
 *   9-10:  Numbers (0-9) + mixed uppercase
 *  11-13:  2-letter combos (AB, GO, HI...)
 *  14-15:  3-letter CVC words (CAT, SUN, DOG...)
 *  16-18:  4-letter words (BEAR, FISH, TREE...)
 *  19-20:  5-letter words (APPLE, HAPPY, WATER...)
 *  21-23:  Simple sentences (I am big. He is fun.)
 *  24-25:  Short phrases (Good job! I love you.)
 *  26-28:  Longer words (RAINBOW, ELEPHANT, BUTTERFLY...)
 *  29-30:  Full sentences (The cat is on the mat.)
 *
 * FEATURES:
 *  - Pen size selector (thin / medium / thick)
 *  - Pen color selector (6 colors)
 *  - Smooth quadratic curve drawing
 *  - DPR-aware canvas
 *  - No word/letter repeats within a level session
 *  - Coverage-based scoring
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import { useNoRepeat } from './useNoRepeat';
import { getRounds, getFeedbackDelay } from './levelConfig';
import { useAudio } from '../context/AudioContext';
import { useTeaching } from './useTeaching';
import styles from './GameCommon.module.css';

/* ── Content pools ──────────────────────────────── */
const UPPER_EASY = 'ABCDEFGHIJ'.split('');
const UPPER_ALL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const LOWER_ALL = 'abcdefghijklmnopqrstuvwxyz'.split('');
const NUMBERS = '0123456789'.split('');

const COMBOS_2 = ['AB', 'CD', 'EF', 'GO', 'HI', 'IN', 'IT', 'MY', 'NO', 'OK', 'ON', 'SO', 'UP', 'TO', 'BE', 'DO', 'IS', 'AT', 'AN', 'IF'];

const WORDS_3 = [
  'CAT', 'DOG', 'SUN', 'BIG', 'RED', 'HAT', 'CUP', 'RUN', 'FUN', 'MOM',
  'DAD', 'HUG', 'BUS', 'BED', 'PEN', 'NET', 'BOX', 'MAP', 'JAR', 'FAN',
  'BAT', 'FOX', 'HOP', 'LOG', 'MUG', 'NUT', 'PIG', 'RAT', 'TOP', 'VAN',
  'WET', 'ZIP', 'DIG', 'GUM', 'HEN', 'JOG', 'KIT', 'LID', 'PAD', 'RUG',
];

const WORDS_4 = [
  'BEAR', 'STAR', 'FISH', 'DUCK', 'TREE', 'CAKE', 'PLAY', 'LOVE', 'SING', 'JUMP',
  'FROG', 'BIRD', 'MOON', 'RAIN', 'BOOK', 'HAND', 'BALL', 'MILK', 'KING', 'RING',
  'SHIP', 'BLUE', 'PINK', 'GOLD', 'LION', 'WOLF', 'DEER', 'GOAT', 'FARM', 'SAND',
  'SEED', 'LEAF', 'WIND', 'SNOW', 'POND', 'HILL', 'CAVE', 'LAMP', 'DRUM', 'BELL',
];

const WORDS_5 = [
  'APPLE', 'HAPPY', 'WATER', 'TIGER', 'BEACH', 'CLOUD', 'DANCE', 'EARTH', 'FAIRY',
  'GLOBE', 'HEART', 'LIGHT', 'MAGIC', 'OCEAN', 'PIANO', 'QUEEN', 'SMILE', 'TRAIN',
  'MUSIC', 'DREAM', 'SPARK', 'HOUSE', 'PLANT', 'RIVER', 'LEMON', 'GRAPE', 'MELON',
  'CANDY', 'BUNNY', 'PUPPY', 'KITTY', 'STONE', 'FLAME', 'FRUIT', 'BRUSH', 'CROWN',
];

const SENTENCES_SHORT = [
  'I am big.', 'He is fun.', 'She can run.', 'We go up.', 'It is red.',
  'I see a cat.', 'I like dogs.', 'The sun is up.', 'I can jump.', 'He has a hat.',
  'A big bear.', 'My red cup.', 'A fun day.', 'Go and play.', 'I am happy.',
];

const PHRASES = [
  'Good job!', 'I love you.', 'Well done!', 'Be happy!', 'You are kind.',
  'Try again!', 'Keep going!', 'You can do it!', 'Nice work!', 'Have fun!',
  'Be brave.', 'Stay cool.', 'Dream big.', 'Smile more.', 'I am strong.',
];

const WORDS_LONG = [
  'RAINBOW', 'ELEPHANT', 'BUTTERFLY', 'SUNSHINE', 'DINOSAUR', 'PRINCESS',
  'UMBRELLA', 'MOUNTAIN', 'TREASURE', 'BIRTHDAY', 'ALPHABET', 'TOGETHER',
  'COMPUTER', 'SANDWICH', 'FOOTBALL', 'PAINTING', 'STARFISH', 'CHAMPION',
];

const SENTENCES_LONG = [
  'The cat is on the mat.', 'I like to play with my dog.', 'The sun is very bright today.',
  'We love to read good books.', 'She can sing a nice song.', 'He runs fast in the park.',
  'I see a big red ball.', 'The bird sits on the tree.', 'My mom makes the best cake.',
  'We jump and play all day.', 'The fish swims in the pond.', 'Stars shine at night.',
];

/* ── Level config ──────────────────────────────── */
function getCharPool(level) {
  if (level <= 3) return UPPER_EASY;
  if (level <= 5) return UPPER_ALL;
  if (level <= 8) return LOWER_ALL;
  if (level <= 10) return [...UPPER_ALL.slice(0, 13), ...NUMBERS];
  if (level <= 13) return COMBOS_2;
  if (level <= 15) return WORDS_3;
  if (level <= 18) return WORDS_4;
  if (level <= 20) return WORDS_5;
  if (level <= 23) return SENTENCES_SHORT;
  if (level <= 25) return PHRASES;
  if (level <= 28) return WORDS_LONG;
  return SENTENCES_LONG;
}

function getLevelLabel(level) {
  if (level <= 3) return 'Uppercase Letters (Easy)';
  if (level <= 5) return 'Uppercase Letters (A-Z)';
  if (level <= 8) return 'Lowercase Letters';
  if (level <= 10) return 'Numbers & Letters';
  if (level <= 13) return 'Letter Combos';
  if (level <= 15) return '3-Letter Words';
  if (level <= 18) return '4-Letter Words';
  if (level <= 20) return '5-Letter Words';
  if (level <= 23) return 'Short Sentences';
  if (level <= 25) return 'Phrases';
  if (level <= 28) return 'Long Words';
  return 'Full Sentences';
}

function getPassThreshold(level) {
  if (level <= 5) return 10;
  if (level <= 10) return 14;
  if (level <= 15) return 16;
  if (level <= 20) return 18;
  if (level <= 25) return 12;
  return 10;
}

function getCriteria(level) {
  const t = getPassThreshold(level);
  if (level <= 5) return `Trace over the guide. Cover ${t}%+ to pass!`;
  if (level <= 10) return `Write neatly. Cover ${t}%+ of the guide!`;
  if (level <= 15) return `Write the word carefully. Cover ${t}%+!`;
  if (level <= 25) return `Write the text. Cover ${t}%+ to pass!`;
  return `Master: write precisely. Cover ${t}%+!`;
}

/* ── Pen sizes ──────────────────────────────── */
const PEN_SIZES = [
  { label: 'Thin', value: 3, icon: '·' },
  { label: 'Medium', value: 6, icon: '●' },
  { label: 'Thick', value: 10, icon: '⬤' },
];

const PEN_COLORS = [
  { label: 'Blue', value: '#4f46e5' },
  { label: 'Black', value: '#1e293b' },
  { label: 'Red', value: '#dc2626' },
  { label: 'Green', value: '#16a34a' },
  { label: 'Purple', value: '#9333ea' },
  { label: 'Orange', value: '#ea580c' },
];

/* ── Component ──────────────────────────────── */
export default function HandwritingHero({ onComplete, level = 1, childName }) {
  const canvasRef = useRef(null);
  const guideDataRef = useRef(null);
  const isDrawingRef = useRef(false);
  const lastPosRef = useRef(null);
  const penColorRef = useRef('#4f46e5');
  const penSizeRef = useRef(6);

  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [done, setDone] = useState(false);
  const [strokes, setStrokes] = useState(0);
  const [penSize, setPenSize] = useState(1); // index into PEN_SIZES
  const [penColor, setPenColor] = useState(0); // index into PEN_COLORS

  const { playSuccess, playCelebration, playClick, playWrong } = useAudio();
  const { teachAfterAnswer, readQuestion, setChildName } = useTeaching();
  const { generate } = useNoRepeat(level);

  useEffect(() => { if (childName) setChildName(childName); }, [childName, setChildName]);

  const totalRounds = getRounds(level);
  const passThreshold = getPassThreshold(level);
  const pool = getCharPool(level);
  const [chars, setChars] = useState([]);

  // Pre-generate all characters for this level — no repeats
  useEffect(() => {
    const picked = [];
    for (let i = 0; i < totalRounds; i++) {
      picked.push(generate(() => pool[Math.floor(Math.random() * pool.length)], (r) => String(r)));
    }
    setChars(picked);
  }, [level, totalRounds]);

  // Set default pen size based on level
  useEffect(() => {
    if (level <= 5) { setPenSize(2); penSizeRef.current = PEN_SIZES[2].value; }
    else if (level <= 15) { setPenSize(1); penSizeRef.current = PEN_SIZES[1].value; }
    else { setPenSize(0); penSizeRef.current = PEN_SIZES[0].value; }
  }, [level]);

  const currentChar = chars[round] || 'A';
  const isLong = currentChar.length > 3;
  const isWord = currentChar.length > 1;

  // Voice prompt
  useEffect(() => {
    if (currentChar) {
      window.speechSynthesis?.cancel();
      let msg;
      if (currentChar.length === 1) {
        msg = `${childName ? childName + ', write' : 'Write'} the ${/\d/.test(currentChar) ? 'number' : 'letter'} "${currentChar}"`;
      } else if (currentChar.includes(' ')) {
        msg = `${childName ? childName + ', write' : 'Write'}: "${currentChar}"`;
      } else {
        msg = `${childName ? childName + ', write' : 'Write'} the word "${currentChar}"`;
      }
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

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, rect.width, rect.height);

    // Draw guide text
    ctx.fillStyle = 'rgba(100, 100, 255, 0.13)';
    let fontSize;
    if (currentChar.length <= 1) {
      fontSize = Math.min(150, rect.height * 0.65);
    } else if (currentChar.length <= 4) {
      fontSize = Math.min(100, (rect.width * 0.85) / currentChar.length);
    } else if (currentChar.length <= 8) {
      fontSize = Math.min(60, (rect.width * 0.85) / currentChar.length);
    } else {
      fontSize = Math.min(40, (rect.width * 0.9) / (currentChar.length * 0.55));
    }
    ctx.font = `900 ${fontSize}px "Fredoka", "Comic Sans MS", cursive`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // For very long text, wrap to 2 lines
    if (currentChar.length > 12) {
      const words = currentChar.split(' ');
      const mid = Math.ceil(words.length / 2);
      const line1 = words.slice(0, mid).join(' ');
      const line2 = words.slice(mid).join(' ');
      ctx.fillText(line1, rect.width / 2, rect.height / 2 - fontSize * 0.55);
      ctx.fillText(line2, rect.width / 2, rect.height / 2 + fontSize * 0.55);
    } else {
      ctx.fillText(currentChar, rect.width / 2, rect.height / 2);
    }

    // Capture guide pixels
    guideDataRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // Draw writing lines
    ctx.strokeStyle = 'rgba(0,0,0,0.06)';
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 6]);
    const lineY = rect.height * 0.78;
    ctx.beginPath();
    ctx.moveTo(16, lineY);
    ctx.lineTo(rect.width - 16, lineY);
    ctx.stroke();
    // Midline for single chars
    if (currentChar.length <= 2) {
      const midY = rect.height * 0.5;
      ctx.beginPath();
      ctx.moveTo(16, midY);
      ctx.lineTo(rect.width - 16, midY);
      ctx.stroke();
    }
    ctx.setLineDash([]);
  }, [currentChar]);

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
    return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
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
    ctx.strokeStyle = penColorRef.current;
    ctx.lineWidth = penSizeRef.current;
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
        if (cR < 200 || cG < 200 || cB < 200) {
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
    const passed = coverage >= passThreshold || (strokes >= 3 && coverage >= passThreshold * 0.5);
    const roundScore = passed ? Math.min(100, coverage * 2 + 20) : Math.max(10, coverage);
    setScore(s => s + roundScore);

    if (passed) {
      setCorrect(c => c + 1);
      setFeedback({ text: `Great job${childName ? ', ' + childName : ''}! ${coverage}% coverage! ✍️`, correct: true });
      playSuccess();
      teachAfterAnswer(true, { type: 'letter', correctAnswer: currentChar });
    } else {
      setWrong(w => w + 1);
      setFeedback({ text: `Keep trying! "${currentChar}" — you covered ${coverage}%, need ${passThreshold}%.`, correct: false });
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

  function selectPenSize(idx) {
    setPenSize(idx);
    penSizeRef.current = PEN_SIZES[idx].value;
    playClick();
  }

  function selectPenColor(idx) {
    setPenColor(idx);
    penColorRef.current = PEN_COLORS[idx].value;
    playClick();
  }

  /* ── Done screen ──────────────────────────────── */
  if (done) {
    const finalAccuracy = totalRounds > 0 ? Math.round((correct / totalRounds) * 100) : 0;
    return (
      <div className={styles.container}>
        <div className={styles.celebration}>
          <span style={{ fontSize: '4rem' }}>✍️</span>
          <h2>Great Writing{childName ? ', ' + childName : ''}!</h2>
          <p style={{ fontSize: '1.1rem', fontWeight: 700 }}>Score: {score}</p>
          <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', margin: '0.5rem 0' }}>
            <span style={{ color: '#22c55e', fontWeight: 800 }}>✅ {correct}</span>
            <span style={{ color: '#ef4444', fontWeight: 800 }}>❌ {wrong}</span>
          </div>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Accuracy: {finalAccuracy}%</p>
        </div>
      </div>
    );
  }

  /* ── Main UI ──────────────────────────────── */
  const canvasHeight = isLong ? 200 : 280;

  return (
    <div className={styles.container}>
      {/* HUD */}
      <div className={styles.hud}>
        <span>Lv {level} · {round + 1}/{totalRounds} · ✅ {correct} · ❌ {wrong}</span>
      </div>

      {/* Level badge */}
      <div style={{
        textAlign: 'center', marginBottom: '0.2rem',
        fontSize: '0.7rem', fontWeight: 700, color: '#a78bfa',
        background: 'rgba(167,139,250,0.08)', borderRadius: 999,
        display: 'inline-block', padding: '0.2rem 0.75rem', margin: '0 auto',
      }}>
        {getLevelLabel(level)}
      </div>

      {/* What to write */}
      <div style={{
        fontSize: currentChar.length <= 1 ? '1.3rem' : '1rem',
        fontWeight: 900, textAlign: 'center', marginBottom: '0.15rem',
      }}>
        ✍️ Write: <span style={{
          fontSize: currentChar.length <= 1 ? '2.2rem' : currentChar.length <= 5 ? '1.6rem' : '1.1rem',
          color: '#4f46e5', fontFamily: '"Fredoka", "Comic Sans MS", cursive',
          wordBreak: 'break-word',
        }}>
          {currentChar}
        </span>
      </div>

      {/* Criteria */}
      <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center', marginBottom: '0.3rem', fontWeight: 600 }}>
        {getCriteria(level)}
      </p>

      {/* Pen tools row */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem',
        marginBottom: '0.4rem', flexWrap: 'wrap',
      }}>
        {/* Pen sizes */}
        <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', marginRight: '0.15rem' }}>Size:</span>
          {PEN_SIZES.map((ps, idx) => (
            <button key={ps.label} type="button" onClick={() => selectPenSize(idx)}
              style={{
                width: 32, height: 32, borderRadius: '50%', minHeight: 'auto', padding: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: ps.value <= 3 ? '0.5rem' : ps.value <= 6 ? '0.7rem' : '1rem',
                background: penSize === idx ? 'rgba(79,70,229,0.12)' : 'transparent',
                border: penSize === idx ? '2px solid #4f46e5' : '2px solid #e2e8f0',
                cursor: 'pointer', color: '#4f46e5', fontWeight: 900,
              }}>
              {ps.icon}
            </button>
          ))}
        </div>

        {/* Separator */}
        <div style={{ width: 1, height: 24, background: '#e2e8f0' }} />

        {/* Pen colors */}
        <div style={{ display: 'flex', gap: '0.2rem', alignItems: 'center' }}>
          {PEN_COLORS.map((pc, idx) => (
            <button key={pc.label} type="button" onClick={() => selectPenColor(idx)}
              style={{
                width: 24, height: 24, borderRadius: '50%', minHeight: 'auto', padding: 0,
                background: pc.value, cursor: 'pointer',
                border: penColor === idx ? '3px solid #1e293b' : '2px solid transparent',
                transform: penColor === idx ? 'scale(1.2)' : 'scale(1)',
                transition: 'transform 0.15s',
              }}
            />
          ))}
        </div>
      </div>

      {/* Stroke counter */}
      <p style={{ fontSize: '0.7rem', textAlign: 'center', color: strokes > 0 ? '#22c55e' : 'var(--text-muted)', fontWeight: 700, marginBottom: '0.2rem' }}>
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
          width: '100%', maxWidth: '420px', height: `${canvasHeight}px`,
          borderRadius: '16px', border: '3px solid #a78bfa',
          background: 'white', touchAction: 'none', cursor: 'crosshair',
          display: 'block', margin: '0 auto',
        }}
      />

      {/* Actions */}
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        <button type="button" onClick={handleClear} className={styles.choiceBtn}
          style={{ fontSize: '0.85rem', padding: '0.65rem 1rem' }}>
          🗑️ Clear
        </button>
        <button type="button" onClick={handleSkip} className={styles.choiceBtn}
          style={{ fontSize: '0.85rem', padding: '0.65rem 1rem' }}>
          ⏭️ Skip
        </button>
        <button type="button" onClick={handleSubmit} className={styles.choiceBtn}
          style={{ fontSize: '0.85rem', padding: '0.65rem 1.5rem', background: '#22c55e', color: 'white', fontWeight: 900 }}
          disabled={strokes < 1}>
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
