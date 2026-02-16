/**
 * Clock Time - Learn to tell time on analog and digital clocks.
 * Builds time-telling skills essential for daily life.
 * Progressive: hours only → half hours → quarters → 5-minute intervals.
 */
import { useState, useEffect, useRef } from 'react';
import { useAudio } from '../context/AudioContext';
import { getRounds, getChoiceCount, getFeedbackDelay } from './levelConfig';
import { useTeaching } from './useTeaching';
import styles from './GameCommon.module.css';

function generateTime(level) {
  const h = Math.floor(Math.random() * 12) + 1;
  let m = 0;
  if (level <= 5) m = 0;
  else if (level <= 10) m = [0, 30][Math.floor(Math.random() * 2)];
  else if (level <= 15) m = [0, 15, 30, 45][Math.floor(Math.random() * 4)];
  else m = Math.floor(Math.random() * 12) * 5;
  return { h, m };
}

function formatTime(h, m) {
  return `${h}:${m.toString().padStart(2, '0')}`;
}

function ClockFace({ h, m, size = 160 }) {
  const cx = size / 2, cy = size / 2, r = size * 0.42;
  const hourAngle = ((h % 12) + m / 60) * 30 - 90;
  const minAngle = m * 6 - 90;
  const hLen = r * 0.55, mLen = r * 0.78;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block', margin: '0 auto' }}>
      <circle cx={cx} cy={cy} r={r + 8} fill="white" stroke="var(--primary)" strokeWidth="4" />
      {/* Hour markers */}
      {Array.from({ length: 12 }, (_, i) => {
        const angle = (i * 30 - 60) * Math.PI / 180;
        const x = cx + (r - 8) * Math.cos(angle);
        const y = cy + (r - 8) * Math.sin(angle);
        return (
          <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="central"
            fontSize={size * 0.09} fontWeight="800" fill="var(--text)">
            {i + 1}
          </text>
        );
      })}
      {/* Minute hand */}
      <line x1={cx} y1={cy}
        x2={cx + mLen * Math.cos(minAngle * Math.PI / 180)}
        y2={cy + mLen * Math.sin(minAngle * Math.PI / 180)}
        stroke="var(--primary)" strokeWidth="3" strokeLinecap="round" />
      {/* Hour hand */}
      <line x1={cx} y1={cy}
        x2={cx + hLen * Math.cos(hourAngle * Math.PI / 180)}
        y2={cy + hLen * Math.sin(hourAngle * Math.PI / 180)}
        stroke="var(--text)" strokeWidth="4" strokeLinecap="round" />
      <circle cx={cx} cy={cy} r="5" fill="var(--text)" />
    </svg>
  );
}

export default function ClockTime({ onComplete, level = 1, childName }) {
  const { playSuccess, playWrong, playClick, playCelebration } = useAudio();
  const { teachAfterAnswer, readQuestion } = useTeaching();
  const [round, setRound] = useState(0);
  const [time, setTime] = useState({ h: 12, m: 0 });
  const [options, setOptions] = useState([]);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [selected, setSelected] = useState(null);
  const [done, setDone] = useState(false);
  const completedRef = useRef(false);
  const ROUNDS = getRounds(level);
  const CHOICES = getChoiceCount(level);
  const delay = getFeedbackDelay(level);

  useEffect(() => {
    if (round >= ROUNDS && !completedRef.current) {
      completedRef.current = true;
      setDone(true);
      playCelebration();
      onComplete(score, ROUNDS > 0 ? Math.round((correct / ROUNDS) * 100) : 0);
      return;
    }
    const t = generateTime(level);
    const correctAnswer = formatTime(t.h, t.m);
    const opts = new Set([correctAnswer]);
    while (opts.size < CHOICES) {
      const fake = generateTime(level);
      opts.add(formatTime(fake.h, fake.m));
    }
    setTime(t);
    setOptions([...opts].sort(() => Math.random() - 0.5));
    setFeedback(null);
    setSelected(null);
    const cancelRead = readQuestion('What time does the clock show?');
    return cancelRead;
  }, [round]);

  function handleChoice(answer) {
    if (feedback) return;
    playClick();
    setSelected(answer);
    const correctAnswer = formatTime(time.h, time.m);
    const isCorrect = answer === correctAnswer;
    if (isCorrect) {
      setScore(s => s + 10);
      setCorrect(c => c + 1);
      setFeedback({ type: 'correct', text: `Correct! It's ${correctAnswer}!` });
      playSuccess();
      teachAfterAnswer(true, { type: 'math', correctAnswer, extra: 'Clocks help us know what time it is!' });
    } else {
      setWrong(w => w + 1);
      setFeedback({ type: 'wrong', text: `Not quite! It's ${correctAnswer}.` });
      playWrong();
      teachAfterAnswer(false, { type: 'math', correctAnswer, extra: 'Clocks help us know what time it is!' });
    }
    setTimeout(() => setRound(r => r + 1), delay);
  }

  if (done) {
    const acc = ROUNDS > 0 ? Math.round((correct / ROUNDS) * 100) : 0;
    return (
      <div className={styles.container}>
        <div className={styles.celebration}>
          <span style={{ fontSize: '4rem' }}>🕐</span>
          <h2>Time Keeper, {childName || 'Clock Pro'}!</h2>
          <p style={{ fontSize: '1.1rem', fontWeight: 700 }}>Score: {score}</p>
          <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', margin: '0.5rem 0' }}>
            <span style={{ color: '#22c55e', fontWeight: 800 }}>✅ {correct}</span>
            <span style={{ color: '#ef4444', fontWeight: 800 }}>❌ {wrong}</span>
          </div>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Accuracy: {acc}%</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.hud}>
        <span>Lv {level} · {round + 1}/{ROUNDS} · ✅ {correct} · ❌ {wrong} · ⭐ {score}</span>
      </div>
      <p className={styles.prompt}>What time is it?</p>

      <ClockFace h={time.h} m={time.m} size={180} />

      <div className={styles.choices} style={{ marginTop: '1rem' }}>
        {options.map(opt => {
          let bg = 'transparent';
          let border = '3px solid var(--border)';
          if (feedback && selected === opt) {
            bg = feedback.type === 'correct' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)';
            border = feedback.type === 'correct' ? '3px solid #22c55e' : '3px solid #ef4444';
          }
          const correctAnswer = formatTime(time.h, time.m);
          if (feedback && feedback.type === 'wrong' && opt === correctAnswer) {
            bg = 'rgba(34,197,94,0.1)'; border = '3px solid #22c55e';
          }
          return (
            <button key={opt} type="button" onClick={() => handleChoice(opt)}
              className={`${styles.choiceBtn} ${styles.choiceNumber}`}
              disabled={feedback !== null}
              style={{ background: bg, border, fontSize: '1.1rem', fontWeight: 800, minWidth: 80 }}>
              {opt}
            </button>
          );
        })}
      </div>

      {feedback && (
        <div className={feedback.type === 'correct' ? styles.feedbackOk : styles.feedbackBad}
          style={{ marginTop: '0.5rem' }}>{feedback.text}</div>
      )}
    </div>
  );
}
