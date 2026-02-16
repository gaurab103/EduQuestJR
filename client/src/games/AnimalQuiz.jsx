import { useState, useEffect, useRef } from 'react';
import { useAudio } from '../context/AudioContext';
import { useTeaching } from './useTeaching';
import { useNoRepeat } from './useNoRepeat';
import { getRounds, getChoiceCount, getFeedbackDelay } from './levelConfig';
import { GameImage, ANIMAL_IMAGES } from './gameImages';
import styles from './GameCommon.module.css';

const QUESTIONS = [
  { q: "Which animal says 'Woof'?", answer: 'dog', options: ['dog', 'cat', 'frog', 'duck'], images: ANIMAL_IMAGES },
  { q: "Which animal lives in the ocean?", answer: 'whale', options: ['whale', 'bear', 'rabbit', 'chicken'] },
  { q: "Which animal has a trunk?", answer: 'elephant', options: ['elephant', 'cat', 'dog', 'penguin'] },
  { q: "Which animal hops?", answer: 'frog', options: ['frog', 'fish', 'owl', 'cow'] },
  { q: "Which animal says 'Meow'?", answer: 'cat', options: ['cat', 'dog', 'duck', 'cow'] },
  { q: "Which animal flies?", answer: 'bird', options: ['bird', 'fish', 'rabbit', 'bear'] },
  { q: "Which animal is black and white?", answer: 'panda', options: ['panda', 'tiger', 'lion', 'bear'] },
  { q: "Which animal has stripes?", answer: 'tiger', options: ['tiger', 'bear', 'elephant', 'whale'] },
  { q: "Which animal lives in trees?", answer: 'monkey', options: ['monkey', 'fish', 'cow', 'chicken'] },
  { q: "Which animal has a long neck?", answer: 'giraffe', options: ['giraffe', 'elephant', 'bear', 'rabbit'] },
  { q: "Which animal swims?", answer: 'fish', options: ['fish', 'bird', 'rabbit', 'bear'] },
  { q: "Which animal says 'Quack'?", answer: 'duck', options: ['duck', 'chicken', 'bird', 'owl'] },
  { q: "Which animal is very big?", answer: 'elephant', options: ['elephant', 'mouse', 'rabbit', 'frog'] },
  { q: "Which animal is very small?", answer: 'ant', options: ['ant', 'elephant', 'bear', 'whale'] },
  { q: "Which animal has wings?", answer: 'butterfly', options: ['butterfly', 'fish', 'rabbit', 'bear'] },
  { q: "Which animal has a shell?", answer: 'turtle', options: ['turtle', 'fish', 'bird', 'rabbit'] },
  { q: "Which animal barks?", answer: 'dog', options: ['dog', 'cat', 'cow', 'chicken'] },
  { q: "Which animal moos?", answer: 'cow', options: ['cow', 'pig', 'horse', 'chicken'] },
  { q: "Which animal has a mane?", answer: 'lion', options: ['lion', 'tiger', 'bear', 'fox'] },
  { q: "Which animal is pink?", answer: 'pig', options: ['pig', 'cow', 'rabbit', 'bear'] },
  { q: "Which animal has eight legs?", answer: 'octopus', options: ['octopus', 'crab', 'fish', 'whale'] },
  { q: "Which animal has claws?", answer: 'crab', options: ['crab', 'fish', 'bird', 'rabbit'] },
  { q: "Which animal is a bird that can't fly?", answer: 'penguin', options: ['penguin', 'owl', 'parrot', 'chick'] },
  { q: "Which animal hoots?", answer: 'owl', options: ['owl', 'bird', 'chicken', 'duck'] },
  { q: "Which animal is a mammal that lives in water?", answer: 'dolphin', options: ['dolphin', 'fish', 'crab', 'octopus'] },
];

