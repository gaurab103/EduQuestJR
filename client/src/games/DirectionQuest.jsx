/**
 * DirectionQuest - Teaches left/right/up/down. "The cat wants to go to the fish. Which direction?"
 * Shows 2x2 or 3x3 grid. Kid taps arrow. Motor / Free
 */
import { useState, useEffect, useRef } from 'react';
import styles from './GameCommon.module.css';
import { useAudio } from '../context/AudioContext';
import { getRounds, getFeedbackDelay } from './levelConfig';
import { useTeaching } from './useTeaching';
import { useNoRepeat } from './useNoRepeat';

const TWEMOJI = (cp) => `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/${cp}.svg`;

const SCENARIOS = [
  { from: { name: 'cat', img: TWEMOJI('1f431') }, to: { name: 'fish', img: TWEMOJI('1f41f') } },
  { from: { name: 'dog', img: TWEMOJI('1f436') }, to: { name: 'bone', img: TWEMOJI('1f9b4') } },
  { from: { name: 'bird', img: TWEMOJI('1f426') }, to: { name: 'nest', img: TWEMOJI('1f3d8') } },
  { from: { name: 'rabbit', img: TWEMOJI('1f430') }, to: { name: 'carrot', img: TWEMOJI('1f955') } },
  { from: { name: 'bee', img: TWEMOJI('1f41d') }, to: { name: 'flower', img: TWEMOJI('1f338') } },
  { from: { name: 'mouse', img: TWEMOJI('1f42d') }, to: { name: 'cheese', img: TWEMOJI('1f9c0') } },
  { from: { name: 'frog', img: TWEMOJI('1f438') }, to: { name: 'fly', img: TWEMOJI('1f578') } },
  { from: { name: 'bear', img: TWEMOJI('1f43b') }, to: { name: 'honey', img: TWEMOJI('1f36f') } },
  { from: { name: 'duck', img: TWEMOJI('1f986') }, to: { name: 'pond', img: TWEMOJI('1f30a') } },
  { from: { name: 'monkey', img: TWEMOJI('1f435') }, to: { name: 'banana', img: TWEMOJI('1f34c') } },
  { from: { name: 'elephant', img: TWEMOJI('1f418') }, to: { name: 'water', img: TWEMOJI('1f4a7') } },
  { from: { name: 'penguin', img: TWEMOJI('1f427') }, to: { name: 'ice', img: TWEMOJI('1f9ca') } },
  { from: { name: 'lion', img: TWEMOJI('1f981') }, to: { name: 'sun', img: TWEMOJI('2600') } },
  { from: { name: 'owl', img: TWEMOJI('1f989') }, to: { name: 'moon', img: TWEMOJI('1f319') } },
  { from: { name: 'fish', img: TWEMOJI('1f41f') }, to: { name: 'coral', img: TWEMOJI('1f331') } },
  { from: { name: 'chick', img: TWEMOJI('1f425') }, to: { name: 'worm', img: TWEMOJI('1f41b') } },
  { from: { name: 'horse', img: TWEMOJI('1f434') }, to: { name: 'apple', img: TWEMOJI('1f34e') } },
  { from: { name: 'pig', img: TWEMOJI('1f437') }, to: { name: 'mud', img: TWEMOJI('1f4a6') } },
  { from: { name: 'cow', img: TWEMOJI('1f404') }, to: { name: 'grass', img: TWEMOJI('1f33f') } },
  { from: { name: 'turtle', img: TWEMOJI('1f422') }, to: { name: 'water', img: TWEMOJI('1f4a7') } },
  { from: { name: 'butterfly', img: TWEMOJI('1f98b') }, to: { name: 'flower', img: TWEMOJI('1f338') } },
  { from: { name: 'squirrel', img: TWEMOJI('1f43f') }, to: { name: 'nut', img: TWEMOJI('1f330') } },
  { from: { name: 'koala', img: TWEMOJI('1f428') }, to: { name: 'leaf', img: TWEMOJI('1f343') } },
  { from: { name: 'panda', img: TWEMOJI('1f43c') }, to: { name: 'bamboo', img: TWEMOJI('1f38d') } },
  { from: { name: 'dolphin', img: TWEMOJI('1f42c') }, to: { name: 'ball', img: TWEMOJI('26bd') } },
  { from: { name: 'fox', img: TWEMOJI('1f98a') }, to: { name: 'chicken', img: TWEMOJI('1f414') } },
  { from: { name: 'crab', img: TWEMOJI('1f980') }, to: { name: 'shell', img: TWEMOJI('1f41a') } },
  { from: { name: 'octopus', img: TWEMOJI('1f419') }, to: { name: 'coral', img: TWEMOJI('1f331') } },
  { from: { name: 'parrot', img: TWEMOJI('1f99c') }, to: { name: 'fruit', img: TWEMOJI('1f34a') } },
  { from: { name: 'whale', img: TWEMOJI('1f433') }, to: { name: 'fish', img: TWEMOJI('1f41f') } },
  { from: { name: 'snail', img: TWEMOJI('1f40c') }, to: { name: 'leaf', img: TWEMOJI('1f343') } },
];

