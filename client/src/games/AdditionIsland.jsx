import { useState, useEffect, useRef } from 'react';
import { useAudio } from '../context/AudioContext';
import { useTeaching } from './useTeaching';
import { useNoRepeat } from './useNoRepeat';
import { getRounds, getChoiceCount, getFeedbackDelay } from './levelConfig';
import { COUNTING_THEMES, GameImage } from './gameImages';
import styles from './GameCommon.module.css';

function getMaxForAddition(level) {
  if (level <= 5) return 9;
  if (level <= 10) return 15;
  if (level <= 15) return 20;
  return 30;
}

function getMode(level, round) {
  if (level <= 5) return 0; // A + B = ?
  if (level <= 10) return round % 2; // 0: A+B, 1: ?+B=C
  if (level <= 15) return round % 3; // 0: A+B, 1: ?+B=C, 2: A+B+C
  return round % 4; // add 3: word problem
}

const WORD_PROBLEM_TEMPLATES = [
  { name: 'apple', q: 'Tom has {a} apples. He gets {b} more. How many apples now?' },
  { name: 'ball', q: 'Sara has {a} balls. Her friend gives her {b} more. How many total?' },
  { name: 'cookie', q: 'There are {a} cookies. Mom bakes {b} more. How many cookies?' },
  { name: 'star', q: 'You earned {a} stars. You get {b} more. How many stars?' },
  { name: 'book', q: 'There are {a} books. Dad brings {b} more. How many books?' },
  { name: 'flower', q: 'There are {a} flowers. {b} more bloom. How many flowers?' },
  { name: 'toy', q: 'You have {a} toys. You get {b} for your birthday. How many toys?' },
  { name: 'bird', q: '{a} birds sit on a tree. {b} more fly over. How many birds?' },
  { name: 'fish', q: 'The tank has {a} fish. {b} new fish are added. How many fish?' },
  { name: 'balloon', q: 'There are {a} balloons. {b} more are blown up. How many balloons?' },
];

function getProblem(level, round) {
  const max = getMaxForAddition(level);
  const choiceCount = getChoiceCount(level);
  const mode = getMode(level, round);

  if (mode === 0) {
    const a = Math.floor(Math.random() * Math.min(max - 1, 9)) + 1;
    const b = Math.floor(Math.random() * Math.min(max - a, 9)) + 1;
    const sum = a + b;
    const wrong = new Set([sum]);
    const maxWrong = Math.min(max * 2, 50);
    while (wrong.size < choiceCount) wrong.add(Math.floor(Math.random() * maxWrong) + 1);
    return { mode: 0, a, b, c: null, sum, options: [...wrong].sort(() => Math.random() - 0.5), question: `${a} + ${b} = ?` };
  }

  if (mode === 1) {
    const b = Math.floor(Math.random() * Math.min(max - 1, 12)) + 1;
    const sum = Math.floor(Math.random() * (max - b)) + b + 1;
    const a = sum - b;
    const wrong = new Set([a]);
    while (wrong.size < choiceCount) wrong.add(Math.max(1, Math.min(max, a + (Math.floor(Math.random() * 9) - 4))));
    return { mode: 1, a, b, c: sum, sum: a, options: [...wrong].sort(() => Math.random() - 0.5), question: `? + ${b} = ${sum}` };
  }

  if (mode === 2) {
    const a = Math.floor(Math.random() * Math.min(max / 3, 6)) + 1;
    const b = Math.floor(Math.random() * Math.min(max / 3, 6)) + 1;
    const c = Math.floor(Math.random() * Math.min(max / 3, 6)) + 1;
    const sum = a + b + c;
    const wrong = new Set([sum]);
    while (wrong.size < choiceCount) wrong.add(Math.max(3, sum + (Math.floor(Math.random() * 11) - 5)));
    return { mode: 2, a, b, c, sum, options: [...wrong].sort(() => Math.random() - 0.5), question: `${a} + ${b} + ${c} = ?` };
  }

  // mode 3: word problem
  const a = Math.floor(Math.random() * Math.min(max - 1, 9)) + 1;
  const b = Math.floor(Math.random() * Math.min(max - a, 9)) + 1;
  const sum = a + b;
  const tpl = WORD_PROBLEM_TEMPLATES[Math.floor(Math.random() * WORD_PROBLEM_TEMPLATES.length)];
  const q = tpl.q.replace('{a}', a).replace('{b}', b);
  const wrong = new Set([sum]);
  while (wrong.size < choiceCount) wrong.add(Math.max(2, sum + (Math.floor(Math.random() * 9) - 4)));
  return { mode: 3, a, b, c: null, sum, options: [...wrong].sort(() => Math.random() - 0.5), question: q, wordObj: tpl.name };
}

