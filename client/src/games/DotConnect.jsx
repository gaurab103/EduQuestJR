/**
 * Dot Connect - Numbered dots scattered on screen.
 * Kid taps them in order (1, 2, 3...) to reveal a shape.
 * Teaches counting and fine motor control. Motor / Free
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { useAudio } from '../context/AudioContext';
import { useNoRepeat } from './useNoRepeat';
import { getRounds, getFeedbackDelay, getMaxNumber } from './levelConfig';
import { useTeaching } from './useTeaching';
import styles from './GameCommon.module.css';

const TWEMOJI = (cp) => `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/${cp}.svg`;

// Pre-defined dot layouts: [x%, y%] for each number
const DOT_SHAPES = [
  [[20, 25], [80, 25], [50, 75]],
  [[15, 20], [85, 20], [50, 50], [25, 85], [75, 85]],
  [[50, 10], [25, 50], [75, 50], [25, 90], [75, 90]],
  [[20, 30], [80, 30], [20, 70], [80, 70], [50, 50]],
  [[50, 5], [15, 50], [85, 50], [30, 90], [70, 90]],
  [[25, 20], [75, 20], [15, 60], [85, 60], [50, 85]],
  [[50, 10], [20, 40], [80, 40], [20, 75], [80, 75], [50, 95]],
  [[15, 15], [85, 15], [50, 35], [20, 65], [80, 65], [50, 85]],
  [[30, 10], [70, 10], [15, 50], [85, 50], [30, 90], [70, 90]],
  [[50, 5], [20, 35], [80, 35], [20, 70], [80, 70], [50, 95]],
  [[25, 15], [75, 15], [15, 45], [85, 45], [25, 75], [75, 75], [50, 50]],
  [[50, 8], [25, 30], [75, 30], [20, 60], [80, 60], [30, 88], [70, 88]],
];

const COUNTING_FACTS = [
  (n) => `You connected ${n} dots! Counting in order helps your brain.`,
  (n) => `${n} dots! Can you count to ${n} on your fingers?`,
  (n) => `Great! ${n} is ${n > 1 ? n - 1 + ' plus 1' : 'the first number'}.`,
  (n) => `Numbers go in order: 1, 2, 3... all the way to ${n}!`,
  (n) => `Connecting dots helps with hand-eye coordination!`,
];

export default function DotConnect({ onComplete, level = 1, childAge }) {
  const { playSuccess, playWrong, playClick, playCelebration } = useAudio();
  const { teachAfterAnswer, readQuestion } = useTeaching();
  const { generate } = useNoRepeat();
  const [round, setRound] = useState(0);
  const [dots, setDots] = useState([]);
  const [nextNum, setNextNum] = useState(1);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [done, setDone] = useState(false);
  const completedRef = useRef(false);
  const ROUNDS = getRounds(level);
  const maxNum = Math.min(getMaxNumber(level), 12);
  const dotCount = Math.min(Math.max(3, Math.floor(maxNum * 0.6)), 12);

  const loadRound = useCallback(() => {
    const shapePool = DOT_SHAPES.filter(s => s.length >= dotCount);
    const shape = generate(
      () => (shapePool.length ? shapePool[Math.floor(Math.random() * shapePool.length)] : DOT_SHAPES[DOT_SHAPES.length - 1]).slice(0, dotCount),
      (r) => r.map(p => p.join(',')).join('|')
    );
    const positions = shape;
    const shuffled = positions.map((pos, i) => ({ pos, num: i + 1 })).sort(() => Math.random() - 0.5);
    setDots(shuffled);
    setNextNum(1);
    setFeedback(null);
  }, [dotCount, generate]);

  useEffect(() => {
    window.speechSynthesis?.cancel();
    if (round >= ROUNDS && !completedRef.current) {
      completedRef.current = true;
      setDone(true);
      playCelebration();
      const accuracy = ROUNDS > 0 ? Math.round((correct / ROUNDS) * 100) : 0;
      onComplete(score, accuracy);
      return;
    }
    loadRound();
  }, [round, ROUNDS, correct, score]);

  useEffect(() => {
    if (dots.length && round < ROUNDS) {
      const cancelRead = readQuestion(`Tap the dots in order from 1 to ${dots.length}!`);
      return cancelRead;
    }
  }, [dots, round, ROUNDS]);

  function handleDotClick(dot) {
    if (feedback) return;
    playClick();
    if (dot.num !== nextNum) {
      playWrong();
      setFeedback('wrong');
      teachAfterAnswer(false, { type: 'counting', answer: dot.num, correctAnswer: nextNum, extra: COUNTING_FACTS[Math.floor(Math.random() * COUNTING_FACTS.length)](nextNum) });
      const delay = getFeedbackDelay(level, false);
      setTimeout(() => setRound(r => r + 1), delay);
      return;
    }
    const newNext = nextNum + 1;
    setNextNum(newNext);
    if (newNext > dots.length) {
      setScore(s => s + 10);
      setCorrect(c => c + 1);
      playSuccess();
      setFeedback('correct');
      teachAfterAnswer(true, { type: 'counting', answer: dot.num, correctAnswer: dot.num, extra: COUNTING_FACTS[Math.floor(Math.random() * COUNTING_FACTS.length)](dots.length) });
      const delay = getFeedbackDelay(level, true);
      setTimeout(() => setRound(r => r + 1), delay);
    }
  }

  if (done) {
    const accuracy = ROUNDS > 0 ? Math.round((correct / ROUNDS) * 100) : 0;
    return (
      <div className={styles.container}>
        <div className={styles.celebration}>
          <img src={TWEMOJI('1f4ca')} alt="" style={{ width: 80, height: 80 }} />
          <h2>Dot Master!</h2>
          <p style={{ fontSize: '1.1rem', fontWeight: 700 }}>Score: {score}</p>
          <span style={{ color: 'var(--text-muted)', fontWeight: 800 }}>Accuracy: {accuracy}%</span>
        </div>
      </div>
    );
  }

  if (!dots.length) return null;

  return (
    <div className={styles.container}>
      <div className={styles.hud}>
        <span>Lv {level} · {round + 1}/{ROUNDS} · ✅ {correct} · ⭐ {score}</span>
      </div>
      <p className={styles.prompt}>Tap the dots in order: 1, 2, 3...</p>
      <div className={styles.targetArea} style={{ position: 'relative', width: '100%', maxWidth: 320, height: 220, margin: '0 auto' }}>
        {dots.map((dot) => {
          const isConnected = dot.num < nextNum;
          const isNext = dot.num === nextNum;
          return (
            <button
              key={dot.num}
              type="button"
              onClick={() => handleDotClick(dot)}
              disabled={!!feedback}
              className={styles.choiceBtn}
              style={{
                position: 'absolute',
                left: `${dot.pos[0]}%`,
                top: `${dot.pos[1]}%`,
                transform: 'translate(-50%, -50%)',
                width: 48,
                height: 48,
                minWidth: 48,
                minHeight: 48,
                borderRadius: '50%',
                padding: 0,
                background: isConnected ? 'var(--success)' : 'var(--card-bg)',
                borderColor: isNext ? 'var(--primary)' : 'var(--sky-blue)',
                borderWidth: isNext ? 4 : 3,
                boxShadow: isNext ? '0 0 20px rgba(56,189,248,0.4)' : undefined,
                fontWeight: 900,
                fontSize: '1.1rem',
              }}
            >
              {dot.num}
            </button>
          );
        })}
      </div>
      {feedback && (
        <div className={feedback === 'correct' ? styles.feedbackOk : styles.feedbackBad}>
          {feedback === 'correct' ? '✓ Shape complete!' : `Tap number ${nextNum} next!`}
        </div>
      )}
    </div>
  );
}
