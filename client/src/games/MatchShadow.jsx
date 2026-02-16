/**
 * MatchShadow - Match colored object with its grayscale/dark silhouette.
 * Uses Twemoji + CSS filter for shadows. Cognitive / Premium
 */
import { useState, useEffect, useRef } from 'react';
import styles from './GameCommon.module.css';
import { useAudio } from '../context/AudioContext';
import { getRounds, getChoiceCount, getFeedbackDelay } from './levelConfig';
import { useTeaching } from './useTeaching';
import { useNoRepeat } from './useNoRepeat';

const TWEMOJI = (cp) => `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/${cp}.svg`;

const SHADOW_ITEMS = [
  { name: 'apple', img: TWEMOJI('1f34e'), label: 'Apple' },
  { name: 'banana', img: TWEMOJI('1f34c'), label: 'Banana' },
  { name: 'orange', img: TWEMOJI('1f34a'), label: 'Orange' },
  { name: 'strawberry', img: TWEMOJI('1f353'), label: 'Strawberry' },
  { name: 'grape', img: TWEMOJI('1f347'), label: 'Grapes' },
  { name: 'watermelon', img: TWEMOJI('1f349'), label: 'Watermelon' },
  { name: 'cherry', img: TWEMOJI('1f352'), label: 'Cherry' },
  { name: 'peach', img: TWEMOJI('1f351'), label: 'Peach' },
  { name: 'lemon', img: TWEMOJI('1f34b'), label: 'Lemon' },
  { name: 'carrot', img: TWEMOJI('1f955'), label: 'Carrot' },
  { name: 'broccoli', img: TWEMOJI('1f966'), label: 'Broccoli' },
  { name: 'cat', img: TWEMOJI('1f431'), label: 'Cat' },
  { name: 'dog', img: TWEMOJI('1f436'), label: 'Dog' },
  { name: 'rabbit', img: TWEMOJI('1f430'), label: 'Rabbit' },
  { name: 'bear', img: TWEMOJI('1f43b'), label: 'Bear' },
  { name: 'elephant', img: TWEMOJI('1f418'), label: 'Elephant' },
  { name: 'lion', img: TWEMOJI('1f981'), label: 'Lion' },
  { name: 'fish', img: TWEMOJI('1f41f'), label: 'Fish' },
  { name: 'bird', img: TWEMOJI('1f426'), label: 'Bird' },
  { name: 'butterfly', img: TWEMOJI('1f98b'), label: 'Butterfly' },
  { name: 'bee', img: TWEMOJI('1f41d'), label: 'Bee' },
  { name: 'star', img: TWEMOJI('2b50'), label: 'Star' },
  { name: 'heart', img: TWEMOJI('2764'), label: 'Heart' },
  { name: 'sun', img: TWEMOJI('2600'), label: 'Sun' },
  { name: 'moon', img: TWEMOJI('1f319'), label: 'Moon' },
  { name: 'cloud', img: TWEMOJI('2601'), label: 'Cloud' },
  { name: 'flower', img: TWEMOJI('1f338'), label: 'Flower' },
  { name: 'tree', img: TWEMOJI('1f333'), label: 'Tree' },
  { name: 'ball', img: TWEMOJI('26bd'), label: 'Ball' },
  { name: 'balloon', img: TWEMOJI('1f388'), label: 'Balloon' },
  { name: 'house', img: TWEMOJI('1f3e0'), label: 'House' },
  { name: 'car', img: TWEMOJI('1f697'), label: 'Car' },
  { name: 'boat', img: TWEMOJI('1f6a3'), label: 'Boat' },
  { name: 'plane', img: TWEMOJI('2708'), label: 'Plane' },
  { name: 'book', img: TWEMOJI('1f4d6'), label: 'Book' },
  { name: 'cup', img: TWEMOJI('1f375'), label: 'Cup' },
  { name: 'chair', img: TWEMOJI('1f4ba'), label: 'Chair' },
];

function getPool(level) {
  if (level <= 5) return SHADOW_ITEMS.slice(0, 12);
  if (level <= 15) return SHADOW_ITEMS.slice(0, 24);
  return SHADOW_ITEMS;
}

export default function MatchShadow({ onComplete, level = 1, childAge }) {
  const { playSuccess, playWrong, playClick } = useAudio();
  const { teachAfterAnswer, readQuestion } = useTeaching();
  const { generate } = useNoRepeat();
  const [round, setRound] = useState(0);
  const [target, setTarget] = useState(null);
  const [choices, setChoices] = useState([]);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [selected, setSelected] = useState(null);
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
    const pool = getPool(level);
    const t = generate(() => pool[Math.floor(Math.random() * pool.length)], (r) => r.name);
    const opts = new Set([t]);
    while (opts.size < Math.min(CHOICES, pool.length)) {
      opts.add(pool[Math.floor(Math.random() * pool.length)]);
    }
    setTarget(t);
    setChoices([...opts].sort(() => Math.random() - 0.5));
    setFeedback(null);
    setSelected(null);
    const cancelRead = readQuestion('Which one matches this shadow?');
    return cancelRead;
  }, [round, ROUNDS, level, CHOICES, generate]);

  function handleChoice(item) {
    if (feedback !== null) return;
    playClick();
    setSelected(item.name);
    const correct = item.name === target?.name;
    if (correct) setScore((s) => s + 1);
    else playWrong();
    if (correct) playSuccess();
    setFeedback(correct ? 'correct' : 'wrong');
    teachAfterAnswer(correct, { type: 'shape', correctAnswer: target?.label, extra: `It's a ${target?.label}!` });
    const delay = getFeedbackDelay(level, correct);
    setTimeout(() => setRound((r) => r + 1), delay);
  }

  if (round >= ROUNDS) return <div className={styles.container}><p className={styles.prompt}>Calculating rewards...</p></div>;

  if (!target) return null;

  return (
    <div className={styles.container}>
      <div className={styles.progress}>
        <span>Lv {level} · {round + 1}/{ROUNDS}</span><span>·</span><span>⭐ {score}</span>
      </div>
      <p className={styles.prompt}>Which one matches this shadow?</p>
      <div className={styles.targetArea} style={{ marginBottom: '1.5rem' }}>
        <img src={target.img} alt="shadow" style={{ width: 80, height: 80, filter: 'grayscale(1) brightness(0.3) contrast(1.2)', objectFit: 'contain' }} />
      </div>
      <div className={styles.choices}>
        {choices.map((item) => {
          let btnClass = styles.choiceBtn;
          if (feedback && selected === item.name) btnClass += item.name === target.name ? ` ${styles.correct}` : ` ${styles.wrong}`;
          if (feedback && feedback === 'wrong' && item.name === target.name) btnClass += ` ${styles.correct}`;
          return (
            <button key={item.name} type="button" onClick={() => handleChoice(item)} className={btnClass} disabled={feedback !== null} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
              <img src={item.img} alt={item.label} style={{ width: 48, height: 48, objectFit: 'contain' }} />
              <span style={{ fontSize: '0.7rem', fontWeight: 700 }}>{item.label}</span>
            </button>
          );
        })}
      </div>
      {feedback === 'correct' && <p className={styles.feedbackOk}>✓ Correct!</p>}
      {feedback === 'wrong' && (
        <div className={styles.feedbackBad}>
          <p>✗ The answer is <strong>{target?.label}</strong></p>
        </div>
      )}
    </div>
  );
}
