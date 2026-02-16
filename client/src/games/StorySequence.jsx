import { useState, useEffect, useRef } from 'react';
import { useAudio } from '../context/AudioContext';
import { useNoRepeat } from './useNoRepeat';
import { getRounds, getFeedbackDelay } from './levelConfig';
import { useTeaching } from './useTeaching';
import styles from './GameCommon.module.css';

const STORIES = [
  ['Wake up', 'Brush teeth', 'Eat breakfast', 'Go to school'],
  ['Plant seed', 'Water it', 'See sprout', 'Flower blooms'],
  ['Get ingredients', 'Mix batter', 'Bake in oven', 'Eat cake'],
  ['Put on pajamas', 'Read a story', 'Turn off light', 'Go to sleep'],
  ['Find a book', 'Open it', 'Read pages', 'Close the book'],
  ['Wash hands', 'Set table', 'Serve food', 'Eat dinner'],
  ['Put on shoes', 'Tie laces', 'Walk outside', 'Play in park'],
  ['Pick up toys', 'Put in box', 'Close lid', 'Room is clean'],
  ['Draw picture', 'Color it', 'Show friends', 'Hang on wall'],
  ['Wake up', 'Get dressed', 'Eat breakfast', 'Pack backpack', 'Go to school'],
  ['Plant seed', 'Water daily', 'See sprout', 'Grow leaves', 'Pick fruit'],
  ['Get ingredients', 'Measure flour', 'Mix batter', 'Bake in oven', 'Frost cake', 'Eat cake'],
  ['Wake up', 'Stretch', 'Brush teeth', 'Wash face', 'Get dressed', 'Eat breakfast'],
  ['Find seeds', 'Dig hole', 'Plant seed', 'Cover with soil', 'Water it', 'Watch grow'],
  ['Open book', 'Read first page', 'Turn page', 'Read more', 'Finish chapter', 'Close book']
];

// Pastel colors for story cards
const CARD_COLORS = [
  '#FFB3BA', '#FFDFBA', '#FFFFBA', '#BAFFC9', '#BAE1FF',
  '#E0BBE4', '#FFCCCB', '#FFD9B3', '#F0E68C', '#DDA0DD',
  '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B88B'
];

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

function getStepCount(level) {
  if (level <= 5) return 3;
  if (level <= 10) return 4;
  if (level <= 15) return 5;
  return 6;
}

function getStoriesForLength(length) {
  return STORIES.filter(story => story.length >= length)
    .map(story => story.slice(0, length));
}

