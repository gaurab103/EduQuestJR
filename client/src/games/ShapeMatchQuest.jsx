import { useState, useEffect, useRef } from 'react';
import { useAudio } from '../context/AudioContext';
import { useTeaching } from './useTeaching';
import { useNoRepeat } from './useNoRepeat';
import { ai as aiApi } from '../api/client';
import { getRounds, getChoiceCount, getFeedbackDelay } from './levelConfig';
import { GameImage, SHAPE_IMAGES, OBJECT_IMAGES } from './gameImages';
import styles from './GameCommon.module.css';

const SHAPES = [
  { id: 'circle', label: 'Circle', emoji: '⭕', img: SHAPE_IMAGES.circle, sides: 0, corners: 0, hasCurves: true },
  { id: 'square', label: 'Square', emoji: '🟦', img: SHAPE_IMAGES.square, sides: 4, corners: 4, hasCurves: false },
  { id: 'triangle', label: 'Triangle', emoji: '🔺', img: SHAPE_IMAGES.triangle, sides: 3, corners: 3, hasCurves: false },
  { id: 'star', label: 'Star', emoji: '⭐', img: SHAPE_IMAGES.star, sides: 5, corners: 5, hasCurves: false },
  { id: 'heart', label: 'Heart', emoji: '❤️', img: SHAPE_IMAGES.heart, sides: 0, corners: 0, hasCurves: true },
  { id: 'diamond', label: 'Diamond', emoji: '💎', img: SHAPE_IMAGES.diamond, sides: 4, corners: 4, hasCurves: false },
  { id: 'moon', label: 'Moon', emoji: '🌙', img: OBJECT_IMAGES.moon, sides: 0, corners: 0, hasCurves: true },
  { id: 'sun', label: 'Sun', emoji: '☀️', img: OBJECT_IMAGES.sun, sides: 0, corners: 0, hasCurves: true },
];

function getMode(level, round) {
  if (level <= 5) return 0; // Find the X shape
  if (level <= 10) return round % 2; // 0: find, 1: how many sides
  if (level <= 15) return round % 3; // 0: find, 1: how many sides, 2: which has N sides
  return round % 4; // add 3: sort curves vs corners
}

