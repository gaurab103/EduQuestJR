/**
 * CompareWeight - Kids learn about weight/mass.
 * "Which is heavier: elephant or cat?" Higher levels: order from lightest to heaviest.
 * Cognitive / Free
 */
import { useState, useEffect, useRef } from 'react';
import styles from './GameCommon.module.css';
import { useAudio } from '../context/AudioContext';
import { getRounds, getChoiceCount, getFeedbackDelay } from './levelConfig';
import { useTeaching } from './useTeaching';
import { useNoRepeat } from './useNoRepeat';

const TWEMOJI = (cp) => `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/${cp}.svg`;

const WEIGHT_PAIRS = [
  { heavy: { name: 'elephant', img: TWEMOJI('1f418'), label: 'Elephant' }, light: { name: 'cat', img: TWEMOJI('1f431'), label: 'Cat' } },
  { heavy: { name: 'whale', img: TWEMOJI('1f433'), label: 'Whale' }, light: { name: 'fish', img: TWEMOJI('1f41f'), label: 'Fish' } },
  { heavy: { name: 'car', img: TWEMOJI('1f697'), label: 'Car' }, light: { name: 'balloon', img: TWEMOJI('1f388'), label: 'Balloon' } },
  { heavy: { name: 'rock', img: TWEMOJI('1faa8'), label: 'Rock' }, light: { name: 'feather', img: TWEMOJI('1fab6'), label: 'Feather' } },
  { heavy: { name: 'bear', img: TWEMOJI('1f43b'), label: 'Bear' }, light: { name: 'mouse', img: TWEMOJI('1f42d'), label: 'Mouse' } },
  { heavy: { name: 'dinosaur', img: TWEMOJI('1f995'), label: 'Dinosaur' }, light: { name: 'ant', img: TWEMOJI('1f41c'), label: 'Ant' } },
  { heavy: { name: 'truck', img: TWEMOJI('1f69b'), label: 'Truck' }, light: { name: 'bicycle', img: TWEMOJI('1f6b2'), label: 'Bicycle' } },
  { heavy: { name: 'lion', img: TWEMOJI('1f981'), label: 'Lion' }, light: { name: 'butterfly', img: TWEMOJI('1f98b'), label: 'Butterfly' } },
  { heavy: { name: 'cow', img: TWEMOJI('1f404'), label: 'Cow' }, light: { name: 'chick', img: TWEMOJI('1f425'), label: 'Chick' } },
  { heavy: { name: 'whale', img: TWEMOJI('1f433'), label: 'Whale' }, light: { name: 'duck', img: TWEMOJI('1f986'), label: 'Duck' } },
  { heavy: { name: 'elephant', img: TWEMOJI('1f418'), label: 'Elephant' }, light: { name: 'rabbit', img: TWEMOJI('1f430'), label: 'Rabbit' } },
  { heavy: { name: 'horse', img: TWEMOJI('1f434'), label: 'Horse' }, light: { name: 'bee', img: TWEMOJI('1f41d'), label: 'Bee' } },
  { heavy: { name: 'refrigerator', img: TWEMOJI('1f9ec'), label: 'Refrigerator' }, light: { name: 'apple', img: TWEMOJI('1f34e'), label: 'Apple' } },
  { heavy: { name: 'bookcase', img: TWEMOJI('1f9fa'), label: 'Bookshelf' }, light: { name: 'book', img: TWEMOJI('1f4d6'), label: 'Book' } },
  { heavy: { name: 'tiger', img: TWEMOJI('1f42f'), label: 'Tiger' }, light: { name: 'ladybug', img: TWEMOJI('1f41e'), label: 'Ladybug' } },
  { heavy: { name: 'hippopotamus', img: TWEMOJI('1f99b'), label: 'Hippo' }, light: { name: 'bird', img: TWEMOJI('1f426'), label: 'Bird' } },
  { heavy: { name: 'piano', img: TWEMOJI('1f3b8'), label: 'Piano' }, light: { name: 'bell', img: TWEMOJI('1f514'), label: 'Bell' } },
  { heavy: { name: 'tree', img: TWEMOJI('1f333'), label: 'Tree' }, light: { name: 'flower', img: TWEMOJI('1f338'), label: 'Flower' } },
  { heavy: { name: 'panda', img: TWEMOJI('1f43c'), label: 'Panda' }, light: { name: 'frog', img: TWEMOJI('1f438'), label: 'Frog' } },
  { heavy: { name: 'soccer ball', img: TWEMOJI('26bd'), label: 'Soccer Ball' }, light: { name: 'balloon', img: TWEMOJI('1f388'), label: 'Balloon' } },
  { heavy: { name: 'ship', img: TWEMOJI('1f6a2'), label: 'Ship' }, light: { name: 'paper boat', img: TWEMOJI('1f6a3'), label: 'Sailboat' } },
  { heavy: { name: 'turtle', img: TWEMOJI('1f422'), label: 'Turtle' }, light: { name: 'snail', img: TWEMOJI('1f40c'), label: 'Snail' } },
  { heavy: { name: 'koala', img: TWEMOJI('1f428'), label: 'Koala' }, light: { name: 'caterpillar', img: TWEMOJI('1f41b'), label: 'Caterpillar' } },
  { heavy: { name: 'dolphin', img: TWEMOJI('1f42c'), label: 'Dolphin' }, light: { name: 'goldfish', img: TWEMOJI('1f420'), label: 'Fish' } },
  { heavy: { name: 'penguin', img: TWEMOJI('1f427'), label: 'Penguin' }, light: { name: 'hummingbird', img: TWEMOJI('1f985'), label: 'Eagle' } },
  { heavy: { name: 'monkey', img: TWEMOJI('1f435'), label: 'Monkey' }, light: { name: 'spider', img: TWEMOJI('1f577'), label: 'Spider' } },
  { heavy: { name: 'owl', img: TWEMOJI('1f989'), label: 'Owl' }, light: { name: 'squirrel', img: TWEMOJI('1f43f'), label: 'Squirrel' } },
  { heavy: { name: 'parrot', img: TWEMOJI('1f99c'), label: 'Parrot' }, light: { name: 'worm', img: TWEMOJI('1f41b'), label: 'Worm' } },
  { heavy: { name: 'octopus', img: TWEMOJI('1f419'), label: 'Octopus' }, light: { name: 'starfish', img: TWEMOJI('1f31f'), label: 'Star' } },
  { heavy: { name: 'crab', img: TWEMOJI('1f980'), label: 'Crab' }, light: { name: 'shell', img: TWEMOJI('1f41a'), label: 'Shell' } },
  { heavy: { name: 'watering can', img: TWEMOJI('1f337'), label: 'Watering Can' }, light: { name: 'leaf', img: TWEMOJI('1f343'), label: 'Leaf' } },
];

