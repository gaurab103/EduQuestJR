import { useState, useEffect, useRef } from 'react';
import { useAudio } from '../context/AudioContext';
import { useTeaching } from './useTeaching';
import { useNoRepeat } from './useNoRepeat';
import { getRounds, getChoiceCount, getFeedbackDelay } from './levelConfig';
import styles from './GameCommon.module.css';

const COLORS = [
  { name: 'Red', hex: '#ef4444' },
  { name: 'Blue', hex: '#3b82f6' },
  { name: 'Green', hex: '#22c55e' },
  { name: 'Yellow', hex: '#eab308' },
  { name: 'Purple', hex: '#a855f7' },
  { name: 'Orange', hex: '#f97316' },
];

const COLOR_OBJECTS = [
  { object: 'banana', color: 'Yellow' },
  { object: 'sky', color: 'Blue' },
  { object: 'grass', color: 'Green' },
  { object: 'apple', color: 'Red' },
  { object: 'carrot', color: 'Orange' },
  { object: 'grape', color: 'Purple' },
  { object: 'sun', color: 'Yellow' },
  { object: 'leaf', color: 'Green' },
  { object: 'strawberry', color: 'Red' },
  { object: 'orange fruit', color: 'Orange' },
  { object: 'eggplant', color: 'Purple' },
  { object: 'ocean', color: 'Blue' },
  { object: 'fire', color: 'Red' },
  { object: 'tree', color: 'Green' },
  { object: 'sunflower', color: 'Yellow' },
  { object: 'plum', color: 'Purple' },
];

const COLOR_MIX = [
  { a: 'Red', b: 'Blue', result: 'Purple' },
  { a: 'Yellow', b: 'Blue', result: 'Green' },
  { a: 'Red', b: 'Yellow', result: 'Orange' },
  { a: 'Blue', b: 'Yellow', result: 'Green' },
  { a: 'Yellow', b: 'Red', result: 'Orange' },
  { a: 'Blue', b: 'Red', result: 'Purple' },
  { a: 'Red', b: 'Blue', result: 'Purple' },
  { a: 'Yellow', b: 'Blue', result: 'Green' },
  { a: 'Red', b: 'Yellow', result: 'Orange' },
];

function getMode(level, round) {
  if (level <= 5) return 0; // Tap the X color
  if (level <= 10) return round % 2; // 0: tap, 1: what color is X
  if (level <= 15) return round % 3; // 0: tap, 1: what color, 2: color mixing
  return round % 4; // add 3: which is NOT X
}

