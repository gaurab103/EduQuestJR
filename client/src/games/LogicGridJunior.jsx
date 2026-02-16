/**
 * Logic Grid Junior - PREMIUM
 * Academic focus: Clue-based deduction to build reading comprehension,
 * logical reasoning, and classification. Each puzzle teaches a real skill:
 * animal habitats, ordinal numbers, size comparison, sequencing.
 */
import { useState, useEffect, useRef } from 'react';
import { useAudio } from '../context/AudioContext';
import { useTeaching } from './useTeaching';
import { useNoRepeat } from './useNoRepeat';
import { getRounds, getFeedbackDelay } from './levelConfig';
import styles from './GameCommon.module.css';

const TWEMOJI = (cp) => `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/${cp}.svg`;

// skill: academic focus for teaching feedback
const PUZZLES_2x2 = [
  {
    skill: 'Animal Habitats',
    items: [{ name: 'Fish', emoji: '1f41f' }, { name: 'Bird', emoji: '1f426' }],
    slots: [{ label: 'In Water', color: '#3b82f6' }, { label: 'In the Sky', color: '#38bdf8' }],
    solution: [0, 1],
    clues: ['Fish swim in water.', 'Birds fly in the sky.'],
  },
  {
    skill: 'Animal Habitats',
    items: [{ name: 'Rabbit', emoji: '1f430' }, { name: 'Fish', emoji: '1f41f' }],
    slots: [{ label: 'On Land', color: '#22c55e' }, { label: 'In Water', color: '#3b82f6' }],
    solution: [0, 1],
    clues: ['Rabbits hop on land.', 'Fish live in water.'],
  },
  {
    skill: 'Ordinal Numbers',
    items: [{ name: 'Gold', emoji: '1f947' }, { name: 'Silver', emoji: '1f948' }],
    slots: [{ label: '1st place', color: '#ef4444' }, { label: '2nd place', color: '#94a3b8' }],
    solution: [0, 1],
    clues: ['Gold medal is first place.', 'Silver medal is second place.'],
  },
  {
    skill: 'Position Words',
    items: [{ name: 'Sun', emoji: '2600' }, { name: 'Moon', emoji: '1f319' }],
    slots: [{ label: 'Day', color: '#eab308' }, { label: 'Night', color: '#6366f1' }],
    solution: [0, 1],
    clues: ['The sun shines in the day.', 'The moon comes out at night.'],
  },
  {
    skill: 'Size Comparison',
    items: [{ name: 'Big', emoji: '1f4a5' }, { name: 'Small', emoji: '2e2e' }],
    slots: [{ label: 'Elephant', color: '#94a3b8' }, { label: 'Ant', color: '#78716c' }],
    solution: [0, 1],
    clues: ['The elephant is big.', 'The ant is small.'],
  },
  {
    skill: 'Classification',
    items: [{ name: 'Apple', emoji: '1f34e' }, { name: 'Carrot', emoji: '1f955' }],
    slots: [{ label: 'Fruit', color: '#ef4444' }, { label: 'Vegetable', color: '#22c55e' }],
    solution: [0, 1],
    clues: ['An apple is a fruit.', 'A carrot is a vegetable.'],
  },
];

