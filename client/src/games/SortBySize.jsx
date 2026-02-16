/**
 * SortBySize - Tap items in order from smallest to biggest (or reverse at higher levels).
 * Cognitive / Premium - teaches ordering and comparison.
 */
import { useState, useEffect, useRef } from 'react';
import styles from './GameCommon.module.css';
import { useAudio } from '../context/AudioContext';
import { getRounds, getFeedbackDelay } from './levelConfig';
import { useTeaching } from './useTeaching';
import { useNoRepeat } from './useNoRepeat';

const TWEMOJI = (cp) => `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/${cp}.svg`;

const SIZE_SETS = [
  [{ name: 'ant', img: TWEMOJI('1f41c'), label: 'Ant' }, { name: 'mouse', img: TWEMOJI('1f42d'), label: 'Mouse' }, { name: 'cat', img: TWEMOJI('1f431'), label: 'Cat' }, { name: 'elephant', img: TWEMOJI('1f418'), label: 'Elephant' }],
  [{ name: 'chick', img: TWEMOJI('1f425'), label: 'Chick' }, { name: 'chicken', img: TWEMOJI('1f414'), label: 'Chicken' }, { name: 'duck', img: TWEMOJI('1f986'), label: 'Duck' }, { name: 'turkey', img: TWEMOJI('1f983'), label: 'Turkey' }],
  [{ name: 'berry', img: TWEMOJI('1f347'), label: 'Berry' }, { name: 'apple', img: TWEMOJI('1f34e'), label: 'Apple' }, { name: 'peach', img: TWEMOJI('1f351'), label: 'Peach' }, { name: 'watermelon', img: TWEMOJI('1f349'), label: 'Watermelon' }],
  [{ name: 'car', img: TWEMOJI('1f697'), label: 'Car' }, { name: 'bus', img: TWEMOJI('1f68c'), label: 'Bus' }, { name: 'truck', img: TWEMOJI('1f69b'), label: 'Truck' }, { name: 'plane', img: TWEMOJI('2708'), label: 'Plane' }],
  [{ name: 'cup', img: TWEMOJI('1f375'), label: 'Cup' }, { name: 'bowl', img: TWEMOJI('1f37a'), label: 'Bowl' }, { name: 'pot', img: TWEMOJI('1f373'), label: 'Cooking' }, { name: 'bath', img: TWEMOJI('1f6c0'), label: 'Bath' }],
  [{ name: 'fish', img: TWEMOJI('1f41f'), label: 'Fish' }, { name: 'dolphin', img: TWEMOJI('1f42c'), label: 'Dolphin' }, { name: 'whale', img: TWEMOJI('1f433'), label: 'Whale' }],
  [{ name: 'flower', img: TWEMOJI('1f338'), label: 'Flower' }, { name: 'bush', img: TWEMOJI('1f332'), label: 'Bush' }, { name: 'tree', img: TWEMOJI('1f333'), label: 'Tree' }],
  [{ name: 'bee', img: TWEMOJI('1f41d'), label: 'Bee' }, { name: 'bird', img: TWEMOJI('1f426'), label: 'Bird' }, { name: 'owl', img: TWEMOJI('1f989'), label: 'Owl' }, { name: 'eagle', img: TWEMOJI('1f985'), label: 'Eagle' }],
  [{ name: 'snail', img: TWEMOJI('1f40c'), label: 'Snail' }, { name: 'frog', img: TWEMOJI('1f438'), label: 'Frog' }, { name: 'turtle', img: TWEMOJI('1f422'), label: 'Turtle' }],
  [{ name: 'rabbit', img: TWEMOJI('1f430'), label: 'Rabbit' }, { name: 'dog', img: TWEMOJI('1f436'), label: 'Dog' }, { name: 'horse', img: TWEMOJI('1f434'), label: 'Horse' }],
  [{ name: 'butterfly', img: TWEMOJI('1f98b'), label: 'Butterfly' }, { name: 'cat', img: TWEMOJI('1f431'), label: 'Cat' }, { name: 'lion', img: TWEMOJI('1f981'), label: 'Lion' }],
  [{ name: 'ladybug', img: TWEMOJI('1f41e'), label: 'Ladybug' }, { name: 'rabbit', img: TWEMOJI('1f430'), label: 'Rabbit' }, { name: 'bear', img: TWEMOJI('1f43b'), label: 'Bear' }],
  [{ name: 'star', img: TWEMOJI('2b50'), label: 'Star' }, { name: 'moon', img: TWEMOJI('1f319'), label: 'Moon' }, { name: 'sun', img: TWEMOJI('2600'), label: 'Sun' }],
  [{ name: 'ball', img: TWEMOJI('26bd'), label: 'Ball' }, { name: 'balloon', img: TWEMOJI('1f388'), label: 'Balloon' }, { name: 'globe', img: TWEMOJI('1f30d'), label: 'Globe' }],
  [{ name: 'book', img: TWEMOJI('1f4d6'), label: 'Book' }, { name: 'books', img: TWEMOJI('1f4da'), label: 'Books' }, { name: 'bookshelf', img: TWEMOJI('1f9fa'), label: 'Bookshelf' }],
  [{ name: 'house', img: TWEMOJI('1f3e0'), label: 'House' }, { name: 'building', img: TWEMOJI('1f3e2'), label: 'Building' }, { name: 'castle', img: TWEMOJI('1f3f0'), label: 'Castle' }],
  [{ name: 'pebble', img: TWEMOJI('1faa8'), label: 'Rock' }, { name: 'ball', img: TWEMOJI('26bd'), label: 'Ball' }, { name: 'boulder', img: TWEMOJI('26f0'), label: 'Mountain' }],
  [{ name: 'seed', img: TWEMOJI('1f331'), label: 'Seed' }, { name: 'flower', img: TWEMOJI('1f338'), label: 'Flower' }, { name: 'tree', img: TWEMOJI('1f333'), label: 'Tree' }],
  [{ name: 'drop', img: TWEMOJI('1f4a7'), label: 'Drop' }, { name: 'cup', img: TWEMOJI('1f375'), label: 'Cup' }, { name: 'ocean', img: TWEMOJI('1f30a'), label: 'Ocean' }],
  [{ name: 'cookie', img: TWEMOJI('1f36a'), label: 'Cookie' }, { name: 'cake', img: TWEMOJI('1f382'), label: 'Cake' }, { name: 'birthday', img: TWEMOJI('1f389'), label: 'Party' }],
  [{ name: 'sock', img: TWEMOJI('1f9e6'), label: 'Sock' }, { name: 'shirt', img: TWEMOJI('1f455'), label: 'Shirt' }, { name: 'blanket', img: TWEMOJI('1f381'), label: 'Gift' }],
  [{ name: 'pebble', img: TWEMOJI('1faa8'), label: 'Rock' }, { name: 'brick', img: TWEMOJI('1f9f1'), label: 'Brick' }, { name: 'house', img: TWEMOJI('1f3e0'), label: 'House' }],
  [{ name: 'bee', img: TWEMOJI('1f41d'), label: 'Bee' }, { name: 'frog', img: TWEMOJI('1f438'), label: 'Frog' }, { name: 'elephant', img: TWEMOJI('1f418'), label: 'Elephant' }],
  [{ name: 'mouse', img: TWEMOJI('1f42d'), label: 'Mouse' }, { name: 'cat', img: TWEMOJI('1f431'), label: 'Cat' }, { name: 'tiger', img: TWEMOJI('1f42f'), label: 'Tiger' }],
  [{ name: 'duck', img: TWEMOJI('1f986'), label: 'Duck' }, { name: 'swan', img: TWEMOJI('1f9a2'), label: 'Swan' }, { name: 'flamingo', img: TWEMOJI('1f9a9'), label: 'Flamingo' }],
  [{ name: 'crab', img: TWEMOJI('1f980'), label: 'Crab' }, { name: 'octopus', img: TWEMOJI('1f419'), label: 'Octopus' }, { name: 'whale', img: TWEMOJI('1f433'), label: 'Whale' }],
  [{ name: 'lizard', img: TWEMOJI('1f98e'), label: 'Lizard' }, { name: 'crocodile', img: TWEMOJI('1f40a'), label: 'Crocodile' }, { name: 'dinosaur', img: TWEMOJI('1f995'), label: 'Dinosaur' }],
  [{ name: 'caterpillar', img: TWEMOJI('1f41b'), label: 'Caterpillar' }, { name: 'butterfly', img: TWEMOJI('1f98b'), label: 'Butterfly' }],
  [{ name: 'tadpole', img: TWEMOJI('1f433'), label: 'Whale' }, { name: 'frog', img: TWEMOJI('1f438'), label: 'Frog' }],
  [{ name: 'acorn', img: TWEMOJI('1f330'), label: 'Nut' }, { name: 'apple', img: TWEMOJI('1f34e'), label: 'Apple' }, { name: 'pumpkin', img: TWEMOJI('1f383'), label: 'Pumpkin' }],
];