export default function StorySequence({ level = 1, onComplete }) {
  const { playSuccess, playWrong, playClick } = useAudio();
  const { teachAfterAnswer, readQuestion } = useTeaching();
  const { generate } = useNoRepeat();
  const [round, setRound] = useState(0);
  const [steps, setSteps] = useState([]);
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
  const stepCount = getStepCount(level);
  const delay = getFeedbackDelay(level);

  useEffect(() => {
    if (round >= ROUNDS && !completedRef.current) {
      completedRef.current = true;
      setDone(true);
      const accuracy = ROUNDS > 0 ? Math.round((correct / ROUNDS) * 100) : 0;
      onComplete(score, accuracy);
      return;
    }

    // Get stories that match the required length
    const availableStories = getStoriesForLength(stepCount);
    if (availableStories.length === 0) {
      // Fallback: create a simple story
      const simpleStory = Array.from({ length: stepCount }, (_, i) => `Step ${i + 1}`);
      setCorrectOrder(simpleStory);
      setSteps(shuffle([...simpleStory]));
    } else {
      const story = generate(
        () => availableStories[Math.floor(Math.random() * availableStories.length)],
        (r) => r.join('-')
      );
      setCorrectOrder([...story]);
      setSteps(shuffle([...story]));
    }

    setSelectedOrder([]);
    setFeedback(null);
    const cancelRead = readQuestion('Put the story in the correct order!');
    return cancelRead;
  }, [round, ROUNDS, stepCount, correct, score]);

  function handleStepClick(step) {
    if (feedback !== null) return;
    if (selectedOrder.includes(step)) return; // Already selected

    playClick();
    const newSelected = [...selectedOrder, step];
    setSelectedOrder(newSelected);

    // Check if all steps are selected
    if (newSelected.length === correctOrder.length) {
      const isCorrect = newSelected.every((s, i) => s === correctOrder[i]);
      
      if (isCorrect) {
        const streakBonus = streak >= 2 ? 5 : 0;
        const points = 10 + streakBonus;
        setScore(s => s + points);
        setCorrect(c => c + 1);
        setStreak(s => s + 1);
        setFeedback('correct');
        playSuccess();
        teachAfterAnswer(true, { type: 'word', extra: 'Stories happen in order. First, then, next!' });
        setTimeout(() => setRound(r => r + 1), delay);
      } else {
        setWrong(w => w + 1);
        setStreak(0);
        setFeedback('wrong');
        playWrong();
        teachAfterAnswer(false, { type: 'word', extra: 'Stories happen in order. First, then, next!' });
        // Reset after showing feedback
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
          <span style={{ fontSize: '4rem' }}>📚</span>
          <h2>Story Master!</h2>
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

      <p className={styles.prompt}>Put the story in the correct order!</p>

      {/* Selected steps row - shows selected steps with number badges */}
      {selectedOrder.length > 0 && (
        <div className={styles.sequenceArea} style={{ marginBottom: '1.5rem', minHeight: '80px', alignItems: 'center', flexDirection: 'row' }}>
          {selectedOrder.map((step, i) => {
            const stepIdx = correctOrder.indexOf(step);
            const color = CARD_COLORS[stepIdx % CARD_COLORS.length];
            return (
              <div
                key={`${step}-${i}`}
                className={styles.sequenceItem}
                style={{
                  background: color,
                  fontSize: '1rem',
                  fontWeight: 700,
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius)',
                  animation: 'fadeIn 0.3s ease',
                  border: '3px solid rgba(255,255,255,0.8)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <span style={{
                  background: 'rgba(255,255,255,0.9)',
                  borderRadius: '50%',
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.85rem',
                  fontWeight: 900,
                  color: '#333'
                }}>
                  {i + 1}
                </span>
                {step}
              </div>
            );
          })}
        </div>
      )}

      {/* Step cards */}
      <div className={styles.choices} style={{ flexDirection: 'column', gap: '0.75rem' }}>
        {steps.map((step, i) => {
          const isSelected = selectedOrder.includes(step);
          const stepIdx = correctOrder.indexOf(step);
          const color = CARD_COLORS[stepIdx % CARD_COLORS.length];
          const isWrong = feedback === 'wrong' && selectedOrder[selectedOrder.length - 1] === step;
          const selectedIndex = selectedOrder.indexOf(step);
          
          return (
            <button
              key={`${step}-${i}`}
              type="button"
              onClick={() => handleStepClick(step)}
              className={`${styles.choiceBtn} ${isWrong ? styles.wrong : ''}`}
              disabled={feedback !== null || isSelected}
              style={{
                background: color,
                border: isSelected ? '4px solid var(--success)' : `4px solid ${color}`,
                opacity: isSelected ? 0.5 : 1,
                fontSize: '1.1rem',
                fontWeight: 700,
                color: '#333',
                cursor: isSelected ? 'default' : 'pointer',
                minWidth: '200px',
                minHeight: '70px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.75rem',
                position: 'relative',
                padding: '1rem 1.5rem'
              }}
            >
              {isSelected && (
                <span style={{
                  background: 'rgba(255,255,255,0.9)',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1rem',
                  fontWeight: 900,
                  color: '#333',
                  position: 'absolute',
                  top: '8px',
                  right: '8px'
                }}>
                  {selectedIndex + 1}
                </span>
              )}
              {step}
            </button>
          );
        })}
      </div>

      {/* Feedback */}
      {feedback && (
        <p className={feedback === 'correct' ? styles.feedbackOk : styles.feedbackBad}>
          {feedback === 'correct'
            ? (streak >= 3 ? '🔥 Story Master!' : '✓ Correct!')
            : '✗ Wrong order! Try again!'}
        </p>
      )}
    </div>
  );
}