export default function ShapeMatchQuest({ onComplete, level = 1, childName, childAge }) {
  const { playSuccess, playWrong, playClick } = useAudio();
  const { teachAfterAnswer, readQuestion } = useTeaching();
  const { generate } = useNoRepeat();
  const [round, setRound] = useState(0);
  const [target, setTarget] = useState(null);
  const [choices, setChoices] = useState([]);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [streak, setStreak] = useState(0);
  const [hint, setHint] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [mode, setModeState] = useState(0);
  const [sortQuestion, setSortQuestion] = useState(null);
  const completedRef = useRef(false);
  const ROUNDS = getRounds(level);
  const CHOICE_COUNT = getChoiceCount(level);

  useEffect(() => {
    window.speechSynthesis?.cancel();
    if (round >= ROUNDS && !completedRef.current) {
      completedRef.current = true;
      const accuracy = Math.round((score / ROUNDS) * 100);
      onComplete(score, accuracy);
      return;
    }
    const m = getMode(level, round);
    setModeState(m);

    if (m === 0) {
      const targetShape = generate(
        () => {
          const pool = [...SHAPES].sort(() => Math.random() - 0.5);
          return pool[0];
        },
        (r) => r.label
      );
      const pool = [targetShape, ...SHAPES.filter(s => s.id !== targetShape.id)].sort(() => Math.random() - 0.5);
      const options = pool.slice(0, CHOICE_COUNT).sort(() => Math.random() - 0.5);
      setTarget(targetShape);
      setChoices(options);
      setSortQuestion(null);
      setFeedback(null);
      setShowHint(false);
      setHint('');
      const cancelRead = readQuestion('Find the ' + targetShape.label + '!');
      return cancelRead;
    }

    if (m === 1) {
      const withSides = SHAPES.filter(s => s.sides > 0);
      const shape = generate(
        () => withSides[Math.floor(Math.random() * withSides.length)],
        (r) => `${m}-${r.label}`
      );
      const answerNum = shape.sides;
      const wrong = new Set([answerNum]);
      const allNums = [3, 4, 5, 6];
      while (wrong.size < CHOICE_COUNT) wrong.add(allNums[Math.floor(Math.random() * allNums.length)]);
      const opts = [...wrong].sort(() => Math.random() - 0.5).map(n => ({ id: 'n' + n, label: String(n), sides: n }));
      setTarget({ ...shape, correctAnswer: shape.sides });
      setChoices(opts);
      setSortQuestion(null);
      setFeedback(null);
      const cancelRead = readQuestion('How many sides does a ' + shape.label + ' have?');
      return cancelRead;
    }

    if (m === 2) {
      const withSides = SHAPES.filter(s => s.sides > 0);
      const targetShape = generate(
        () => withSides[Math.floor(Math.random() * withSides.length)],
        (r) => `${m}-${r.id}`
      );
      const pool = [...withSides].sort(() => Math.random() - 0.5);
      const options = pool.slice(0, CHOICE_COUNT).sort(() => Math.random() - 0.5);
      setTarget({ ...targetShape, correctAnswer: targetShape.id });
      setChoices(options);
      setSortQuestion(null);
      setFeedback(null);
      const cancelRead = readQuestion('Which shape has ' + targetShape.sides + ' sides?');
      return cancelRead;
    }

    // m === 3: Sort - which has curves? which has corners?
    const { askCurves, pool, options, correct } = generate(
      () => {
        const askCurves = Math.random() > 0.5;
        const pool = [...SHAPES].filter(s => s.id !== 'moon' && s.id !== 'sun').sort(() => Math.random() - 0.5);
        const options = pool.slice(0, 4);
        const correctOnes = options.filter(s => askCurves ? s.hasCurves : !s.hasCurves && s.corners > 0);
        const correct = correctOnes[0];
        return { askCurves, pool, options, correct };
      },
      (r) => `${m}-${r.askCurves}-${r.options.map(o => o.id).join('-')}`
    );
    setTarget({ id: 'sort', correctAnswer: correct?.id, askCurves });
    setChoices(options);
    setSortQuestion(askCurves ? 'Which shape has curves?' : 'Which shape has corners?');
    setFeedback(null);
    const cancelRead = readQuestion(askCurves ? 'Which shape has curves?' : 'Which shape has corners?');
    return cancelRead;
  }, [round, score, ROUNDS, CHOICE_COUNT, level]);

  function handleChoice(choice) {
    if (feedback !== null) return;
    playClick();
    let correct = false;
    if (mode === 0) correct = choice.id === target.id;
    else if (mode === 1) correct = choice.sides === target.correctAnswer;
    else if (mode === 2) correct = choice.id === target.correctAnswer;
    else correct = (target.askCurves && choice.hasCurves) || (!target.askCurves && choice.corners > 0 && !choice.hasCurves);
    if (correct) {
      setScore((s) => s + 1);
      setStreak(s => s + 1);
      playSuccess();
    } else {
      setStreak(0);
      playWrong();
    }
    setFeedback(correct ? 'correct' : 'wrong');
    const correctAns = mode === 0 ? target?.label : mode === 1 ? target?.correctAnswer : mode === 2 ? target?.label : (target?.askCurves ? 'the curved shape' : 'the shape with corners');
    teachAfterAnswer(correct, { type: 'shape', answer: choice.id, correctAnswer: correctAns });
    const delay = getFeedbackDelay(level, correct);
    setTimeout(() => setRound((r) => r + 1), delay);
  }

  async function requestHint() {
    setShowHint(true);
    try {
      const res = await aiApi.hint('shape-match-quest', `Find ${target?.label || target?.correctAnswer}`, score, Math.round((score / Math.max(1, round)) * 100), childAge || 5);
      setHint(res.hint || `Look for the ${target?.label || 'shape'}!`);
    } catch (_) {
      setHint(`Look carefully for the shape!`);
    }
  }

  if (round >= ROUNDS) return <div className={styles.container}><p className={styles.prompt}>Calculating your rewards...</p></div>;

  let promptText = '';
  let targetArea = null;

  if (mode === 0) {
    promptText = `Find the ${target?.label}!`;
    targetArea = (
      <div className={styles.targetArea}>
        <span className={styles.targetEmoji} aria-label={target?.label}>
          {target?.img ? <GameImage src={target.img} alt={target.label} size={72} /> : target?.emoji}
        </span>
      </div>
    );
  } else if (mode === 1) {
    promptText = `How many sides does a ${target?.label} have?`;
    targetArea = (
      <div className={styles.targetArea}>
        <span className={styles.targetEmoji} aria-label={target?.label}>
          {target?.img ? <GameImage src={target.img} alt={target.label} size={72} /> : target?.emoji}
        </span>
      </div>
    );
  } else if (mode === 2) {
    promptText = `Which shape has ${target?.sides} sides?`;
    targetArea = (
      <div className={styles.targetArea}>
        <span style={{ fontSize: '2rem', fontWeight: 800 }}>{target?.sides} sides</span>
      </div>
    );
  } else {
    promptText = sortQuestion;
    targetArea = (
      <div className={styles.targetArea}>
        <span style={{ fontSize: '1.1rem', fontWeight: 700 }}>Tap the {target?.askCurves ? 'curved' : 'cornered'} shape</span>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.progress}>
        <span>Lv {level}</span>
        <span>·</span>
        <span>Round {round + 1} / {ROUNDS}</span>
        <span>·</span>
        <span>⭐ {score}</span>
        {streak >= 2 && <span>· 🔥 {streak}</span>}
      </div>

      <p className={styles.prompt}>{promptText}</p>
      {targetArea}

      {!showHint && feedback === null && mode === 0 && (
        <button
          type="button"
          onClick={requestHint}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--primary)',
            fontSize: '0.85rem',
            fontWeight: 700,
            cursor: 'pointer',
            marginBottom: '0.75rem',
            padding: '0.25rem 0.5rem',
            minHeight: 'auto',
          }}
        >
          🐻 Need a hint?
        </button>
      )}
      {showHint && hint && (
        <div style={{
          background: 'rgba(56, 189, 248, 0.08)',
          padding: '0.5rem 0.75rem',
          borderRadius: '12px',
          fontSize: '0.85rem',
          fontWeight: 600,
          marginBottom: '0.75rem',
        }}>
          🐻 {hint}
        </div>
      )}

      <div className={styles.choices}>
        {choices.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => handleChoice(c)}
            className={`${styles.choiceBtn} ${
              feedback !== null
                ? (mode === 0 && c.id === target?.id) || (mode === 1 && c.sides === target?.correctAnswer) || (mode === 2 && c.id === target?.correctAnswer) || (mode === 3 && ((target?.askCurves && c.hasCurves) || (!target?.askCurves && c.corners > 0 && !c.hasCurves)))
                  ? styles.correct
                  : feedback === 'wrong'
                  ? styles.wrong
                  : ''
                : ''
            }`}
            disabled={feedback !== null}
          >
            {mode === 1 ? (
              <span className={styles.choiceEmoji} style={{ fontSize: '1.5rem', fontWeight: 800 }}>{c.sides}</span>
            ) : (
              <span className={styles.choiceEmoji}>
                {c.img ? <GameImage src={c.img} alt={c.label} size={48} /> : c.emoji}
              </span>
            )}
          </button>
        ))}
      </div>

      {feedback === 'correct' && (
        <p className={styles.feedbackOk}>{streak >= 3 ? '🔥 Shape Master!' : '✓ Correct!'}</p>
      )}
      {feedback === 'wrong' && (
        <div className={styles.feedbackBad}>
          <p>✗ The answer is <strong>{mode === 0 ? target?.label : mode === 1 ? target?.correctAnswer : mode === 2 ? target?.label : (target?.askCurves ? 'the curved shape' : 'the shape with corners')}</strong></p>
        </div>
      )}
    </div>
  );
}
