import { useState, useEffect, useRef } from 'react';
import { useAudio } from '../context/AudioContext';
import { useNoRepeat } from './useNoRepeat';
import { getRounds, getChoiceCount, getFeedbackDelay } from './levelConfig';
import { useTeaching } from './useTeaching';
import styles from './GameCommon.module.css';

const SCENARIOS = [
  { scenario: 'Your friend is sad. What do you do?', good: 'Give a hug', bad: ['Ignore them', 'Laugh'] },
  { scenario: 'You find a toy on the floor. What do you do?', good: 'Return it', bad: ['Hide it', 'Break it'] },
  { scenario: 'Someone shares with you. What do you say?', good: 'Thank you', bad: ['Nothing', 'Mine!'] },
  { scenario: 'You want to play. Your friend is busy. What do you do?', good: 'Wait patiently', bad: ['Take their toy', 'Yell'] },
  { scenario: 'You made a mistake. What do you do?', good: 'Say sorry', bad: ['Run away', 'Blame others'] },
];

export default function GoodBehaviorChoice({ onComplete, level = 1 }) {
  const { playSuccess, playWrong, playClick } = useAudio();
  const { teachAfterAnswer, readQuestion, getRecommendedDelayBeforeNext } = useTeaching();
  const { generate } = useNoRepeat(level);
  const [round, setRound] = useState(0);
  const [item, setItem] = useState(null);
  const [options, setOptions] = useState([]);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const completedRef = useRef(false);
  const ROUNDS = getRounds(level);
  const CHOICES = getChoiceCount(level);

  useEffect(() => {
    window.speechSynthesis?.cancel();
    if (round >= ROUNDS && !completedRef.current) {
      completedRef.current = true;
      const accuracy = Math.round((score / ROUNDS) * 100);
      onComplete(score, accuracy);
      return;
    }
    const i = generate(
      () => SCENARIOS[Math.floor(Math.random() * SCENARIOS.length)],
      (r) => r.scenario
    );
    const allOptions = [i.good, ...i.bad].slice(0, CHOICES);
    while (allOptions.length < CHOICES && i.bad.length > allOptions.length - 1) {
      const extra = i.bad.find(b => !allOptions.includes(b));
      if (extra) allOptions.push(extra);
      else break;
    }
    setItem(i);
    setOptions(allOptions.sort(() => Math.random() - 0.5));
    setFeedback(null);
    const cancelRead = readQuestion(i.scenario);
    return cancelRead;
  }, [round, score, ROUNDS, CHOICES]);

  function handlePick(opt) {
    if (feedback !== null) return;
    playClick();
    const correct = opt === item?.good;
    if (correct) { setScore((s) => s + 1); setStreak((s) => s + 1); playSuccess(); }
    else { setStreak(0); playWrong(); }
    teachAfterAnswer(correct, { type: 'word', correctAnswer: item?.good, extra: 'Making good choices makes everyone happy!' });
    setFeedback(correct ? 'correct' : 'wrong');
    const delay = getRecommendedDelayBeforeNext(getFeedbackDelay(level, correct));
    setTimeout(() => setRound((r) => r + 1), delay);
  }

  if (round >= ROUNDS) return <div className={styles.container}>Calculating your rewards…</div>;

  return (
    <div className={styles.container}>
      <div className={styles.progress}>
        <span>Lv {level} · Round {round + 1}/{ROUNDS}</span><span>·</span><span>Score: {score}</span>
        {streak >= 2 && <span>· 🔥 {streak}</span>}
      </div>
      <p className={styles.prompt}>{item?.scenario}</p>
      <div className={styles.choices}>
        {options.map((opt, i) => (
          <button key={i} type="button" onClick={() => handlePick(opt)} className={`${styles.choiceBtn} ${styles.choiceNumber}`} disabled={feedback !== null}>{opt}</button>
        ))}
      </div>
      {feedback === 'correct' && <p className={styles.feedbackOk}>{streak >= 3 ? '🔥 Amazing streak!' : '✓ Great choice!'}</p>}
      {feedback === 'wrong' && (
        <div className={styles.feedbackBad}>
          <p>✗ The answer is <strong>{item?.good}</strong></p>
        </div>
      )}
    </div>
  );
}
