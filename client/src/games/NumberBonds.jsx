/**
 * Number Bonds - Find pairs of numbers that add up to a target.
 * Builds mental arithmetic and number sense.
 * Progressive: bonds to 5 → 10 → 15 → 20.
 */
import { useState, useEffect, useRef } from 'react';
import { useAudio } from '../context/AudioContext';
import { useTeaching } from './useTeaching';
import { useNoRepeat } from './useNoRepeat';
import { getRounds, getChoiceCount, getFeedbackDelay } from './levelConfig';
import styles from './GameCommon.module.css';

function getTargetMax(level) {
  if (level <= 5) return 5;
  if (level <= 10) return 10;
  if (level <= 15) return 15;
  return 20;
}

export default function NumberBonds({ onComplete, level = 1, childName }) {
  const { playSuccess, playWrong, playClick, playCelebration, speak } = useAudio();
  const { teachAfterAnswer, readQuestion } = useTeaching();
  const { generate } = useNoRepeat(level);
  const [round, setRound] = useState(0);
  const [target, setTarget] = useState(0);
  const [given, setGiven] = useState(0);
  const [options, setOptions] = useState([]);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [streak, setStreak] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [selected, setSelected] = useState(null);
  const [done, setDone] = useState(false);
  const completedRef = useRef(false);
  const ROUNDS = getRounds(level);
  const CHOICES = getChoiceCount(level);

  useEffect(() => {
    window.speechSynthesis?.cancel();
    if (round >= ROUNDS && !completedRef.current) {
      completedRef.current = true;
      setDone(true);
      playCelebration();
      onComplete(score, ROUNDS > 0 ? Math.round((correct / ROUNDS) * 100) : 0);
      return;
    }
    const maxT = getTargetMax(level);
    const { t, g } = generate(
      () => {
        const t = Math.floor(Math.random() * (maxT - 2)) + 3;
        const g = Math.floor(Math.random() * t);
        return { t, g };
      },
      (r) => `${r.t}-${r.g}`
    );
    const answer = t - g;
    const opts = new Set([answer]);
    while (opts.size < CHOICES) {
      const rnd = Math.floor(Math.random() * (maxT + 1));
      if (rnd !== answer) opts.add(rnd);
    }
    setTarget(t);
    setGiven(g);
    setOptions([...opts].sort(() => Math.random() - 0.5));
    setFeedback(null);
    setSelected(null);
    const cancelRead = readQuestion(g + ' plus what equals ' + t + '?');
    return cancelRead;
  }, [round]);

  function handleChoice(n) {
    if (feedback) return;
    playClick();
    setSelected(n);
    const answer = target - given;
    const isCorrect = n === answer;
    if (isCorrect) {
      const pts = 10 + (streak >= 2 ? 5 : 0);
      setScore(s => s + pts);
      setCorrect(c => c + 1);
      setStreak(s => s + 1);
      setFeedback({ type: 'correct', text: `${given} + ${answer} = ${target}! +${pts}` });
      playSuccess();
      teachAfterAnswer(true, { type: 'addition', answer: n, correctAnswer: answer, a: given, b: answer });
    } else {
      setWrong(w => w + 1);
      setStreak(0);
      setFeedback({ type: 'wrong', text: `Wrong! ${given} + ${answer} = ${target}` });
      playWrong();
      teachAfterAnswer(false, { type: 'addition', answer: n, correctAnswer: answer, a: given, b: answer });
    }
    const delay = getFeedbackDelay(level, isCorrect);
    setTimeout(() => setRound(r => r + 1), delay);
  }

  if (done) {
    const acc = ROUNDS > 0 ? Math.round((correct / ROUNDS) * 100) : 0;
    return (
      <div className={styles.container}>
        <div className={styles.celebration}>
          <span style={{ fontSize: '4rem' }}>🔗</span>
          <h2>Number Bond Pro, {childName || 'Math Star'}!</h2>
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
        {streak >= 2 && <span> · 🔥 {streak}</span>}
      </div>

      {/* Visual bond */}
      <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
        <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--primary)' }}>{target}</div>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', margin: '0.5rem 0' }}>
          <div style={{
            width: 56, height: 56, borderRadius: 12, background: 'var(--success)', color: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 900,
          }}>{given}</div>
          <span style={{ fontSize: '1.5rem', fontWeight: 900 }}>+</span>
          <div style={{
            width: 56, height: 56, borderRadius: 12, background: 'rgba(0,0,0,0.05)',
            border: '3px dashed var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 900,
          }}>?</div>
          <span style={{ fontSize: '1.5rem', fontWeight: 900 }}>=</span>
          <div style={{
            width: 56, height: 56, borderRadius: 12, background: 'var(--primary)', color: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 900,
          }}>{target}</div>
        </div>
      </div>

      <p className={styles.prompt}>{given} + ? = {target}</p>

      <div className={styles.choices}>
        {options.map(n => {
          let bg = 'transparent';
          let border = '3px solid var(--border)';
          if (feedback && selected === n) {
            bg = feedback.type === 'correct' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)';
            border = feedback.type === 'correct' ? '3px solid #22c55e' : '3px solid #ef4444';
          }
          if (feedback && feedback.type === 'wrong' && n === target - given) {
            bg = 'rgba(34,197,94,0.1)'; border = '3px solid #22c55e';
          }
          return (
            <button key={n} type="button" onClick={() => handleChoice(n)}
              className={`${styles.choiceBtn} ${styles.choiceNumber}`}
              disabled={feedback !== null}
              style={{ background: bg, border, transition: 'all 0.2s' }}>
              {n}
            </button>
          );
        })}
      </div>

      {feedback?.type === 'correct' && (
        <div className={styles.feedbackOk} style={{ marginTop: '0.5rem' }}>{feedback.text}</div>
      )}
      {feedback?.type === 'wrong' && (
        <div className={styles.feedbackBad} style={{ marginTop: '0.5rem' }}>
          <p>✗ The answer is <strong>{target - given}</strong></p>
        </div>
      )}
    </div>
  );
}
