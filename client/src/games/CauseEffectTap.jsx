/**
 * Cause & Effect Tap - Tap objects and learn what happens.
 * Progressive levels: more objects, timing challenges, prediction mode at higher levels.
 * Audio feedback and scoring.
 */
import { useState, useEffect, useRef } from 'react';
import { useAudio } from '../context/AudioContext';
import { useNoRepeat } from './useNoRepeat';
import { getRounds, getFeedbackDelay } from './levelConfig';
import { useTeaching } from './useTeaching';
import styles from './GameCommon.module.css';

const ACTIONS = [
  { tap: '🔔', result: 'Ding!', category: 'sound' },
  { tap: '🎵', result: 'Music!', category: 'sound' },
  { tap: '🌟', result: 'Sparkle!', category: 'light' },
  { tap: '🎈', result: 'Pop!', category: 'sound' },
  { tap: '🔦', result: 'Light!', category: 'light' },
  { tap: '💧', result: 'Splash!', category: 'water' },
  { tap: '🎉', result: 'Yay!', category: 'sound' },
  { tap: '🌈', result: 'Colors!', category: 'light' },
  { tap: '⛈️', result: 'Thunder!', category: 'sound' },
  { tap: '🧲', result: 'Stick!', category: 'other' },
];

function getMode(level) {
  if (level <= 5) return 'tap';         // Just tap to see result
  if (level <= 10) return 'predict';    // Predict the result before tapping
  if (level <= 15) return 'match';      // Match cause to correct effect
  return 'timed';                       // Timed matching
}

function getItemPool(level) {
  if (level <= 5) return ACTIONS.slice(0, 5);
  if (level <= 10) return ACTIONS.slice(0, 7);
  return ACTIONS;
}

export default function CauseEffectTap({ onComplete, level = 1, childName }) {
  const { playSuccess, playWrong, playClick, playCelebration, speak } = useAudio();
  const { teachAfterAnswer, readQuestion, getRecommendedDelayBeforeNext } = useTeaching();
  const { generate } = useNoRepeat(level);
  const [round, setRound] = useState(0);
  const [item, setItem] = useState(null);
  const [tapped, setTapped] = useState(false);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [options, setOptions] = useState([]);
  const [done, setDone] = useState(false);
  const completedRef = useRef(false);
  const ROUNDS = getRounds(level);
  const mode = getMode(level);
  const pool = getItemPool(level);

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
    const chosen = generate(
      () => pool[Math.floor(Math.random() * pool.length)],
      (r) => r.tap
    );
    setItem(chosen);
    setTapped(false);
    setFeedback(null);
    setPrediction(null);

    // Generate wrong options for predict/match modes
    if (mode === 'predict' || mode === 'match' || mode === 'timed') {
      const opts = new Set([chosen.result]);
      while (opts.size < 3) {
        opts.add(pool[Math.floor(Math.random() * pool.length)].result);
      }
      setOptions([...opts].sort(() => Math.random() - 0.5));
    }

    if (chosen) {
      const questionText = mode === 'tap' ? `Tap the ${chosen.tap} and see what happens!` : `What happens when you tap ${chosen.tap}?`;
      const cancelRead = readQuestion(questionText);
      return cancelRead;
    }
  }, [round]);

  // TAP MODE: just tap the item
  function handleTap() {
    if (tapped || !item) return;
    playClick();
    setTapped(true);
    setScore(s => s + 5);
    setCorrect(c => c + 1);
    setFeedback({ type: 'correct', text: `${item.result} Great job!` });
    playSuccess();
    speak(item.result);
    teachAfterAnswer(true, { type: 'word', extra: 'When we tap something, we cause an effect! That\'s cause and effect!' });
    const delay = getRecommendedDelayBeforeNext(getFeedbackDelay(level, true));
    setTimeout(() => setRound(r => r + 1), delay);
  }

  // PREDICT/MATCH MODE: pick the correct result
  function handlePredict(choice) {
    if (feedback !== null) return;
    playClick();
    const isCorrect = choice === item.result;
    setTapped(true);

    if (isCorrect) {
      setScore(s => s + 10);
      setCorrect(c => c + 1);
      setFeedback({ type: 'correct', text: `Correct! ${item.tap} makes ${item.result}` });
      playSuccess();
      speak(`Correct! ${item.result}`);
      teachAfterAnswer(true, { type: 'word', correctAnswer: item.result, extra: 'Cause and effect: when we do something, something else happens!' });
    } else {
      setWrong(w => w + 1);
      setFeedback({ type: 'wrong', text: `Wrong! ${item.tap} makes ${item.result}, not ${choice}` });
      playWrong();
      speak(`Not quite! The answer was ${item.result}`);
      teachAfterAnswer(false, { type: 'word', correctAnswer: item.result, extra: 'Cause and effect: when we do something, something else happens!' });
    }
    const delay = getRecommendedDelayBeforeNext(getFeedbackDelay(level, isCorrect) + 300);
    setTimeout(() => setRound(r => r + 1), delay);
  }

  if (done) {
    const finalAccuracy = ROUNDS > 0 ? Math.round((correct / ROUNDS) * 100) : 0;
    return (
      <div className={styles.container}>
        <div className={styles.celebration}>
          <span style={{ fontSize: '4rem' }}>🔮</span>
          <h2>Great Exploring, {childName || 'Explorer'}!</h2>
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
      </div>

      <p className={styles.prompt}>
        {mode === 'tap'
          ? 'Tap and see what happens!'
          : `What happens when you tap ${item?.tap}?`
        }
      </p>

      {/* The item to tap */}
      <button
        type="button"
        onClick={mode === 'tap' ? handleTap : undefined}
        className={styles.causeEffectBtn}
        disabled={tapped}
        style={{
          fontSize: '3rem',
          padding: '1.5rem 2rem',
          cursor: mode === 'tap' && !tapped ? 'pointer' : 'default',
          transform: tapped ? 'scale(1.1)' : 'scale(1)',
          transition: 'transform 0.2s',
        }}
      >
        <span className={styles.causeEmoji}>{item?.tap}</span>
        <span style={{ fontSize: '1rem', fontWeight: 700 }}>
          {tapped ? item?.result : mode === 'tap' ? 'Tap me!' : ''}
        </span>
      </button>

      {/* Predict/Match mode: show options */}
      {(mode === 'predict' || mode === 'match' || mode === 'timed') && !tapped && (
        <div style={{ marginTop: '0.5rem' }}>
          <p style={{ fontSize: '0.8rem', fontWeight: 700, textAlign: 'center', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
            Pick the correct result:
          </p>
          <div className={styles.choices}>
            {options.map((opt, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handlePredict(opt)}
                className={styles.choiceBtn}
                disabled={feedback !== null}
                style={{ fontSize: '1rem', padding: '0.7rem 1.2rem', fontWeight: 700 }}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Feedback */}
      {feedback && (
        <div className={feedback.type === 'correct' ? styles.feedbackOk : styles.feedbackBad}
          style={{ marginTop: '0.5rem', fontSize: '0.85rem', padding: '0.6rem 1rem' }}>
          {feedback.type === 'correct' ? '✓ ' : '✗ '}{feedback.text}
        </div>
      )}
    </div>
  );
}
