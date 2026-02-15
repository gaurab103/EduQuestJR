/**
 * Sight Words - Recognize common sight words quickly.
 * Builds reading fluency and word recognition.
 * Progressive: easier words → harder words, more distractors.
 */
import { useState, useEffect, useRef } from 'react';
import { useAudio } from '../context/AudioContext';
import { getRounds, getChoiceCount, getFeedbackDelay } from './levelConfig';
import styles from './GameCommon.module.css';

const EASY = ['the','and','is','it','to','in','on','up','go','me','my','no','do','so','he','we','am','at'];
const MEDIUM = ['they','this','have','from','with','said','what','were','when','your','each','been','come','make','like'];
const HARD = ['about','their','could','would','there','these','other','which','water','first','after','where','think','right'];

function getPool(level) {
  if (level <= 8) return EASY;
  if (level <= 18) return MEDIUM;
  return HARD;
}

export default function SightWords({ onComplete, level = 1, childName }) {
  const { playSuccess, playWrong, playClick, playCelebration, speak } = useAudio();
  const [round, setRound] = useState(0);
  const [target, setTarget] = useState('');
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
  const delay = getFeedbackDelay(level);

  useEffect(() => {
    if (round >= ROUNDS && !completedRef.current) {
      completedRef.current = true;
      setDone(true);
      playCelebration();
      onComplete(score, ROUNDS > 0 ? Math.round((correct / ROUNDS) * 100) : 0);
      return;
    }
    const pool = getPool(level);
    const t = pool[Math.floor(Math.random() * pool.length)];
    const opts = new Set([t]);
    while (opts.size < CHOICES) opts.add(pool[Math.floor(Math.random() * pool.length)]);
    setTarget(t);
    setOptions([...opts].sort(() => Math.random() - 0.5));
    setFeedback(null);
    setSelected(null);
    speak(`Find the word: ${t}`);
  }, [round]);

  function handleChoice(w) {
    if (feedback) return;
    playClick();
    setSelected(w);
    const isCorrect = w === target;
    if (isCorrect) {
      const pts = 10 + (streak >= 2 ? 5 : 0);
      setScore(s => s + pts);
      setCorrect(c => c + 1);
      setStreak(s => s + 1);
      setFeedback({ type: 'correct', text: `Correct! "${target}" +${pts}` });
      playSuccess();
    } else {
      setWrong(wr => wr + 1);
      setStreak(0);
      setFeedback({ type: 'wrong', text: `Wrong! The word was "${target}".` });
      playWrong();
    }
    setTimeout(() => setRound(r => r + 1), delay);
  }

  if (done) {
    const acc = ROUNDS > 0 ? Math.round((correct / ROUNDS) * 100) : 0;
    return (
      <div className={styles.container}>
        <div className={styles.celebration}>
          <span style={{ fontSize: '4rem' }}>📖</span>
          <h2>Reading Star, {childName || 'Reader'}!</h2>
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
      <p className={styles.prompt}>Find the word:</p>
      <div className={styles.targetArea}>
        <span style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--primary)', letterSpacing: '3px' }}>{target}</span>
      </div>
      <div className={styles.choices}>
        {options.map(w => {
          let bg = 'transparent';
          let border = '3px solid var(--border)';
          if (feedback && selected === w) {
            bg = feedback.type === 'correct' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)';
            border = feedback.type === 'correct' ? '3px solid #22c55e' : '3px solid #ef4444';
          }
          if (feedback && feedback.type === 'wrong' && w === target) {
            bg = 'rgba(34,197,94,0.1)'; border = '3px solid #22c55e';
          }
          return (
            <button key={w} type="button" onClick={() => handleChoice(w)}
              className={styles.choiceBtn} disabled={feedback !== null}
              style={{ background: bg, border, fontSize: '1.2rem', fontWeight: 800, minWidth: 100 }}>
              {w}
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