const ORDER_SETS = [
  [{ name: 'ant', img: TWEMOJI('1f41c'), label: 'Ant' }, { name: 'mouse', img: TWEMOJI('1f42d'), label: 'Mouse' }, { name: 'cat', img: TWEMOJI('1f431'), label: 'Cat' }, { name: 'elephant', img: TWEMOJI('1f418'), label: 'Elephant' }],
  [{ name: 'feather', img: TWEMOJI('1fab6'), label: 'Feather' }, { name: 'balloon', img: TWEMOJI('1f388'), label: 'Balloon' }, { name: 'apple', img: TWEMOJI('1f34e'), label: 'Apple' }, { name: 'rock', img: TWEMOJI('1faa8'), label: 'Rock' }],
  [{ name: 'bee', img: TWEMOJI('1f41d'), label: 'Bee' }, { name: 'rabbit', img: TWEMOJI('1f430'), label: 'Rabbit' }, { name: 'dog', img: TWEMOJI('1f436'), label: 'Dog' }, { name: 'horse', img: TWEMOJI('1f434'), label: 'Horse' }],
  [{ name: 'book', img: TWEMOJI('1f4d6'), label: 'Book' }, { name: 'ball', img: TWEMOJI('26bd'), label: 'Ball' }, { name: 'bicycle', img: TWEMOJI('1f6b2'), label: 'Bicycle' }, { name: 'car', img: TWEMOJI('1f697'), label: 'Car' }],
  [{ name: 'chick', img: TWEMOJI('1f425'), label: 'Chick' }, { name: 'chicken', img: TWEMOJI('1f414'), label: 'Chicken' }, { name: 'pig', img: TWEMOJI('1f437'), label: 'Pig' }, { name: 'cow', img: TWEMOJI('1f404'), label: 'Cow' }],
  [{ name: 'ladybug', img: TWEMOJI('1f41e'), label: 'Ladybug' }, { name: 'frog', img: TWEMOJI('1f438'), label: 'Frog' }, { name: 'turtle', img: TWEMOJI('1f422'), label: 'Turtle' }, { name: 'whale', img: TWEMOJI('1f433'), label: 'Whale' }],
  [{ name: 'butterfly', img: TWEMOJI('1f98b'), label: 'Butterfly' }, { name: 'bird', img: TWEMOJI('1f426'), label: 'Bird' }, { name: 'owl', img: TWEMOJI('1f989'), label: 'Owl' }, { name: 'penguin', img: TWEMOJI('1f427'), label: 'Penguin' }],
  [{ name: 'flower', img: TWEMOJI('1f338'), label: 'Flower' }, { name: 'tree', img: TWEMOJI('1f333'), label: 'Tree' }],
  [{ name: 'fish', img: TWEMOJI('1f41f'), label: 'Fish' }, { name: 'dolphin', img: TWEMOJI('1f42c'), label: 'Dolphin' }, { name: 'whale', img: TWEMOJI('1f433'), label: 'Whale' }],
  [{ name: 'snail', img: TWEMOJI('1f40c'), label: 'Snail' }, { name: 'cat', img: TWEMOJI('1f431'), label: 'Cat' }, { name: 'lion', img: TWEMOJI('1f981'), label: 'Lion' }],
];