const PUZZLES_3 = [
  {
    skill: 'Animal Habitats',
    items: [{ name: 'Bear', emoji: '1f43b' }, { name: 'Rabbit', emoji: '1f430' }, { name: 'Frog', emoji: '1f438' }],
    slots: [{ label: 'Cave', color: '#92400e' }, { label: 'Burrow', color: '#a16207' }, { label: 'Pond', color: '#22c55e' }],
    solution: [0, 1, 2],
    clues: ['Bears live in caves.', 'Rabbits live in burrows.', 'Frogs live near ponds.'],
  },
  {
    skill: 'Ordinal Numbers',
    items: [{ name: '1st', emoji: '1f947' }, { name: '2nd', emoji: '1f948' }, { name: '3rd', emoji: '1f949' }],
    slots: [{ label: 'First', color: '#ef4444' }, { label: 'Second', color: '#eab308' }, { label: 'Third', color: '#22c55e' }],
    solution: [0, 1, 2],
    clues: ['Gold medal is first.', 'Silver medal is second.', 'Bronze medal is third.'],
  },
  {
    skill: 'Position Words',
    items: [{ name: 'Apple', emoji: '1f34e' }, { name: 'Banana', emoji: '1f34c' }, { name: 'Orange', emoji: '1f34a' }],
    slots: [{ label: 'Left', color: '#ef4444' }, { label: 'Middle', color: '#eab308' }, { label: 'Right', color: '#f97316' }],
    solution: [0, 1, 2],
    clues: ['The apple is on the left.', 'The banana is in the middle.', 'The orange is on the right.'],
  },
  {
    skill: 'Cause and Effect',
    items: [{ name: 'Rain', emoji: '1f327' }, { name: 'Sun', emoji: '2600' }, { name: 'Snow', emoji: '2744' }],
    slots: [{ label: 'Umbrella', color: '#a855f7' }, { label: 'Sunglasses', color: '#eab308' }, { label: 'Coat', color: '#38bdf8' }],
    solution: [0, 1, 2],
    clues: ['When it rains, we need an umbrella.', 'When it is sunny, we wear sunglasses.', 'When it snows, we wear a coat.'],
  },
  {
    skill: 'Animal Habitats',
    items: [{ name: 'Dog', emoji: '1f436' }, { name: 'Fish', emoji: '1f41f' }, { name: 'Bird', emoji: '1f426' }],
    slots: [{ label: 'House', color: '#f97316' }, { label: 'Water', color: '#3b82f6' }, { label: 'Nest', color: '#22c55e' }],
    solution: [0, 1, 2],
    clues: ['Dogs live in a house.', 'Fish live in water.', 'Birds live in a nest.'],
  },
  {
    skill: 'Sequencing',
    items: [{ name: 'Morning', emoji: '1f305' }, { name: 'Noon', emoji: '2600' }, { name: 'Night', emoji: '1f319' }],
    slots: [{ label: 'Wake up', color: '#fbbf24' }, { label: 'Lunch time', color: '#f97316' }, { label: 'Bedtime', color: '#6366f1' }],
    solution: [0, 1, 2],
    clues: ['We wake up in the morning.', 'We eat lunch at noon.', 'We go to bed at night.'],
  },
];

const PUZZLES_4 = [
  {
    skill: 'Animal Habitats',
    items: [
      { name: 'Cat', emoji: '1f431' }, { name: 'Dog', emoji: '1f436' },
      { name: 'Bird', emoji: '1f426' }, { name: 'Fish', emoji: '1f41f' },
    ],
    slots: [
      { label: 'House', color: '#ef4444' }, { label: 'Doghouse', color: '#92400e' },
      { label: 'Nest', color: '#22c55e' }, { label: 'Fishbowl', color: '#3b82f6' },
    ],
    solution: [0, 1, 2, 3],
    clues: [
      'Cats live in a house.', 'Dogs live in a doghouse.',
      'Birds live in a nest.', 'Fish live in a fishbowl.',
    ],
  },
  {
    skill: 'Ordinal Numbers',
    items: [
      { name: 'First', emoji: '1f947' }, { name: 'Second', emoji: '1f948' },
      { name: 'Third', emoji: '1f949' }, { name: 'Fourth', emoji: '1f3c6' },
    ],
    slots: [
      { label: '1st place', color: '#ef4444' }, { label: '2nd place', color: '#94a3b8' },
      { label: '3rd place', color: '#b45309' }, { label: '4th place', color: '#22c55e' },
    ],
    solution: [0, 1, 2, 3],
    clues: [
      'First place gets the gold.', 'Second place gets silver.',
      'Third place gets bronze.', 'Fourth place gets green.',
    ],
  },
  {
    skill: 'Classification',
    items: [
      { name: 'Apple', emoji: '1f34e' }, { name: 'Broccoli', emoji: '1f966' },
      { name: 'Bread', emoji: '1f35e' }, { name: 'Milk', emoji: '1f95b' },
    ],
    slots: [
      { label: 'Fruit', color: '#ef4444' }, { label: 'Vegetable', color: '#22c55e' },
      { label: 'Grain', color: '#eab308' }, { label: 'Dairy', color: '#fef3c7' },
    ],
    solution: [0, 1, 2, 3],
    clues: [
      'Apple is a fruit.', 'Broccoli is a vegetable.',
      'Bread is a grain.', 'Milk is dairy.',
    ],
  },
];

function getPool(level) {
  if (level <= 8) return PUZZLES_2x2;
  if (level <= 18) return PUZZLES_3;
  return [...PUZZLES_3, ...PUZZLES_4];
}

