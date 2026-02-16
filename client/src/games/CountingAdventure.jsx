import { useState, useEffect, useRef } from 'react';
import { useAudio } from '../context/AudioContext';
import { useTeaching } from './useTeaching';
import { useNoRepeat } from './useNoRepeat';
import { ai as aiApi } from '../api/client';
import { getRounds, getMaxNumber, getChoiceCount, getFeedbackDelay } from './levelConfig';
import { COUNTING_THEMES, GameImage } from './gameImages';
import styles from './GameCommon.module.css';

function getMode(level, round) {
  if (level <= 5) return 0;
  if (level <= 10) return round % 2;
  if (level <= 15) return round % 4;
  return round % 5;
}

export default function CountingAdventure({ onComplete, level = 1, childAge }) {
  const { playSuccess, playWrong, playClick } = useAudio();
  const { teachAfterAnswer, readQuestion } = useTeaching();
  const { generate } = useNoRepeat();
  const [round, setRound] = useState(0);
  const [questionData, setQuestionData] = useState(null);
  const [options, setOptions] = useState([]);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [streak, setStreak] = useState(0);
  const [theme, setTheme] = useState(COUNTING_THEMES[0]);
  const completedRef = useRef(false);
  const ROUNDS = getRounds(level);
  const MAX_COUNT = getMaxNumber(level);
  const CHOICES = getChoiceCount(level);

  useEffect(() => {
    setTheme(COUNTING_THEMES[Math.floor(Math.random() * COUNTING_THEMES.length)]);
  }, []);

  // Generate new question when round changes
  useEffect(() => {
    // Cancel any speech from previous round
    window.speechSynthesis?.cancel();

    if (round >= ROUNDS && !completedRef.current) {
      completedRef.current = true;
      onComplete(score, Math.round((score / ROUNDS) * 100));
      return;
    }

    const m = getMode(level, round);
    const objs = theme.objects;

    let q;
    if (m === 0) {
      const { n, obj } = generate(
        () => ({ n: Math.floor(Math.random() * MAX_COUNT) + 1, obj: objs[Math.floor(Math.random() * objs.length)] }),
        r => `0-${r.n}-${r.obj?.name}`
      );
      const opts = makeOptions(n, CHOICES, MAX_COUNT);
      q = { mode: 0, correct: n, prompt: `How many ${obj?.name || 'items'} are there?`, obj, n, opts };
    } else if (m === 1) {
      const { a, b, obj1, obj2 } = generate(
        () => {
          let a, b;
          do { a = Math.floor(Math.random() * MAX_COUNT) + 1; b = Math.floor(Math.random() * MAX_COUNT) + 1; } while (a === b);
          const obj1 = objs[Math.floor(Math.random() * objs.length)];
          let obj2 = objs[Math.floor(Math.random() * objs.length)];
          while (obj2?.name === obj1?.name && objs.length > 1) obj2 = objs[Math.floor(Math.random() * objs.length)];
          return { a, b, obj1, obj2 };
        },
        r => `1-${r.a}-${r.b}`
      );
      const answer = Math.max(a, b);
      const opts = makeOptions(answer, CHOICES, MAX_COUNT);
      q = { mode: 1, correct: answer, prompt: `Which has more: ${a} ${obj1?.name}s or ${b} ${obj2?.name}s?`, a, b, obj1, obj2, opts };
    } else if (m === 2) {
      const { n, obj } = generate(
        () => ({ n: Math.floor(Math.random() * (MAX_COUNT - 1)) + 1, obj: objs[Math.floor(Math.random() * objs.length)] }),
        r => `2-${r.n}`
      );
      const answer = n + 1;
      const opts = makeOptions(answer, CHOICES, MAX_COUNT + 1);
      q = { mode: 2, correct: answer, prompt: `What is 1 more than ${n}?`, n, obj, opts };
    } else if (m === 3) {
      const { start } = generate(
        () => ({ start: Math.floor(Math.random() * (MAX_COUNT - 2)) + 3 }),
        r => `3-${r.start}`
      );
      const answer = start - 1;
      const opts = makeOptions(answer, CHOICES, MAX_COUNT);
      q = { mode: 3, correct: answer, prompt: `What number comes before ${start}?`, n: start, opts };
    } else {
      const { n1, n2, obj1, obj2 } = generate(
        () => {
          const n1 = Math.floor(Math.random() * Math.min(5, MAX_COUNT - 1)) + 1;
          const n2 = Math.floor(Math.random() * Math.min(5, MAX_COUNT - n1)) + 1;
          const obj1 = objs[Math.floor(Math.random() * objs.length)];
          let obj2 = objs[Math.floor(Math.random() * objs.length)];
          while (obj2?.name === obj1?.name && objs.length > 1) obj2 = objs[Math.floor(Math.random() * objs.length)];
          return { n1, n2, obj1, obj2 };
        },
        r => `4-${r.n1}-${r.n2}-${r.obj1?.name}`
      );
      const answer = n1 + n2;
      const opts = makeOptions(answer, CHOICES, MAX_COUNT * 2);
      q = { mode: 4, correct: answer, prompt: `How many ${obj1?.name}s and ${obj2?.name}s together?`, n1, n2, obj1, obj2, opts };
    }

    setQuestionData(q);
    setOptions(q.opts);
    setFeedback(null);

    const cancel = readQuestion(q.prompt);
    return cancel;
  }, [round, ROUNDS, MAX_COUNT, CHOICES, theme, level]);

  function handleAnswer(selected) {
    if (feedback !== null || !questionData) return;
    playClick();
    const correct = selected === questionData.correct;
    if (correct) { setScore(s => s + 1); setStreak(s => s + 1); playSuccess(); }
    else { setStreak(0); playWrong(); }
    setFeedback(correct ? 'correct' : 'wrong');
    teachAfterAnswer(correct, { type: 'counting', answer: selected, correctAnswer: questionData.correct });
    const delay = getFeedbackDelay(level, correct);
    setTimeout(() => setRound(r => r + 1), delay);
  }

  if (round >= ROUNDS) return <div className={styles.container}><p className={styles.prompt}>Calculating rewards...</p></div>;
  if (!questionData) return <div className={styles.container}><p className={styles.prompt}>Loading...</p></div>;

  return (
    <div className={styles.container}>
      <div className={styles.progress}>
        <span>Lv {level} · {round + 1}/{ROUNDS}</span><span>·</span><span>⭐ {score}</span>
        {streak >= 2 && <span>· 🔥 {streak}</span>}
      </div>
      <p className={styles.prompt}>{questionData.prompt}</p>
      <QuestionDisplay q={questionData} level={level} />
      <div className={styles.choices}>
        {options.map(num => (
          <button key={num} type="button" onClick={() => handleAnswer(num)}
            className={`${styles.choiceBtn} ${styles.choiceNumber} ${feedback !== null ? (num === questionData.correct ? styles.correct : feedback === 'wrong' ? styles.wrong : '') : ''}`}
            disabled={feedback !== null}>{num}</button>
        ))}
      </div>
      {feedback === 'correct' && (
        <p className={styles.feedbackOk}>{streak >= 3 ? '🔥 Amazing streak!' : '✓ Correct!'}</p>
      )}
      {feedback === 'wrong' && (
        <div className={styles.feedbackBad}>
          <p>✗ The answer is <strong>{questionData.correct}</strong></p>
        </div>
      )}
    </div>
  );
}

