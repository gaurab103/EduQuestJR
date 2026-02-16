/**
 * Maze Runner - Path-finding game. Kid taps through cells from start to end.
 * Grid size increases with level. Teaches spatial reasoning.
 * Motor / Premium
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { useAudio } from '../context/AudioContext';
import { getRounds, getFeedbackDelay } from './levelConfig';
import { useTeaching } from './useTeaching';
import { useNoRepeat } from './useNoRepeat';
import styles from './GameCommon.module.css';

const TWEMOJI = (cp) => `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/${cp}.svg`;

function getGridSize(level) {
  if (level <= 3) return 3;
  if (level <= 8) return 4;
  if (level <= 15) return 5;
  return 6;
}

// Pre-defined simple mazes: 1=path, 0=wall
const MAZES_3 = [
  [[1,1,0],[0,1,0],[0,1,1]],
  [[1,0,0],[1,1,1],[0,0,1]],
  [[1,1,1],[0,0,1],[0,1,1]],
  [[1,0,1],[1,1,1],[1,0,1]],
  [[1,1,1],[1,0,0],[1,1,1]],
];
const MAZES_4 = [
  [[1,1,1,0],[0,0,1,0],[1,1,1,0],[1,0,1,1]],
  [[1,0,0,0],[1,1,1,1],[0,0,0,1],[1,1,1,1]],
  [[1,1,1,1],[0,0,0,1],[1,1,1,1],[1,0,0,0]],
  [[1,0,1,1],[1,1,1,0],[0,1,0,0],[1,1,1,1]],
  [[1,1,0,0],[0,1,1,1],[1,1,0,1],[0,1,1,1]],
  [[1,1,1,1],[1,0,0,1],[1,1,1,1],[0,0,0,1]],
];
const MAZES_5 = [
  [[1,1,1,1,0],[0,0,0,1,0],[1,1,1,1,1],[1,0,0,0,1],[1,1,1,1,1]],
  [[1,0,0,0,0],[1,1,1,1,0],[0,0,0,1,1],[1,1,1,1,0],[0,0,0,1,1]],
  [[1,1,1,0,0],[0,0,1,1,1],[1,1,1,0,1],[1,0,0,1,1],[1,1,1,1,1]],
  [[1,1,1,1,1],[0,0,0,0,1],[1,1,1,1,1],[1,0,0,0,0],[1,1,1,1,1]],
  [[1,0,1,1,1],[1,1,1,0,1],[0,1,0,1,1],[1,1,1,1,0],[1,0,1,1,1]],
];
const MAZES_6 = [
  [[1,1,1,1,1,0],[0,0,0,0,1,0],[1,1,1,1,1,1],[1,0,0,0,0,1],[1,1,1,1,1,1],[0,0,0,0,0,1]],
  [[1,0,0,0,0,0],[1,1,1,1,1,0],[0,0,0,0,1,1],[1,1,1,1,1,0],[1,0,0,0,1,1],[1,1,1,1,1,1]],
];

function getMaze(size) {
  if (size === 3) return MAZES_3[Math.floor(Math.random() * MAZES_3.length)];
  if (size === 4) return MAZES_4[Math.floor(Math.random() * MAZES_4.length)];
  if (size === 5) return MAZES_5[Math.floor(Math.random() * MAZES_5.length)];
  return MAZES_6[Math.floor(Math.random() * MAZES_6.length)];
}

function findPath(maze) {
  const rows = maze.length;
  const cols = maze[0].length;
  const path = [];
  const visited = maze.map(row => row.map(() => false));
  function dfs(r, c) {
    if (r < 0 || r >= rows || c < 0 || c >= cols || !maze[r][c] || visited[r][c]) return false;
    path.push([r, c]);
    visited[r][c] = true;
    if (r === rows - 1 && c === cols - 1) return true;
    const dirs = [[0,1],[1,0],[0,-1],[-1,0]];
    for (const [dr, dc] of dirs) {
      if (dfs(r + dr, c + dc)) return true;
    }
    path.pop();
    visited[r][c] = false;
    return false;
  }
  dfs(0, 0);
  return path;
}

const SPATIAL_FACTS = [
  'Finding your way through mazes helps your brain learn directions!',
  'Maps and mazes teach us about left, right, up, and down!',
  'Spatial reasoning helps you put puzzles together!',
  'Navigating mazes is like being an explorer!',
  'Your brain gets stronger when you solve path puzzles!',
  'Mazes help you plan ahead and think step by step!',
];

export default function MazeRunner({ onComplete, level = 1, childAge }) {
  const { playSuccess, playWrong, playClick, playCelebration } = useAudio();
  const { teachAfterAnswer, readQuestion, getRecommendedDelayBeforeNext } = useTeaching();
  const { generate } = useNoRepeat(level);
  const [round, setRound] = useState(0);
  const [maze, setMaze] = useState(null);
  const [path, setPath] = useState([]);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [done, setDone] = useState(false);
  const completedRef = useRef(false);
  const ROUNDS = getRounds(level);
  const gridSize = getGridSize(level);

  const loadRound = useCallback(() => {
    const m = generate(
      () => getMaze(gridSize),
      (maze) => JSON.stringify(maze)
    );
    const p = findPath(m);
    setMaze(m);
    setPath(p);
    setFeedback(null);
  }, [gridSize, generate]);

  useEffect(() => {
    window.speechSynthesis?.cancel();
    if (round >= ROUNDS && !completedRef.current) {
      completedRef.current = true;
      setDone(true);
      playCelebration();
      const accuracy = ROUNDS > 0 ? Math.round((correct / ROUNDS) * 100) : 0;
      onComplete(score, accuracy);
      return;
    }
    loadRound();
  }, [round, ROUNDS, correct, score]);

  useEffect(() => {
    if (maze && round < ROUNDS) {
      const cancelRead = readQuestion('Tap from the start to the finish! Find the path through the maze.');
      return cancelRead;
    }
  }, [maze, round, ROUNDS]);

  function handleCellClick(r, c) {
    if (!maze || feedback) return;
    const cellVal = maze[r]?.[c];
    if (!cellVal) {
      playWrong();
      setFeedback('wrong');
      teachAfterAnswer(false, { type: 'spatial', answer: 'wall', correctAnswer: 'path', extra: SPATIAL_FACTS[Math.floor(Math.random() * SPATIAL_FACTS.length)] });
      const delay = getRecommendedDelayBeforeNext(getFeedbackDelay(level, false));
      setTimeout(() => { setFeedback(null); }, delay);
      return;
    }
    const rows = maze.length;
    const cols = maze[0].length;
    const last = path[path.length - 1];
    const isStart = path.length === 0 && r === 0 && c === 0;
    const isAdjacent = last && (Math.abs(last[0] - r) + Math.abs(last[1] - c)) === 1;
    const alreadyInPath = path.some(([pr, pc]) => pr === r && pc === c);
    if (alreadyInPath) return;
    if (!isStart && !isAdjacent) {
      playWrong();
      setFeedback('wrong');
      teachAfterAnswer(false, { type: 'spatial', answer: 'jump', correctAnswer: 'step', extra: 'Tap the next cell right next to where you are! Move one step at a time.' });
      const delay = getRecommendedDelayBeforeNext(getFeedbackDelay(level, false));
      setTimeout(() => { setFeedback(null); }, delay);
      return;
    }
    playClick();
    const newPath = [...path, [r, c]];
    setPath(newPath);
    if (r === rows - 1 && c === cols - 1) {
      setScore(s => s + 10);
      setCorrect(c => c + 1);
      playSuccess();
      setFeedback('correct');
      teachAfterAnswer(true, { type: 'spatial', answer: 'path', correctAnswer: 'path', extra: SPATIAL_FACTS[Math.floor(Math.random() * SPATIAL_FACTS.length)] });
      const delay = getRecommendedDelayBeforeNext(getFeedbackDelay(level, true));
      setTimeout(() => setRound(r => r + 1), delay);
    }
  }

  if (done) {
    const accuracy = ROUNDS > 0 ? Math.round((correct / ROUNDS) * 100) : 0;
    return (
      <div className={styles.container}>
        <div className={styles.celebration}>
          <img src={TWEMOJI('1f3c1')} alt="" style={{ width: 80, height: 80 }} />
          <h2>Maze Champion!</h2>
          <p style={{ fontSize: '1.1rem', fontWeight: 700 }}>Score: {score}</p>
          <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', margin: '0.5rem 0' }}>
            <span style={{ color: '#22c55e', fontWeight: 800 }}>✅ {correct}</span>
            <span style={{ color: 'var(--text-muted)', fontWeight: 800 }}>Accuracy: {accuracy}%</span>
          </div>
        </div>
      </div>
    );
  }

  if (!maze) return null;

  const rows = maze.length;
  const cols = maze[0].length;
  const cellSize = Math.min(56, 320 / Math.max(rows, cols));

  return (
    <div className={styles.container}>
      <div className={styles.hud}>
        <span>Lv {level} · {round + 1}/{ROUNDS} · ✅ {correct} · ⭐ {score}</span>
      </div>
      <p className={styles.prompt}>Find the path from start to finish!</p>
      <div className={styles.targetArea} style={{ display: 'inline-block', marginBottom: '1rem' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
          gridTemplateRows: `repeat(${rows}, ${cellSize}px)`,
          gap: 2,
          background: '#e5e7eb',
          padding: 4,
          borderRadius: 12,
        }}>
          {maze.map((row, r) =>
            row.map((cell, c) => {
              const isPath = path.some(([pr, pc]) => pr === r && pc === c);
              const isStart = r === 0 && c === 0;
              const isEnd = r === rows - 1 && c === cols - 1;
              const isWrong = feedback === 'wrong' && !cell;
              return (
                <button
                  key={`${r}-${c}`}
                  type="button"
                  disabled={!cell || feedback === 'correct'}
                  onClick={() => handleCellClick(r, c)}
                  className={styles.choiceBtn}
                  style={{
                    width: cellSize,
                    height: cellSize,
                    minWidth: cellSize,
                    minHeight: cellSize,
                    padding: 0,
                    background: !cell ? '#94a3b8' : isPath ? '#4ade80' : 'var(--card-bg)',
                    borderColor: isPath ? 'var(--success)' : isWrong ? 'var(--coral-pink)' : 'var(--sky-blue)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {isStart && <img src={TWEMOJI('1f7e9')} alt="Start" style={{ width: cellSize * 0.6, height: cellSize * 0.6 }} />}
                  {isEnd && !isStart && <img src={TWEMOJI('1f3c1')} alt="End" style={{ width: cellSize * 0.6, height: cellSize * 0.6 }} />}
                </button>
              );
            })
          )}
        </div>
      </div>
      {feedback && (
        <div className={feedback === 'correct' ? styles.feedbackOk : styles.feedbackBad}>
          {feedback === 'correct' ? '✓ You found the path!' : 'Try again! Tap only on green path cells, one step at a time, from start to finish.'}
        </div>
      )}
    </div>
  );
}
