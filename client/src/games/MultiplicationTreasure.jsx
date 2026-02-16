/**
 * Multiplication Treasure - PREMIUM
 * Unique mechanic: Visual arrays (rows x columns of items) for teaching
 * multiplication. Kid counts arrays, does skip-counting, and solves
 * multiplication problems visually.
 * Different from AdditionIsland (plain addition) -- this uses arrays & groups.
 */
import { useState, useEffect, useRef } from 'react';
import { useAudio } from '../context/AudioContext';
import { useTeaching } from './useTeaching';
import { useNoRepeat } from './useNoRepeat';
import { getRounds, getChoiceCount, getFeedbackDelay } from './levelConfig';
import styles from './GameCommon.module.css';

const TWEMOJI = (cp) => `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/${cp}.svg`;

const ITEM_EMOJIS = [
  { name: 'star', cp: '2b50' },
  { name: 'apple', cp: '1f34e' },
  { name: 'heart', cp: '2764' },
  { name: 'flower', cp: '1f33b' },
  { name: 'ball', cp: '26bd' },
  { name: 'fish', cp: '1f41f' },
  { name: 'gem', cp: '1f48e' },
  { name: 'cookie', cp: '1f36a' },
];

function getQuestionTypes(level) {
  if (level <= 5) return ['array'];
  if (level <= 10) return ['array', 'skip'];
  if (level <= 15) return ['array', 'skip', 'multiply'];
  return ['array', 'skip', 'multiply', 'word'];
}

function getMaxFactor(level) {
  if (level <= 5) return 3;
  if (level <= 10) return 5;
  if (level <= 15) return 7;
  if (level <= 20) return 10;
  return 12;
}

function generateQuestion(types, maxFactor, choiceCount) {
  const type = types[Math.floor(Math.random() * types.length)];
  const item = ITEM_EMOJIS[Math.floor(Math.random() * ITEM_EMOJIS.length)];

  switch (type) {
    case 'array': {
      const rows = Math.floor(Math.random() * Math.min(maxFactor, 5)) + 2;
      const cols = Math.floor(Math.random() * Math.min(maxFactor, 5)) + 2;
      const answer = rows * cols;
      const options = [answer];
      while (options.length < choiceCount) {
        const opt = answer + (Math.floor(Math.random() * 7) - 3);
        if (opt > 0 && !options.includes(opt)) options.push(opt);
      }
      return {
        type: 'array', rows, cols, item, answer,
        prompt: `How many ${item.name}s are there?`,
        hint: `${rows} rows of ${cols}`,
        options: options.sort(() => Math.random() - 0.5),
        key: `arr-${rows}x${cols}-${item.name}`,
      };
    }
    case 'skip': {
      const by = Math.floor(Math.random() * (maxFactor - 1)) + 2;
      const count = Math.floor(Math.random() * 4) + 3;
      const seq = Array.from({ length: count }, (_, i) => by * (i + 1));
      const blankIdx = Math.floor(Math.random() * (count - 1)) + 1;
      const answer = seq[blankIdx];
      const options = [answer];
      while (options.length < choiceCount) {
        const opt = answer + (Math.floor(Math.random() * 5) - 2) * by;
        if (opt > 0 && !options.includes(opt)) options.push(opt);
      }
      return {
        type: 'skip', by, seq, blankIdx, answer,
        prompt: `Skip counting by ${by}s. What goes in the blank?`,
        options: options.sort(() => Math.random() - 0.5),
        key: `skip-${by}-${blankIdx}`,
      };
    }
    case 'multiply': {
      const a = Math.floor(Math.random() * maxFactor) + 1;
      const b = Math.floor(Math.random() * maxFactor) + 1;
      const answer = a * b;
      const options = [answer];
      while (options.length < choiceCount) {
        const opt = answer + (Math.floor(Math.random() * 9) - 4);
        if (opt > 0 && !options.includes(opt)) options.push(opt);
      }
      return {
        type: 'multiply', a, b, answer, item,
        prompt: `What is ${a} x ${b}?`,
        options: options.sort(() => Math.random() - 0.5),
        key: `mul-${a}x${b}`,
      };
    }
    case 'word': {
      const groups = Math.floor(Math.random() * Math.min(maxFactor, 6)) + 2;
      const perGroup = Math.floor(Math.random() * Math.min(maxFactor, 5)) + 2;
      const answer = groups * perGroup;
      const options = [answer];
      while (options.length < choiceCount) {
        const opt = answer + (Math.floor(Math.random() * 7) - 3);
        if (opt > 0 && !options.includes(opt)) options.push(opt);
      }
      return {
        type: 'word', groups, perGroup, answer, item,
        prompt: `There are ${groups} bags with ${perGroup} ${item.name}s each. How many total?`,
        options: options.sort(() => Math.random() - 0.5),
        key: `word-${groups}x${perGroup}-${item.name}`,
      };
    }
    default:
      return generateQuestion(['array'], maxFactor, choiceCount);
  }
}