const ARROWS = [
  { dir: 'up', label: 'Up', img: TWEMOJI('2b06'), key: 'up' },
  { dir: 'down', label: 'Down', img: TWEMOJI('2b07'), key: 'down' },
  { dir: 'left', label: 'Left', img: TWEMOJI('2b05'), key: 'left' },
  { dir: 'right', label: 'Right', img: TWEMOJI('27a1'), key: 'right' },
];

function getGridSize(level) {
  if (level <= 5) return 2;
  if (level <= 15) return 3;
  return 4;
}

export default function DirectionQuest({ onComplete, level = 1, childAge }) {
  const { playSuccess, playWrong, playClick } = useAudio();
  const { teachAfterAnswer, readQuestion } = useTeaching();
  const { generate } = useNoRepeat();
  const [round, setRound] = useState(0);
  const [scenario, setScenario] = useState(null);
  const [correctDir, setCorrectDir] = useState(null);
  const [fromPos, setFromPos] = useState({ r: 0, c: 0 });
  const [toPos, setToPos] = useState({ r: 0, c: 0 });
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [selectedDir, setSelectedDir] = useState(null);
  const completedRef = useRef(false);
  const ROUNDS = getRounds(level);
  const GRID = getGridSize(level);
  const delay = getFeedbackDelay(level);

  useEffect(() => {
    if (round >= ROUNDS && !completedRef.current) {
      completedRef.current = true;
      onComplete(score, Math.round((score / ROUNDS) * 100));
      return;
    }
    const s = generate(() => SCENARIOS[Math.floor(Math.random() * SCENARIOS.length)], (r) => `${r.from.name}-${r.to.name}`);
    setScenario(s);
    const size = GRID;
    let fr, fc, tr, tc;
    do {
      fr = Math.floor(Math.random() * size);
      fc = Math.floor(Math.random() * size);
      tr = Math.floor(Math.random() * size);
      tc = Math.floor(Math.random() * size);
    } while (fr === tr && fc === tc);
    setFromPos({ r: fr, c: fc });
    setToPos({ r: tr, c: tc });
    let dir = '';
    if (tr < fr) dir = 'up';
    else if (tr > fr) dir = 'down';
    else if (tc < fc) dir = 'left';
    else dir = 'right';
    setCorrectDir(dir);
    setFeedback(null);
    setSelectedDir(null);
    const cancelRead = readQuestion(`The ${s.from.name} wants to go to the ${s.to.name}. Which direction?`);
    return cancelRead;
  }, [round, ROUNDS, level, GRID, generate]);

  function handleDir(dir) {
    if (feedback !== null) return;
    playClick();
    setSelectedDir(dir);
    const correct = dir === correctDir;
    if (correct) setScore((s) => s + 1);
    else playWrong();
    if (correct) playSuccess();
    setFeedback(correct ? 'correct' : 'wrong');
    teachAfterAnswer(correct, { type: 'word', correctAnswer: correctDir, extra: `${correctDir} is the way to go!` });
    setTimeout(() => setRound((r) => r + 1), delay);
  }

  if (round >= ROUNDS) return <div className={styles.container}><p className={styles.prompt}>Calculating rewards...</p></div>;

  if (!scenario) return null;

  const cellSize = GRID <= 2 ? 80 : GRID <= 3 ? 70 : 56;

  return (
    <div className={styles.container}>
      <div className={styles.progress}>
        <span>Lv {level} · {round + 1}/{ROUNDS}</span><span>·</span><span>⭐ {score}</span>
      </div>
      <p className={styles.prompt}>Which direction to the {scenario.to.name}?</p>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${GRID}, ${cellSize}px)`, gridTemplateRows: `repeat(${GRID}, ${cellSize}px)`, gap: 6, margin: '0 auto 1.5rem', justifyContent: 'center' }}>
        {Array.from({ length: GRID * GRID }, (_, i) => {
          const r = Math.floor(i / GRID);
          const c = i % GRID;
          const isFrom = r === fromPos.r && c === fromPos.c;
          const isTo = r === toPos.r && c === toPos.c;
          return (
            <div key={i} style={{ width: cellSize, height: cellSize, border: '3px solid #e5e7eb', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: isFrom ? 'rgba(56,189,248,0.15)' : isTo ? 'rgba(74,222,128,0.15)' : 'var(--card-bg)' }}>
              {isFrom && <img src={scenario.from.img} alt="" style={{ width: cellSize - 16, height: cellSize - 16 }} />}
              {isTo && !isFrom && <img src={scenario.to.img} alt="" style={{ width: cellSize - 16, height: cellSize - 16 }} />}
            </div>
          );
        })}
      </div>
      <div className={styles.choices}>
        {ARROWS.map((a) => (
          <button key={a.key} type="button" onClick={() => handleDir(a.dir)} className={`${styles.choiceBtn} ${feedback !== null && correctDir === a.dir ? styles.correct : ''} ${feedback !== null && selectedDir === a.dir && a.dir !== correctDir ? styles.wrong : ''}`} disabled={feedback !== null} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <img src={a.img} alt={a.label} style={{ width: 36, height: 36 }} />
            <span style={{ fontSize: '0.7rem', fontWeight: 700 }}>{a.label}</span>
          </button>
        ))}
      </div>
      {feedback && <p className={feedback === 'correct' ? styles.feedbackOk : styles.feedbackBad}>{feedback === 'correct' ? '✓ Correct!' : `Try ${correctDir}!`}</p>}
    </div>
  );
}
