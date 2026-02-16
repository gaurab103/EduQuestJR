/**
 * NumberLine - UNIQUE drag-slider mechanic.
 * Kid drags a marker along a visual number line to place it at the correct position.
 * Different from MissingNumber (tap from multiple choices) -- this uses DRAG/SLIDER input.
 * Numeracy / Free
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import styles from './GameCommon.module.css';
import { useAudio } from '../context/AudioContext';
import { getRounds, getFeedbackDelay, getMaxNumber } from './levelConfig';
import { useTeaching } from './useTeaching';
import { useNoRepeat } from './useNoRepeat';

function getQuestionType(level, round) {
  if (level <= 5) return 'place';
  if (level <= 10) return round % 2 === 0 ? 'place' : 'between';
  if (level <= 15) return round % 3 === 0 ? 'place' : round % 3 === 1 ? 'between' : 'estimate';
  return ['place', 'between', 'estimate', 'closest'][round % 4];
}

export default function NumberLine({ onComplete, level = 1, childAge }) {
  const { playSuccess, playWrong, playClick } = useAudio();
  const { teachAfterAnswer, readQuestion } = useTeaching();
  const { generate } = useNoRepeat();
  const [round, setRound] = useState(0);
  const [qType, setQType] = useState('place');
  const [rangeMin, setRangeMin] = useState(0);
  const [rangeMax, setRangeMax] = useState(10);
  const [target, setTarget] = useState(5);
  const [sliderVal, setSliderVal] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [prompt, setPrompt] = useState('');
  const completedRef = useRef(false);
  const lineRef = useRef(null);
  const dragging = useRef(false);
  const ROUNDS = getRounds(level);
  const MAX = getMaxNumber(level);

  useEffect(() => {
    window.speechSynthesis?.cancel();
    if (round >= ROUNDS && !completedRef.current) {
      completedRef.current = true;
      const accuracy = ROUNDS > 0 ? Math.round((correct / ROUNDS) * 100) : 0;
      onComplete(score, accuracy);
      return;
    }

    const type = getQuestionType(level, round);
    setQType(type);

    const q = generate(() => {
      const rMin = Math.floor(Math.random() * Math.max(1, MAX - 10));
      const rMax = rMin + Math.max(5, Math.min(20, MAX - rMin));
      const ans = rMin + 1 + Math.floor(Math.random() * (rMax - rMin - 1));
      return { rMin, rMax, ans };
    }, (q) => `${type}-${q.rMin}-${q.rMax}-${q.ans}`);

    setRangeMin(q.rMin);
    setRangeMax(q.rMax);
    setTarget(q.ans);
    setSliderVal(q.rMin);
    setSubmitted(false);
    setFeedback(null);

    let p;
    switch (type) {
      case 'place':
        p = `Drag the marker to ${q.ans} on the number line!`;
        break;
      case 'between':
        p = `Place the marker between ${q.ans - 1} and ${q.ans + 1}!`;
        break;
      case 'estimate':
        p = `Where does ${q.ans} go on the line?`;
        break;
      case 'closest':
        p = `Put the marker as close to ${q.ans} as you can!`;
        break;
      default:
        p = `Find ${q.ans} on the number line!`;
    }
    setPrompt(p);
    const cancelRead = readQuestion(p);
    return cancelRead;
  }, [round]);

  const getValFromEvent = useCallback((clientX) => {
    if (!lineRef.current) return rangeMin;
    const rect = lineRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const val = Math.round(rangeMin + pct * (rangeMax - rangeMin));
    return val;
  }, [rangeMin, rangeMax]);

  const handlePointerDown = useCallback((e) => {
    if (submitted) return;
    dragging.current = true;
    setSliderVal(getValFromEvent(e.clientX));
  }, [submitted, getValFromEvent]);

  const handlePointerMove = useCallback((e) => {
    if (!dragging.current || submitted) return;
    setSliderVal(getValFromEvent(e.clientX));
  }, [submitted, getValFromEvent]);

  const handlePointerUp = useCallback(() => {
    dragging.current = false;
  }, []);

  useEffect(() => {
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [handlePointerMove, handlePointerUp]);

  function handleSubmit() {
    if (submitted) return;
    playClick();
    setSubmitted(true);

    const diff = Math.abs(sliderVal - target);
    const tolerance = Math.max(1, Math.floor((rangeMax - rangeMin) * 0.1));
    const isCorrect = diff <= tolerance;
    const isExact = diff === 0;

    if (isCorrect) {
      setScore(s => s + (isExact ? 10 : 7));
      setCorrect(c => c + 1);
      playSuccess();
      setFeedback('correct');
      teachAfterAnswer(true, {
        type: 'counting', correctAnswer: target,
        extra: isExact
          ? `Perfect! ${target} is exactly right on the number line!`
          : `Close enough! You put ${sliderVal}, the answer was ${target}. Great estimation!`,
      });
    } else {
      playWrong();
      setFeedback('wrong');
      teachAfterAnswer(false, {
        type: 'counting', answer: sliderVal, correctAnswer: target,
        extra: `${target} goes here on the number line. It is ${target - rangeMin} away from ${rangeMin}.`,
      });
    }
    const delay = getFeedbackDelay(level, isCorrect);
    setTimeout(() => setRound(r => r + 1), delay);
  }

  if (round >= ROUNDS) {
    const accuracy = ROUNDS > 0 ? Math.round((correct / ROUNDS) * 100) : 0;
    return (
      <div className={styles.container}>
        <div className={styles.celebration}>
          <h2>Number Line Pro!</h2>
          <p style={{ fontSize: '1.1rem', fontWeight: 700 }}>Score: {score}</p>
          <span style={{ color: 'var(--text-muted)', fontWeight: 800 }}>Accuracy: {accuracy}%</span>
        </div>
      </div>
    );
  }

  const pct = rangeMax > rangeMin
    ? ((sliderVal - rangeMin) / (rangeMax - rangeMin)) * 100
    : 0;
  const targetPct = rangeMax > rangeMin
    ? ((target - rangeMin) / (rangeMax - rangeMin)) * 100
    : 0;

  const ticks = [];
  const step = Math.max(1, Math.floor((rangeMax - rangeMin) / 10));
  for (let i = rangeMin; i <= rangeMax; i += step) {
    ticks.push(i);
  }
  if (!ticks.includes(rangeMax)) ticks.push(rangeMax);

  return (
    <div className={styles.container}>
      <div className={styles.hud}>
        <span>Lv {level}</span><span>·</span>
        <span>{round + 1}/{ROUNDS}</span><span>·</span>
        <span>Score: {score}</span>
      </div>

      <p className={styles.prompt}>{prompt}</p>

      {/* Slider value display */}
      <div style={{
        fontSize: '2rem', fontWeight: 800, margin: '0.5rem 0',
        color: 'var(--primary)',
      }}>
        {sliderVal}
      </div>

      {/* Number line with drag */}
      <div
        ref={lineRef}
        onPointerDown={handlePointerDown}
        style={{
          position: 'relative', width: '100%', maxWidth: 360,
          height: 60, margin: '1rem auto', cursor: submitted ? 'default' : 'pointer',
          touchAction: 'none', userSelect: 'none',
        }}
      >
        {/* Track */}
        <div style={{
          position: 'absolute', top: 24, left: 0, right: 0, height: 6,
          background: 'var(--card-border)', borderRadius: 3,
        }} />

        {/* Correct answer indicator (shown after submit) */}
        {submitted && (
          <div style={{
            position: 'absolute', top: 14, left: `${targetPct}%`,
            transform: 'translateX(-50%)',
            width: 18, height: 18, borderRadius: '50%',
            background: '#22c55e', border: '2.5px solid #fff',
            boxShadow: '0 2px 8px rgba(34,197,94,0.4)',
            zIndex: 3,
          }} />
        )}

        {/* Slider thumb */}
        <div style={{
          position: 'absolute', top: 10, left: `${pct}%`,
          transform: 'translateX(-50%)',
          width: 28, height: 28, borderRadius: '50%',
          background: feedback === 'correct' ? '#22c55e' : feedback === 'wrong' ? '#ef4444' : 'var(--primary)',
          border: '3px solid #fff',
          boxShadow: `0 2px 12px ${feedback === 'correct' ? 'rgba(34,197,94,0.5)' : feedback === 'wrong' ? 'rgba(239,68,68,0.5)' : 'rgba(56,189,248,0.5)'}`,
          zIndex: 5,
          transition: submitted ? 'background 0.3s' : 'none',
        }} />

        {/* Tick marks */}
        {ticks.map(n => {
          const tickPct = ((n - rangeMin) / (rangeMax - rangeMin)) * 100;
          return (
            <div key={n} style={{
              position: 'absolute', top: 32, left: `${tickPct}%`,
              transform: 'translateX(-50%)', textAlign: 'center',
            }}>
              <div style={{ width: 2, height: 8, background: 'var(--text-muted)', margin: '0 auto' }} />
              <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)' }}>{n}</span>
            </div>
          );
        })}
      </div>

      {/* Submit button */}
      {!submitted && (
        <button
          type="button"
          onClick={handleSubmit}
          className={styles.choiceBtn}
          style={{
            padding: '0.7rem 2rem', fontWeight: 800, fontSize: '1rem',
            background: 'linear-gradient(135deg, var(--primary), #8b5cf6)',
            color: '#fff', border: 'none', marginTop: '0.5rem',
          }}
        >
          Place it here!
        </button>
      )}

      {feedback === 'correct' && <p className={styles.feedbackOk}>Great placement!</p>}
      {feedback === 'wrong' && (
        <div className={styles.feedbackBad}>
          <p>The answer was <strong>{target}</strong></p>
        </div>
      )}
    </div>
  );
}
