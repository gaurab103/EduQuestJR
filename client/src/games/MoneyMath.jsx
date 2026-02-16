/**
 * Money Math - Learn coins and counting money.
 * Builds financial literacy and addition skills.
 * Progressive: identify coins → count coins → make change.
 */
import { useState, useEffect, useRef } from 'react';
import { useAudio } from '../context/AudioContext';
import { useNoRepeat } from './useNoRepeat';
import { getRounds, getChoiceCount, getFeedbackDelay } from './levelConfig';
import { useTeaching } from './useTeaching';
import styles from './GameCommon.module.css';

const COINS = [
  { name: 'Penny', value: 1, color: '#cd7f32', symbol: '1¢' },
  { name: 'Nickel', value: 5, color: '#a0a0a0', symbol: '5¢' },
  { name: 'Dime', value: 10, color: '#c0c0c0', symbol: '10¢' },
  { name: 'Quarter', value: 25, color: '#d4d4d4', symbol: '25¢' },
];

function getMode(level) {
  if (level <= 5) return 'identify';
  if (level <= 15) return 'count';
  return 'make';
}

function generateCountProblem(level) {
  const maxCoins = level <= 8 ? 2 : level <= 12 ? 3 : 4;
  const pool = level <= 8 ? COINS.slice(0, 2) : level <= 15 ? COINS.slice(0, 3) : COINS;
  const coins = [];
  for (let i = 0; i < maxCoins; i++) {
    coins.push(pool[Math.floor(Math.random() * pool.length)]);
  }
  const total = coins.reduce((s, c) => s + c.value, 0);
  return { coins, total };
}