export default function MultiplicationTreasure({ onComplete, level = 1, childName }) {
  const { playSuccess, playWrong, playClick } = useAudio();
  const { teachAfterAnswer, readQuestion } = useTeaching();
  const { generate } = useNoRepeat(level);
  const [round, setRound] = useState(0);
  const [question, setQuestion] = useState(null);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const completedRef = useRef(false);
  const ROUNDS = getRounds(level);
  const choiceCount = getChoiceCount(level);

  useEffect(() => {
    window.speechSynthesis?.cancel();
    if (round >= ROUNDS && !completedRef.current) {
      completedRef.current = true;
      const accuracy = ROUNDS > 0 ? Math.round((correct / ROUNDS) * 100) : 0;
      onComplete(score, accuracy);
      return;
    }
    const types = getQuestionTypes(level);
    const maxF = getMaxFactor(level);
    const q = generate(() => generateQuestion(types, maxF, choiceCount), (q) => q.key);
    setQuestion(q);
    setFeedback(null);
    const cancelRead = readQuestion(q.prompt);
    return cancelRead;
  }, [round]);

  function handleAnswer(option) {
    if (feedback) return;
    playClick();
    const isCorrect = option === question.answer;
    if (isCorrect) {
      setScore(s => s + 10);
      setCorrect(c => c + 1);
      playSuccess();
    } else {
      playWrong();
    }
    let extra = '';
    if (question.type === 'array') {
      extra = `${question.rows} rows times ${question.cols} columns equals ${question.answer}. That is ${question.rows} times ${question.cols}!`;
    } else if (question.type === 'multiply') {
      extra = `${question.a} times ${question.b} equals ${question.answer}. Imagine ${question.a} groups of ${question.b}!`;
    } else if (question.type === 'skip') {
      extra = `When we skip count by ${question.by}s: ${question.seq.join(', ')}`;
    } else if (question.type === 'word') {
      extra = `${question.groups} groups of ${question.perGroup} equals ${question.answer}. That is ${question.groups} times ${question.perGroup}!`;
    }
    teachAfterAnswer(isCorrect, {
      type: 'math', answer: option, correctAnswer: question.answer,
      a: question.a || question.rows || question.groups,
      b: question.b || question.cols || question.perGroup,
      extra,
    });
    setFeedback(isCorrect ? 'correct' : 'wrong');
    setTimeout(() => setRound(r => r + 1), getFeedbackDelay(level, isCorrect));
  }

  if (round >= ROUNDS) {
    const accuracy = ROUNDS > 0 ? Math.round((correct / ROUNDS) * 100) : 0;
    return (
      <div className={styles.container}>
        <div className={styles.celebration}>
          <h2>Multiplication Master!</h2>
          <p style={{ fontSize: '1.1rem', fontWeight: 700 }}>Score: {score}</p>
          <span style={{ color: 'var(--text-muted)', fontWeight: 800 }}>Accuracy: {accuracy}%</span>
        </div>
      </div>
    );
  }

  if (!question) return null;

  return (
    <div className={styles.container}>
      <div className={styles.hud}>
        <span>Lv {level}</span><span>·</span>
        <span>{round + 1}/{ROUNDS}</span><span>·</span>
        <span>Score: {score}</span>
      </div>

      {/* Visual display */}
      {question.type === 'array' && (
        <div style={{
          display: 'inline-grid',
          gridTemplateColumns: `repeat(${question.cols}, 1fr)`,
          gap: 4, padding: '0.5rem', background: 'rgba(56,189,248,0.06)',
          borderRadius: 12, margin: '0.5rem 0',
        }}>
          {Array.from({ length: question.rows * question.cols }).map((_, i) => (
            <img key={i} src={TWEMOJI(question.item.cp)} alt="" style={{ width: 28, height: 28 }} />
          ))}
        </div>
      )}

      {question.type === 'multiply' && (
        <div style={{
          fontSize: '2rem', fontWeight: 800, margin: '0.5rem 0',
          background: 'rgba(56,189,248,0.06)', padding: '0.75rem 1.5rem',
          borderRadius: 16, display: 'inline-block',
        }}>
          {question.a} x {question.b} = ?
        </div>
      )}

      {question.type === 'skip' && (
        <div style={{
          display: 'flex', gap: '0.5rem', justifyContent: 'center',
          flexWrap: 'wrap', margin: '0.5rem 0',
        }}>
          {question.seq.map((n, i) => (
            <span key={i} style={{
              padding: '0.5rem 0.8rem', borderRadius: 10, fontWeight: 800,
              fontSize: '1.2rem',
              background: i === question.blankIdx ? '#fbbf24' : 'rgba(56,189,248,0.1)',
              border: i === question.blankIdx ? '2px dashed #f97316' : '1.5px solid var(--card-border)',
              minWidth: 44, textAlign: 'center',
            }}>
              {i === question.blankIdx ? '?' : n}
            </span>
          ))}
        </div>
      )}

      {question.type === 'word' && (
        <div style={{ margin: '0.5rem 0', display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          {Array.from({ length: question.groups }).map((_, g) => (
            <div key={g} style={{
              background: 'rgba(56,189,248,0.06)', borderRadius: 10,
              padding: '0.3rem 0.5rem', display: 'flex', gap: 2,
              border: '1.5px solid var(--card-border)',
            }}>
              {Array.from({ length: question.perGroup }).map((_, i) => (
                <img key={i} src={TWEMOJI(question.item.cp)} alt="" style={{ width: 20, height: 20 }} />
              ))}
            </div>
          ))}
        </div>
      )}

      <p className={styles.prompt} style={{ marginTop: '0.5rem' }}>
        {question.type === 'array' && question.hint}
        {question.type === 'skip' && `Skip counting by ${question.by}s`}
        {question.type === 'word' && question.prompt}
      </p>

      <div className={styles.choices}>
        {question.options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => handleAnswer(opt)}
            disabled={!!feedback}
            className={`${styles.choiceBtn} ${styles.choiceNumber} ${
              feedback && opt === question.answer ? styles.correct : ''
            } ${feedback === 'wrong' && opt !== question.answer ? styles.wrong : ''}`}
          >
            {opt}
          </button>
        ))}
      </div>

      {feedback === 'correct' && <p className={styles.feedbackOk}>Correct!</p>}
      {feedback === 'wrong' && (
        <div className={styles.feedbackBad}>
          <p>The answer is <strong>{question.answer}</strong></p>
        </div>
      )}
    </div>
  );
}
