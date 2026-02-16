/**
 * Pattern Master - Complete the pattern game.
 * Progressive difficulty: simple AB patterns → complex sequences → multi-symbol patterns.
 * Full audio feedback and scoring with clear right/wrong.
 */
import { useState, useEffect, useRef } from 'react';
import { useAudio } from '../context/AudioContext';
import { useTeaching } from './useTeaching';
import { useNoRepeat } from './useNoRepeat';
import { getRounds, getChoiceCount, getFeedbackDelay } from './levelConfig';
import styles from './GameCommon.module.css';

const ITEMS = ['🔴', '🔵', '🟢', '⭐', '❤️', '🌟', '🟡', '🔺', '🟣', '💎'];

function getPatternLength(level) {
  if (level <= 5) return 4;    // AB AB ?
  if (level <= 10) return 5;   // ABC AB ?
  if (level <= 15) return 6;   // ABCABC ?
  return 7;
}

function getPatternType(level) {
  if (level <= 5) return 2;    // 2-symbol pattern
  if (level <= 10) return 3;   // 3-symbol pattern
  if (level <= 20) return 3;
  return 4;
}

function buildPattern(level) {
  const patLen = getPatternLength(level);
  const symbols = getPatternType(level);
  const pool = [...ITEMS].sort(() => Math.random() - 0.5).slice(0, symbols);
  const pattern = [];
  for (let i = 0; i < patLen; i++) {
    pattern.push(pool[i % pool.length]);
  }
  // The answer is the next item in the pattern
  const answer = pool[patLen % pool.length];
  return { pattern, answer };
}

export default function PatternMaster({ onComplete, level = 1, childName }) {
  const { playSuccess, playWrong, playClick, playCelebration, speak } = useAudio();
  const { teachAfterAnswer, readQuestion } = useTeaching();
  const { generate } = useNoRepeat();
  const [round, setRound] = useState(0);
  const [pattern, setPattern] = useState([]);
  const [answer, setAnswer] = useState(null);
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
  const CHOICE_COUNT = getChoiceCount(level);

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
    const { pattern: p, answer: a } = generate(
      () => buildPattern(level),
      (r) => r.pattern.join('')
    );
    const opts = new Set([a]);
    while (opts.size < CHOICE_COUNT) {
      opts.add(ITEMS[Math.floor(Math.random() * ITEMS.length)]);
    }
    setPattern(p);
    setAnswer(a);
    setOptions([...opts].sort(() => Math.random() - 0.5));
    setFeedback(null);
    setSelected(null);
    const cancelRead = readQuestion('What comes next in the pattern?');
    return cancelRead;
  }, [round, ROUNDS, CHOICE_COUNT, level]);

  function handleChoice(choice) {
    if (feedback !== null) return;
    playClick();
    setSelected(choice);
    const isCorrect = choice === answer;

    if (isCorrect) {
      const streakBonus = streak >= 2 ? 5 : 0;
      const points = 10 + streakBonus;
      setScore(s => s + points);
      setCorrect(c => c + 1);
      setStreak(s => s + 1);
      setFeedback({ type: 'correct', points });
      playSuccess();
      speak(streak >= 2 ? 'Amazing streak!' : 'Correct!');
      teachAfterAnswer(true, { type: 'sequence', correctAnswer: answer, extra: 'The pattern continues with ' + answer + '! Patterns repeat in a sequence.' });
    } else {
      setWrong(w => w + 1);
      setStreak(0);
      setFeedback({ type: 'wrong', answer });
      playWrong();
      speak(`Not quite! The answer was ${answer}.`);
      teachAfterAnswer(false, { type: 'sequence', answer: choice, correctAnswer: answer, extra: 'The answer was ' + answer + '. Patterns repeat in a sequence!' });
    }

    const delay = getFeedbackDelay(level, isCorrect);
    setTimeout(() => setRound(r => r + 1), delay);
  }

  if (done) {
    const finalAccuracy = ROUNDS > 0 ? Math.round((correct / ROUNDS) * 100) : 0;
    return (
      <div className={styles.container}>
        <div className={styles.celebration}>
          <span style={{ fontSize: '4rem' }}>🧩</span>
          <h2>Pattern Genius, {childName || 'Smart Kid'}!</h2>
          <p style={{ fontSize: '1.1rem', fontWeight: 700 }}>Score: {score}</p>
          <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', margin: '0.5rem 0' }}>
            <span style={{ color: '#22c55e', fontWeight: 800 }}>✅ Correct: {correct}</span>
            <span style={{ color: '#ef4444', fontWeight: 800 }}>❌ Wrong: {wrong}</span>
          </div>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Accuracy: {finalAccuracy}%</p>
        </div>
      </div>
    );
  }

  if (round >= ROUNDS) return <div className={styles.container}>Calculating your rewards...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.hud}>
        <span>Lv {level} · Round {round + 1}/{ROUNDS} · ✅ {correct} · ❌ {wrong} · ⭐ {score}</span>
        {streak >= 2 && <span> · 🔥 {streak}</span>}
      </div>

      <p className={styles.prompt}>What comes next?</p>

      {/* Pattern display */}
      <div className={styles.patternRow}>
        {pattern.map((emoji, i) => (
          <span key={i} className={styles.patternEmoji}>{emoji}</span>
        ))}
        <span className={styles.patternBlank}>?</span>
      </div>

      {/* Choices */}
      <div className={styles.choices}>
        {options.map((emoji, i) => {
          let bg = 'transparent';
          let border = '3px solid var(--border)';
          if (feedback && selected === emoji) {
            if (feedback.type === 'correct') { bg = 'rgba(34,197,94,0.15)'; border = '3px solid #22c55e'; }
            else { bg = 'rgba(239,68,68,0.15)'; border = '3px solid #ef4444'; }
          }
          if (feedback && feedback.type === 'wrong' && emoji === answer) {
            bg = 'rgba(34,197,94,0.1)';
            border = '3px solid #22c55e';
          }
          return (
            <button
              key={i}
              type="button"
              onClick={() => handleChoice(emoji)}
              className={`${styles.choiceBtn} ${styles.choiceEmoji}`}
              disabled={feedback !== null}
              style={{ background: bg, border, transition: 'all 0.2s' }}
            >
              {emoji}
            </button>
          );
        })}
      </div>

      {/* Feedback */}
      {feedback?.type === 'correct' && (
        <div className={styles.feedbackOk} style={{ marginTop: '0.5rem', fontSize: '0.9rem', padding: '0.6rem 1rem' }}>
          ✓ Correct! +{feedback.points} points{streak >= 3 ? ' 🔥' : ''}
        </div>
      )}
      {feedback?.type === 'wrong' && (
        <div className={styles.feedbackBad} style={{ marginTop: '0.5rem', fontSize: '0.9rem', padding: '0.6rem 1rem' }}>
          <p>✗ The answer is <strong>{answer}</strong></p>
        </div>
      )}
    </div>
  );
}
