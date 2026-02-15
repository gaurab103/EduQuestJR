import { useState, useEffect, useRef } from 'react';
import { useAudio } from '../context/AudioContext';
import { useTeaching } from './useTeaching';
import { getFeedbackDelay } from './levelConfig';
import { MEMORY_THEMES, GameImage } from './gameImages';
import styles from './GameCommon.module.css';

function getPairs(level) {
  if (level <= 3) return 3;
  if (level <= 6) return 4;
  if (level <= 10) return 5;
  if (level <= 15) return 6;
  return 8;
}

export default function MemoryFlipArena({ onComplete, level = 1 }) {
  const { playSuccess, playWrong, playClick, playCelebration } = useAudio();
  const { teachAfterAnswer } = useTeaching();
  const [cards, setCards] = useState([]);
  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState([]);
  const [moves, setMoves] = useState(0);
  const [score, setScore] = useState(0);
  const [theme, setTheme] = useState(MEMORY_THEMES[0]);
  const [matchAnim, setMatchAnim] = useState([]);
  const completedRef = useRef(false);
  const lockRef = useRef(false);
  const PAIRS = getPairs(level);
  const feedbackDelay = getFeedbackDelay(level);

  useEffect(() => {
    const selectedTheme = MEMORY_THEMES[Math.floor(Math.random() * MEMORY_THEMES.length)];
    setTheme(selectedTheme);
    const pool = selectedTheme.items.slice(0, PAIRS);
    const arr = [...pool, ...pool].map((item, i) => ({ id: i, itemId: item.id, img: item.img })).sort(() => Math.random() - 0.5);
    setCards(arr);
  }, [PAIRS]);

  useEffect(() => {
    if (matched.length === PAIRS * 2 && !completedRef.current) {
      completedRef.current = true;
      playCelebration();
      const accuracy = Math.max(10, 100 - Math.max(0, moves - PAIRS * 2) * 5);
      const roundScore = Math.max(0, 50 - moves + (PAIRS * 10));
      setTimeout(() => onComplete(roundScore, accuracy), 500);
    }
  }, [matched, moves, onComplete, PAIRS, playCelebration]);

  function handleClick(idx) {
    if (lockRef.current || flipped.includes(idx) || matched.includes(idx)) return;
    playClick();
    const newFlipped = [...flipped, idx];
    setFlipped(newFlipped);
    setMoves(m => m + 1);

    if (newFlipped.length === 2) {
      lockRef.current = true;
      const [a, b] = newFlipped;
      if (cards[a].itemId === cards[b].itemId) {
        setMatched(m => [...m, a, b]);
        setScore(s => s + 10);
        setMatchAnim([a, b]);
        playSuccess();
        teachAfterAnswer(true, { type: 'animal', correctAnswer: cards[a].itemId, extra: 'You found the ' + cards[a].itemId + ' pair!' });
        setTimeout(() => setMatchAnim([]), 600);
      } else {
        playWrong();
      }
      setTimeout(() => {
        setFlipped([]);
        lockRef.current = false;
      }, feedbackDelay);
    }
  }

  if (matched.length === PAIRS * 2) {
    return (
      <div className={styles.container}>
        <p className={styles.prompt}>Calculating your rewards...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.progress}>
        <span>Lv {level}</span>
        <span>·</span>
        <span>Moves: {moves}</span>
        <span>·</span>
        <span>Matched: {matched.length / 2}/{PAIRS}</span>
      </div>
      <p className={styles.prompt}>Find matching {theme.name.toLowerCase()} pairs!</p>
      <div className={styles.memoryGrid} style={{
        gridTemplateColumns: `repeat(${PAIRS <= 3 ? 3 : 4}, 1fr)`,
      }}>
        {cards.map((card, idx) => {
          const isOpen = flipped.includes(idx) || matched.includes(idx);
          const isMatched = matched.includes(idx);
          const isAnimating = matchAnim.includes(idx);
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => handleClick(idx)}
              className={`${styles.memoryCard} ${isOpen ? styles.memoryCardOpen : ''}`}
              style={{
                opacity: isMatched && !isAnimating ? 0.7 : 1,
                transform: isAnimating ? 'scale(1.1)' : undefined,
                transition: 'transform 0.2s, opacity 0.3s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {isOpen ? (
                <GameImage src={card.img} alt={card.itemId} size={40} />
              ) : (
                <span style={{ fontSize: '1.5rem' }}>❓</span>
              )}
            </button>
          );
        })}
      </div>
      {matched.length > 0 && matched.length < PAIRS * 2 && (
        <p style={{ marginTop: '0.75rem', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>
          {matched.length / 2 === PAIRS - 1 ? 'Almost there! One more!' : `${PAIRS - matched.length / 2} more to find!`}
        </p>
      )}
    </div>
  );
}
