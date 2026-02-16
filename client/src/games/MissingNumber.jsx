import { useState, useEffect, useRef } from 'react';
import { useTeaching } from './useTeaching';
import { useNoRepeat } from './useNoRepeat';
import styles from './GameCommon.module.css';
import { getRounds, getChoiceCount, getFeedbackDelay, getMaxNumber } from './levelConfig';
import { useAudio } from '../context/AudioContext';

function getMode(level, round) {
  if (level <= 5) return 0; // 1,2,_,4 counting
  if (level <= 10) return round % 2; // 0: counting, 1: skip by 2
  if (level <= 15) return round % 3; // 0: counting, 1: skip by 2, 2: skip from odd
  return round % 4; // add 3: descending, 4: skip by 5
}

function getProblem(level, round) {
  const maxNum = getMaxNumber(level);
  const choiceCount = getChoiceCount(level);
  const mode = getMode(level, round);

  if (mode === 0) {
    const seqLen = 4;
    const start = Math.floor(Math.random() * Math.max(1, maxNum - seqLen)) + 1;
    const seq = [start, start + 1, start + 2, start + 3];
    const blank = Math.floor(Math.random() * seqLen);
    const answer = seq[blank];
    const opts = new Set([answer]);
    while (opts.size < choiceCount) opts.add(Math.max(1, Math.min(maxNum + 5, answer + (Math.floor(Math.random() * 9) - 4))));
    return { seq, blank, answer, options: [...opts].sort(() => Math.random() - 0.5) };
  }

  if (mode === 1) {
    const start = 2 + (round % 2) * 2;
    const seq = [start, start + 2, start + 4, start + 6];
    const blank = Math.floor(Math.random() * 4);
    const answer = seq[blank];
    const opts = new Set([answer]);
    const wrongPool = [answer - 2, answer + 2, answer - 4, answer + 4, answer + 1, answer - 1].filter(n => n >= 2 && n <= 30 && n !== answer);
    while (opts.size < choiceCount && wrongPool.length > 0) opts.add(wrongPool[Math.floor(Math.random() * wrongPool.length)]);
    while (opts.size < choiceCount) opts.add(answer + (opts.size % 2 ? 2 : -2));
    return { seq, blank, answer, options: [...opts].sort(() => Math.random() - 0.5) };
  }

  if (mode === 2) {
    const start = 1 + (round % 2) * 2;
    const seq = [start, start + 2, start + 4, start + 6];
    const blank = Math.floor(Math.random() * 4);
    const answer = seq[blank];
    const opts = new Set([answer]);
    const wrongPool = [answer - 2, answer + 2, answer - 1, answer + 1].filter(n => n >= 1 && n <= 25);
    while (opts.size < choiceCount) opts.add(wrongPool[Math.floor(Math.random() * wrongPool.length)] || answer + 2);
    return { seq, blank, answer, options: [...opts].sort(() => Math.random() - 0.5) };
  }

  if (mode === 3) {
    const isDesc = round % 2 === 0;
    if (isDesc) {
      const start = Math.min(10 + Math.floor(Math.random() * 8), 18);
      const seq = [start, start - 1, start - 2, start - 3];
      const blank = Math.floor(Math.random() * 4);
      const answer = seq[blank];
      const opts = new Set([answer]);
      while (opts.size < choiceCount) opts.add(Math.max(1, Math.min(20, answer + (Math.floor(Math.random() * 9) - 4))));
      return { seq, blank, answer, options: [...opts].sort(() => Math.random() - 0.5) };
    }
    const start = 5 + (round % 3) * 5;
    const seq = [start, start + 5, start + 10, start + 15];
    const blank = Math.floor(Math.random() * 4);
    const answer = seq[blank];
    const opts = new Set([answer]);
    const wrongPool = [5, 10, 15, 20, 25, 0, 3, 8, 12, 18, 7, 13].filter(n => n !== answer && n >= 0 && n <= 30);
    while (opts.size < choiceCount) opts.add(wrongPool[Math.floor(Math.random() * wrongPool.length)] || answer + 5);
    return { seq, blank, answer, options: [...opts].sort(() => Math.random() - 0.5) };
  }

  return null;
}

export default function MissingNumber({ onComplete, level = 1 }) {
  const { playSuccess, playWrong, playClick } = useAudio();
  const { teachAfterAnswer, readQuestion, getRecommendedDelayBeforeNext } = useTeaching();
  const { generate } = useNoRepeat(level);
  const [round, setRound] = useState(0);
  const [problem, setProblem] = useState(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [mode, setModeState] = useState(0);
  const completedRef = useRef(false);
  const ROUNDS = getRounds(level);

  useEffect(() => {
    window.speechSynthesis?.cancel();
    if (round >= ROUNDS && !completedRef.current) {
      completedRef.current = true;
      const accuracy = Math.round((score / ROUNDS) * 100);
      onComplete(score, accuracy);
      return;
    }
    const m = getMode(level, round);
    setModeState(m);
    const p = generate(
      () => getProblem(level, round),
      (r) => r?.seq?.join('-') || String(Date.now())
    );
    setProblem(p);
    setFeedback(null);
    const prompts = [
      'What number goes in the blank?',
      'What comes next?',
      'Fill in the missing number!',
      'What number fits?',
    ];
    const cancelRead = p ? readQuestion(prompts[Math.min(m, 3)]) : undefined;
    return cancelRead;
  }, [round, score, ROUNDS, level]);

  function handleAnswer(n) {
    if (feedback !== null || !problem) return;
    playClick();
    const correct = n === problem.answer;
    if (correct) {
      setScore((s) => s + 1);
      setStreak((s) => s + 1);
      playSuccess();
    } else {
      setStreak(0);
      playWrong();
    }
    setFeedback(correct ? 'correct' : 'wrong');
    teachAfterAnswer(correct, { type: 'math', answer: n, correctAnswer: problem.answer, extra: 'The sequence was: ' + problem.seq.join(', ') });
    const delay = getRecommendedDelayBeforeNext(getFeedbackDelay(level, correct));
    setTimeout(() => setRound((r) => r + 1), delay);
  }

  if (round >= ROUNDS) return <div className={styles.container}>Calculating your rewards…</div>;
  if (!problem) return null;

  return (
    <div className={styles.container}>
      <div className={styles.progress}>Lv {level} · Round {round + 1}/{ROUNDS} · Fill the missing number! Score: {score}{streak > 1 ? ` · Streak: ${streak}` : ''}</div>
      <p className={styles.prompt}>What number goes in the blank?</p>
      <div className={styles.sequenceArea}>
        {problem.seq.map((n, i) => (
          i === problem.blank ? (
            <span key={i} className={styles.sequenceItem} style={{ background: '#e5e7eb' }}>?</span>
          ) : (
            <span key={i} className={styles.sequenceItem}>{n}</span>
          )
        ))}
      </div>
      <div className={styles.choices}>
        {problem.options.map((n) => (
          <button key={n} type="button" onClick={() => handleAnswer(n)} className={`${styles.choiceBtn} ${styles.choiceNumber} ${feedback !== null && n === problem.answer ? styles.correct : ''} ${feedback !== null && n !== problem.answer ? styles.wrong : ''}`} disabled={feedback !== null}>{n}</button>
        ))}
      </div>
      {feedback === 'correct' && <p className={styles.feedbackOk}>✓ Correct!</p>}
      {feedback === 'wrong' && (
        <div className={styles.feedbackBad}>
          <p>✗ The answer is <strong>{problem.answer}</strong></p>
        </div>
      )}
    </div>
  );
}