function getItemCount(level) {
  if (level <= 5) return 3;
  if (level <= 15) return 4;
  return 5;
}

function getMode(level, round) {
  if (level <= 10) return 0;
  return round % 2;
}

export default function SortBySize({ onComplete, level = 1, childAge }) {
  const { playSuccess, playWrong, playClick } = useAudio();
  const { teachAfterAnswer, readQuestion, getRecommendedDelayBeforeNext } = useTeaching();
  const { generate } = useNoRepeat(level);
  const [round, setRound] = useState(0);
  const [items, setItems] = useState([]);
  const [smallestFirst, setSmallestFirst] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState([]);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const completedRef = useRef(false);
  const ROUNDS = getRounds(level);
  const itemCount = getItemCount(level);

  useEffect(() => {
    window.speechSynthesis?.cancel();
    if (round >= ROUNDS && !completedRef.current) {
      completedRef.current = true;
      onComplete(score, Math.round((score / ROUNDS) * 100));
      return;
    }
    const mode = getMode(level, round);
    const smallestFirstMode = mode === 0;
    setSmallestFirst(smallestFirstMode);
    const set = generate(
      () => {
        const s = SIZE_SETS[Math.floor(Math.random() * SIZE_SETS.length)];
        const n = Math.min(itemCount, s.length);
        return s.slice(0, n);
      },
      (r) => r.map((x) => x.name).join('-')
    );
    setItems(set);
    setSelectedOrder([]);
    setFeedback(null);
    const q = smallestFirstMode ? 'Tap from smallest to biggest!' : 'Tap from biggest to smallest!';
    const cancelRead = readQuestion(q);
    return cancelRead;
  }, [round, ROUNDS, level, itemCount, generate]);

  function handleTap(idx) {
    if (feedback !== null || selectedOrder.includes(idx)) return;
    playClick();
    const next = [...selectedOrder, idx];
    setSelectedOrder(next);
    if (next.length === items.length) {
      const targetOrder = smallestFirst ? [...Array(items.length).keys()] : [...Array(items.length).keys()].reverse();
      const correct = JSON.stringify(next) === JSON.stringify(targetOrder);
      if (correct) setScore((s) => s + 1);
      else playWrong();
      if (correct) playSuccess();
      setFeedback(correct ? 'correct' : 'wrong');
      teachAfterAnswer(correct, { type: 'word', correctAnswer: items.map((x) => x.label).join(', '), extra: 'Great job ordering by size!' });
      const delay = getRecommendedDelayBeforeNext(getFeedbackDelay(level, correct));
      setTimeout(() => setRound((r) => r + 1), delay);
    }
  }

  if (round >= ROUNDS) return <div className={styles.container}><p className={styles.prompt}>Calculating rewards...</p></div>;

  if (!items.length) return null;

  const targetOrder = smallestFirst ? [...Array(items.length).keys()] : [...Array(items.length).keys()].reverse();

  return (
    <div className={styles.container}>
      <div className={styles.progress}>
        <span>Lv {level} · {round + 1}/{ROUNDS}</span><span>·</span><span>⭐ {score}</span>
      </div>
      <p className={styles.prompt}>{smallestFirst ? 'Tap from smallest to biggest!' : 'Tap from biggest to smallest!'}</p>
      <div className={styles.choices} style={{ marginBottom: '1.5rem' }}>
        {items.map((item, idx) => {
          const pos = selectedOrder.indexOf(idx);
          const done = feedback !== null;
          let borderClass = '';
          if (done && pos >= 0) borderClass = pos === targetOrder.indexOf(idx) ? ` ${styles.correct}` : ` ${styles.wrong}`;
          return (
            <button key={idx} type="button" onClick={() => handleTap(idx)} className={`${styles.choiceBtn}${borderClass}`} disabled={done} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
              <img src={item.img} alt={item.label} style={{ width: 48, height: 48, objectFit: 'contain' }} />
              <span style={{ fontSize: '0.7rem', fontWeight: 700 }}>{item.label}</span>
              {pos >= 0 && <span style={{ fontSize: '1rem', fontWeight: 900 }}>{pos + 1}</span>}
            </button>
          );
        })}
      </div>
      {feedback && <p className={feedback === 'correct' ? styles.feedbackOk : styles.feedbackBad}>{feedback === 'correct' ? '✓ Correct order!' : `The correct order is: ${targetOrder.map(idx => items[idx].label).join(' → ')}`}</p>}
    </div>
  );
}
