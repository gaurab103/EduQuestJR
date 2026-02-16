/**
 * Science Sort - Sort items into scientific categories.
 * Builds early science knowledge: living vs non-living, land vs water, etc.
 * Progressive: 2 categories → 3 → more items per round.
 */
import { useState, useEffect, useRef } from 'react';
import { useAudio } from '../context/AudioContext';
import { useNoRepeat } from './useNoRepeat';
import { getRounds, getFeedbackDelay } from './levelConfig';
import { useTeaching } from './useTeaching';
import styles from './GameCommon.module.css';

const CATEGORIES = [
  {
    name: 'Living vs Non-Living',
    groups: [
      { label: 'Living', items: ['Dog','Cat','Tree','Flower','Bird','Fish','Butterfly','Frog'] },
      { label: 'Non-Living', items: ['Rock','Chair','Car','Ball','Book','Cup','Phone','Key'] },
    ],
  },
  {
    name: 'Land vs Water Animals',
    groups: [
      { label: 'Land', items: ['Lion','Elephant','Cat','Horse','Rabbit','Bear','Deer','Fox'] },
      { label: 'Water', items: ['Fish','Whale','Dolphin','Octopus','Shark','Turtle','Crab','Seal'] },
    ],
  },
  {
    name: 'Fruits vs Vegetables',
    groups: [
      { label: 'Fruits', items: ['Apple','Banana','Orange','Grape','Mango','Berry','Peach','Pear'] },
      { label: 'Vegetables', items: ['Carrot','Potato','Tomato','Onion','Corn','Pea','Bean','Pepper'] },
    ],
  },
  {
    name: 'Hot vs Cold',
    groups: [
      { label: 'Hot', items: ['Sun','Fire','Oven','Lava','Desert','Candle','Stove','Iron'] },
      { label: 'Cold', items: ['Ice','Snow','Fridge','Winter','Glacier','Igloo','Frost','Penguin'] },
    ],
  },
  {
    name: 'Day vs Night',
    groups: [
      { label: 'Day', items: ['Sun','Clouds','Rainbow','Butterfly','Picnic','Playground','Garden','School'] },
      { label: 'Night', items: ['Moon','Stars','Owl','Bat','Sleep','Dream','Lamp','Firefly'] },
    ],
  },
];

export default function ScienceSort({ onComplete, level = 1, childName }) {
  const { playSuccess, playWrong, playClick, playCelebration } = useAudio();
  const { teachAfterAnswer, readQuestion } = useTeaching();
  const { generate } = useNoRepeat();
  const [round, setRound] = useState(0);
  const [category, setCategory] = useState(null);
  const [currentItem, setCurrentItem] = useState(null);
  const [correctGroup, setCorrectGroup] = useState(0);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [done, setDone] = useState(false);
  const completedRef = useRef(false);
  const ROUNDS = getRounds(level);

  useEffect(() => {
    window.speechSynthesis?.cancel();
    if (round >= ROUNDS && !completedRef.current) {
      completedRef.current = true;
      setDone(true);
      playCelebration();
      onComplete(score, ROUNDS > 0 ? Math.round((correct / ROUNDS) * 100) : 0);
      return;
    }
    const catPool = level <= 5 ? CATEGORIES.slice(0, 2) : level <= 15 ? CATEGORIES.slice(0, 4) : CATEGORIES;
    const { cat, groupIdx, item } = generate(
      () => {
        const cat = catPool[Math.floor(Math.random() * catPool.length)];
        const groupIdx = Math.floor(Math.random() * cat.groups.length);
        const group = cat.groups[groupIdx];
        const item = group.items[Math.floor(Math.random() * group.items.length)];
        return { cat, groupIdx, item };
      },
      (r) => r.item
    );
    setCategory(cat);
    setCurrentItem(item);
    setCorrectGroup(groupIdx);
    setFeedback(null);
    const cancelRead = readQuestion(`Is ${item} ${cat.groups[0].label} or ${cat.groups[1].label}?`);
    return cancelRead;
  }, [round]);

  function handleChoice(idx) {
    if (feedback) return;
    playClick();
    const isCorrect = idx === correctGroup;
    if (isCorrect) {
      setScore(s => s + 10);
      setCorrect(c => c + 1);
      setFeedback({ type: 'correct', text: `Yes! ${currentItem} is ${category.groups[correctGroup].label}!` });
      playSuccess();
      teachAfterAnswer(true, { type: 'science', correctAnswer: category.groups[correctGroup].label, extra: 'Scientists sort things into groups to learn about them!' });
    } else {
      setWrong(w => w + 1);
      setFeedback({ type: 'wrong', text: `Not quite! The correct answer is ${category.groups[correctGroup].label} — ${currentItem} belongs in ${category.groups[correctGroup].label}.` });
      playWrong();
      teachAfterAnswer(false, { type: 'science', correctAnswer: category.groups[correctGroup].label, extra: 'Scientists sort things into groups to learn about them!' });
    }
    const delay = getFeedbackDelay(level, isCorrect);
    setTimeout(() => setRound(r => r + 1), delay);
  }

  if (done) {
    const acc = ROUNDS > 0 ? Math.round((correct / ROUNDS) * 100) : 0;
    return (
      <div className={styles.container}>
        <div className={styles.celebration}>
          <span style={{ fontSize: '4rem' }}>🔬</span>
          <h2>Science Star, {childName || 'Scientist'}!</h2>
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

  if (!category) return null;

  return (
    <div className={styles.container}>
      <div className={styles.hud}>
        <span>Lv {level} · {round + 1}/{ROUNDS} · ✅ {correct} · ❌ {wrong} · ⭐ {score}</span>
      </div>

      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700, textAlign: 'center', marginBottom: '0.3rem' }}>
        {category.name}
      </p>

      <div className={styles.targetArea}>
        <span style={{ fontSize: '2.2rem', fontWeight: 900, color: 'var(--text)' }}>{currentItem}</span>
      </div>

      <p className={styles.prompt}>Where does it belong?</p>

      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
        {category.groups.map((group, idx) => {
          let bg = idx === 0 ? 'linear-gradient(135deg, #38bdf8, #818cf8)' : 'linear-gradient(135deg, #f472b6, #fb923c)';
          let border = '3px solid transparent';
          if (feedback) {
            if (idx === correctGroup) border = '3px solid #22c55e';
            else if (idx !== correctGroup && feedback.type === 'wrong') border = '3px solid #ef4444';
          }
          return (
            <button key={idx} type="button" onClick={() => handleChoice(idx)}
              className={styles.choiceBtn}
              disabled={feedback !== null}
              style={{
                background: bg, color: 'white', fontWeight: 900,
                fontSize: '1.1rem', padding: '1rem 1.5rem', border,
                minWidth: 120, borderRadius: 16,
              }}>
              {group.label}
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
