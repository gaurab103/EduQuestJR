/**
 * Time Sorter - Daily activities (wake up, breakfast, school, lunch, dinner, bedtime).
 * Kid puts them in correct time order. Teaches daily routine and time concepts.
 * Academic / Premium
 */
import { useState, useEffect, useRef } from 'react';
import { useAudio } from '../context/AudioContext';
import { useNoRepeat } from './useNoRepeat';
import { getRounds, getFeedbackDelay } from './levelConfig';
import { useTeaching } from './useTeaching';
import styles from './GameCommon.module.css';

const TWEMOJI = (cp) => `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/${cp}.svg`;

const ACTIVITIES = [
  { id: 'wake', label: 'Wake up', emoji: TWEMOJI('1f6cc'), order: 1 },
  { id: 'brush', label: 'Brush teeth', emoji: TWEMOJI('1faa5'), order: 2 },
  { id: 'breakfast', label: 'Breakfast', emoji: TWEMOJI('1f373'), order: 3 },
  { id: 'school', label: 'Go to school', emoji: TWEMOJI('1f3eb'), order: 4 },
  { id: 'lunch', label: 'Lunch', emoji: TWEMOJI('1f35d'), order: 5 },
  { id: 'play', label: 'Play time', emoji: TWEMOJI('26bd'), order: 6 },
  { id: 'dinner', label: 'Dinner', emoji: TWEMOJI('1f35c'), order: 7 },
  { id: 'bath', label: 'Bath time', emoji: TWEMOJI('1f6c0'), order: 8 },
  { id: 'story', label: 'Read a story', emoji: TWEMOJI('1f4da'), order: 9 },
  { id: 'bed', label: 'Bedtime', emoji: TWEMOJI('1f319'), order: 10 },
];

const ROUTINE_SETS = [
  ['wake', 'breakfast', 'school'],
  ['wake', 'brush', 'breakfast'],
  ['breakfast', 'school', 'lunch'],
  ['school', 'lunch', 'play'],
  ['lunch', 'dinner', 'bed'],
  ['dinner', 'bath', 'bed'],
  ['wake', 'brush', 'breakfast', 'school'],
  ['breakfast', 'school', 'lunch', 'play'],
  ['school', 'lunch', 'play', 'dinner'],
  ['lunch', 'dinner', 'bath', 'bed'],
  ['dinner', 'bath', 'story', 'bed'],
  ['wake', 'brush', 'breakfast', 'school', 'lunch'],
  ['breakfast', 'school', 'lunch', 'play', 'dinner'],
  ['school', 'lunch', 'play', 'dinner', 'bed'],
  ['wake', 'brush', 'breakfast', 'school', 'lunch', 'play'],
  ['breakfast', 'school', 'lunch', 'play', 'dinner', 'bed'],
  ['wake', 'brush', 'breakfast', 'school', 'lunch', 'play', 'dinner'],
  ['wake', 'brush', 'breakfast', 'school', 'lunch', 'play', 'dinner', 'bed'],
];

const TIME_FACTS = [
  'We do things in order every day! Morning comes before afternoon.',
  'Our bodies need routines. Going to bed at the same time helps us sleep.',
  'Breakfast is the first meal of the day! It gives us energy.',
  'We go to school in the morning and come home in the afternoon.',
  'Dinner is usually in the evening. Then we get ready for bed.',
  'Brushing teeth in the morning and at night keeps them healthy!',
  'Stories before bed help us relax and sleep better.',
  'Playing comes after school. We need fun time too!',
];

function getStepCount(level) {
  if (level <= 3) return 3;
  if (level <= 8) return 4;
  if (level <= 15) return 5;
  return 6;
}

