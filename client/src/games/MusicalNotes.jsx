/**
 * Musical Notes - Simon Says with colors + sounds.
 * Kid repeats a sequence of colored notes by tapping.
 * Uses Web Audio API tones. Teaches memory and rhythm.
 * Motor / Premium
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { useAudio } from '../context/AudioContext';
import { getRounds, getFeedbackDelay } from './levelConfig';
import { useTeaching } from './useTeaching';
import { useNoRepeat } from './useNoRepeat';
import styles from './GameCommon.module.css';

const TWEMOJI = (cp) => `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/${cp}.svg`;

const COLORS = [
  { name: 'red', hex: '#ef4444', freq: 261.63 },
  { name: 'blue', hex: '#3b82f6', freq: 329.63 },
  { name: 'green', hex: '#22c55e', freq: 392 },
  { name: 'yellow', hex: '#eab308', freq: 523.25 },
];

function getSequenceLength(level) {
  if (level <= 3) return 2;
  if (level <= 8) return 3;
  if (level <= 15) return 4;
  return 5;
}

function playTone(audioCtx, freq, duration = 0.25, volume = 0.3) {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(volume, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}

const MUSIC_FACTS = [
  'Remembering patterns helps your brain get stronger!',
  'Music and rhythm help us remember things!',
  'Sequences are like a story: first, then, next!',
  'Your ears and eyes work together when you play!',
  'Repeating patterns is how we learn songs!',
  'Memory games make your brain super smart!',
];

export default function MusicalNotes({ onComplete, level = 1, childAge }) {
  const { playSuccess, playWrong, playClick, playCelebration } = useAudio();
  const { teachAfterAnswer, readQuestion } = useTeaching();
  const { generate } = useNoRepeat();
  const [round, setRound] = useState(0);
  const [sequence, setSequence] = useState([]);
  const [inputIndex, setInputIndex] = useState(0);
  const [phase, setPhase] = useState('show');
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [done, setDone] = useState(false);
  const completedRef = useRef(false);
  const audioCtxRef = useRef(null);
  const ROUNDS = getRounds(level);
  const seqLen = getSequenceLength(level);

  const ensureAudio = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtxRef.current?.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

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
    const seq = generate(
      () => Array.from({ length: seqLen }, () => COLORS[Math.floor(Math.random() * COLORS.length)]),
      (s) => s.map(c => c.name).join(',')
    );
    setSequence(seq);
    setInputIndex(0);
    setPhase('show');
    setFeedback(null);
  }, [round, ROUNDS, correct, score, seqLen]);

  useEffect(() => {
    if (!sequence.length || phase !== 'show' || round >= ROUNDS) return;
    const cancelRead = readQuestion('Watch and listen! Then repeat the pattern.');
    let i = 0;
    const showNext = () => {
      if (i >= sequence.length) {
        setPhase('input');
        return;
      }
      const c = sequence[i];
      const ctx = ensureAudio();
      if (ctx) playTone(ctx, c.freq, 0.3, 0.25);
      i++;
      setTimeout(showNext, 500);
    };
    const t = setTimeout(showNext, 800);
    return () => { clearTimeout(t); cancelRead(); };
  }, [sequence, phase, round, ROUNDS, ensureAudio]);

  function handleColorClick(color) {
    if (phase !== 'input' || feedback) return;
    playClick();
    const ctx = ensureAudio();
    if (ctx) playTone(ctx, color.freq, 0.2, 0.25);
    const expected = sequence[inputIndex];
    if (color.name !== expected.name) {
      playWrong();
      setFeedback('wrong');
      teachAfterAnswer(false, { type: 'music', answer: color.name, correctAnswer: expected.name, extra: MUSIC_FACTS[Math.floor(Math.random() * MUSIC_FACTS.length)] });
      const delay = getFeedbackDelay(level, false);
      setTimeout(() => setRound(r => r + 1), delay);
      return;
    }
    const next = inputIndex + 1;
    setInputIndex(next);
    if (next >= sequence.length) {
      setScore(s => s + 10);
      setCorrect(c => c + 1);
      playSuccess();
      setFeedback('correct');
      teachAfterAnswer(true, { type: 'music', answer: color.name, correctAnswer: color.name, extra: MUSIC_FACTS[Math.floor(Math.random() * MUSIC_FACTS.length)] });
      const delay = getFeedbackDelay(level, true);
      setTimeout(() => setRound(r => r + 1), delay);
    }
  }

  if (done) {
    const accuracy = ROUNDS > 0 ? Math.round((correct / ROUNDS) * 100) : 0;
    return (
      <div className={styles.container}>
        <div className={styles.celebration}>
          <img src={TWEMOJI('1f3b6')} alt="" style={{ width: 80, height: 80 }} />
          <h2>Music Star!</h2>
          <p style={{ fontSize: '1.1rem', fontWeight: 700 }}>Score: {score}</p>
          <span style={{ color: 'var(--text-muted)', fontWeight: 800 }}>Accuracy: {accuracy}%</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.hud}>
        <span>Lv {level} · {round + 1}/{ROUNDS} · ✅ {correct} · ⭐ {score}</span>
      </div>
      <p className={styles.prompt}>
        {phase === 'show' ? 'Watch the pattern...' : 'Your turn! Tap the pattern.'}
      </p>
      <div className={styles.targetArea}>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center', maxWidth: 320, margin: '0 auto' }}>
          {COLORS.map((c) => (
            <button
              key={c.name}
              type="button"
              onClick={() => handleColorClick(c)}
              disabled={phase !== 'input' || !!feedback}
              className={styles.choiceBtn}
              style={{
                width: 72,
                height: 72,
                minWidth: 72,
                minHeight: 72,
                padding: 0,
                background: c.hex,
                borderColor: feedback === 'correct' ? 'var(--success)' : 'rgba(255,255,255,0.5)',
                boxShadow: `0 4px 12px ${c.hex}40`,
              }}
            />
          ))}
        </div>
      </div>
      {feedback && (
        <div className={feedback === 'correct' ? styles.feedbackOk : styles.feedbackBad}>
          {feedback === 'correct' ? '✓ Perfect pattern!' : `Not quite! The correct note was the ${sequence[inputIndex]?.name || 'next'} one. Watch and listen carefully next round!`}
        </div>
      )}
    </div>
  );
}
