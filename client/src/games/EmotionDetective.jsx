import { useState, useEffect, useRef } from 'react';
import { useAudio } from '../context/AudioContext';
import { useTeaching } from './useTeaching';
import { useNoRepeat } from './useNoRepeat';
import { getRounds, getChoiceCount, getFeedbackDelay } from './levelConfig';
import styles from './GameCommon.module.css';

const EMOTIONS = [
  { emoji: '😊', word: 'Happy', color: '#fde68a', tip: 'This face has a big smile!' },
  { emoji: '😢', word: 'Sad', color: '#93c5fd', tip: 'This face has tears.' },
  { emoji: '😠', word: 'Angry', color: '#fda4af', tip: 'This face looks upset.' },
  { emoji: '😨', word: 'Scared', color: '#c4b5fd', tip: 'This face looks worried!' },
  { emoji: '😴', word: 'Sleepy', color: '#a5b4fc', tip: 'This face is very tired.' },
  { emoji: '🤗', word: 'Excited', color: '#fdba74', tip: 'This face is full of energy!' },
  { emoji: '😌', word: 'Calm', color: '#a7f3d0', tip: 'This face looks peaceful.' },
  { emoji: '😲', word: 'Surprised', color: '#fcd34d', tip: 'This face has a big open mouth!' },
];

export default function EmotionDetective({ onComplete, level = 1 }) {
  const { playSuccess, playWrong, playClick, speak } = useAudio();
  const { teachAfterAnswer, readQuestion } = useTeaching();
  const { generate } = useNoRepeat();
  const [round, setRound] = useState(0);
  const [target, setTarget] = useState(null);
  const [options, setOptions] = useState([]);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [streak, setStreak] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const completedRef = useRef(false);
  const ROUNDS = getRounds(level);
  const CHOICE_COUNT = getChoiceCount(level);
  const feedbackDelay = getFeedbackDelay(level);

  useEffect(() => {
    if (round >= ROUNDS && !completedRef.current) {
      completedRef.current = true;
      const accuracy = Math.round((score / ROUNDS) * 100);
      onComplete(score, accuracy);
      return;
    }
    const targetItem = generate(
      () => {
        const pool = [...EMOTIONS].sort(() => Math.random() - 0.5);
        return pool[0];
      },
      (r) => r.word
    );
    const pool = [targetItem, ...EMOTIONS.filter(e => e.word !== targetItem.word)].sort(() => Math.random() - 0.5);
    const opts = pool.slice(0, CHOICE_COUNT).map((e) => e.word);
    setTarget(targetItem);
    setOptions(opts.sort(() => Math.random() - 0.5));
    setFeedback(null);
    setShowHint(false);

    // Speak the question
    let cancelRead;
    const t = setTimeout(() => {
      cancelRead = readQuestion('How does this face feel?');
    }, 300);
    return () => { clearTimeout(t); if (cancelRead) cancelRead(); };
  }, [round, score, ROUNDS, CHOICE_COUNT, level]);

  function handleChoice(word) {
    if (feedback !== null) return;
    playClick();
    const correct = word === target?.word;
    if (correct) {
      setScore((s) => s + 1);
      setStreak(s => s + 1);
      playSuccess();
      teachAfterAnswer(true, { type: 'word', correctAnswer: target?.word, extra: target?.tip || 'This face is ' + target?.word + '!' });
    } else {
      setStreak(0);
      playWrong();
      teachAfterAnswer(false, { type: 'word', answer: word, correctAnswer: target?.word, extra: 'This face is ' + (target?.word || '') + '. ' + (target?.tip || '') });
    }
    setFeedback(correct ? 'correct' : 'wrong');
    setTimeout(() => setRound((r) => r + 1), feedbackDelay);
  }

  if (round >= ROUNDS) return <div className={styles.container}><p className={styles.prompt}>Calculating your rewards...</p></div>;

  return (
    <div className={styles.container}>
      <div className={styles.progress}>
        <span>Lv {level}</span>
        <span>·</span>
        <span>Round {round + 1} / {ROUNDS}</span>
        <span>·</span>
        <span>⭐ {score}</span>
        {streak >= 2 && <span>· 🔥 {streak}</span>}
      </div>

      <p className={styles.prompt}>How does this face feel?</p>

      <div className={styles.targetArea} style={{
        background: target?.color ? `${target.color}33` : 'transparent',
        borderRadius: '50%',
        width: '120px',
        height: '120px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 1rem',
      }}>
        <span className={styles.targetEmoji} role="img" aria-label={target?.word}>{target?.emoji}</span>
      </div>

      {!showHint && feedback === null && (
        <button
          type="button"
          onClick={() => setShowHint(true)}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--primary)',
            fontSize: '0.85rem',
            fontWeight: 700,
            cursor: 'pointer',
            marginBottom: '0.75rem',
            padding: '0.25rem 0.5rem',
            minHeight: 'auto',
          }}
        >
          🐻 Need a hint?
        </button>
      )}
      {showHint && target && (
        <div style={{
          background: 'rgba(56, 189, 248, 0.08)',
          padding: '0.5rem 0.75rem',
          borderRadius: '12px',
          fontSize: '0.85rem',
          fontWeight: 600,
          marginBottom: '0.75rem',
        }}>
          🐻 {target.tip}
        </div>
      )}

      <div className={styles.choices}>
        {options.map((word) => (
          <button
            key={word}
            type="button"
            onClick={() => handleChoice(word)}
            className={`${styles.choiceBtn} ${styles.choiceNumber} ${
              feedback !== null
                ? word === target?.word
                  ? styles.correct
                  : styles.wrong
                : ''
            }`}
            disabled={feedback !== null}
            style={{ fontSize: '1.1rem' }}
          >
            {word}
          </button>
        ))}
      </div>

      {feedback && (
        <p className={feedback === 'correct' ? styles.feedbackOk : styles.feedbackBad}>
          {feedback === 'correct'
            ? streak >= 3 ? '🔥 Emotion Expert!' : '✓ Correct!'
            : `This face is ${target?.word}. Great try!`}
        </p>
      )}
    </div>
  );
}
