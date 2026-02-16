import { useState, useEffect, useRef } from 'react';
import { useAudio } from '../context/AudioContext';
import { useTeaching } from './useTeaching';
import { useNoRepeat } from './useNoRepeat';
import { getRounds, getChoiceCount, getFeedbackDelay } from './levelConfig';
import styles from './GameCommon.module.css';

const COLORS = {
  Red: '#ef4444',
  Blue: '#3b82f6',
  Yellow: '#eab308',
  Green: '#22c55e',
  Orange: '#f97316',
  Purple: '#a855f7',
  Pink: '#ec4899',
  Brown: '#a16207',
  Black: '#1f2937',
  White: '#f9fafb',
};

const COLOR_MIXES = [
  { mix: ['Red', 'Blue'], result: 'Purple', options: ['Purple', 'Green', 'Orange', 'Brown'] },
  { mix: ['Red', 'Yellow'], result: 'Orange', options: ['Orange', 'Green', 'Purple', 'Pink'] },
  { mix: ['Blue', 'Yellow'], result: 'Green', options: ['Green', 'Purple', 'Orange', 'Brown'] },
  { mix: ['Red', 'White'], result: 'Pink', options: ['Pink', 'Orange', 'Purple', 'Brown'] },
  { mix: ['Red', 'Black'], result: 'Brown', options: ['Brown', 'Purple', 'Green', 'Orange'] },
  { mix: ['Blue', 'Red'], result: 'Purple', options: ['Purple', 'Green', 'Orange', 'Pink'] },
  { mix: ['Yellow', 'Blue'], result: 'Green', options: ['Green', 'Orange', 'Purple', 'Brown'] },
  { mix: ['Yellow', 'Red'], result: 'Orange', options: ['Orange', 'Green', 'Purple', 'Pink'] },
];

const SIMPLE_COLORS = ['Red', 'Blue', 'Yellow', 'Green', 'Orange', 'Purple', 'Pink', 'Brown'];

