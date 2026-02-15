import { useState, useEffect, useRef } from 'react';
import { useAudio } from '../context/AudioContext';
import { getRounds, getChoiceCount, getFeedbackDelay } from './levelConfig';
import { useTeaching } from './useTeaching';
import styles from './GameCommon.module.css';

const SEQUENCES_3 = [
  ['1', '2', '3'],
  ['A', 'B', 'C'],
  ['🟢', '🟡', '🔴'],
  ['small', 'medium', 'big'],
];
const SEQUENCES_4 = [
  ['1', '2', '3', '4'],
  ['A', 'B', 'C', 'D'],
  ['🟢', '🟡', '🔴', '🔵'],
  ['small', 'medium', 'big', 'huge'],
];
const SEQUENCES_5 = [
  ['1', '2', '3', '4', '5'],
  ['A', 'B', 'C', 'D', 'E'],
  ['🟢', '🟡', '🔴', '🔵', '🟣'],
  ['tiny', 'small', 'medium', 'big', 'huge'],
];

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

function getSequencesForLength(len) {
  if (len <= 3) return SEQUENCES_3;
  if (len <= 4) return SEQUENCES_4;
  return SEQUENCES_5;
}

export default function SequenceBuilder({ onComplete, level = 1 }) {
  const { playSuccess, playWrong, playClick } = useAudio();
  const { teachAfterAnswer, readQuestion } = useTeaching();
  const [round, setRound] = useState(0);
  const [correct, setCorrect] = useState([]);
  const [options, setOptions] = useState([]);
  const [selected, setSelected] = useState([]);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const completedRef = useRef(false);
  const ROUNDS = getRounds(level);
  const seqLength = getChoiceCount(level);
  const sequences = getSequencesForLength(seqLength);
  const delay = getFeedbackDelay(level);

  useEffect(() => {
    if (round >= ROUNDS && !completedRef.current) {
      completedRef.current = true;
      const accuracy = Math.round((score / ROUNDS) * 100);
      onComplete(score, accuracy);
      return;
    }
    const seq = sequences[Math.floor(Math.random() * sequences.length)];
    setCorrect([...seq]);
    setOptions(shuffle([...seq]));
    setSelected([]);
    setFeedback(null);
    readQuestion('Tap in the correct order');
  }, [round, score, ROUNDS, sequences, readQuestion]);

  function handlePick(item) {
    if (feedback !== null) return;
    playClick();
    const idx = options.indexOf(item);
    if (idx < 0) return;
    const newOpts = options.filter((_, i) => i !== idx);
    const newSel = [...selected, item];
    setOptions(newOpts);
    setSelected(newSel);
    if (newSel.length === correct.length) {
      const ok = newSel.every((v, i) => v === correct[i]);
      if (ok) { setScore((s) => s + 1); setStreak((s) => s + 1); playSuccess(); }
      else { setStreak(0); playWrong(); }
      teachAfterAnswer(ok, { type: 'math', correctAnswer: correct.join(' '), extra: 'Sequences follow a pattern. What comes next?' });
      setFeedback(ok ? 'correct' : 'wrong');
      setTimeout(() => setRound((r) => r + 1), delay);
    }
  }

  if (round >= ROUNDS) return <div className={styles.container}>Calculating your rewards…</div>;

  return (
    <div className={styles.container}>
      <div className={styles.progress}>
        <span>Lv {level} · Round {round + 1}/{ROUNDS}</span><span>·</span><span>Build the sequence! Score: {score}</span>
        {streak >= 2 && <span>· 🔥 {streak}</span>}
      </div>
      <p className={styles.prompt}>Tap in the correct order:</p>
      <div className={styles.sequenceArea}>
        {selected.map((item, i) => (
          <span key={i} className={styles.sequenceItem}>{item}</span>
        ))}
      </div>
      <div className={styles.choices}>
        {options.map((item, i) => (
          <button
            key={i}
            type="button"
            onClick={() => handlePick(item)}
            className={styles.choiceBtn}
            disabled={feedback !== null}
          >
            {item}
          </button>
        ))}
      </div>
      {feedback && (
        <p className={feedback === 'correct' ? styles.feedbackOk : styles.feedbackBad}>
          {feedback === 'correct' ? (streak >= 3 ? '🔥 Sequence Master!' : '✓ Correct!') : 'Try again next round!'}
        </p>
      )}
    </div>
  );
}
