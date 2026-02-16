import { useState, useEffect, useRef } from 'react';
import { useAudio } from '../context/AudioContext';
import { useTeaching } from './useTeaching';
import { useNoRepeat } from './useNoRepeat';
import { ai as aiApi } from '../api/client';
import { getRounds, getMaxNumber, getChoiceCount, getFeedbackDelay } from './levelConfig';
import { COUNTING_THEMES, GameImage } from './gameImages';
import styles from './GameCommon.module.css';

function getMode(level, round) {
  if (level <= 5) return 0; // howMany
  if (level <= 10) return round % 2; // 0: howMany, 1: whichMore
  if (level <= 15) return round % 4; // 0: howMany, 1: whichMore, 2: oneMore, 3: countBackwards
  return round % 5; // add 4: together
}

export default function CountingAdventure({ onComplete, level = 1, childAge }) {
  const { playSuccess, playWrong, playClick } = useAudio();
  const { teachAfterAnswer, readQuestion } = useTeaching();
  const { generate } = useNoRepeat();
  const [round, setRound] = useState(0);
  const [count, setCount] = useState(0);
  const [count2, setCount2] = useState(0);
  const [options, setOptions] = useState([]);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [currentObj, setCurrentObj] = useState(null);
  const [currentObj2, setCurrentObj2] = useState(null);
  const [theme, setTheme] = useState(COUNTING_THEMES[0]);
  const [mode, setModeState] = useState(0);
  const [streak, setStreak] = useState(0);
  const [hint, setHint] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [whichMorePair, setWhichMorePair] = useState(null);
  const completedRef = useRef(false);
  const ROUNDS = getRounds(level);
  const MAX_COUNT = getMaxNumber(level);
  const CHOICES = getChoiceCount(level);
  const delay = getFeedbackDelay(level);

  useEffect(() => { setTheme(COUNTING_THEMES[Math.floor(Math.random() * COUNTING_THEMES.length)]); }, []);

  useEffect(() => {
    if (round >= ROUNDS && !completedRef.current) {
      completedRef.current = true;
      onComplete(score, Math.round((score / ROUNDS) * 100));
      return;
    }
    const m = getMode(level, round);
    setModeState(m);
    const objs = theme.objects;

    if (m === 0) {
      // How many X?
      const { n, obj } = generate(
        () => {
          const n = Math.floor(Math.random() * MAX_COUNT) + 1;
          const obj = objs[Math.floor(Math.random() * objs.length)];
          return { n, obj };
        },
        (r) => `${m}-${r.n}-${r.obj?.name}`
      );
      const wrong = new Set([n]);
      while (wrong.size < CHOICES) {
        const w = Math.floor(Math.random() * MAX_COUNT) + 1;
        if (w !== n) wrong.add(w);
      }
      setCount(n);
      setCount2(0);
      setCurrentObj(obj);
      setCurrentObj2(null);
      setWhichMorePair(null);
      setOptions([...wrong].sort(() => Math.random() - 0.5));
      const cancelRead = readQuestion('How many ' + (obj?.name || 'items') + ' do you see?');
      return cancelRead;
    }

    if (m === 1) {
      // Which has more: A X or B Y?
      const { a, b, obj1, obj2 } = generate(
        () => {
          let a, b;
          do {
            a = Math.floor(Math.random() * MAX_COUNT) + 1;
            b = Math.floor(Math.random() * MAX_COUNT) + 1;
          } while (a === b);
          const obj1 = objs[Math.floor(Math.random() * objs.length)];
          let obj2 = objs[Math.floor(Math.random() * objs.length)];
          while (obj2?.name === obj1?.name && objs.length > 1) obj2 = objs[Math.floor(Math.random() * objs.length)];
          return { a, b, obj1, obj2 };
        },
        (r) => `${m}-${r.a}-${r.b}-${r.obj1?.name}-${r.obj2?.name}`
      );
      setWhichMorePair({ a, b, obj1, obj2 });
      const answer = a > b ? a : b;
      const wrong = new Set([answer]);
      while (wrong.size < CHOICES) wrong.add(Math.floor(Math.random() * MAX_COUNT) + 1);
      setCount(a > b ? a : b);
      setCount2(a > b ? b : a);
      setCurrentObj(null);
      setCurrentObj2(null);
      setOptions([...wrong].sort(() => Math.random() - 0.5));
      const cancelRead = readQuestion('Which has more: ' + a + ' ' + obj1?.name + 's or ' + b + ' ' + obj2?.name + 's?');
      return cancelRead;
    }

    if (m === 2) {
      // What is 1 more than X?
      const { n, obj } = generate(
        () => {
          const n = Math.min(Math.floor(Math.random() * (MAX_COUNT - 1)) + 1, MAX_COUNT - 1);
          const obj = objs[Math.floor(Math.random() * objs.length)];
          return { n, obj };
        },
        (r) => `${m}-${r.n}-${r.obj?.name}`
      );
      const answer = n + 1;
      const wrong = new Set([answer]);
      while (wrong.size < CHOICES) wrong.add(Math.max(1, answer + (Math.floor(Math.random() * 5) - 2)));
      setCount(n);
      setCount2(0);
      setCurrentObj(obj);
      setCurrentObj2(null);
      setWhichMorePair(null);
      setOptions([...wrong].sort(() => Math.random() - 0.5));
      const cancelRead = readQuestion('What is 1 more than ' + n + ' ' + (obj?.name || 'items') + '?');
      return cancelRead;
    }

    if (m === 3) {
      // Count backwards from N - what comes before?
      const { start } = generate(
        () => ({ start: Math.min(Math.floor(Math.random() * (MAX_COUNT - 2)) + 3, MAX_COUNT) }),
        (r) => `${m}-${r.start}`
      );
      const answer = start - 1;
      const wrong = new Set([answer]);
      while (wrong.size < CHOICES) wrong.add(Math.max(1, answer + (Math.floor(Math.random() * 5) - 2)));
      setCount(start);
      setCount2(0);
      setCurrentObj({ name: 'number' });
      setCurrentObj2(null);
      setWhichMorePair(null);
      setOptions([...wrong].sort(() => Math.random() - 0.5));
      const cancelRead = readQuestion('Count backwards from ' + start + '. What number comes before ' + start + '?');
      return cancelRead;
    }

    // m === 4: How many X AND Y together?
    const { n1, n2, obj1, obj2 } = generate(
      () => {
        const n1 = Math.floor(Math.random() * Math.min(5, MAX_COUNT - 1)) + 1;
        const n2 = Math.floor(Math.random() * Math.min(5, MAX_COUNT - n1)) + 1;
        const obj1 = objs[Math.floor(Math.random() * objs.length)];
        let obj2 = objs[Math.floor(Math.random() * objs.length)];
        while (obj2?.name === obj1?.name && objs.length > 1) obj2 = objs[Math.floor(Math.random() * objs.length)];
        return { n1, n2, obj1, obj2 };
      },
      (r) => `${m}-${r.n1}-${r.n2}-${r.obj1?.name}-${r.obj2?.name}`
    );
    const answer = n1 + n2;
    const wrong = new Set([answer]);
    while (wrong.size < CHOICES) wrong.add(Math.max(2, answer + (Math.floor(Math.random() * 7) - 3)));
    setCount(n1);
    setCount2(n2);
    setCurrentObj(obj1);
    setCurrentObj2(obj2);
    setWhichMorePair(null);
    setOptions([...wrong].sort(() => Math.random() - 0.5));
    const cancelRead = readQuestion('How many ' + obj1?.name + 's and ' + obj2?.name + 's are there altogether?');
    return cancelRead;
  }, [round, ROUNDS, MAX_COUNT, CHOICES, theme, level]);

  function getCorrectAnswer() {
    if (mode === 0) return count;
    if (mode === 1) return whichMorePair ? (whichMorePair.a > whichMorePair.b ? whichMorePair.a : whichMorePair.b) : count;
    if (mode === 2) return count + 1;
    if (mode === 3) return count - 1;
    if (mode === 4) return count + count2;
    return count;
  }

  function handleAnswer(selected) {
    if (feedback !== null) return;
    playClick();
    const correct = selected === getCorrectAnswer();
    if (correct) { setScore(s => s + 1); setStreak(s => s + 1); playSuccess(); }
    else { setStreak(0); playWrong(); }
    setFeedback(correct ? 'correct' : 'wrong');
    teachAfterAnswer(correct, { type: 'counting', answer: selected, correctAnswer: getCorrectAnswer() });
    setTimeout(() => setRound(r => r + 1), delay);
  }

  async function requestHint() {
    setShowHint(true);
    try {
      const res = await aiApi.hint('counting-adventure', `Count: ${getCorrectAnswer()}`, score, Math.round((score / Math.max(1, round)) * 100), childAge || 5);
      setHint(res.hint || 'Count each one carefully!');
    } catch (_) { setHint('Count each one slowly!'); }
  }

  if (round >= ROUNDS) return <div className={styles.container}><p className={styles.prompt}>Calculating rewards...</p></div>;

  let promptText = '';
  let displayArea = null;

  if (mode === 0) {
    promptText = `How many ${currentObj?.name || 'items'} are there?`;
    displayArea = (
      <div className={styles.countDisplay}>
        {Array.from({ length: count }, (_, i) => (
          <span key={i} className={styles.countEmoji}>
            {currentObj ? <GameImage src={currentObj.img} alt={currentObj.name} size={level <= 10 ? 48 : 40} /> : '⭐'}
          </span>
        ))}
      </div>
    );
  } else if (mode === 1 && whichMorePair) {
    const { a, b, obj1, obj2 } = whichMorePair;
    promptText = `Which has more: ${a} ${obj1?.name}s or ${b} ${obj2?.name}s?`;
    displayArea = (
      <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        <div>
          <p style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem' }}>{a} {obj1?.name}s</p>
          <div className={styles.countDisplay} style={{ justifyContent: 'center' }}>
            {Array.from({ length: Math.min(a, 10) }, (_, i) => (
              <span key={i} className={styles.countEmoji}>
                <GameImage src={obj1.img} alt={obj1.name} size={40} />
              </span>
            ))}
            {a > 10 && <span style={{ fontSize: '1.2rem', fontWeight: 800 }}>+{a - 10} more</span>}
          </div>
        </div>
        <div>
          <p style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem' }}>{b} {obj2?.name}s</p>
          <div className={styles.countDisplay} style={{ justifyContent: 'center' }}>
            {Array.from({ length: Math.min(b, 10) }, (_, i) => (
              <span key={i} className={styles.countEmoji}>
                <GameImage src={obj2.img} alt={obj2.name} size={40} />
              </span>
            ))}
            {b > 10 && <span style={{ fontSize: '1.2rem', fontWeight: 800 }}>+{b - 10} more</span>}
          </div>
        </div>
      </div>
    );
  } else if (mode === 2) {
    promptText = `What is 1 more than ${count}?`;
    displayArea = (
      <div className={styles.countDisplay}>
        {Array.from({ length: count }, (_, i) => (
          <span key={i} className={styles.countEmoji}>
            {currentObj ? <GameImage src={currentObj.img} alt={currentObj.name} size={40} /> : '⭐'}
          </span>
        ))}
        <span style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0.5rem' }}>+ 1 = ?</span>
      </div>
    );
  } else if (mode === 3) {
    promptText = `Count backwards from ${count}. What comes before ${count}?`;
    displayArea = (
      <div style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '1.5rem' }}>
        {count} → ?
      </div>
    );
  } else if (mode === 4 && currentObj && currentObj2) {
    promptText = `How many ${currentObj.name}s and ${currentObj2.name}s together?`;
    displayArea = (
      <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        <div className={styles.countDisplay} style={{ flexDirection: 'column', alignItems: 'center' }}>
          {Array.from({ length: Math.min(count, 6) }, (_, i) => (
            <GameImage key={i} src={currentObj.img} alt={currentObj.name} size={36} />
          ))}
          {count > 6 && <span>+{count - 6} more</span>}
          <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>{count} {currentObj.name}s</span>
        </div>
        <span style={{ fontSize: '1.5rem', alignSelf: 'center' }}>+</span>
        <div className={styles.countDisplay} style={{ flexDirection: 'column', alignItems: 'center' }}>
          {Array.from({ length: Math.min(count2, 6) }, (_, i) => (
            <GameImage key={i} src={currentObj2.img} alt={currentObj2.name} size={36} />
          ))}
          {count2 > 6 && <span>+{count2 - 6} more</span>}
          <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>{count2} {currentObj2.name}s</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.progress}>
        <span>Lv {level} · {round + 1}/{ROUNDS}</span><span>·</span><span>⭐ {score}</span>
        {streak >= 2 && <span>· 🔥 {streak}</span>}
      </div>
      <p className={styles.prompt}>{promptText}</p>
      {displayArea}
      {!showHint && feedback === null && (
        <button type="button" onClick={requestHint} style={{ background:'none',border:'none',color:'var(--primary)',fontSize:'0.85rem',fontWeight:700,cursor:'pointer',marginBottom:'0.75rem',padding:'0.25rem 0.5rem',minHeight:'auto' }}>🐻 Need a hint?</button>
      )}
      {showHint && hint && (
        <div style={{ background:'rgba(56,189,248,0.08)',padding:'0.5rem 0.75rem',borderRadius:'12px',fontSize:'0.85rem',fontWeight:600,marginBottom:'0.75rem' }}>🐻 {hint}</div>
      )}
      <div className={styles.choices}>
        {options.map(num => (
          <button key={num} type="button" onClick={() => handleAnswer(num)}
            className={`${styles.choiceBtn} ${styles.choiceNumber} ${feedback !== null ? (num === getCorrectAnswer() ? styles.correct : feedback === 'wrong' ? styles.wrong : '') : ''}`}
            disabled={feedback !== null}>{num}</button>
        ))}
      </div>
      {feedback && (
        <p className={feedback === 'correct' ? styles.feedbackOk : styles.feedbackBad}>
          {feedback === 'correct' ? (streak >= 3 ? '🔥 Amazing streak!' : '✓ Correct!') : `It was ${getCorrectAnswer()}! Keep going!`}
        </p>
      )}
    </div>
  );
}