export default function MoneyMath({ onComplete, level = 1, childName }) {
  const { playSuccess, playWrong, playClick, playCelebration } = useAudio();
  const { teachAfterAnswer, readQuestion } = useTeaching();
  const { generate } = useNoRepeat(level);
  const [round, setRound] = useState(0);
  const [problem, setProblem] = useState(null);
  const [options, setOptions] = useState([]);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [selected, setSelected] = useState(null);
  const [done, setDone] = useState(false);
  const completedRef = useRef(false);
  const ROUNDS = getRounds(level);
  const CHOICES = getChoiceCount(level);
  const mode = getMode(level);

  useEffect(() => {
    window.speechSynthesis?.cancel();
    if (round >= ROUNDS && !completedRef.current) {
      completedRef.current = true;
      setDone(true);
      playCelebration();
      onComplete(score, ROUNDS > 0 ? Math.round((correct / ROUNDS) * 100) : 0);
      return;
    }

    let cancelRead;
    if (mode === 'identify') {
      const coinPool = COINS.slice(0, level <= 3 ? 2 : 4);
      const coin = generate(
        () => coinPool[Math.floor(Math.random() * coinPool.length)],
        (r) => r.name
      );
      const opts = new Set([coin.name]);
      while (opts.size < CHOICES) opts.add(COINS[Math.floor(Math.random() * COINS.length)].name);
      setProblem({ type: 'identify', coin });
      setOptions([...opts].sort(() => Math.random() - 0.5));
      cancelRead = readQuestion(`What coin is this? It says ${coin.symbol}`);
    } else {
      const { coins, total } = generate(
        () => generateCountProblem(level),
        (r) => String(r.total)
      );
      const opts = new Set([total]);
      while (opts.size < CHOICES) {
        const fake = total + (Math.floor(Math.random() * 20) - 10);
        if (fake > 0 && fake !== total) opts.add(fake);
      }
      setProblem({ type: 'count', coins, total });
      setOptions([...opts].sort((a, b) => a - b));
      cancelRead = readQuestion('How much money is this?');
    }

    setFeedback(null);
    setSelected(null);
    return cancelRead;
  }, [round, mode, level, CHOICES]);

  function handleChoice(answer) {
    if (feedback) return;
    playClick();
    setSelected(answer);

    let isCorrect = false;
    if (problem.type === 'identify') {
      isCorrect = answer === problem.coin.name;
    } else {
      isCorrect = answer === problem.total;
    }

    if (isCorrect) {
      setScore(s => s + 10);
      setCorrect(c => c + 1);
      setFeedback({ type: 'correct', text: problem.type === 'identify' ? `Correct! That's a ${problem.coin.name}!` : `Correct! ${problem.total}¢!` });
      playSuccess();
      teachAfterAnswer(true, { type: 'math', correctAnswer: problem.type === 'identify' ? problem.coin.name : problem.total, extra: 'Learning about money helps us make smart choices!' });
    } else {
      setWrong(w => w + 1);
      setFeedback({ type: 'wrong', text: problem.type === 'identify' ? `Not quite! The correct answer is ${problem.coin.name}.` : `Not quite! The correct total is ${problem.total}¢.` });
      playWrong();
      teachAfterAnswer(false, { type: 'math', correctAnswer: problem.type === 'identify' ? problem.coin.name : problem.total, extra: 'Learning about money helps us make smart choices!' });
    }
    const delay = getFeedbackDelay(level, isCorrect);
    setTimeout(() => setRound(r => r + 1), delay);
  }

  if (done) {
    const acc = ROUNDS > 0 ? Math.round((correct / ROUNDS) * 100) : 0;
    return (
      <div className={styles.container}>
        <div className={styles.celebration}>
          <span style={{ fontSize: '4rem' }}>💰</span>
          <h2>Money Expert, {childName || 'Banker'}!</h2>
          <p style={{ fontSize: '1.1rem', fontWeight: 700 }}>Score: {score}</p>
          <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', margin: '0.5rem 0' }}>
            <span style={{ color: '#22c55e', fontWeight: 800 }}>✅ {correct}</span>
            <span style={{ color: '#ef4444', fontWeight: 800 }}>❌ {wrong}</span>
          </div>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Accuracy: {acc}%</p>
        </div>
      </div>
    );
  }

  if (!problem) return null;

  return (
    <div className={styles.container}>
      <div className={styles.hud}>
        <span>Lv {level} · {round + 1}/{ROUNDS} · ✅ {correct} · ❌ {wrong} · ⭐ {score}</span>
      </div>

      {problem.type === 'identify' ? (
        <>
          <p className={styles.prompt}>What coin is this?</p>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
            <div style={{
              width: 90, height: 90, borderRadius: '50%', background: problem.coin.color,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.2rem', fontWeight: 900, color: '#333',
              border: '4px solid rgba(0,0,0,0.15)', boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
            }}>
              {problem.coin.symbol}
            </div>
          </div>
        </>
      ) : (
        <>
          <p className={styles.prompt}>How much money?</p>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '1rem' }}>
            {problem.coins.map((coin, i) => (
              <div key={i} style={{
                width: 60, height: 60, borderRadius: '50%', background: coin.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.8rem', fontWeight: 900, color: '#333',
                border: '3px solid rgba(0,0,0,0.12)', boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
              }}>
                {coin.symbol}
              </div>
            ))}
          </div>
        </>
      )}

      <div className={styles.choices}>
        {options.map((opt, i) => {
          let bg = 'transparent';
          let border = '3px solid var(--border)';
          if (feedback && selected === opt) {
            bg = feedback.type === 'correct' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)';
            border = feedback.type === 'correct' ? '3px solid #22c55e' : '3px solid #ef4444';
          }
          const correctAnswer = problem.type === 'identify' ? problem.coin.name : problem.total;
          if (feedback && feedback.type === 'wrong' && opt === correctAnswer) {
            bg = 'rgba(34,197,94,0.1)'; border = '3px solid #22c55e';
          }
          return (
            <button key={i} type="button" onClick={() => handleChoice(opt)}
              className={`${styles.choiceBtn} ${styles.choiceNumber}`}
              disabled={feedback !== null}
              style={{ background: bg, border, fontSize: '1rem', fontWeight: 800 }}>
              {problem.type === 'identify' ? opt : `${opt}¢`}
            </button>
          );
        })}
      </div>

      {feedback && (
        <div className={feedback.type === 'correct' ? styles.feedbackOk : styles.feedbackBad}
          style={{ marginTop: '0.5rem' }}>{feedback.text}</div>
      )}
    </div>
  );
}
