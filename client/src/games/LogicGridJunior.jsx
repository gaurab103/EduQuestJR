/**
 * Logic Grid Junior - PREMIUM
 * Unique mechanic: Clue-based deduction puzzles. Kid reads clues and
 * places items into correct positions on a grid.
 * "The cat is NOT in the red box." "The dog IS next to the blue box."
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { useAudio } from '../context/AudioContext';
import { useTeaching } from './useTeaching';
import { useNoRepeat } from './useNoRepeat';
import { getRounds, getFeedbackDelay } from './levelConfig';
import styles from './GameCommon.module.css';

const TWEMOJI = (cp) => `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/${cp}.svg`;

const PUZZLES_2x2 = [
  {
    items: [{ name: 'Cat', emoji: '1f431' }, { name: 'Dog', emoji: '1f436' }],
    slots: [{ label: 'Red Box', color: '#ef4444' }, { label: 'Blue Box', color: '#3b82f6' }],
    solution: [0, 1],
    clues: ['The Cat is in the Red Box.', 'The Dog is in the Blue Box.'],
  },
  {
    items: [{ name: 'Apple', emoji: '1f34e' }, { name: 'Banana', emoji: '1f34c' }],
    slots: [{ label: 'Plate 1', color: '#22c55e' }, { label: 'Plate 2', color: '#eab308' }],
    solution: [1, 0],
    clues: ['The Apple is NOT on Plate 1.', 'The Banana goes on Plate 1.'],
  },
  {
    items: [{ name: 'Star', emoji: '2b50' }, { name: 'Moon', emoji: '1f319' }],
    slots: [{ label: 'Top Shelf', color: '#a855f7' }, { label: 'Bottom Shelf', color: '#38bdf8' }],
    solution: [0, 1],
    clues: ['The Star goes on the Top Shelf.', 'The Moon is NOT on the Top Shelf.'],
  },
  {
    items: [{ name: 'Fish', emoji: '1f41f' }, { name: 'Bird', emoji: '1f426' }],
    slots: [{ label: 'Water', color: '#3b82f6' }, { label: 'Sky', color: '#38bdf8' }],
    solution: [0, 1],
    clues: ['The Fish lives in Water.', 'The Bird flies in the Sky.'],
  },
  {
    items: [{ name: 'Sun', emoji: '2600' }, { name: 'Cloud', emoji: '2601' }],
    slots: [{ label: 'Left', color: '#eab308' }, { label: 'Right', color: '#94a3b8' }],
    solution: [0, 1],
    clues: ['The Sun is on the Left.', 'The Cloud is NOT on the Left.'],
  },
];

const PUZZLES_3 = [
  {
    items: [{ name: 'Cat', emoji: '1f431' }, { name: 'Dog', emoji: '1f436' }, { name: 'Fish', emoji: '1f41f' }],
    slots: [{ label: 'Box 1', color: '#ef4444' }, { label: 'Box 2', color: '#3b82f6' }, { label: 'Box 3', color: '#22c55e' }],
    solution: [2, 0, 1],
    clues: ['The Cat is NOT in Box 1 or Box 2.', 'The Dog is in Box 1.', 'The Fish goes in Box 2.'],
  },
  {
    items: [{ name: 'Apple', emoji: '1f34e' }, { name: 'Grapes', emoji: '1f347' }, { name: 'Orange', emoji: '1f34a' }],
    slots: [{ label: 'Left', color: '#ef4444' }, { label: 'Middle', color: '#a855f7' }, { label: 'Right', color: '#f97316' }],
    solution: [0, 1, 2],
    clues: ['The Apple is on the Left.', 'The Orange is on the Right.', 'The Grapes go in the Middle.'],
  },
  {
    items: [{ name: 'Bear', emoji: '1f43b' }, { name: 'Rabbit', emoji: '1f430' }, { name: 'Frog', emoji: '1f438' }],
    slots: [{ label: 'Cave', color: '#92400e' }, { label: 'Burrow', color: '#eab308' }, { label: 'Pond', color: '#22c55e' }],
    solution: [0, 1, 2],
    clues: ['The Bear lives in the Cave.', 'The Frog is NOT in the Cave or Burrow.', 'The Rabbit digs a Burrow.'],
  },
  {
    items: [{ name: 'Hat', emoji: '1f3a9' }, { name: 'Crown', emoji: '1f451' }, { name: 'Cap', emoji: '1f9e2' }],
    slots: [{ label: 'Shelf A', color: '#ef4444' }, { label: 'Shelf B', color: '#3b82f6' }, { label: 'Shelf C', color: '#22c55e' }],
    solution: [1, 0, 2],
    clues: ['The Crown is on Shelf A.', 'The Hat is NOT on Shelf A or Shelf C.', 'The Cap is on Shelf C.'],
  },
];

const PUZZLES_4 = [
  {
    items: [
      { name: 'Cat', emoji: '1f431' }, { name: 'Dog', emoji: '1f436' },
      { name: 'Bird', emoji: '1f426' }, { name: 'Fish', emoji: '1f41f' },
    ],
    slots: [
      { label: 'Spot 1', color: '#ef4444' }, { label: 'Spot 2', color: '#3b82f6' },
      { label: 'Spot 3', color: '#22c55e' }, { label: 'Spot 4', color: '#eab308' },
    ],
    solution: [0, 1, 2, 3],
    clues: [
      'The Cat is in Spot 1.', 'The Dog is in Spot 2.',
      'The Fish is in the last spot.', 'The Bird is NOT in Spot 1, 2, or 4.',
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
  const { teachAfterAnswer, readQuestion } = useTeaching();
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
    const p = generate(() => pool[Math.floor(Math.random() * pool.length)], (p) => p.clues[0]);
    setPuzzle(p);
    setPlacements({});
    setSelectedItem(null);
    setFeedback(null);
    const cancelRead = readQuestion('Read the clues and place each item in the right spot!');
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
        teachAfterAnswer(true, { type: 'science', extra: 'You solved the logic puzzle! Reading clues carefully helps you think like a detective!' });
      } else {
        playWrong();
        setFeedback('wrong');
        const correctNames = puzzle.solution.map((itemIdx, slotIdx) =>
          `${puzzle.items[itemIdx].name} in ${puzzle.slots[slotIdx].label}`
        ).join(', ');
        teachAfterAnswer(false, { type: 'science', extra: `The correct answer is: ${correctNames}. Read each clue carefully!` });
      }
      const delay = getFeedbackDelay(level, allCorrect);
      setTimeout(() => setRound(r => r + 1), delay);
    }
  }

  if (round >= ROUNDS) {
    const accuracy = ROUNDS > 0 ? Math.round((correct / ROUNDS) * 100) : 0;
    return (
      <div className={styles.container}>
        <div className={styles.celebration}>
          <h2>Logic Master!</h2>
          <p style={{ fontSize: '1.1rem', fontWeight: 700 }}>Score: {score}</p>
          <span style={{ color: 'var(--text-muted)', fontWeight: 800 }}>Accuracy: {accuracy}%</span>
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
        <p style={{ fontWeight: 800, marginBottom: '0.3rem', fontSize: '0.85rem' }}>Clues:</p>
        {puzzle.clues.map((clue, i) => (
          <p key={i} style={{ fontSize: '0.82rem', marginBottom: '0.2rem', lineHeight: 1.4 }}>
            {i + 1}. {clue}
          </p>
        ))}
      </div>

      {/* Items to place */}
      <p className={styles.prompt}>Tap an item, then tap where it goes:</p>
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
          <p>Not quite! Check the clues again.</p>
        </div>
      )}
    </div>
  );
}