export default function TimeSorter({ onComplete, level = 1, childAge }) {
  const { playSuccess, playWrong, playClick, playCelebration } = useAudio();
  const { teachAfterAnswer, readQuestion } = useTeaching();
  const { generate } = useNoRepeat();
  const [round, setRound] = useState(0);
  const [correctOrder, setCorrectOrder] = useState([]);
  const [cards, setCards] = useState([]);
  const [selected, setSelected] = useState([]);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [done, setDone] = useState(false);
  const completedRef = useRef(false);
  const ROUNDS = getRounds(level);
  const stepCount = getStepCount(level);

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
    const sets = ROUTINE_SETS.filter(s => s.length === stepCount);
    const ids = generate(
      () => sets.length ? sets[Math.floor(Math.random() * sets.length)] : ROUTINE_SETS[0].slice(0, stepCount),
      (r) => r.join('-')
    );
    const ordered = ids.map(id => ACTIVITIES.find(a => a.id === id)).filter(Boolean);
    const shuffled = [...ordered].sort(() => Math.random() - 0.5);
    setCorrectOrder(ordered);
    setCards(shuffled);
    setSelected([]);
    setFeedback(null);
  }, [round, ROUNDS, correct, score, stepCount]);

  useEffect(() => {
    if (correctOrder.length && round < ROUNDS) {
      const cancelRead = readQuestion('Put these activities in the correct order of the day!');
      return cancelRead;
    }
  }, [correctOrder, round, ROUNDS]);

  function handleCardClick(activity) {
    if (feedback) return;
    if (selected.includes(activity)) return;
    playClick();
    const newSelected = [...selected, activity];
    setSelected(newSelected);
    if (newSelected.length === correctOrder.length) {
      const isCorrect = newSelected.every((a, i) => a.id === correctOrder[i].id);
      if (isCorrect) {
        setScore(s => s + 10);
        setCorrect(c => c + 1);
        playSuccess();
        setFeedback('correct');
      } else {
        playWrong();
        setFeedback('wrong');
      }
      teachAfterAnswer(isCorrect, {
        type: 'word',
        answer: isCorrect ? 'order' : 'wrong',
        correctAnswer: 'order',
        extra: TIME_FACTS[Math.floor(Math.random() * TIME_FACTS.length)],
      });
      const delay = getFeedbackDelay(level, isCorrect);
      setTimeout(() => setRound(r => r + 1), delay);
    }
  }

  if (done) {
    const accuracy = ROUNDS > 0 ? Math.round((correct / ROUNDS) * 100) : 0;
    return (
      <div className={styles.container}>
        <div className={styles.celebration}>
          <img src={TWEMOJI('23f0')} alt="" style={{ width: 80, height: 80 }} />
          <h2>Time Master!</h2>
          <p style={{ fontSize: '1.1rem', fontWeight: 700 }}>Score: {score}</p>
          <span style={{ color: 'var(--text-muted)', fontWeight: 800 }}>Accuracy: {accuracy}%</span>
        </div>
      </div>
    );
  }

  if (!correctOrder.length) return null;

  const CARD_COLORS = ['#FFB3BA', '#FFDFBA', '#FFFFBA', '#BAFFC9', '#BAE1FF', '#E0BBE4'];

  return (
    <div className={styles.container}>
      <div className={styles.hud}>
        <span>Lv {level} · {round + 1}/{ROUNDS} · ✅ {correct} · ⭐ {score}</span>
      </div>
      <p className={styles.prompt}>Put them in the correct order of the day!</p>
      {selected.length > 0 && (
        <div className={styles.sequenceArea} style={{ marginBottom: '1rem', minHeight: 70 }}>
          {selected.map((a, i) => (
            <div
              key={a.id}
              className={styles.sequenceItem}
              style={{
                background: CARD_COLORS[i % CARD_COLORS.length],
                padding: '0.5rem 0.75rem',
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.95rem',
                fontWeight: 700,
                border: '2px solid rgba(255,255,255,0.8)',
              }}
            >
              <span style={{ background: 'rgba(255,255,255,0.9)', borderRadius: '50%', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>{i + 1}</span>
              <img src={a.emoji} alt="" style={{ width: 28, height: 28 }} />
              {a.label}
            </div>
          ))}
        </div>
      )}
      <div className={styles.choices} style={{ flexDirection: 'column', gap: '0.6rem' }}>
        {cards.map((activity) => {
          const isSelected = selected.includes(activity);
          return (
            <button
              key={activity.id}
              type="button"
              onClick={() => handleCardClick(activity)}
              disabled={!!feedback || isSelected}
              className={`${styles.choiceBtn} ${feedback === 'wrong' && selected[selected.length - 1] === activity ? styles.wrong : ''}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                justifyContent: 'flex-start',
                opacity: isSelected ? 0.5 : 1,
                background: isSelected ? 'rgba(74,222,128,0.2)' : undefined,
                border: isSelected ? '3px solid var(--success)' : undefined,
              }}
            >
              <img src={activity.emoji} alt="" style={{ width: 40, height: 40 }} />
              <span className={styles.choiceNumber} style={{ fontSize: '1rem' }}>{activity.label}</span>
            </button>
          );
        })}
      </div>
      {feedback && (
        <div className={feedback === 'correct' ? styles.feedbackOk : styles.feedbackBad}>
          {feedback === 'correct' ? '✓ Perfect order!' : `The correct order is: ${correctOrder.map(a => a.label).join(' → ')}`}
        </div>
      )}
    </div>
  );
}
