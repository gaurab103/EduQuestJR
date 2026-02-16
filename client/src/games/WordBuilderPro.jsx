/**
 * Word Builder Pro - PREMIUM
 * Unique mechanic: Visual clue + letter slots. Kid taps letters from a
 * tray into blank slots to build the word. Wrong letters bounce back.
 * Different from FillMissingLetter (1 blank) -- this builds ENTIRE words.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { useAudio } from '../context/AudioContext';
import { useTeaching } from './useTeaching';
import { useNoRepeat } from './useNoRepeat';
import { getRounds, getFeedbackDelay } from './levelConfig';
import { GameImage, ANIMAL_IMAGES, FRUIT_IMAGES, OBJECT_IMAGES } from './gameImages';
import styles from './GameCommon.module.css';

const WORDS_3 = [
  { word: 'cat', img: ANIMAL_IMAGES.cat, hint: 'A furry pet that says meow' },
  { word: 'dog', img: ANIMAL_IMAGES.dog, hint: 'A pet that barks' },
  { word: 'sun', img: OBJECT_IMAGES.sun, hint: 'It shines in the sky' },
  { word: 'hat', img: OBJECT_IMAGES.hat, hint: 'You wear it on your head' },
  { word: 'cup', img: OBJECT_IMAGES.cup, hint: 'You drink from it' },
  { word: 'pen', img: OBJECT_IMAGES.pen, hint: 'You write with it' },
  { word: 'bus', img: OBJECT_IMAGES.bus, hint: 'A big vehicle for passengers' },
  { word: 'bee', img: ANIMAL_IMAGES.bee, hint: 'A buzzing insect that makes honey' },
  { word: 'pig', img: ANIMAL_IMAGES.pig, hint: 'A pink farm animal' },
  { word: 'fox', img: ANIMAL_IMAGES.fox, hint: 'A clever orange animal' },
];
const WORDS_4 = [
  { word: 'fish', img: ANIMAL_IMAGES.fish, hint: 'It swims in water' },
  { word: 'bird', img: ANIMAL_IMAGES.bird, hint: 'It flies in the sky' },
  { word: 'tree', img: OBJECT_IMAGES.tree, hint: 'It has leaves and branches' },
  { word: 'star', img: OBJECT_IMAGES.star, hint: 'It twinkles at night' },
  { word: 'frog', img: ANIMAL_IMAGES.frog, hint: 'A green animal that hops' },
  { word: 'bear', img: ANIMAL_IMAGES.bear, hint: 'A big furry animal' },
  { word: 'duck', img: ANIMAL_IMAGES.duck, hint: 'It swims and says quack' },
  { word: 'moon', img: OBJECT_IMAGES.moon, hint: 'You see it at night' },
  { word: 'lion', img: ANIMAL_IMAGES.lion, hint: 'The king of the jungle' },
  { word: 'cake', img: OBJECT_IMAGES.cake, hint: 'A sweet birthday treat' },
];
const WORDS_5 = [
  { word: 'apple', img: FRUIT_IMAGES.apple, hint: 'A round red fruit' },
  { word: 'house', img: OBJECT_IMAGES.house, hint: 'You live in it' },
  { word: 'whale', img: ANIMAL_IMAGES.whale, hint: 'The biggest ocean animal' },
  { word: 'grape', img: FRUIT_IMAGES.grapes, hint: 'Small purple fruits in bunches' },
  { word: 'mouse', img: ANIMAL_IMAGES.mouse, hint: 'A tiny animal that squeaks' },
  { word: 'horse', img: ANIMAL_IMAGES.horse, hint: 'You can ride this animal' },
  { word: 'cloud', img: OBJECT_IMAGES.cloud, hint: 'White and fluffy in the sky' },
  { word: 'water', img: OBJECT_IMAGES.water, hint: 'You drink it every day' },
  { word: 'train', img: OBJECT_IMAGES.train, hint: 'It rides on tracks' },
  { word: 'lemon', img: FRUIT_IMAGES.lemon, hint: 'A sour yellow fruit' },
];
const WORDS_6 = [
  { word: 'banana', img: FRUIT_IMAGES.banana, hint: 'A long yellow fruit' },
  { word: 'flower', img: OBJECT_IMAGES.flower, hint: 'It grows in a garden and smells nice' },
  { word: 'monkey', img: ANIMAL_IMAGES.monkey, hint: 'A smart animal that climbs trees' },
  { word: 'rabbit', img: ANIMAL_IMAGES.rabbit, hint: 'It has long ears and hops' },
  { word: 'turtle', img: ANIMAL_IMAGES.turtle, hint: 'A slow animal with a shell' },
  { word: 'spider', img: ANIMAL_IMAGES.spider, hint: 'It spins a web' },
  { word: 'orange', img: FRUIT_IMAGES.orange, hint: 'A round citrus fruit' },
  { word: 'garden', img: OBJECT_IMAGES.tree, hint: 'Plants grow here' },
];

function getPool(level) {
  if (level <= 6) return WORDS_3;
  if (level <= 12) return WORDS_4;
  if (level <= 20) return WORDS_5;
  return WORDS_6;
}

function generateExtraLetters(word, count) {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz';
  const extras = [];
  const wordLetters = new Set(word.split(''));
  while (extras.length < count) {
    const l = alphabet[Math.floor(Math.random() * 26)];
    if (!wordLetters.has(l) && !extras.includes(l)) extras.push(l);
  }
  return extras;
}

export default function WordBuilderPro({ onComplete, level = 1, childName }) {
  const { playSuccess, playWrong, playClick, playCelebration } = useAudio();
  const { teachAfterAnswer, readQuestion } = useTeaching();
  const { generate } = useNoRepeat();
  const [round, setRound] = useState(0);
  const [item, setItem] = useState(null);
  const [tray, setTray] = useState([]);
  const [slots, setSlots] = useState([]);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [wrongFlash, setWrongFlash] = useState(null);
  const completedRef = useRef(false);
  const ROUNDS = getRounds(level);

  useEffect(() => {
    window.speechSynthesis?.cancel();
    if (round >= ROUNDS && !completedRef.current) {
      completedRef.current = true;
      playCelebration();
      const accuracy = ROUNDS > 0 ? Math.round((correct / ROUNDS) * 100) : 0;
      onComplete(score, accuracy);
      return;
    }
    const pool = getPool(level);
    const w = generate(() => pool[Math.floor(Math.random() * pool.length)], (w) => w.word);
    setItem(w);
    const extraCount = Math.min(Math.floor(level / 5) + 1, 4);
    const extras = generateExtraLetters(w.word, extraCount);
    const allLetters = [...w.word.split(''), ...extras].sort(() => Math.random() - 0.5);
    setTray(allLetters.map((l, i) => ({ letter: l, id: i, used: false })));
    setSlots(Array(w.word.length).fill(null));
    setFeedback(null);
    setWrongFlash(null);
    const cancelRead = readQuestion(`Build the word! Hint: ${w.hint}`);
    return cancelRead;
  }, [round]);

  const handleLetterTap = useCallback((trayItem) => {
    if (feedback || trayItem.used) return;
    playClick();

    const nextSlot = slots.findIndex(s => s === null);
    if (nextSlot === -1) return;

    const expectedLetter = item.word[nextSlot];
    if (trayItem.letter === expectedLetter) {
      const newSlots = [...slots];
      newSlots[nextSlot] = trayItem.letter;
      setSlots(newSlots);
      setTray(prev => prev.map(t => t.id === trayItem.id ? { ...t, used: true } : t));

      if (newSlots.every(s => s !== null)) {
        setScore(s => s + 10);
        setCorrect(c => c + 1);
        playSuccess();
        setFeedback('correct');
        teachAfterAnswer(true, { type: 'word', correctAnswer: item.word, extra: `You spelled "${item.word}"! ${item.hint}.` });
        const delay = getFeedbackDelay(level, true);
        setTimeout(() => setRound(r => r + 1), delay);
      }
    } else {
      playWrong();
      setWrongFlash(trayItem.id);
      teachAfterAnswer(false, { type: 'letter', answer: trayItem.letter, correctAnswer: expectedLetter, extra: `The next letter in "${item.word}" is "${expectedLetter}".` });
      setTimeout(() => setWrongFlash(null), 800);
    }
  }, [slots, tray, item, feedback, level]);

  if (round >= ROUNDS) {
    const accuracy = ROUNDS > 0 ? Math.round((correct / ROUNDS) * 100) : 0;
    return (
      <div className={styles.container}>
        <div className={styles.celebration}>
          <h2>Word Builder!</h2>
          <p style={{ fontSize: '1.1rem', fontWeight: 700 }}>Score: {score}</p>
          <span style={{ color: 'var(--text-muted)', fontWeight: 800 }}>Accuracy: {accuracy}%</span>
        </div>
      </div>
    );
  }

  if (!item) return null;

  return (
    <div className={styles.container}>
      <div className={styles.hud}>
        <span>Lv {level}</span><span>·</span>
        <span>{round + 1}/{ROUNDS}</span><span>·</span>
        <span>Score: {score}</span>
      </div>

      <div style={{ margin: '0.5rem 0' }}>
        <GameImage src={item.img} alt={item.word} size={64} />
      </div>
      <p className={styles.prompt} style={{ fontSize: '0.85rem' }}>{item.hint}</p>

      {/* Letter slots */}
      <div style={{
        display: 'flex', gap: 6, justifyContent: 'center', margin: '1rem 0',
      }}>
        {slots.map((letter, i) => (
          <div key={i} style={{
            width: 44, height: 52, borderRadius: 10,
            border: `2.5px ${letter ? 'solid #22c55e' : 'dashed var(--card-border)'}`,
            background: letter ? 'rgba(34,197,94,0.1)' : 'var(--card-bg)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.5rem', fontWeight: 800, textTransform: 'uppercase',
            color: letter ? '#22c55e' : 'var(--text-muted)',
            transition: 'all 0.2s',
          }}>
            {letter || (i + 1)}
          </div>
        ))}
      </div>

      {/* Letter tray */}
      <div style={{
        display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap',
        marginTop: '0.5rem',
      }}>
        {tray.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => handleLetterTap(t)}
            disabled={t.used || !!feedback}
            className={styles.choiceBtn}
            style={{
              width: 48, height: 52, fontSize: '1.3rem', fontWeight: 800,
              textTransform: 'uppercase', padding: 0,
              opacity: t.used ? 0.2 : 1,
              background: wrongFlash === t.id ? '#fca5a5' : undefined,
              transform: wrongFlash === t.id ? 'translateX(4px)' : 'none',
              transition: 'all 0.15s',
            }}
          >
            {t.letter}
          </button>
        ))}
      </div>

      {feedback === 'correct' && <p className={styles.feedbackOk}>"{item.word}" - Perfect!</p>}
    </div>
  );
}