function getMode(level, round) {
  if (level <= 5) return 0;
  if (level <= 10) return round % 2;
  if (level <= 15) return round % 3;
  return round % 4;
}

export default function CompareWeight({ onComplete, level = 1, childAge }) {
  const { playSuccess, playWrong, playClick } = useAudio();
  const { teachAfterAnswer, readQuestion, getRecommendedDelayBeforeNext } = useTeaching();
  const { generate } = useNoRepeat(level);
  const [round, setRound] = useState(0);
  const [pair, setPair] = useState(null);
  const [orderSet, setOrderSet] = useState(null);
  const [askHeavier, setAskHeavier] = useState(true);
  const [askSmallestFirst, setAskSmallestFirst] = useState(true);
  const [swapped, setSwapped] = useState(false);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [mode, setModeState] = useState(0);
  const [selectedOrder, setSelectedOrder] = useState([]);
  const completedRef = useRef(false);
  const ROUNDS = getRounds(level);
  const CHOICES = getChoiceCount(level);

  useEffect(() => {
    window.speechSynthesis?.cancel();
    if (round >= ROUNDS && !completedRef.current) {
      completedRef.current = true;
      onComplete(score, Math.round((score / ROUNDS) * 100));
      return;
    }
    const m = getMode(level, round);
    setModeState(m);

    if (m <= 1) {
      const p = generate(() => WEIGHT_PAIRS[Math.floor(Math.random() * WEIGHT_PAIRS.length)], (r) => `${r.heavy.name}-${r.light.name}`);
      setPair(p);
      setOrderSet(null);
      setAskHeavier(m === 0);
      setSwapped(Math.random() > 0.5);
      setFeedback(null);
      const q = m === 0 ? 'Which is heavier?' : 'Which is lighter?';
      const cancelRead = readQuestion(q);
      return cancelRead;
    }

    if (m === 2 || m === 3) {
      const itemCount = level <= 10 ? 3 : 4;
      const set = generate(
        () => {
          const s = ORDER_SETS[Math.floor(Math.random() * ORDER_SETS.length)];
          return s.length >= itemCount ? s.slice(0, itemCount) : s;
        },
        (r) => r.map((x) => x.name).join('-')
      );
      setOrderSet(set);
      setAskSmallestFirst(m === 2);
      setPair(null);
      setSelectedOrder([]);
      setFeedback(null);
      const q = m === 2 ? 'Tap from lightest to heaviest!' : 'Tap from heaviest to lightest!';
      const cancelRead = readQuestion(q);
      return cancelRead;
    }

    setFeedback(null);
  }, [round, ROUNDS, level, generate]);

  function handlePick(choice) {
    if (feedback !== null) return;
    playClick();
    const isHeavy = swapped ? choice === 'right' : choice === 'left';
    const correct = askHeavier ? isHeavy : !isHeavy;
    if (correct) {
      setScore((s) => s + 1);
      playSuccess();
    } else playWrong();
    setFeedback(correct ? 'correct' : 'wrong');
    const correctItem = askHeavier ? pair?.heavy : pair?.light;
    teachAfterAnswer(correct, { type: 'animal', correctAnswer: correctItem?.label, extra: `${correctItem?.label} is ${askHeavier ? 'heavier' : 'lighter'}!` });
    const delay = getRecommendedDelayBeforeNext(getFeedbackDelay(level, correct));
    setTimeout(() => setRound((r) => r + 1), delay);
  }

  function handleOrderTap(idx) {
    if (feedback !== null || !orderSet) return;
    if (selectedOrder.includes(idx)) return;
    playClick();
    const next = [...selectedOrder, idx];
    setSelectedOrder(next);
    if (next.length === orderSet.length) {
      const targetOrder = askSmallestFirst ? [...Array(orderSet.length).keys()] : [...Array(orderSet.length).keys()].reverse();
      const userOrder = next;
      const correct = JSON.stringify(userOrder) === JSON.stringify(targetOrder);
      if (correct) {
        setScore((s) => s + 1);
        playSuccess();
      } else playWrong();
      setFeedback(correct ? 'correct' : 'wrong');
      teachAfterAnswer(correct, { type: 'word', correctAnswer: orderSet.map((x) => x.label).join(', '), extra: 'Great job thinking about weight!' });
      const delay = getRecommendedDelayBeforeNext(getFeedbackDelay(level, correct));
      setTimeout(() => setRound((r) => r + 1), delay);
    }
  }

  if (round >= ROUNDS) return <div className={styles.container}><p className={styles.prompt}>Calculating rewards...</p></div>;

  if (mode <= 1 && pair) {
    const leftItem = swapped ? pair.light : pair.heavy;
    const rightItem = swapped ? pair.heavy : pair.light;
    const leftCorrect = (askHeavier && leftItem === pair.heavy) || (!askHeavier && leftItem === pair.light);
    const rightCorrect = (askHeavier && rightItem === pair.heavy) || (!askHeavier && rightItem === pair.light);
    return (
      <div className={styles.container}>
        <div className={styles.progress}>
          <span>Lv {level} · {round + 1}/{ROUNDS}</span><span>·</span><span>⭐ {score}</span>
        </div>
        <p className={styles.prompt}>{askHeavier ? 'Which is heavier?' : 'Which is lighter?'}</p>
        <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', alignItems: 'flex-end', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <button type="button" onClick={() => handlePick('left')} className={`${styles.choiceBtn} ${feedback !== null ? (leftCorrect ? styles.correct : styles.wrong) : ''}`} disabled={feedback !== null} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
            <img src={leftItem.img} alt={leftItem.label} style={{ width: 64, height: 64 }} />
            <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>{leftItem.label}</span>
          </button>
          <button type="button" onClick={() => handlePick('right')} className={`${styles.choiceBtn} ${feedback !== null ? (rightCorrect ? styles.correct : styles.wrong) : ''}`} disabled={feedback !== null} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
            <img src={rightItem.img} alt={rightItem.label} style={{ width: 64, height: 64 }} />
            <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>{rightItem.label}</span>
          </button>
        </div>
        {feedback && <p className={feedback === 'correct' ? styles.feedbackOk : styles.feedbackBad}>{feedback === 'correct' ? '✓ Correct!' : `The correct answer is ${(askHeavier ? pair?.heavy : pair?.light)?.label} — it's ${askHeavier ? 'heavier' : 'lighter'}!`}</p>}
      </div>
    );
  }

  if ((mode === 2 || mode === 3) && orderSet) {
    const targetOrder = askSmallestFirst ? [...Array(orderSet.length).keys()] : [...Array(orderSet.length).keys()].reverse();
    const isComplete = selectedOrder.length === orderSet.length;
    const correct = isComplete && JSON.stringify(selectedOrder) === JSON.stringify(targetOrder);
    return (
      <div className={styles.container}>
        <div className={styles.progress}>
          <span>Lv {level} · {round + 1}/{ROUNDS}</span><span>·</span><span>⭐ {score}</span>
        </div>
        <p className={styles.prompt}>{askSmallestFirst ? 'Tap from lightest to heaviest!' : 'Tap from heaviest to lightest!'}</p>
        <div className={styles.choices} style={{ marginBottom: '1.5rem' }}>
          {orderSet.map((item, idx) => {
            const pos = selectedOrder.indexOf(idx);
            const done = feedback !== null;
            let borderClass = '';
            if (done && pos >= 0) borderClass = pos === targetOrder.indexOf(idx) ? styles.correct : styles.wrong;
            return (
              <button key={idx} type="button" onClick={() => handleOrderTap(idx)} className={`${styles.choiceBtn} ${borderClass}`} disabled={done} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                <img src={item.img} alt={item.label} style={{ width: 48, height: 48 }} />
                <span style={{ fontSize: '0.7rem', fontWeight: 700 }}>{item.label}</span>
                {pos >= 0 && <span style={{ fontSize: '1rem', fontWeight: 900 }}>{pos + 1}</span>}
              </button>
            );
          })}
        </div>
        {feedback && <p className={feedback === 'correct' ? styles.feedbackOk : styles.feedbackBad}>{feedback === 'correct' ? '✓ Correct order!' : `The correct order is: ${targetOrder.map(idx => orderSet[idx].label).join(' → ')}`}</p>}
      </div>
    );
  }

  return null;
}
