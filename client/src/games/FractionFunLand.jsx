/**
 * Fraction Fun Land - PREMIUM
 * Unique mechanic: Visual fractions using pizza/pie slices. Kid taps
 * slices to shade the correct fraction, compares fractions side-by-side.
 * Different from NumberBonds (addition pairs) -- this teaches fractions.
 */
import { useState, useEffect, useRef } from 'react';
import { useAudio } from '../context/AudioContext';
import { useTeaching } from './useTeaching';
import { useNoRepeat } from './useNoRepeat';
import { getRounds, getChoiceCount, getFeedbackDelay } from './levelConfig';
import styles from './GameCommon.module.css';

const FRACTION_COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#eab308', '#a855f7', '#f97316'];

function getQuestionTypes(level) {
  if (level <= 5) return ['shade'];
  if (level <= 10) return ['shade', 'identify'];
  if (level <= 15) return ['shade', 'identify', 'compare'];
  return ['shade', 'identify', 'compare', 'equivalent'];
}

function getDenominators(level) {
  if (level <= 5) return [2];
  if (level <= 10) return [2, 3, 4];
  if (level <= 15) return [2, 3, 4, 6];
  return [2, 3, 4, 5, 6, 8];
}

function PieChart({ total, filled, size = 120, color = '#3b82f6', onSliceClick, interactive = false }) {
  const slices = [];
  for (let i = 0; i < total; i++) {
    const startAngle = (i / total) * 2 * Math.PI - Math.PI / 2;
    const endAngle = ((i + 1) / total) * 2 * Math.PI - Math.PI / 2;
    const r = size / 2 - 4;
    const cx = size / 2;
    const cy = size / 2;
    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    const largeArc = (endAngle - startAngle) > Math.PI ? 1 : 0;
    const d = total === 1
      ? `M${cx},${cy} m-${r},0 a${r},${r} 0 1,0 ${r * 2},0 a${r},${r} 0 1,0 -${r * 2},0`
      : `M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${largeArc},1 ${x2},${y2} Z`;
    const isFilled = typeof filled === 'object' ? filled.has(i) : i < filled;
    slices.push(
      <path
        key={i}
        d={d}
        fill={isFilled ? color : '#f3f4f6'}
        stroke="#333"
        strokeWidth={1.5}
        style={{ cursor: interactive ? 'pointer' : 'default', transition: 'fill 0.2s' }}
        onClick={() => interactive && onSliceClick?.(i)}
      />
    );
  }
  return (
    <svg viewBox={`0 0 ${size} ${size}`} style={{ width: size, height: size }}>
      {slices}
    </svg>
  );
}

