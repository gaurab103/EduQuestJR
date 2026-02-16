import { useState, useEffect, useRef } from 'react';
import { useTeaching } from './useTeaching';
import styles from './GameCommon.module.css';
import { useAudio } from '../context/AudioContext';
import { getRounds, getChoiceCount, getFeedbackDelay } from './levelConfig';
import { GameImage, ANIMAL_IMAGES, FRUIT_IMAGES, OBJECT_IMAGES, VEGGIE_IMAGES, FOOD_IMAGES, NATURE_IMAGES } from './gameImages';

// DATA array mapping letters A-Z to words and images
const DATA = [
  { letter: 'A', word: 'Apple', img: FRUIT_IMAGES.apple },
  { letter: 'B', word: 'Bear', img: ANIMAL_IMAGES.bear },
  { letter: 'C', word: 'Cat', img: ANIMAL_IMAGES.cat },
  { letter: 'D', word: 'Dog', img: ANIMAL_IMAGES.dog },
  { letter: 'E', word: 'Elephant', img: ANIMAL_IMAGES.elephant },
  { letter: 'F', word: 'Fish', img: ANIMAL_IMAGES.fish },
  { letter: 'G', word: 'Grapes', img: FRUIT_IMAGES.grapes },
  { letter: 'H', word: 'House', img: OBJECT_IMAGES.house },
  { letter: 'I', word: 'Icecream', img: FOOD_IMAGES.icecream },
  { letter: 'J', word: 'Juice', img: FRUIT_IMAGES.orange }, // Using orange as proxy for juice
  { letter: 'K', word: 'Key', img: OBJECT_IMAGES.key },
  { letter: 'L', word: 'Lion', img: ANIMAL_IMAGES.lion },
  { letter: 'M', word: 'Monkey', img: ANIMAL_IMAGES.monkey },
  { letter: 'N', word: 'Night', img: OBJECT_IMAGES.moon }, // Using moon for night
  { letter: 'O', word: 'Orange', img: FRUIT_IMAGES.orange },
  { letter: 'P', word: 'Penguin', img: ANIMAL_IMAGES.penguin },
  { letter: 'Q', word: 'Queen', img: OBJECT_IMAGES.crown }, // Using crown as proxy
  { letter: 'R', word: 'Rabbit', img: ANIMAL_IMAGES.rabbit },
  { letter: 'S', word: 'Sun', img: OBJECT_IMAGES.sun },
  { letter: 'T', word: 'Tree', img: OBJECT_IMAGES.tree },
  { letter: 'U', word: 'Umbrella', img: OBJECT_IMAGES.umbrella },
  { letter: 'V', word: 'Violin', img: OBJECT_IMAGES.music }, // Using music as proxy
  { letter: 'W', word: 'Whale', img: ANIMAL_IMAGES.whale },
  { letter: 'X', word: 'Xylophone', img: OBJECT_IMAGES.music }, // Using music as proxy
  { letter: 'Y', word: 'Yacht', img: OBJECT_IMAGES.ship }, // Using ship as proxy
  { letter: 'Z', word: 'Zebra', img: ANIMAL_IMAGES.horse }, // Using horse as proxy
];

// Get wrong choices (all items except the current one)
function getWrongChoices(currentLetter, count) {
  const wrong = DATA.filter(item => item.letter !== currentLetter);
  const shuffled = [...wrong].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count - 1);
}

export default function LetterSoundMatch({ level = 1, onComplete }) {
  const { playSuccess, playWrong, playClick, speak } = useAudio();
  const { teachAfterAnswer, readQuestion } = useTeaching();
  const [round, setRound] = useState(0);
  const [currentItem, setCurrentItem] = useState(null);
  const [choices, setChoices] = useState([]);
  const [correctIndex, setCorrectIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const completedRef = useRef(false);
  const ROUNDS = getRounds(level);
  const choiceCount = getChoiceCount(level);

  useEffect(() => {
    window.speechSynthesis?.cancel();
    if (round >= ROUNDS && !completedRef.current) {
      completedRef.current = true;
      const accuracy = Math.round((score / ROUNDS) * 100);
      onComplete(score, accuracy);
      return;
    }

    // Select a random letter
    const item = DATA[Math.floor(Math.random() * DATA.length)];
    setCurrentItem(item);

    // Get wrong choices
    const wrongChoices = getWrongChoices(item.letter, choiceCount);
    
    // Combine correct and wrong choices, then shuffle
    const allChoices = [item, ...wrongChoices].sort(() => Math.random() - 0.5);
    setChoices(allChoices);
    setCorrectIndex(allChoices.findIndex(c => c.letter === item.letter));
    setFeedback(null);
    const cancelRead = readQuestion('What starts with "' + item.letter + '"?');
    return cancelRead;
  }, [round, ROUNDS, choiceCount]);

  function handleChoice(index) {
    if (feedback !== null) return;
    playClick();
    
    const isCorrect = index === correctIndex;
    
    if (isCorrect) {
      setScore(s => s + 1);
      playSuccess();
      speak(currentItem.word);
      setFeedback('correct');
      teachAfterAnswer(true, { type: 'letter', answer: currentItem.word, correctAnswer: currentItem.letter });
    } else {
      playWrong();
      setFeedback('wrong');
      teachAfterAnswer(false, { type: 'letter', answer: choices[index]?.word, correctAnswer: currentItem?.letter });
    }

    const delay = getFeedbackDelay(level, isCorrect);
    setTimeout(() => {
      setRound(r => r + 1);
    }, delay);
  }

  if (round >= ROUNDS) {
    return (
      <div className={styles.container}>
        <div className={styles.celebration}>
          <h2>🎉 Great Job! 🎉</h2>
          <p>You scored {score} out of {ROUNDS}</p>
          <p>Accuracy: {Math.round((score / ROUNDS) * 100)}%</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.hud}>
        <span>Lv {level}</span>
        <span>·</span>
        <span>Round {round + 1}/{ROUNDS}</span>
        <span>·</span>
        <span>Score: {score}</span>
      </div>

      <div className={styles.targetArea}>
        <div className={styles.targetLetter}>{currentItem?.letter}</div>
      </div>

      <p className={styles.prompt}>
        What starts with <strong>"{currentItem?.letter}"</strong>?
      </p>

      <div className={styles.choices}>
        {choices.map((choice, index) => (
          <button
            key={index}
            type="button"
            onClick={() => handleChoice(index)}
            className={`${styles.choiceBtn} ${
              feedback === 'correct' && index === correctIndex ? styles.correct : ''
            } ${
              feedback === 'wrong' && index === correctIndex ? styles.correct : ''
            } ${
              feedback === 'wrong' && index !== correctIndex ? styles.wrong : ''
            }`}
            disabled={feedback !== null}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              padding: '1rem',
            }}
          >
            <GameImage src={choice.img} alt={choice.word} size={56} />
            <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'capitalize' }}>
              {choice.word}
            </span>
          </button>
        ))}
      </div>

      {feedback === 'correct' && (
        <p className={styles.feedbackOk}>✓ Correct! "{currentItem?.word}" starts with "{currentItem?.letter}"!</p>
      )}
      {feedback === 'wrong' && (
        <div className={styles.feedbackBad}>
          <p>✗ The answer is <strong>{currentItem?.word} ({currentItem?.letter})</strong></p>
        </div>
      )}
    </div>
  );
}
