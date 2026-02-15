import { useState, useRef, useEffect } from 'react';
import { useAudio } from '../context/AudioContext';
import { getFeedbackDelay } from './levelConfig';
import { useTeaching } from './useTeaching';
import styles from './GameCommon.module.css';

const CODING_BLOCKS = [
  { id: 'move', label: 'move forward', color: '#4A90D9' },
  { id: 'turn', label: 'turn right', color: '#50C878' },
  { id: 'jump', label: 'jump', color: '#E74C3C' },
  { id: 'repeat', label: 'repeat 2x', color: '#9B59B6' },
];

function getMinBlocks(level) {
  if (level <= 5) return 2;
  if (level <= 11) return 3;
  if (level <= 17) return 4;
  if (level <= 23) return 5;
  return 6;
}

export default function BlocklyCodingLab({ onComplete, level = 1 }) {
  const { playSuccess, playWrong, playClick } = useAudio();
  const { teachAfterAnswer, readQuestion } = useTeaching();
  const [sequence, setSequence] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const completedRef = useRef(false);
  const minBlocks = getMinBlocks(level);
  const delay = getFeedbackDelay(level);

  useEffect(() => {
    readQuestion(`Add ${minBlocks} or more blocks, then click Run Code`);
  }, [minBlocks, readQuestion]);

  const handleAdd = (block) => {
    if (completedRef.current || feedback) return;
    playClick();
    setSequence((s) => [...s, block]);
  };

  const handleRun = () => {
    if (completedRef.current) return;
    const ok = sequence.length >= minBlocks;
    if (ok) playSuccess();
    else playWrong();
    teachAfterAnswer(ok, { type: 'math', extra: 'Coding helps us tell computers what to do! Great job building your sequence!' });
    setFeedback(ok ? 'correct' : 'wrong');
    completedRef.current = true;
    setTimeout(() => onComplete(ok ? 100 : 30, ok ? 90 : 50), delay);
  };

  const handleClear = () => {
    if (!feedback) setSequence([]);
  };

  return (
    <div className={styles.container}>
      <div className={styles.progress}><span>Lv {level}</span><span>·</span><span>Blockly Coding Lab</span></div>
      <p className={styles.prompt}>Add {minBlocks}+ blocks, then click Run Code</p>
      <div className={styles.blockPalette}>
        {CODING_BLOCKS.map((b) => (
          <button
            key={b.id}
            type="button"
            onClick={() => handleAdd(b)}
            className={styles.codingBlock}
            style={{ backgroundColor: b.color }}
            disabled={!!feedback}
          >
            {b.label}
          </button>
        ))}
      </div>
      <div className={styles.sequenceArea}>
        {sequence.map((b, i) => (
          <span key={i} className={styles.sequenceItem} style={{ backgroundColor: b.color }}>
            {b.label}
          </span>
        ))}
      </div>
      <div className={styles.blockActions}>
        <button type="button" onClick={handleClear} className={styles.choiceBtn} disabled={!!feedback}>
          Clear
        </button>
        <button type="button" onClick={handleRun} className={styles.choiceBtn} style={{ padding: '1rem 2rem' }}>
          Run Code
        </button>
      </div>
      {feedback && (
        <p className={feedback === 'correct' ? styles.feedbackOk : styles.feedbackBad}>
          {feedback === 'correct' ? '✓ Great coding!' : `Add ${minBlocks}+ blocks and try again!`}
        </p>
      )}
    </div>
  );
}