export default function LogicGridJunior({ onComplete, level = 1, childName }) {
  const { playSuccess, playWrong, playClick, playCelebration } = useAudio();
  const { teachAfterAnswer, readQuestion, getRecommendedDelayBeforeNext } = useTeaching();
  const { generate } = useNoRepeat(level);
  const [round, setRound] = useState(0);
  const [puzzle, setPuzzle] = useState(null);
  const [placements, setPlacements] = useState({});
  const [selectedItem, setSelectedItem] = useState(null);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const completedRef = useRef(false);
  const ROUNDS = Math.min(getRounds(level), getPool(level).length);

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
    const p = generate(() => pool[Math.floor(Math.random() * pool.length)], (p) => `${p.skill}:${p.clues[0]}`);
    setPuzzle(p);
    setPlacements({});
    setSelectedItem(null);
    setFeedback(null);
    const prompt = p.skill === 'Animal Habitats'
      ? 'Where does each animal live? Read the clues and match them!'
      : p.skill === 'Ordinal Numbers'
        ? 'Which is first, second, third? Read the clues and put them in order!'
        : p.skill === 'Classification'
          ? 'Sort each food into the right group! Read the clues.'
          : p.skill === 'Cause and Effect'
            ? 'What goes together? Match each one to what we need!'
            : p.skill === 'Position Words'
              ? 'Where does each one go? Left, middle, or right?'
              : p.skill === 'Sequencing'
                ? 'What happens when? Put morning, noon, and night in order!'
                : p.skill === 'Size Comparison'
                  ? 'Which is big? Which is small? Match them!'
                  : 'Read the clues and place each one in the right spot!';
    const cancelRead = readQuestion(prompt);
    return cancelRead;
  }, [round]);

  function handleItemClick(itemIdx) {
    if (feedback) return;
    playClick();
    setSelectedItem(itemIdx);
  }

  function handleSlotClick(slotIdx) {
    if (feedback || selectedItem === null) return;
    playClick();
    const newPlacements = { ...placements };
    Object.keys(newPlacements).forEach(k => {
      if (newPlacements[k] === selectedItem) delete newPlacements[k];
    });
    newPlacements[slotIdx] = selectedItem;
    setPlacements(newPlacements);
    setSelectedItem(null);

    if (Object.keys(newPlacements).length === puzzle.items.length) {
      let allCorrect = true;
      for (let i = 0; i < puzzle.items.length; i++) {
        if (newPlacements[i] !== puzzle.solution[i]) {
          allCorrect = false;
          break;
        }
      }
      if (allCorrect) {
        setScore(s => s + 10);
        setCorrect(c => c + 1);
        playSuccess();
        setFeedback('correct');
        const skillMsg = puzzle.skill === 'Animal Habitats'
          ? 'You matched animals to their homes! Knowing where animals live is science!'
          : puzzle.skill === 'Ordinal Numbers'
            ? 'You learned first, second, third! Order helps us count and sequence!'
            : puzzle.skill === 'Classification'
              ? 'You sorted things into groups! Classification is an important thinking skill!'
              : puzzle.skill === 'Cause and Effect'
                ? 'You matched causes and effects! That helps us understand how things work!'
                : puzzle.skill === 'Position Words'
                  ? 'You used left, middle, right! Position words help us describe where things are!'
                  : puzzle.skill === 'Sequencing'
                    ? 'You put morning, noon, and night in order! Sequencing helps us understand time!'
                    : puzzle.skill === 'Size Comparison'
                      ? 'You compared big and small! Size words help us describe the world!'
                      : 'You used the clues to solve it! Reading carefully helps you think!';
        teachAfterAnswer(true, { type: 'science', extra: skillMsg });
      } else {
        playWrong();
        setFeedback('wrong');
        const correctNames = puzzle.solution.map((itemIdx, slotIdx) =>
          `${puzzle.items[itemIdx].name} goes in ${puzzle.slots[slotIdx].label}`
        ).join('. ');
        teachAfterAnswer(false, { type: 'science', extra: `Let's try again! ${correctNames}. Read each clue one at a time!` });
      }
      const delay = getRecommendedDelayBeforeNext(getFeedbackDelay(level, allCorrect));
      setTimeout(() => setRound(r => r + 1), delay);
    }
  }

  if (round >= ROUNDS) {
    const accuracy = ROUNDS > 0 ? Math.round((correct / ROUNDS) * 100) : 0;
    return (
      <div className={styles.container}>
        <div className={styles.celebration}>
          <h2>Super Thinker!</h2>
          <p style={{ fontSize: '1.1rem', fontWeight: 700 }}>Score: {score}</p>
          <p style={{ color: 'var(--text-muted)', fontWeight: 600, marginTop: '0.25rem' }}>
            You used clues to solve puzzles! That builds reading and thinking skills.
          </p>
          <span style={{ color: 'var(--success)', fontWeight: 800, marginTop: '0.5rem', display: 'block' }}>
            Accuracy: {accuracy}%
          </span>
        </div>
      </div>
    );
  }

  if (!puzzle) return null;

  const placedItems = new Set(Object.values(placements));

  return (
    <div className={styles.container}>
      <div className={styles.hud}>
        <span>Lv {level}</span><span>·</span>
        <span>{round + 1}/{ROUNDS}</span><span>·</span>
        <span>Score: {score}</span>
      </div>

      {/* Clues */}
      <div style={{
        background: 'rgba(56,189,248,0.08)', borderRadius: 12, padding: '0.75rem 1rem',
        marginBottom: '1rem', textAlign: 'left',
      }}>
        <p style={{ fontWeight: 800, marginBottom: '0.3rem', fontSize: '0.85rem', color: 'var(--primary)' }}>
          {puzzle.skill} — Read the clues:
        </p>
        {puzzle.clues.map((clue, i) => (
          <p key={i} style={{ fontSize: '0.82rem', marginBottom: '0.2rem', lineHeight: 1.4 }}>
            {i + 1}. {clue}
          </p>
        ))}
      </div>

      {/* Items to place */}
      <p className={styles.prompt}>Tap an item, then tap the spot where it belongs:</p>
      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '1rem' }}>
        {puzzle.items.map((item, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleItemClick(idx)}
            disabled={placedItems.has(idx) || !!feedback}
            className={styles.choiceBtn}
            style={{
              padding: '0.5rem 0.8rem',
              opacity: placedItems.has(idx) ? 0.3 : 1,
              outline: selectedItem === idx ? '3px solid var(--primary)' : 'none',
              outlineOffset: 2,
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            }}
          >
            <img src={TWEMOJI(item.emoji)} alt={item.name} style={{ width: 32, height: 32 }} />
            <span style={{ fontSize: '0.7rem', fontWeight: 700 }}>{item.name}</span>
          </button>
        ))}
      </div>

      {/* Slots */}
      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        {puzzle.slots.map((slot, idx) => {
          const placedItemIdx = placements[idx];
          const placedItem = placedItemIdx !== undefined ? puzzle.items[placedItemIdx] : null;
          const isCorrectSlot = feedback && puzzle.solution[idx] === placements[idx];
          const isWrongSlot = feedback === 'wrong' && placements[idx] !== undefined && puzzle.solution[idx] !== placements[idx];
          return (
            <button
              key={idx}
              type="button"
              onClick={() => handleSlotClick(idx)}
              disabled={!!feedback}
              style={{
                width: 80, minHeight: 90, borderRadius: 12, cursor: feedback ? 'default' : 'pointer',
                border: `2.5px solid ${isCorrectSlot ? '#22c55e' : isWrongSlot ? '#ef4444' : slot.color}`,
                background: `${slot.color}15`,
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', gap: 4, padding: '0.4rem',
                transition: 'border-color 0.2s',
              }}
            >
              {placedItem ? (
                <>
                  <img src={TWEMOJI(placedItem.emoji)} alt={placedItem.name} style={{ width: 28, height: 28 }} />
                  <span style={{ fontSize: '0.65rem', fontWeight: 700 }}>{placedItem.name}</span>
                </>
              ) : (
                <span style={{ fontSize: '1.5rem', opacity: 0.3 }}>?</span>
              )}
              <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 600 }}>{slot.label}</span>
            </button>
          );
        })}
      </div>

      {feedback === 'correct' && <p className={styles.feedbackOk}>All items placed correctly!</p>}
      {feedback === 'wrong' && (
        <div className={styles.feedbackBad}>
          <p>Not quite! Read each clue again and try matching.</p>
        </div>
      )}
    </div>
  );
}