export default function AnimalQuiz({ level = 1, onComplete }) {
  const { playSuccess, playWrong, playClick, speak } = useAudio();
  const { teachAfterAnswer, readQuestion } = useTeaching();
  const { generate } = useNoRepeat();
  const [round, setRound] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [options, setOptions] = useState([]);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const completedRef = useRef(false);
  const ROUNDS = getRounds(level);
  const CHOICES = getChoiceCount(level);
  const delay = getFeedbackDelay(level);

  useEffect(() => {
    if (round >= ROUNDS && !completedRef.current) {
      completedRef.current = true;
      const accuracy = Math.round((correct / ROUNDS) * 100);
      onComplete(score, accuracy);
      return;
    }

    // Select a random question
    const question = generate(
      () => QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)],
      (r) => r.q
    );
    
    // Filter options to match CHOICES count
    let availableOptions = [...question.options];
    
    // If we need more options, add random animals from ANIMAL_IMAGES
    if (availableOptions.length < CHOICES) {
      const allAnimals = Object.keys(ANIMAL_IMAGES);
      const used = new Set(availableOptions);
      while (availableOptions.length < CHOICES) {
        const randomAnimal = allAnimals[Math.floor(Math.random() * allAnimals.length)];
        if (!used.has(randomAnimal)) {
          availableOptions.push(randomAnimal);
          used.add(randomAnimal);
        }
      }
    } else if (availableOptions.length > CHOICES) {
      // If we have too many, randomly select CHOICES options (always include the answer)
      const answerIndex = availableOptions.indexOf(question.answer);
      const otherOptions = availableOptions.filter((_, i) => i !== answerIndex);
      const shuffled = otherOptions.sort(() => Math.random() - 0.5);
      availableOptions = [question.answer, ...shuffled.slice(0, CHOICES - 1)];
    }

    // Shuffle options
    const shuffled = availableOptions.sort(() => Math.random() - 0.5);
    
    setCurrentQuestion(question);
    setOptions(shuffled);
    setFeedback(null);
    const cancelRead = readQuestion(question.q);
    return cancelRead;
  }, [round, ROUNDS, CHOICES]);

  function handleAnswer(selected) {
    if (feedback !== null) return;
    playClick();
    
    const isCorrect = selected === currentQuestion.answer;
    
    if (isCorrect) {
      setScore(s => s + 1);
      setCorrect(c => c + 1);
      playSuccess();
      speak(currentQuestion.answer);
      setFeedback('correct');
      teachAfterAnswer(true, { type: 'animal', answer: selected, correctAnswer: currentQuestion.answer });
    } else {
      setWrong(w => w + 1);
      playWrong();
      setFeedback('wrong');
      teachAfterAnswer(false, { type: 'animal', answer: selected, correctAnswer: currentQuestion.answer });
    }
    
    setTimeout(() => setRound(r => r + 1), delay);
  }

  if (round >= ROUNDS) {
    return (
      <div className={styles.container}>
        <div className={styles.celebration}>
          <h2>🎉 Great Job!</h2>
          <p>Score: {score}/{ROUNDS}</p>
          <p>Accuracy: {Math.round((correct / ROUNDS) * 100)}%</p>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return <div className={styles.container}>Loading...</div>;
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
      
      <p className={styles.prompt}>{currentQuestion.q}</p>
      
      <div className={styles.choices}>
        {options.map((animal, i) => {
          const isCorrect = animal === currentQuestion.answer;
          const isSelected = feedback !== null && animal === currentQuestion.answer;
          const isWrong = feedback === 'wrong' && animal !== currentQuestion.answer;
          
          return (
            <button
              key={i}
              type="button"
              onClick={() => handleAnswer(animal)}
              className={`${styles.choiceBtn} ${
                isSelected ? styles.correct : ''
              } ${isWrong ? styles.wrong : ''}`}
              disabled={feedback !== null}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '1rem',
              }}
            >
              <GameImage 
                src={ANIMAL_IMAGES[animal]} 
                alt={animal} 
                size={64}
              />
              <span style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'capitalize' }}>
                {animal}
              </span>
            </button>
          );
        })}
      </div>
      
      {feedback && (
        <p className={feedback === 'correct' ? styles.feedbackOk : styles.feedbackBad}>
          {feedback === 'correct' ? '✓ Correct!' : 'Try again next round!'}
        </p>
      )}
    </div>
  );
}