function QuestionDisplay({ q, level }) {
  if (q.mode === 0 && q.obj) {
    return (
      <div className={styles.countDisplay}>
        {Array.from({ length: q.n }, (_, i) => (
          <span key={i} className={styles.countEmoji}>
            <GameImage src={q.obj.img} alt={q.obj.name} size={level <= 10 ? 48 : 40} />
          </span>
        ))}
      </div>
    );
  }
  if (q.mode === 1 && q.obj1 && q.obj2) {
    return (
      <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '1rem' }}>
        <div style={{ textAlign: 'center' }}>
          <div className={styles.countDisplay}>{Array.from({ length: Math.min(q.a, 8) }, (_, i) => (
            <span key={i} className={styles.countEmoji}><GameImage src={q.obj1.img} alt={q.obj1.name} size={36} /></span>
          ))}</div>
          <p style={{ fontWeight: 700, fontSize: '0.9rem' }}>{q.a} {q.obj1.name}s</p>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div className={styles.countDisplay}>{Array.from({ length: Math.min(q.b, 8) }, (_, i) => (
            <span key={i} className={styles.countEmoji}><GameImage src={q.obj2.img} alt={q.obj2.name} size={36} /></span>
          ))}</div>
          <p style={{ fontWeight: 700, fontSize: '0.9rem' }}>{q.b} {q.obj2.name}s</p>
        </div>
      </div>
    );
  }
  if (q.mode === 2 && q.obj) {
    return (
      <div className={styles.countDisplay}>
        {Array.from({ length: q.n }, (_, i) => (
          <span key={i} className={styles.countEmoji}><GameImage src={q.obj.img} alt={q.obj.name} size={40} /></span>
        ))}
        <span style={{ fontSize: '1.5rem', fontWeight: 800 }}> + 1 = ?</span>
      </div>
    );
  }
  if (q.mode === 3) {
    return <div style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '1rem', textAlign: 'center' }}>{q.n} → ?</div>;
  }
  if (q.mode === 4 && q.obj1 && q.obj2) {
    return (
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '1rem' }}>
        <div style={{ textAlign: 'center' }}>
          {Array.from({ length: Math.min(q.n1, 6) }, (_, i) => (
            <GameImage key={i} src={q.obj1.img} alt={q.obj1.name} size={32} />
          ))}
          <p style={{ fontWeight: 700, fontSize: '0.85rem' }}>{q.n1}</p>
        </div>
        <span style={{ fontSize: '1.5rem', alignSelf: 'center' }}>+</span>
        <div style={{ textAlign: 'center' }}>
          {Array.from({ length: Math.min(q.n2, 6) }, (_, i) => (
            <GameImage key={i} src={q.obj2.img} alt={q.obj2.name} size={32} />
          ))}
          <p style={{ fontWeight: 700, fontSize: '0.85rem' }}>{q.n2}</p>
        </div>
      </div>
    );
  }
  return null;
}

function makeOptions(correct, count, max) {
  const opts = new Set([correct]);
  while (opts.size < count) {
    const w = Math.max(1, correct + Math.floor(Math.random() * 7) - 3);
    if (w !== correct && w <= Math.max(max, correct + 5)) opts.add(w);
  }
  return [...opts].sort(() => Math.random() - 0.5);
}
