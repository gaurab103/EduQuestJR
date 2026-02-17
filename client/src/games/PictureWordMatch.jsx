/**
 * Picture Word Match - Highly graphical literacy game.
 * Shows a picture, child picks the correct word. Academic + visual.
 */
import { useState, useEffect, useRef } from 'react';
import { useAudio } from '../context/AudioContext';
import { useTeaching } from './useTeaching';
import { useNoRepeat } from './useNoRepeat';
import { getRounds, getChoiceCount, getFeedbackDelay } from './levelConfig';
import { getCorrectMessage, getWrongPrefix } from './feedbackMessages';
import { GameImage, ANIMAL_IMAGES, FRUIT_IMAGES, OBJECT_IMAGES, VEGGIE_IMAGES, FOOD_IMAGES } from './gameImages';
import styles from './GameCommon.module.css';

const PICTURE_WORDS = [
  { word: 'Apple', img: FRUIT_IMAGES.apple },
  { word: 'Bear', img: ANIMAL_IMAGES.bear },
  { word: 'Cat', img: ANIMAL_IMAGES.cat },
  { word: 'Dog', img: ANIMAL_IMAGES.dog },
  { word: 'Elephant', img: ANIMAL_IMAGES.elephant },
  { word: 'Fish', img: ANIMAL_IMAGES.fish },
  { word: 'Grapes', img: FRUIT_IMAGES.grapes },
  { word: 'House', img: OBJECT_IMAGES.house },
  { word: 'Lion', img: ANIMAL_IMAGES.lion },
  { word: 'Monkey', img: ANIMAL_IMAGES.monkey },
  { word: 'Orange', img: FRUIT_IMAGES.orange },
  { word: 'Penguin', img: ANIMAL_IMAGES.penguin },
  { word: 'Rabbit', img: ANIMAL_IMAGES.rabbit },
  { word: 'Sun', img: OBJECT_IMAGES.sun },
  { word: 'Tree', img: OBJECT_IMAGES.tree },
  { word: 'Whale', img: ANIMAL_IMAGES.whale },
  { word: 'Car', img: OBJECT_IMAGES.car },
  { word: 'Flower', img: OBJECT_IMAGES.flower },
  { word: 'Star', img: OBJECT_IMAGES.star },
  { word: 'Moon', img: OBJECT_IMAGES.moon },
  { word: 'Butterfly', img: ANIMAL_IMAGES.butterfly },
  { word: 'Banana', img: FRUIT_IMAGES.banana },
  { word: 'Cookie', img: FOOD_IMAGES.cookie },
  { word: 'Pizza', img: FOOD_IMAGES.pizza },
  { word: 'Carrot', img: VEGGIE_IMAGES.carrot },
];

export default function PictureWordMatch({ onComplete, level = 1, childName }) {
  const { playSuccess, playWrong, playClick, speak } = useAudio();
  const { teachAfterAnswer, readQuestion, getRecommendedDelayBeforeNext } = useTeaching();
  const { generate } = useNoRepeat(level);
  const [round, setRound] = useState(0);
  const [target, setTarget] = useState(null);
  const [choices, setChoices] = useState([]);
  const [correctIndex, setCorrectIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const completedRef = useRef(false);
  const ROUNDS = getRounds(level);
  const CHOICE_COUNT = getChoiceCount(level);

  useEffect(() => {
    window.speechSynthesis?.cancel();
    if (round >= ROUNDS && !completedRef.current) {
      completedRef.current = true;
      const accuracy = Math.round((score / ROUNDS) * 100);
      onComplete(score, accuracy);
      return;
    }

    const item = generate(
      () => PICTURE_WORDS[Math.floor(Math.random() * PICTURE_WORDS.length)],
      (r) => r.word
    );
    const wrong = PICTURE_WORDS
      .filter(p => p.word !== item.word)
      .sort(() => Math.random() - 0.5)
      .slice(0, CHOICE_COUNT - 1);
    const opts = [item, ...wrong].sort(() => Math.random() - 0.5);
    setTarget(item);
    setChoices(opts);
    setCorrectIndex(opts.findIndex(c => c.word === item.word));
    setFeedback(null);
    const cancelRead = readQuestion('What is this? ' + item.word);
    return cancelRead;
  }, [round, level]);

  function handleChoice(index) {
    if (feedback !== null) return;
    playClick();
    const isCorrect = index === correctIndex;
    if (isCorrect) {
      setScore(s => s + 1);
      playSuccess();
      speak(target.word);
      setFeedback('correct');
      teachAfterAnswer(true, { type: 'vocab', correctAnswer: target.word });
    } else {
      playWrong();
      setFeedback('wrong');
      teachAfterAnswer(false, { type: 'vocab', answer: choices[index]?.word, correctAnswer: target?.word });
    }
    const delay = getRecommendedDelayBeforeNext(getFeedbackDelay(level, isCorrect));
    setTimeout(() => setRound(r => r + 1), delay);
  }

  if (round >= ROUNDS) {
    return (
      <div className={styles.container}>
        <div className={styles.celebration}>
          <h2>Picture Master!</h2>
          <p style={{ fontSize: '1.1rem', fontWeight: 700 }}>Score: {score}/{ROUNDS}</p>
          <p style={{ color: 'var(--text-muted)' }}>Accuracy: {Math.round((score / ROUNDS) * 100)}%</p>
        </div>
      </div>
    );
  }

  if (!target) return null;

  return (
    <div className={styles.container}>
      <div className={styles.hud}>
        <span>Lv {level}</span>
        <span>·</span>
        <span>Round {round + 1}/{ROUNDS}</span>
        <span>·</span>
        <span>Score: {score}</span>
      </div>

      <p className={styles.prompt}>What is this?</p>

      <div style={{
        margin: '1rem 0',
        padding: '1.5rem',
        background: 'linear-gradient(135deg, rgba(56,189,248,0.08), rgba(167,139,250,0.08))',
        borderRadius: 20,
        border: '2px solid rgba(56,189,248,0.2)',
        display: 'inline-block',
        boxShadow: '0 8px 32px rgba(56,189,248,0.15)',
      }}>
        <GameImage src={target.img} alt={target.word} size={120} />
      </div>

      <div className={styles.choices} style={{ marginTop: '1rem' }}>
        {choices.map((c, i) => (
          <button
            key={i}
            type="button"
            onClick={() => handleChoice(i)}
            className={`${styles.choiceBtn} ${
              feedback === 'correct' && i === correctIndex ? styles.correct : ''
            } ${feedback === 'wrong' && i === correctIndex ? styles.correct : ''} ${
              feedback === 'wrong' && i !== correctIndex ? styles.wrong : ''
            }`}
            disabled={feedback !== null}
            style={{
              padding: '1rem 1.5rem',
              fontSize: '1.1rem',
              fontWeight: 700,
              minHeight: 52,
            }}
          >
            {c.word}
          </button>
        ))}
      </div>

      {feedback === 'correct' && (
        <p className={styles.feedbackOk}>{getCorrectMessage()} It&apos;s a {target.word}!</p>
      )}
      {feedback === 'wrong' && (
        <div className={styles.feedbackBad}>
          <p>{getWrongPrefix()} It&apos;s <strong>{target.word}</strong></p>
        </div>
      )}
    </div>
  );
}