function generateQuestion(types, denominators, choiceCount) {
  const type = types[Math.floor(Math.random() * types.length)];
  const denom = denominators[Math.floor(Math.random() * denominators.length)];
  const numer = Math.floor(Math.random() * denom) + 1;
  const color = FRACTION_COLORS[Math.floor(Math.random() * FRACTION_COLORS.length)];

  switch (type) {
    case 'shade':
      return {
        type: 'shade', numer, denom, color,
        prompt: `Color ${numer}/${denom} of the pie!`,
        key: `shade-${numer}/${denom}`,
      };
    case 'identify': {
      const options = [`${numer}/${denom}`];
      while (options.length < choiceCount) {
        const n = Math.floor(Math.random() * denom) + 1;
        const d = denominators[Math.floor(Math.random() * denominators.length)];
        const opt = `${n}/${d}`;
        if (!options.includes(opt)) options.push(opt);
      }
      return {
        type: 'identify', numer, denom, color,
        prompt: 'What fraction is shaded?',
        options: options.sort(() => Math.random() - 0.5),
        answer: `${numer}/${denom}`,
        key: `id-${numer}/${denom}`,
      };
    }
    case 'compare': {
      const denom2 = denominators[Math.floor(Math.random() * denominators.length)];
      const numer2 = Math.floor(Math.random() * denom2) + 1;
      const val1 = numer / denom;
      const val2 = numer2 / denom2;
      const answer = val1 > val2 ? 'Left' : val2 > val1 ? 'Right' : 'Same';
      return {
        type: 'compare', numer, denom, numer2, denom2, color,
        prompt: 'Which fraction is bigger?',
        options: ['Left', 'Right', 'Same'].slice(0, choiceCount),
        answer,
        key: `cmp-${numer}/${denom}-${numer2}/${denom2}`,
      };
    }
    case 'equivalent': {
      const mult = Math.floor(Math.random() * 2) + 2;
      const eqN = numer * mult;
      const eqD = denom * mult;
      const options = [`${eqN}/${eqD}`];
      while (options.length < choiceCount) {
        const n = Math.floor(Math.random() * 8) + 1;
        const d = Math.floor(Math.random() * 8) + 2;
        const opt = `${n}/${d}`;
        if (!options.includes(opt) && n / d !== numer / denom) options.push(opt);
      }
      return {
        type: 'equivalent', numer, denom, color,
        prompt: `Which fraction equals ${numer}/${denom}?`,
        options: options.sort(() => Math.random() - 0.5),
        answer: `${eqN}/${eqD}`,
        key: `eq-${numer}/${denom}-${eqN}/${eqD}`,
      };
    }
    default:
      return generateQuestion(['shade'], denominators, choiceCount);
  }
}