export default function TapTheColor({ onComplete, level = 1 }) {
  const { playSuccess, playWrong, playClick } = useAudio();
  const { teachAfterAnswer, readQuestion, getRecommendedDelayBeforeNext } = useTeaching();
  const { generate } = useNoRepeat(level);
  const [round, setRound] = useState(0);
  const [target, setTarget] = useState(null);
  const [options, setOptions] = useState([]);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [streak, setStreak] = useState(0);
  const [mode, setModeState] = useState(0);
  const [objectQuestion, setObjectQuestion] = useState(null);
  const [mixQuestion, setMixQuestion] = useState(null);
  const [notColorTarget, setNotColorTarget] = useState(null);
  const completedRef = useRef(false);
  const ROUNDS = getRounds(level);
  const CHOICE_COUNT = Math.min(getChoiceCount(level), COLORS.length);

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
      const targetColor = generate(
        () => {
          const pool = [...COLORS].sort(() => Math.random() - 0.5);
          return pool[0];
        },
        (r) => r.name
      );
      const pool = [targetColor, ...COLORS.filter(c => c.name !== targetColor.name)].sort(() => Math.random() - 0.5);
      const opts = pool.slice(0, CHOICE_COUNT);
      setTarget(targetColor);
      setOptions(opts.sort(() => Math.random() - 0.5));
      setObjectQuestion(null);
      setMixQuestion(null);
      setNotColorTarget(null);
      setFeedback(null);
      const cancelRead = readQuestion('Tap the color: ' + targetColor.name);
      return cancelRead;
    }

    if (m === 1) {
      const q = generate(
        () => COLOR_OBJECTS[Math.floor(Math.random() * COLOR_OBJECTS.length)],
        (r) => `${m}-${r.object}`
      );
      const targetColor = COLORS.find(c => c.name === q.color) || COLORS[0];
      const pool = [...COLORS].sort(() => Math.random() - 0.5);
      const opts = pool.slice(0, CHOICE_COUNT);
      if (!opts.some(o => o.name === targetColor.name)) opts[opts.length - 1] = targetColor;
      setTarget(targetColor);
      setOptions(opts.sort(() => Math.random() - 0.5));
      setObjectQuestion(q.object);
      setMixQuestion(null);
      setNotColorTarget(null);
      setFeedback(null);
      const cancelRead = readQuestion('What color is a ' + q.object + '?');
      return cancelRead;
    }

    if (m === 2) {
      const mix = generate(
        () => COLOR_MIX[Math.floor(Math.random() * COLOR_MIX.length)],
        (r) => `${m}-${r.a}-${r.b}`
      );
      const targetColor = COLORS.find(c => c.name === mix.result);
      const displayMix = mix.result.charAt(0).toUpperCase() + mix.result.slice(1);
      const pool = COLORS.filter(c => c.name !== mix.a && c.name !== mix.b);
      const opts = [targetColor || { name: displayMix, hex: mix.result === 'Purple' ? '#a855f7' : mix.result === 'Green' ? '#22c55e' : '#f97316' }, ...pool.slice(0, CHOICE_COUNT - 1)].filter(Boolean);
      const uniqueOpts = [];
      const seen = new Set();
      for (const o of opts) {
        if (!seen.has(o.name)) { seen.add(o.name); uniqueOpts.push(o); }
      }
      while (uniqueOpts.length < CHOICE_COUNT && pool.length > 0) {
        const p = pool.find(x => !seen.has(x.name));
        if (p) { seen.add(p.name); uniqueOpts.push(p); } else break;
      }
      setTarget(targetColor || { name: displayMix, hex: displayMix === 'Purple' ? '#a855f7' : displayMix === 'Green' ? '#22c55e' : '#f97316' });
      setOptions(uniqueOpts.sort(() => Math.random() - 0.5));
      setObjectQuestion(null);
      setMixQuestion({ a: mix.a, b: mix.b, result: displayMix });
      setNotColorTarget(null);
      setFeedback(null);
      const cancelRead = readQuestion('Mix ' + mix.a + ' and ' + mix.b + '. What color do you get?');
      return cancelRead;
    }

    if (m === 3) {
      const excludeColor = generate(
        () => COLORS[Math.floor(Math.random() * COLORS.length)],
        (r) => `${m}-${r.name}`
      );
      const others = COLORS.filter(c => c.name !== excludeColor.name);
      const opts = [excludeColor, ...others.slice(0, CHOICE_COUNT - 1)].sort(() => Math.random() - 0.5);
      setTarget(excludeColor);
      setOptions(opts);
      setObjectQuestion(null);
      setMixQuestion(null);
      setNotColorTarget(excludeColor);
      setFeedback(null);
      const cancelRead = readQuestion('Which of these is NOT ' + excludeColor.name + '?');
      return cancelRead;
    }

    setFeedback(null);
  }, [round, score, ROUNDS, CHOICE_COUNT, level]);

  function handleChoice(c) {
    if (feedback !== null) return;
    playClick();
    let correct = false;
    if (mode === 0 || mode === 1 || mode === 2) correct = c.name === target?.name;
    if (mode === 3) correct = c.name !== notColorTarget?.name;
    if (correct) {
      setScore((s) => s + 1);
      setStreak((s) => s + 1);
      playSuccess();
    } else {
      setStreak(0);
      playWrong();
    }
    setFeedback(correct ? 'correct' : 'wrong');
    const correctAns = mode === 3 ? 'any color except ' + notColorTarget?.name : target?.name;
    const ctx = { type: 'color', answer: c.name, correctAnswer: correctAns };
    if (mode === 1 && objectQuestion) ctx.object = objectQuestion;
    if (mode === 2 && mixQuestion) ctx.mix = mixQuestion;
    teachAfterAnswer(correct, ctx);
    const delay = getRecommendedDelayBeforeNext(getFeedbackDelay(level, correct));
    setTimeout(() => setRound((r) => r + 1), delay);
  }

  if (round >= ROUNDS) return <div className={styles.container}>Calculating your rewards…</div>;

  let promptText = '';
  if (mode === 0) promptText = 'Tap the color: ' + (target?.name || '');
  if (mode === 1) promptText = 'What color is a ' + (objectQuestion || '') + '?';
  if (mode === 2) promptText = mixQuestion ? `Mix ${mixQuestion.a} + ${mixQuestion.b} = ?` : '';
  if (mode === 3) promptText = 'Which is NOT ' + (notColorTarget?.name || '') + '?';

  return (
    <div className={styles.container}>
      <div className={styles.progress}>
        <span>Lv {level}</span>
        <span>·</span>
        <span>Round {round + 1} of {ROUNDS}</span>
        <span>·</span>
        <span>Score: {score}</span>
        {streak >= 2 && <span>· 🔥 {streak}</span>}
      </div>
      <p className={styles.prompt}>{promptText}</p>
      {mode === 2 && mixQuestion && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <span style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: COLORS.find(x => x.name === mixQuestion.a)?.hex || '#000' }} />
          <span style={{ fontSize: '1.5rem' }}>+</span>
          <span style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: COLORS.find(x => x.name === mixQuestion.b)?.hex || '#000' }} />
          <span style={{ fontSize: '1.5rem' }}>= ?</span>
        </div>
      )}
      <div className={styles.colorGrid}>
        {options.map((c) => (
          <button
            key={c.name}
            type="button"
            onClick={() => handleChoice(c)}
            className={`${styles.colorBtn} ${
              feedback !== null
                ? (mode <= 2 && c.name === target?.name) || (mode === 3 && c.name !== notColorTarget?.name)
                  ? styles.correct
                  : (mode <= 2 && c.name !== target?.name) || (mode === 3 && c.name === notColorTarget?.name)
                  ? styles.wrong
                  : ''
                : ''
            }`}
            style={{ backgroundColor: c.hex }}
            disabled={feedback !== null}
          />
        ))}
      </div>
      {feedback === 'correct' && (
        <p className={styles.feedbackOk}>{streak >= 3 ? '🔥 Color Master!' : '✓ Correct!'}</p>
      )}
      {feedback === 'wrong' && (
        <div className={styles.feedbackBad}>
          <p>✗ The answer is <strong>{mode === 3 ? 'any color except ' + notColorTarget?.name : target?.name}</strong></p>
        </div>
      )}
    </div>
  );
}
