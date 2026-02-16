/**
 * ConnectTheStars - Kids connect numbered stars in order by tapping them.
 * Level 1-5: 4 stars | 6-10: 6 | 11-15: 8 | 16+: 10
 * Grid-based random positions, SVG lines connecting tapped stars.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { useAudio } from '../context/AudioContext';
import { useTeaching } from './useTeaching';
import { useNoRepeat } from './useNoRepeat';
import { getRounds, getFeedbackDelay } from './levelConfig';
import styles from './GameCommon.module.css';

function getStarCount(level) {
  if (level <= 5) return 4;
  if (level <= 10) return 6;
  if (level <= 15) return 8;
  return 10;
}

// Grid-based positions: cols x rows, spread out
function getGridPositions(count) {
  const cols = count <= 4 ? 2 : count <= 6 ? 3 : count <= 8 ? 4 : 5;
  const rows = Math.ceil(count / cols);
  const positions = [];
  const pad = 0.12;
  const stepX = cols > 1 ? (1 - 2 * pad) / (cols - 1) : 0;
  const stepY = rows > 1 ? (1 - 2 * pad) / (rows - 1) : 0;
  for (let i = 0; i < count; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = pad + col * stepX + (Math.random() - 0.5) * 0.08;
    const y = pad + row * stepY + (Math.random() - 0.5) * 0.08;
    positions.push([Math.max(0.1, Math.min(0.9, x)), Math.max(0.1, Math.min(0.9, y))]);
  }
  return positions;
}

export default function ConnectTheStars({ onComplete, level = 1, childName, childAge }) {
  const { playSuccess, playWrong, playClick, playCelebration } = useAudio();
  const { teachAfterAnswer, readQuestion } = useTeaching();
  const { generate } = useNoRepeat();
  const containerRef = useRef(null);
  const [round, setRound] = useState(0);
  const [stars, setStars] = useState([]);
  const [nextNum, setNextNum] = useState(1);
  const [score, setScore] = useState(0);
  const [correctTaps, setCorrectTaps] = useState(0);
  const [totalTaps, setTotalTaps] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [wrongShake, setWrongShake] = useState(false);
  const [done, setDone] = useState(false);
  const completedRef = useRef(false);

  const ROUNDS = getRounds(level);
  const starCount = getStarCount(level);

  const loadRound = useCallback(() => {
    const positions = generate(
      () => getGridPositions(starCount),
      (p) => p.map(x => x.join(',')).join('|')
    );
    const shuffled = positions.map((pos, i) => ({ pos, num: i + 1 })).sort(() => Math.random() - 0.5);
    setStars(shuffled);
    setNextNum(1);
    setFeedback(null);
    setWrongShake(false);
  }, [starCount, generate]);

  useEffect(() => {
    window.speechSynthesis?.cancel();
    if (round >= ROUNDS && !completedRef.current) {
      completedRef.current = true;
      setDone(true);
      playCelebration();
      const accuracy = totalTaps > 0 ? Math.round((correctTaps / totalTaps) * 100) : 100;
      onComplete(score, accuracy);
      return;
    }
    loadRound();
    const cancel = readQuestion('Connect the stars! Start with number 1!');
    return cancel;
  }, [round, ROUNDS]);

  function handleStarClick(star) {
    if (feedback) return;
    setTotalTaps(t => t + 1);
    playClick();

    if (star.num !== nextNum) {
      playWrong();
      setWrongShake(true);
      setTimeout(() => setWrongShake(false), 400);
      setFeedback('wrong');
      teachAfterAnswer(false, { answer: star.num, correctAnswer: nextNum, extra: `Find number ${nextNum} next!` });
      const delay = getFeedbackDelay(level, false);
      setTimeout(() => setRound(r => r + 1), delay);
      return;
    }

    setCorrectTaps(c => c + 1);
    const newNext = nextNum + 1;
    setNextNum(newNext);

    if (newNext > stars.length) {
      setScore(s => s + 1);
      playSuccess();
      setFeedback('correct');
      teachAfterAnswer(true, { type: 'counting', correctAnswer: stars.length, extra: 'You connected all the stars!' });
      const delay = getFeedbackDelay(level, true);
      setTimeout(() => setRound(r => r + 1), delay);
    }
  }

  if (done) {
    const accuracy = totalTaps > 0 ? Math.round((correctTaps / totalTaps) * 100) : 100;
    return (
      <div className={styles.container}>
        <div className={styles.celebration}>
          <span style={{ fontSize: '4rem' }}>⭐</span>
          <h2>Star Connector!</h2>
          <p style={{ fontSize: '1.1rem', fontWeight: 700 }}>Score: {score}</p>
          <span style={{ color: 'var(--text-muted)', fontWeight: 800 }}>Accuracy: {accuracy}%</span>
        </div>
      </div>
    );
  }

  if (!stars.length) return null;

  const areaWidth = 320;
  const areaHeight = 260;

  return (
    <div className={styles.container}>
      <div className={styles.hud}>
        <span>Lv {level} · {round + 1}/{ROUNDS} · ✅ {score} · ⭐ {correctTaps}/{totalTaps}</span>
      </div>
      <p className={styles.prompt}>Connect the stars in order: 1, 2, 3...</p>
      <div
        ref={containerRef}
        className={`${styles.targetArea} ${wrongShake ? styles.shakeOnly : ''}`}
        style={{
          position: 'relative',
          width: areaWidth,
          height: areaHeight,
          margin: '0 auto',
        }}
      >
        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${areaWidth} ${areaHeight}`}
          preserveAspectRatio="xMidYMid meet"
          style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
        >
          {stars
            .filter(s => s.num < nextNum)
            .sort((a, b) => a.num - b.num)
            .map((s, i) => {
              const next = stars.find(st => st.num === s.num + 1);
              if (!next) return null;
              const [x1, y1] = [s.pos[0] * areaWidth, s.pos[1] * areaHeight];
              const [x2, y2] = [next.pos[0] * areaWidth, next.pos[1] * areaHeight];
              return (
                <line
                  key={`line-${s.num}`}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="var(--success)"
                  strokeWidth={4}
                  strokeLinecap="round"
                />
              );
            })}
        </svg>
        {stars.map((star) => {
          const isConnected = star.num < nextNum;
          const isNext = star.num === nextNum;
          const left = star.pos[0] * areaWidth;
          const top = star.pos[1] * areaHeight;
          return (
            <button
              key={star.num}
              type="button"
              onClick={() => handleStarClick(star)}
              disabled={!!feedback}
              className={styles.choiceBtn}
              style={{
                position: 'absolute',
                left: left - 30,
                top: top - 30,
                width: 60,
                height: 60,
                minWidth: 60,
                minHeight: 60,
                borderRadius: '50%',
                padding: 0,
                fontSize: '1.4rem',
                fontWeight: 900,
                background: isConnected ? 'var(--success)' : 'var(--card-bg)',
                borderColor: isNext ? 'var(--primary)' : 'var(--sky-blue)',
                borderWidth: isNext ? 4 : 3,
                boxShadow: isNext ? '0 0 20px rgba(56,189,248,0.4)' : undefined,
              }}
            >
              ⭐ {star.num}
            </button>
          );
        })}
      </div>
      {feedback && (
        <div className={feedback === 'correct' ? styles.feedbackOk : styles.feedbackBad}>
          {feedback === 'correct' ? '✓ All stars connected!' : `Not quite! Find number ${nextNum} next!`}
        </div>
      )}
    </div>
  );
}