export default function FractionFunLand({ onComplete, level = 1, childName }) {
  const { playSuccess, playWrong, playClick } = useAudio();
  const { teachAfterAnswer, readQuestion, getRecommendedDelayBeforeNext } = useTeaching();
  const { generate } = useNoRepeat(level);
  const [round, setRound] = useState(0);
  const [question, setQuestion] = useState(null);
  const [selectedSlices, setSelectedSlices] = useState(new Set());
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const completedRef = useRef(false);
  const ROUNDS = getRounds(level);
  const choiceCount = getChoiceCount(level);

  useEffect(() => {
    window.speechSynthesis?.cancel();
    if (round >= ROUNDS && !completedRef.current) {
      completedRef.current = true;
      const accuracy = ROUNDS > 0 ? Math.round((correct / ROUNDS) * 100) : 0;
      onComplete(score, accuracy);
      return;
    }
    const types = getQuestionTypes(level);
    const denoms = getDenominators(level);
    const q = generate(() => generateQuestion(types, denoms, choiceCount), (q) => q.key);
    setQuestion(q);
    setSelectedSlices(new Set());
    setFeedback(null);
    const cancelRead = readQuestion(q.prompt);
    return cancelRead;
  }, [round]);

  function handleSliceClick(idx) {
    if (feedback || question.type !== 'shade') return;
    playClick();
    const newSet = new Set(selectedSlices);
    if (newSet.has(idx)) newSet.delete(idx);
    else newSet.add(idx);
    setSelectedSlices(newSet);
  }

  function handleSubmitShade() {
    if (feedback) return;
    const isCorrect = selectedSlices.size === question.numer;
    if (isCorrect) {
      setScore(s => s + 10);
      setCorrect(c => c + 1);
      playSuccess();
    } else {
      playWrong();
    }
    teachAfterAnswer(isCorrect, {
      type: 'math', correctAnswer: `${question.numer}/${question.denom}`,
      extra: `${question.numer}/${question.denom} means ${question.numer} out of ${question.denom} equal parts!`,
    });
    setFeedback(isCorrect ? 'correct' : 'wrong');
    setTimeout(() => setRound(r => r + 1), getRecommendedDelayBeforeNext(getFeedbackDelay(level, isCorrect)));
  }

  function handleChoiceClick(option) {
    if (feedback) return;
    playClick();
    const isCorrect = option === question.answer;
    if (isCorrect) {
      setScore(s => s + 10);
      setCorrect(c => c + 1);
      playSuccess();
    } else {
      playWrong();
    }
    const extra = question.type === 'compare'
      ? `${question.numer}/${question.denom} ${question.numer / question.denom > question.numer2 / question.denom2 ? '>' : question.numer / question.denom < question.numer2 / question.denom2 ? '<' : '='} ${question.numer2}/${question.denom2}`
      : `The fraction shown is ${question.answer}.`;
    teachAfterAnswer(isCorrect, { type: 'math', answer: option, correctAnswer: question.answer, extra });
    setFeedback(isCorrect ? 'correct' : 'wrong');
    setTimeout(() => setRound(r => r + 1), getRecommendedDelayBeforeNext(getFeedbackDelay(level, isCorrect)));
  }

  if (round >= ROUNDS) {
    const accuracy = ROUNDS > 0 ? Math.round((correct / ROUNDS) * 100) : 0;
    return (
      <div className={styles.container}>
        <div className={styles.celebration}>
          <h2>Fraction Star!</h2>
          <p style={{ fontSize: '1.1rem', fontWeight: 700 }}>Score: {score}</p>
          <span style={{ color: 'var(--text-muted)', fontWeight: 800 }}>Accuracy: {accuracy}%</span>
        </div>
      </div>
    );
  }

  if (!question) return null;

  return (
    <div className={styles.container}>
      <div className={styles.hud}>
        <span>Lv {level}</span><span>·</span>
        <span>{round + 1}/{ROUNDS}</span><span>·</span>
        <span>Score: {score}</span>
      </div>

      <p className={styles.prompt}>{question.prompt}</p>

      {/* Pie(s) */}
      <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', margin: '0.75rem 0', flexWrap: 'wrap' }}>
        {question.type === 'shade' && (
          <PieChart
            total={question.denom}
            filled={selectedSlices}
            color={question.color}
            interactive={!feedback}
            onSliceClick={handleSliceClick}
          />
        )}
        {question.type === 'identify' && (
          <PieChart total={question.denom} filled={question.numer} color={question.color} />
        )}
        {question.type === 'compare' && (
          <>
            <div style={{ textAlign: 'center' }}>
              <PieChart total={question.denom} filled={question.numer} color={question.color} size={100} />
              <p style={{ fontWeight: 800, marginTop: 4 }}>{question.numer}/{question.denom}</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <PieChart total={question.denom2} filled={question.numer2} color="#a855f7" size={100} />
              <p style={{ fontWeight: 800, marginTop: 4 }}>{question.numer2}/{question.denom2}</p>
            </div>
          </>
        )}
        {question.type === 'equivalent' && (
          <PieChart total={question.denom} filled={question.numer} color={question.color} />
        )}
      </div>

      {question.type === 'shade' && (
        <div style={{ margin: '0.5rem 0' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Tap slices to color them. You selected {selectedSlices.size}/{question.denom}
          </p>
          {!feedback && (
            <button type="button" onClick={handleSubmitShade} className={styles.choiceBtn}
              style={{ marginTop: '0.5rem', padding: '0.6rem 1.5rem', fontWeight: 800 }}>
              Check!
            </button>
          )}
        </div>
      )}

      {question.options && (
        <div className={styles.choices}>
          {question.options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => handleChoiceClick(opt)}
              disabled={!!feedback}
              className={`${styles.choiceBtn} ${
                feedback && opt === question.answer ? styles.correct : ''
              } ${feedback === 'wrong' && opt !== question.answer ? styles.wrong : ''}`}
            >
              {opt}
            </button>
          ))}
        </div>
      )}

      {feedback === 'correct' && <p className={styles.feedbackOk}>Correct!</p>}
      {feedback === 'wrong' && (
        <div className={styles.feedbackBad}>
          <p>The answer is <strong>{question.answer || `${question.numer}/${question.denom}`}</strong></p>
        </div>
      )}
    </div>
  );
}