export default function AdditionIsland({ onComplete, level = 1 }) {
  const { playSuccess, playWrong, playClick } = useAudio();
  const { teachAfterAnswer, readQuestion } = useTeaching();
  const { generate } = useNoRepeat(level);
  const [round, setRound] = useState(0);
  const [problem, setProblem] = useState(null);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [streak, setStreak] = useState(0);
  const [theme, setTheme] = useState(COUNTING_THEMES[0]);
  const completedRef = useRef(false);
  const ROUNDS = getRounds(level);

  useEffect(() => {
    setTheme(COUNTING_THEMES[Math.floor(Math.random() * COUNTING_THEMES.length)]);
  }, []);

  useEffect(() => {
    window.speechSynthesis?.cancel();
    if (round >= ROUNDS && !completedRef.current) {
      completedRef.current = true;
      const accuracy = Math.round((score / ROUNDS) * 100);
      onComplete(score, accuracy);
      return;
    }
    const p = generate(
      () => getProblem(level, round),
      (r) => `${r.mode}-${r.a}-${r.b}`
    );
    setProblem(p);
    setFeedback(null);
    const readText = p.mode === 3 ? p.question : 'What is ' + (p.mode === 0 ? p.a + ' plus ' + p.b : p.mode === 1 ? 'the missing number' : p.a + ' plus ' + p.b + ' plus ' + p.c) + '?';
    const cancelRead = p ? readQuestion(readText) : undefined;
    return cancelRead;
  }, [round, score, ROUNDS, level]);

  function handleAnswer(num) {
    if (feedback !== null || !problem) return;
    playClick();
    const correct = num === problem.sum;
    if (correct) {
      setScore((s) => s + 1);
      setStreak((s) => s + 1);
      playSuccess();
    } else {
      setStreak(0);
      playWrong();
    }
    setFeedback(correct ? 'correct' : 'wrong');
    const extra = problem.mode === 3
      ? `${problem.a} + ${problem.b} = ${problem.sum}!`
      : `${problem.a} plus ${problem.b}${problem.c != null ? ' plus ' + problem.c : ''} equals ${problem.sum}!`;
    teachAfterAnswer(correct, { type: 'addition', answer: num, correctAnswer: problem.sum, a: problem.a, b: problem.b, extra });
    const delay = getFeedbackDelay(level, correct);
    setTimeout(() => setRound((r) => r + 1), delay);
  }

  if (round >= ROUNDS) return <div className={styles.container}>Calculating your rewards…</div>;
  if (!problem) return <div className={styles.container}>Loading…</div>;

  let visualArea = null;
  if (problem.mode === 0 && level <= 5 && theme?.objects?.length) {
    const obj = theme.objects[round % theme.objects.length] || theme.objects[0];
    visualArea = (
      <div className={styles.countDisplay} style={{ marginBottom: '1rem', minHeight: 60 }}>
        {Array.from({ length: Math.min(problem.a, 6) }, (_, i) => (
          <span key={'a' + i} className={styles.countEmoji}>
            <GameImage src={obj.img} alt={obj.name} size={40} />
          </span>
        ))}
        <span style={{ fontSize: '1.2rem', margin: '0 0.5rem' }}>+</span>
        {Array.from({ length: Math.min(problem.b, 6) }, (_, i) => (
          <span key={'b' + i} className={styles.countEmoji}>
            <GameImage src={obj.img} alt={obj.name} size={40} />
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.progress}>
        <span>Lv {level}</span>
        <span>·</span>
        <span>Round {round + 1} of {ROUNDS}</span>
        <span>·</span>
        <span>Score: {score}</span>
        {streak >= 2 && <span>· 🔥 {streak}</span>}
      </div>
      <p className={styles.prompt}>
        {problem.mode === 0 && problem.a != null && problem.b != null && `What is ${problem.a} + ${problem.b}?`}
        {problem.mode === 1 && ('? + ' + problem.b + ' = ' + problem.c)}
        {problem.mode === 2 && (problem.a + ' + ' + problem.b + ' + ' + problem.c + ' = ?')}
        {problem.mode === 3 && problem.question}
      </p>
      {visualArea}
      <div className={styles.choices}>
        {problem.options.map((num) => (
          <button
            key={num}
            type="button"
            onClick={() => handleAnswer(num)}
            className={`${styles.choiceBtn} ${styles.choiceNumber} ${
              feedback !== null
                ? num === problem.sum
                  ? styles.correct
                  : styles.wrong
                : ''
            }`}
            disabled={feedback !== null}
          >
            {num}
          </button>
        ))}
      </div>
      {feedback === 'correct' && (
        <p className={styles.feedbackOk}>{streak >= 3 ? '🔥 Math Master!' : '✓ Correct!'}</p>
      )}
      {feedback === 'wrong' && (
        <div className={styles.feedbackBad}>
          <p>✗ The answer is <strong>{problem.sum}</strong></p>
        </div>
      )}
    </div>
  );
}