export default function ColorMixing({ level = 1, onComplete }) {
  const { playSuccess, playWrong, playClick, speak } = useAudio();
  const { teachAfterAnswer, readQuestion } = useTeaching();
  const { generate } = useNoRepeat();
  const [round, setRound] = useState(0);
  const [currentChallenge, setCurrentChallenge] = useState(null);
  const [options, setOptions] = useState([]);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const completedRef = useRef(false);
  const ROUNDS = getRounds(level);
  const CHOICES = getChoiceCount(level);
  const isMixingLevel = level > 10;

  useEffect(() => {
    window.speechSynthesis?.cancel();
    if (round >= ROUNDS && !completedRef.current) {
      completedRef.current = true;
      const accuracy = Math.round((correct / ROUNDS) * 100);
      onComplete(score, accuracy);
      return;
    }

    if (isMixingLevel) {
      // Color mixing mode (level 11+)
      const mix = generate(
        () => COLOR_MIXES[Math.floor(Math.random() * COLOR_MIXES.length)],
        (r) => r.result
      );
      
      // Ensure we have enough options
      let availableOptions = [...mix.options];
      if (availableOptions.length < CHOICES) {
        const allColors = Object.keys(COLORS);
        const used = new Set(availableOptions);
        while (availableOptions.length < CHOICES) {
          const randomColor = allColors[Math.floor(Math.random() * allColors.length)];
          if (!used.has(randomColor)) {
            availableOptions.push(randomColor);
            used.add(randomColor);
          }
        }
      } else if (availableOptions.length > CHOICES) {
        // Ensure answer is included, then add random others
        const answerIndex = availableOptions.indexOf(mix.result);
        const otherOptions = availableOptions.filter((_, i) => i !== answerIndex);
        const shuffled = otherOptions.sort(() => Math.random() - 0.5);
        availableOptions = [mix.result, ...shuffled.slice(0, CHOICES - 1)];
      }
      
      const shuffled = availableOptions.sort(() => Math.random() - 0.5);
      setCurrentChallenge({
        type: 'mixing',
        color1: mix.mix[0],
        color2: mix.mix[1],
        answer: mix.result,
      });
      setOptions(shuffled);
    } else {
      // Simple color identification (level 1-10)
      const answer = generate(
        () => SIMPLE_COLORS[Math.floor(Math.random() * SIMPLE_COLORS.length)],
        (r) => r
      );
      const allColors = Object.keys(COLORS);
      const used = new Set([answer]);
      const wrongOptions = [];
      
      while (wrongOptions.length < CHOICES - 1) {
        const randomColor = allColors[Math.floor(Math.random() * allColors.length)];
        if (!used.has(randomColor)) {
          wrongOptions.push(randomColor);
          used.add(randomColor);
        }
      }
      
      const shuffled = [answer, ...wrongOptions].sort(() => Math.random() - 0.5);
      setCurrentChallenge({
        type: 'identification',
        answer,
      });
      setOptions(shuffled);
    }
    
    setFeedback(null);
    const cancelRead = readQuestion(isMixingLevel ? 'What color do you get when you mix these colors?' : 'What color is this?');
    return cancelRead;
  }, [round, ROUNDS, CHOICES, isMixingLevel]);

  function handleAnswer(selected) {
    if (feedback !== null) return;
    playClick();
    
    const isCorrect = selected === currentChallenge.answer;
    
    if (isCorrect) {
      setScore(s => s + 1);
      setCorrect(c => c + 1);
      playSuccess();
      speak(currentChallenge.answer);
      setFeedback('correct');
      teachAfterAnswer(true, { type: 'color', answer: selected, correctAnswer: currentChallenge.answer });
    } else {
      setWrong(w => w + 1);
      playWrong();
      setFeedback('wrong');
      teachAfterAnswer(false, { type: 'color', answer: selected, correctAnswer: currentChallenge.answer });
    }
    
    const delay = getFeedbackDelay(level, isCorrect);
    setTimeout(() => setRound(r => r + 1), delay);
  }

  if (round >= ROUNDS) {
    return (
      <div className={styles.container}>
        <div className={styles.celebration}>
          <h2>🎨 Great Job!</h2>
          <p>Score: {score}/{ROUNDS}</p>
          <p>Accuracy: {Math.round((correct / ROUNDS) * 100)}%</p>
        </div>
      </div>
    );
  }

  if (!currentChallenge) {
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
      
      {isMixingLevel ? (
        <>
          <p className={styles.prompt}>What color do you get when you mix these colors?</p>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            gap: '1rem', 
            marginBottom: '1.5rem',
            alignItems: 'center',
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              backgroundColor: COLORS[currentChallenge.color1],
              border: '4px solid white',
              boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
            }} />
            <span style={{ fontSize: '2rem', fontWeight: 700 }}>+</span>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              backgroundColor: COLORS[currentChallenge.color2],
              border: '4px solid white',
              boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
            }} />
            <span style={{ fontSize: '2rem', fontWeight: 700 }}>=</span>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              backgroundColor: '#e5e7eb',
              border: '4px dashed #9ca3af',
              boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
            }} />
          </div>
        </>
      ) : (
        <>
          <p className={styles.prompt}>What color is this?</p>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            marginBottom: '1.5rem',
          }}>
            <div style={{
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              backgroundColor: COLORS[currentChallenge.answer],
              border: '6px solid white',
              boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
            }} />
          </div>
        </>
      )}
      
      <div className={styles.choices}>
        {options.map((color, i) => {
          const isCorrect = color === currentChallenge.answer;
          const isSelected = feedback !== null && color === currentChallenge.answer;
          const isWrong = feedback === 'wrong' && color !== currentChallenge.answer;
          
          return (
            <button
              key={i}
              type="button"
              onClick={() => handleAnswer(color)}
              className={`${styles.choiceBtn} ${
                isSelected ? styles.correct : ''
              } ${isWrong ? styles.wrong : ''}`}
              disabled={feedback !== null}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                padding: '1rem',
                backgroundColor: COLORS[color] || '#f3f4f6',
                border: `4px solid ${COLORS[color] || '#e5e7eb'}`,
                minWidth: '100px',
                minHeight: '100px',
              }}
            >
              <div style={{
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                backgroundColor: COLORS[color] || '#f3f4f6',
                border: '3px solid white',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              }} />
              <span style={{ 
                fontSize: '0.9rem', 
                fontWeight: 700, 
                color: color === 'White' || color === 'Yellow' ? '#1f2937' : 'white',
                textShadow: color === 'White' || color === 'Yellow' ? 'none' : '0 1px 2px rgba(0,0,0,0.3)',
              }}>
                {color}
              </span>
            </button>
          );
        })}
      </div>
      
      {feedback === 'correct' && (
        <p className={styles.feedbackOk}>✓ Correct!</p>
      )}
      {feedback === 'wrong' && (
        <div className={styles.feedbackBad}>
          <p>✗ The answer is <strong>{currentChallenge.answer}</strong></p>
        </div>
      )}
    </div>
  );
}
