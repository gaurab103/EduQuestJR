/**
 * Shape Geometry Lab - PREMIUM
 * Unique mechanic: Interactive shape manipulation. Rotate, flip, combine shapes
 * to match a target. Tangram mode: drag geometric pieces to fill an outline.
 * Count sides/corners with visual highlighting.
 * Levels: identify shapes -> symmetry -> tangram puzzles
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { useAudio } from '../context/AudioContext';
import { useTeaching } from './useTeaching';
import { useNoRepeat } from './useNoRepeat';
import { getRounds, getFeedbackDelay, getChoiceCount } from './levelConfig';
import { SHAPE_IMAGES } from './gameImages';
import styles from './GameCommon.module.css';

const SHAPES = [
  { id: 'triangle', label: 'Triangle', sides: 3, corners: 3 },
  { id: 'square', label: 'Square', sides: 4, corners: 4 },
  { id: 'star', label: 'Star', sides: 5, corners: 5 },
  { id: 'hexagon', label: 'Hexagon', sides: 6, corners: 6 },
];

function getMode(level) {
  if (level <= 8) return 'sides';
  if (level <= 16) return 'tangram';
  return 'symmetry';
}

export default function ShapeGeometryLab({ onComplete, level = 1 }) {
  const { playSuccess, playWrong, playClick, playCelebration } = useAudio();
  const { teachAfterAnswer, readQuestion } = useTeaching();
  const { generate } = useNoRepeat(level);
  const [round, setRound] = useState(0);
  const [mode, setMode] = useState('sides');
  const [question, setQuestion] = useState(null);
  const [options, setOptions] = useState([]);
  const [tangramGrid, setTangramGrid] = useState([]);
  const [tangramPieces, setTangramPieces] = useState([]);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const completedRef = useRef(false);
  const ROUNDS = getRounds(level);
  const CHOICE_COUNT = getChoiceCount(level);

  useEffect(() => {
    window.speechSynthesis?.cancel();
    if (round >= ROUNDS && !completedRef.current) {
      completedRef.current = true;
      playCelebration();
      const accuracy = ROUNDS > 0 ? Math.round((score / (ROUNDS * 10)) * 100) : 0;
      onComplete(score, Math.min(100, accuracy));
      return;
    }
    const m = getMode(level);
    setMode(m);
    setFeedback(null);

    if (m === 'sides') {
      const target = generate(
        () => SHAPES[Math.floor(Math.random() * SHAPES.length)],
        (s) => s.id
      );
      const q = Math.random() > 0.5
        ? { type: 'sides', text: `How many sides does a ${target.label} have?`, answer: target.sides }
        : { type: 'corners', text: `How many corners does a ${target.label} have?`, answer: target.corners };
      setQuestion(q);
      const nums = [q.answer, q.answer + 1, q.answer - 1, q.answer + 2].filter(n => n >= 3 && n <= 8);
      const opts = [...new Set(nums)];
      while (opts.length < CHOICE_COUNT) {
        opts.push(3 + Math.floor(Math.random() * 4));
      }
      setOptions([...new Set(opts)].sort(() => Math.random() - 0.5).slice(0, CHOICE_COUNT));
      setTangramGrid([]);
      setTangramPieces([]);
      const cancelRead = readQuestion(q.text);
      return cancelRead;
    }

    if (m === 'tangram') {
      setQuestion({ type: 'tangram' });
      const size = level <= 12 ? 4 : 6;
      const grid = Array(size).fill(null);
      const pieces = Array(size).fill(0).map((_, i) => i);
      setTangramGrid(grid);
      setTangramPieces(pieces.sort(() => Math.random() - 0.5));
      const cancelRead = readQuestion('Drag the pieces to fill the grid! Match the pattern.');
      return cancelRead;
    }

    if (m === 'symmetry') {
      const target = generate(
        () => SHAPES[Math.floor(Math.random() * SHAPES.length)],
        (s) => s.id
      );
      setQuestion({ type: 'symmetry', text: `Which shape has ${target.sides} sides?`, answer: target.id });
      const pool = [...SHAPES].sort(() => Math.random() - 0.5);
      setOptions(pool.slice(0, CHOICE_COUNT));
      setTangramGrid([]);
      setTangramPieces([]);
      const cancelRead = readQuestion(`Tap the shape with ${target.sides} sides!`);
      return cancelRead;
    }
  }, [round]);

  const handleSidesAnswer = useCallback((n) => {
    if (!question || question.type === 'tangram' || feedback) return;
    playClick();
    const correct = n === question.answer;
    if (correct) {
      setScore(s => s + 10);
      playSuccess();
      setFeedback('correct');
      teachAfterAnswer(true, { type: 'shape', correctAnswer: question.answer, extra: `Yes! ${question.answer} is correct!` });
    } else {
      playWrong();
      setFeedback('wrong');
      teachAfterAnswer(false, { type: 'shape', answer: n, correctAnswer: question.answer, extra: `A ${question.text.includes('sides') ? 'shape' : 'shape'} with ${question.answer} ${question.text.includes('sides') ? 'sides' : 'corners'} is the answer!` });
    }
    const delay = getFeedbackDelay(level, correct);
    setTimeout(() => setRound(r => r + 1), delay);
  }, [question, feedback, level, playClick, playSuccess, playWrong, teachAfterAnswer]);

  const handleSymmetryAnswer = useCallback((shapeId) => {
    if (!question || question.type !== 'symmetry' || feedback) return;
    playClick();
    const correct = shapeId === question.answer;
    if (correct) {
      setScore(s => s + 10);
      playSuccess();
      setFeedback('correct');
      const shape = SHAPES.find(s => s.id === shapeId);
      teachAfterAnswer(true, { type: 'shape', correctAnswer: shape?.label, extra: `Yes! A ${shape?.label} has ${shape?.sides} sides!` });
    } else {
      playWrong();
      setFeedback('wrong');
      const shape = SHAPES.find(s => s.id === question.answer);
      teachAfterAnswer(false, { type: 'shape', answer: shapeId, correctAnswer: shape?.label, extra: `The ${shape?.label} has ${shape?.sides} sides!` });
    }
    const delay = getFeedbackDelay(level, correct);
    setTimeout(() => setRound(r => r + 1), delay);
  }, [question, feedback, level, playClick, playSuccess, playWrong, teachAfterAnswer]);

  const handleTangramDrop = useCallback((pieceIdx, slotIdx) => {
    if (!question || question.type !== 'tangram' || feedback) return;
    playClick();
    setTangramGrid(prev => {
      const next = [...prev];
      const existing = next.indexOf(pieceIdx);
      if (existing >= 0) next[existing] = null;
      next[slotIdx] = pieceIdx;
      const filled = next.filter(Boolean).length;
      if (filled === next.length) {
        setScore(s => s + 10);
        playSuccess();
        setFeedback('correct');
        teachAfterAnswer(true, { type: 'shape', extra: 'You filled the grid! Great spatial thinking!' });
        setTimeout(() => setRound(r => r + 1), getFeedbackDelay(level, true));
      }
      return next;
    });
  }, [question, feedback, level, playClick, playSuccess, teachAfterAnswer]);

  if (round >= ROUNDS) {
    return (
      <div className={styles.container}>
        <div className={styles.celebration}>
          <h2>Geometry Star!</h2>
          <p style={{ fontSize: '1.1rem', fontWeight: 700 }}>Score: {score}</p>
        </div>
      </div>
    );
  }

  if (!question) return null;

  if (question.type === 'tangram') {
    const size = tangramGrid.length;
    const cellSize = Math.min(60, 280 / size);
    return (
      <div className={styles.container}>
        <div className={styles.hud}>
          <span>Lv {level}</span>
          <span>·</span>
          <span>{round + 1}/{ROUNDS}</span>
          <span>·</span>
          <span>Score: {score}</span>
        </div>
        <p className={styles.prompt}>Fill the grid with the pieces!</p>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.sqrt(size)}, ${cellSize}px)`, gap: 4, margin: '0 auto 1rem', width: 'fit-content' }}>
          {tangramGrid.map((piece, i) => (
            <div
              key={i}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                const p = parseInt(e.dataTransfer?.getData('piece') ?? '-1', 10);
                if (p >= 0) handleTangramDrop(p, i);
              }}
              style={{
                width: cellSize,
                height: cellSize,
                background: 'var(--card-bg)',
                border: '2px dashed var(--card-border)',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
              }}
            >
              {piece !== null ? '🔷' : ''}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
          {tangramPieces.filter(p => !tangramGrid.includes(p)).map((p) => (
            <div
              key={p}
              draggable
              onDragStart={(e) => e.dataTransfer.setData('piece', String(p))}
              style={{
                width: cellSize,
                height: cellSize,
                background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                cursor: 'grab',
              }}
            >
              🔷
            </div>
          ))}
        </div>
        {feedback === 'correct' && <p className={styles.feedbackOk}>Perfect!</p>}
      </div>
    );
  }

  if (question.type === 'symmetry') {
    return (
      <div className={styles.container}>
        <div className={styles.hud}>
          <span>Lv {level}</span>
          <span>·</span>
          <span>{round + 1}/{ROUNDS}</span>
          <span>·</span>
          <span>Score: {score}</span>
        </div>
        <p className={styles.prompt}>{question.text}</p>
        <div className={styles.choices}>
          {options.map((s) => (
            <button
              key={s.id}
              type="button"
              className={styles.choiceBtn}
              onClick={() => handleSymmetryAnswer(s.id)}
              disabled={!!feedback}
            >
              <img src={SHAPE_IMAGES[s.id]} alt={s.label} style={{ width: 64, height: 64 }} />
              <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>{s.label}</span>
            </button>
          ))}
        </div>
        {feedback === 'correct' && <p className={styles.feedbackOk}>Correct!</p>}
        {feedback === 'wrong' && <p className={styles.feedbackBad}>Try again!</p>}
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.hud}>
        <span>Lv {level}</span>
        <span>·</span>
        <span>{round + 1}/{ROUNDS}</span>
        <span>·</span>
        <span>Score: {score}</span>
      </div>
      <p className={styles.prompt}>{question.text}</p>
      <div className={styles.choices}>
        {options.map((n) => (
          <button
            key={n}
            type="button"
            className={styles.choiceBtn}
            onClick={() => handleSidesAnswer(n)}
            disabled={!!feedback}
            style={{ fontSize: '2rem', fontWeight: 800 }}
          >
            {n}
          </button>
        ))}
      </div>
      {feedback === 'correct' && <p className={styles.feedbackOk}>Correct!</p>}
      {feedback === 'wrong' && <p className={styles.feedbackBad}>The answer is {question.answer}</p>}
    </div>
  );
}
