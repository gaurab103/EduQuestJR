import { useState, useEffect, useRef } from 'react';
import { useAudio } from '../context/AudioContext';
import { getRounds, getFeedbackDelay } from './levelConfig';
import { useTeaching } from './useTeaching';
import { useNoRepeat } from './useNoRepeat';
import styles from './GameCommon.module.css';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

// Pastel colors for letter buttons
const PASTEL_COLORS = [
  '#FFB3BA', '#FFDFBA', '#FFFFBA', '#BAFFC9', '#BAE1FF',
  '#E0BBE4', '#FFCCCB', '#FFD9B3', '#F0E68C', '#DDA0DD',
  '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B88B'
];

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

function getLetterCount(level) {
  if (level <= 5) return 3;
  if (level <= 10) return 4;
  if (level <= 15) return 5;
  return 6;
}

export default function ABCOrder({ level = 1, onComplete }) {
  const { playSuccess, playWrong, playClick } = useAudio();
  const { teachAfterAnswer, readQuestion, getRecommendedDelayBeforeNext } = useTeaching();
  const { generate } = useNoRepeat(level);
  const [round, setRound] = useState(0);
  const [letters, setLetters] = useState([]);
  const [correctOrder, setCorrectOrder] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState([]);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [streak, setStreak] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [done, setDone] = useState(false);
  const completedRef = useRef(false);
  const ROUNDS = getRounds(level);
  const letterCount = getLetterCount(level);

  useEffect(() => {
    window.speechSynthesis?.cancel();
    if (round >= ROUNDS && !completedRef.current) {
      completedRef.current = true;
      setDone(true);
      const accuracy = ROUNDS > 0 ? Math.round((correct / ROUNDS) * 100) : 0;
      onComplete(score, accuracy);
      return;
    }

    // Generate consecutive letters starting from a random position
    const { startIdx, correctLetters } = generate(
      () => {
        const startIdx = Math.floor(Math.random() * (26 - letterCount + 1));
        const correctLetters = ALPHABET.slice(startIdx, startIdx + letterCount);
        return { startIdx, correctLetters };
      },
      (r) => r.correctLetters.join('')
    );
    const shuffled = shuffle([...correctLetters]);

    setCorrectOrder(correctLetters);
    setLetters(shuffled);
    setSelectedOrder([]);
    setFeedback(null);
    const cancelRead = readQuestion('Tap the letters in ABC order!');
    return cancelRead;
  }, [round, ROUNDS, letterCount, correct, score]);

  function handleLetterClick(letter) {
    if (feedback !== null) return;
    if (selectedOrder.includes(letter)) return; // Already selected

    playClick();
    const newSelected = [...selectedOrder, letter];
    setSelectedOrder(newSelected);

    // Check if all letters are selected
    if (newSelected.length === correctOrder.length) {
      const isCorrect = newSelected.every((l, i) => l === correctOrder[i]);
      
      if (isCorrect) {
        const streakBonus = streak >= 2 ? 5 : 0;
        const points = 10 + streakBonus;
        setScore(s => s + points);
        setCorrect(c => c + 1);
        setStreak(s => s + 1);
        setFeedback('correct');
        playSuccess();
        teachAfterAnswer(true, { type: 'letter', correctAnswer: correctOrder[0] });
        const delay = getRecommendedDelayBeforeNext(getFeedbackDelay(level, true));
        setTimeout(() => setRound(r => r + 1), delay);
      } else {
        setWrong(w => w + 1);
        setStreak(0);
        setFeedback('wrong');
        playWrong();
        teachAfterAnswer(false, { type: 'letter', correctAnswer: correctOrder.join('') });
        // Reset after showing feedback
        const delay = getRecommendedDelayBeforeNext(getFeedbackDelay(level, false));
        setTimeout(() => {
          setSelectedOrder([]);
          setFeedback(null);
        }, delay);
      }
    }
  }

  if (done) {
    const finalAccuracy = ROUNDS > 0 ? Math.round((correct / ROUNDS) * 100) : 0;
    return (
      <div className={styles.container}>
        <div className={styles.celebration}>
          <span style={{ fontSize: '4rem' }}>🔤</span>
          <h2>ABC Master!</h2>
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

  if (round >= ROUNDS) return <div className={styles.container}>Calculating your rewards…</div>;

  return (
    <div className={styles.container}>
      <div className={styles.hud}>
        <span>Lv {level} · Round {round + 1}/{ROUNDS} · ✅ {correct} · ❌ {wrong} · ⭐ {score}</span>
        {streak >= 2 && <span> · 🔥 {streak}</span>}
      </div>

      <p className={styles.prompt}>Tap the letters in ABC order!</p>

      {/* Sorted row at top - shows selected letters in order */}
      {selectedOrder.length > 0 && (
        <div className={styles.sequenceArea} style={{ marginBottom: '1.5rem', minHeight: '80px', alignItems: 'center' }}>
          {selectedOrder.map((letter, i) => {
            const letterIdx = ALPHABET.indexOf(letter);
            const color = PASTEL_COLORS[letterIdx % PASTEL_COLORS.length];
            return (
              <div
                key={`${letter}-${i}`}
                className={styles.sequenceItem}
                style={{
                  background: color,
                  fontSize: '2.5rem',
                  fontWeight: 900,
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius)',
                  animation: 'fadeIn 0.3s ease',
                  border: '3px solid rgba(255,255,255,0.8)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                }}
              >
                {letter}
              </div>
            );
          })}
        </div>
      )}

      {/* Letter buttons */}
      <div className={styles.choices}>
        {letters.map((letter, i) => {
          const isSelected = selectedOrder.includes(letter);
          const letterIdx = ALPHABET.indexOf(letter);
          const color = PASTEL_COLORS[letterIdx % PASTEL_COLORS.length];
          const isWrong = feedback === 'wrong' && selectedOrder[selectedOrder.length - 1] === letter;
          
          return (
            <button
              key={`${letter}-${i}`}
              type="button"
              onClick={() => handleLetterClick(letter)}
              className={`${styles.choiceBtn} ${isWrong ? styles.wrong : ''}`}
              disabled={feedback !== null || isSelected}
              style={{
                background: color,
                border: isSelected ? '4px solid var(--success)' : `4px solid ${color}`,
                opacity: isSelected ? 0.5 : 1,
                fontSize: '2.5rem',
                fontWeight: 900,
                color: '#333',
                cursor: isSelected ? 'default' : 'pointer'
              }}
            >
              {letter}
            </button>
          );
        })}
      </div>

      {/* Feedback */}
      {feedback === 'correct' && (
        <p className={styles.feedbackOk}>{streak >= 3 ? '🔥 ABC Master!' : '✓ Correct!'}</p>
      )}
      {feedback === 'wrong' && (
        <div className={styles.feedbackBad}>
          <p>✗ The answer is <strong>{correctOrder.join('')}</strong></p>
        </div>
      )}
    </div>
  );
}
