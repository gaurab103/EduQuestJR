import { useState, useEffect, useRef } from 'react';
import { useAudio } from '../context/AudioContext';
import { useTeaching } from './useTeaching';
import { getRounds, getChoiceCount, getFeedbackDelay } from './levelConfig';
import styles from './GameCommon.module.css';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

// Pastel colors for bubbles
const PASTEL_COLORS = [
  '#FFB3BA', '#FFDFBA', '#FFFFBA', '#BAFFC9', '#BAE1FF',
  '#E0BBE4', '#FFCCCB', '#B4E4FF', '#FFD9B3', '#C7CEEA',
  '#F8B88B', '#FADADD', '#FFE4E1', '#E6E6FA', '#FFF0F5',
  '#F0E68C', '#DDA0DD', '#98D8C8', '#F7DC6F', '#AED6F1'
];

function getRandomLetter() {
  return ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
}

function getRandomPastelColor() {
  return PASTEL_COLORS[Math.floor(Math.random() * PASTEL_COLORS.length)];
}

function generateBubbles(correctLetter, count) {
  const bubbles = [{ letter: correctLetter, isCorrect: true, color: getRandomPastelColor() }];
  const usedLetters = new Set([correctLetter]);
  
  while (bubbles.length < count) {
    const letter = getRandomLetter();
    if (!usedLetters.has(letter)) {
      bubbles.push({ letter, isCorrect: false, color: getRandomPastelColor() });
      usedLetters.add(letter);
    }
  }
  
  // Shuffle bubbles
  for (let i = bubbles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [bubbles[i], bubbles[j]] = [bubbles[j], bubbles[i]];
  }
  
  return bubbles;
}

export default function AlphabetBubblePop({ level = 1, onComplete }) {
  const { playSuccess, playWrong, playClick, playCelebration, speak } = useAudio();
  const { teachAfterAnswer, readQuestion } = useTeaching();
  const [round, setRound] = useState(0);
  const [targetLetter, setTargetLetter] = useState('');
  const [bubbles, setBubbles] = useState([]);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [done, setDone] = useState(false);
  const completedRef = useRef(false);
  const ROUNDS = getRounds(level);
  const CHOICE_COUNT = getChoiceCount(level);
  const delay = getFeedbackDelay(level);

  useEffect(() => {
    if (round >= ROUNDS && !completedRef.current) {
      completedRef.current = true;
      setDone(true);
      playCelebration();
      // Use current state values for accuracy calculation
      const finalAccuracy = ROUNDS > 0 ? Math.round((correct / ROUNDS) * 100) : 0;
      onComplete({ score, accuracy: finalAccuracy, total: ROUNDS });
      return;
    }
    
    const letter = getRandomLetter();
    const bubbleList = generateBubbles(letter, CHOICE_COUNT);
    setTargetLetter(letter);
    setBubbles(bubbleList);
    setFeedback(null);
    setSelectedIndex(null);
    
    // Speak the question
    readQuestion('Find the letter ' + letter + '!');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, ROUNDS, CHOICE_COUNT]);

  function handleBubbleClick(index) {
    if (feedback !== null) return;
    
    playClick();
    setSelectedIndex(index);
    const bubble = bubbles[index];
    const isCorrect = bubble.isCorrect;
    
    if (isCorrect) {
      setScore(s => s + 10);
      setCorrect(c => c + 1);
      setFeedback('correct');
      playSuccess();
      teachAfterAnswer(true, { type: 'letter', answer: bubble.letter, correctAnswer: bubble.letter });
    } else {
      setWrong(w => w + 1);
      setFeedback('wrong');
      playWrong();
      teachAfterAnswer(false, { type: 'letter', answer: bubble.letter, correctAnswer: targetLetter });
    }
    
    setTimeout(() => setRound(r => r + 1), delay);
  }

  // Generate unique float animation style for each bubble
  function getBubbleStyle(index) {
    const baseDelay = index * 0.2;
    const floatDuration = 3 + (index % 3) * 0.5; // 3s to 4.5s
    const bubble = bubbles[index];
    
    return {
      backgroundColor: bubble?.color || getRandomPastelColor(),
      animation: `bubbleFloat ${floatDuration}s ease-in-out infinite`,
      animationDelay: `${baseDelay}s`,
    };
  }

  if (done) {
    const finalAccuracy = ROUNDS > 0 ? Math.round((correct / ROUNDS) * 100) : 0;
    return (
      <div className={styles.container}>
        <div className={styles.celebration}>
          <span style={{ fontSize: '4rem' }}>🎈</span>
          <h2>Bubble Pop Master!</h2>
          <p style={{ fontSize: '1.1rem', fontWeight: 700 }}>Score: {score}</p>
          <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', margin: '0.5rem 0', flexWrap: 'wrap' }}>
            <span style={{ color: '#22c55e', fontWeight: 800 }}>✅ Correct: {correct}</span>
            <span style={{ color: '#ef4444', fontWeight: 800 }}>❌ Wrong: {wrong}</span>
          </div>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Accuracy: {finalAccuracy}%</p>
        </div>
      </div>
    );
  }

  if (round >= ROUNDS) {
    return <div className={styles.container}>Calculating your rewards…</div>;
  }

  return (
    <div className={styles.container}>
      <style>{`
        @keyframes bubbleFloat {
          0%, 100% { 
            transform: translateY(0) rotate(0deg); 
          }
          50% { 
            transform: translateY(-12px) rotate(3deg); 
          }
        }
        .bubble-float {
          position: relative;
        }
      `}</style>
      
      <div className={styles.hud}>
        <span>Lv {level} · Round {round + 1}/{ROUNDS} · ✅ {correct} · ❌ {wrong} · ⭐ {score}</span>
      </div>

      <p className={styles.prompt}>Find the letter {targetLetter}!</p>

      {/* Big target letter display */}
      <div className={styles.targetArea}>
        <div className={styles.targetLetter} style={{ fontSize: '5rem', marginBottom: '1rem' }}>
          {targetLetter}
        </div>
      </div>

      {/* Floating bubbles */}
      <div className={styles.choices} style={{ marginTop: '2rem', position: 'relative', minHeight: '200px' }}>
        {bubbles.map((bubble, index) => {
          const isSelected = selectedIndex === index;
          const isCorrectBubble = bubble.isCorrect;
          const showCorrect = feedback === 'correct' && isSelected && isCorrectBubble;
          const showWrong = feedback === 'wrong' && isSelected && !isCorrectBubble;
          const bubbleStyle = getBubbleStyle(index);
          
          return (
            <button
              key={index}
              type="button"
              onClick={() => handleBubbleClick(index)}
              className={`${styles.choiceBtn} bubble-float ${showCorrect ? styles.correct : ''} ${showWrong ? styles.wrong : ''}`}
              disabled={feedback !== null}
              style={{
                ...bubbleStyle,
                minWidth: '88px',
                minHeight: '88px',
                fontSize: '2.5rem',
                fontWeight: 900,
                borderRadius: '50%',
                color: '#1f2937',
                position: 'relative',
                zIndex: 1,
                border: showCorrect || showWrong ? undefined : '4px solid var(--sky-blue)',
              }}
            >
              {bubble.letter}
            </button>
          );
        })}
      </div>

      {/* Feedback */}
      {feedback && (
        <div className={feedback === 'correct' ? styles.feedbackOk : styles.feedbackBad}>
          {feedback === 'correct' ? '✓ Great job! Pop!' : '✗ Try again!'}
        </div>
      )}
    </div>
  );
}
