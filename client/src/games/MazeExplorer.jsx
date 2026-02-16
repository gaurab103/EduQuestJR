/**
 * Maze Explorer - PREMIUM
 * Unique mechanic: Arrow-button navigation through a maze while collecting
 * gems. Different from MazeRunner (tap cells) -- this uses directional
 * controls and collectibles.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { useAudio } from '../context/AudioContext';
import { useTeaching } from './useTeaching';
import { useNoRepeat } from './useNoRepeat';
import { getRounds, getFeedbackDelay } from './levelConfig';
import styles from './GameCommon.module.css';

const TWEMOJI = (cp) => `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/${cp}.svg`;

function getGridSize(level) {
  if (level <= 5) return 4;
  if (level <= 10) return 5;
  if (level <= 15) return 6;
  if (level <= 20) return 7;
  return 8;
}

function getGemCount(level) {
  if (level <= 5) return 2;
  if (level <= 10) return 3;
  if (level <= 20) return 4;
  return 5;
}

function generateMaze(size) {
  const grid = Array.from({ length: size }, () => Array(size).fill(1));
  const visited = Array.from({ length: size }, () => Array(size).fill(false));

  function carve(r, c) {
    visited[r][c] = true;
    grid[r][c] = 0;
    const dirs = [[0, 2], [2, 0], [0, -2], [-2, 0]].sort(() => Math.random() - 0.5);
    for (const [dr, dc] of dirs) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < size && nc >= 0 && nc < size && !visited[nr][nc]) {
        grid[r + dr / 2][c + dc / 2] = 0;
        carve(nr, nc);
      }
    }
  }
  carve(0, 0);
  grid[0][0] = 0;
  grid[size - 1][size - 1] = 0;
  if (grid[size - 2][size - 1] === 1 && grid[size - 1][size - 2] === 1) {
    grid[size - 2][size - 1] = 0;
  }
  return grid;
}

function placeGems(grid, count) {
  const size = grid.length;
  const gems = [];
  let attempts = 0;
  while (gems.length < count && attempts < 200) {
    const r = Math.floor(Math.random() * size);
    const c = Math.floor(Math.random() * size);
    if (grid[r][c] === 0 && !(r === 0 && c === 0) && !(r === size - 1 && c === size - 1) &&
        !gems.some(g => g.r === r && g.c === c)) {
      gems.push({ r, c });
    }
    attempts++;
  }
  return gems;
}

export default function MazeExplorer({ onComplete, level = 1, childName }) {
  const { playSuccess, playWrong, playClick, playCelebration } = useAudio();
  const { teachAfterAnswer, readQuestion, getRecommendedDelayBeforeNext } = useTeaching();
  const { generate } = useNoRepeat(level);
  const [round, setRound] = useState(0);
  const [grid, setGrid] = useState(null);
  const [gems, setGems] = useState([]);
  const [collected, setCollected] = useState(new Set());
  const [pos, setPos] = useState({ r: 0, c: 0 });
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [steps, setSteps] = useState(0);
  const completedRef = useRef(false);
  const ROUNDS = getRounds(level);
  const gridSize = getGridSize(level);
  const gemCount = getGemCount(level);

  useEffect(() => {
    window.speechSynthesis?.cancel();
    if (round >= ROUNDS && !completedRef.current) {
      completedRef.current = true;
      playCelebration();
      const accuracy = ROUNDS > 0 ? Math.round((correct / ROUNDS) * 100) : 0;
      onComplete(score, accuracy);
      return;
    }
    const maze = generate(() => generateMaze(gridSize), (m) => JSON.stringify(m).slice(0, 40));
    const g = placeGems(maze, gemCount);
    setGrid(maze);
    setGems(g);
    setCollected(new Set());
    setPos({ r: 0, c: 0 });
    setFeedback(null);
    setSteps(0);
    const cancelRead = readQuestion(`Navigate the maze! Collect all ${gemCount} gems and reach the flag!`);
    return cancelRead;
  }, [round]);

  const move = useCallback((dr, dc) => {
    if (feedback || !grid) return;
    const nr = pos.r + dr;
    const nc = pos.c + dc;
    if (nr < 0 || nr >= gridSize || nc < 0 || nc >= gridSize || grid[nr][nc] === 1) {
      playWrong();
      return;
    }
    playClick();
    setSteps(s => s + 1);
    const newPos = { r: nr, c: nc };
    setPos(newPos);

    const gemIdx = gems.findIndex(g => g.r === nr && g.c === nc);
    const newCollected = new Set(collected);
    if (gemIdx >= 0 && !collected.has(gemIdx)) {
      newCollected.add(gemIdx);
      setCollected(newCollected);
      playSuccess();
    }

    if (nr === gridSize - 1 && nc === gridSize - 1) {
      const allCollected = newCollected.size >= gems.length;
      if (allCollected) {
        setScore(s => s + 10 + Math.max(0, 20 - steps));
        setCorrect(c => c + 1);
        playSuccess();
        setFeedback('correct');
        teachAfterAnswer(true, { type: 'spatial', extra: `You collected all ${gems.length} gems in ${steps + 1} steps!` });
      } else {
        setFeedback('wrong');
        teachAfterAnswer(false, { type: 'spatial', extra: `You reached the end but missed ${gems.length - newCollected.size} gems! Try to collect them all.` });
      }
      const delay = getRecommendedDelayBeforeNext(getFeedbackDelay(level, allCollected));
      setTimeout(() => setRound(r => r + 1), delay);
    }
  }, [pos, grid, feedback, gridSize, gems, collected, steps, level]);

  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'ArrowUp') move(-1, 0);
      else if (e.key === 'ArrowDown') move(1, 0);
      else if (e.key === 'ArrowLeft') move(0, -1);
      else if (e.key === 'ArrowRight') move(0, 1);
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [move]);

  if (round >= ROUNDS) {
    const accuracy = ROUNDS > 0 ? Math.round((correct / ROUNDS) * 100) : 0;
    return (
      <div className={styles.container}>
        <div className={styles.celebration}>
          <h2>Maze Master!</h2>
          <p style={{ fontSize: '1.1rem', fontWeight: 700 }}>Score: {score}</p>
          <span style={{ color: 'var(--text-muted)', fontWeight: 800 }}>Accuracy: {accuracy}%</span>
        </div>
      </div>
    );
  }

  if (!grid) return null;

  const cellSize = Math.min(42, 300 / gridSize);

  return (
    <div className={styles.container}>
      <div className={styles.hud}>
        <span>Lv {level}</span><span>·</span>
        <span>{round + 1}/{ROUNDS}</span><span>·</span>
        <span>Gems: {collected.size}/{gems.length}</span><span>·</span>
        <span>Steps: {steps}</span>
      </div>

      <p className={styles.prompt}>Collect all gems and reach the flag!</p>

      {/* Maze Grid */}
      <div style={{
        display: 'inline-grid',
        gridTemplateColumns: `repeat(${gridSize}, ${cellSize}px)`,
        gridTemplateRows: `repeat(${gridSize}, ${cellSize}px)`,
        gap: 1, background: '#94a3b8', padding: 2, borderRadius: 10,
        margin: '0.5rem auto',
      }}>
        {grid.map((row, r) =>
          row.map((cell, c) => {
            const isPlayer = pos.r === r && pos.c === c;
            const isEnd = r === gridSize - 1 && c === gridSize - 1;
            const gemIdx = gems.findIndex(g => g.r === r && g.c === c);
            const hasGem = gemIdx >= 0 && !collected.has(gemIdx);
            return (
              <div
                key={`${r}-${c}`}
                style={{
                  width: cellSize, height: cellSize,
                  background: cell === 1 ? '#475569' : isPlayer ? '#fbbf24' : 'var(--card-bg)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background 0.15s',
                  borderRadius: 2,
                }}
              >
                {isPlayer && (
                  <img src={TWEMOJI('1f9d2')} alt="You" style={{ width: cellSize * 0.65, height: cellSize * 0.65 }} />
                )}
                {!isPlayer && hasGem && (
                  <img src={TWEMOJI('1f48e')} alt="Gem" style={{ width: cellSize * 0.55, height: cellSize * 0.55 }} />
                )}
                {!isPlayer && isEnd && (
                  <img src={TWEMOJI('1f3c1')} alt="Finish" style={{ width: cellSize * 0.55, height: cellSize * 0.55 }} />
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Arrow controls */}
      <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
        <button type="button" onClick={() => move(-1, 0)} className={styles.choiceBtn}
          style={{ width: 52, height: 44, fontSize: '1.2rem', padding: 0 }} disabled={!!feedback}>
          ↑
        </button>
        <div style={{ display: 'flex', gap: 4 }}>
          <button type="button" onClick={() => move(0, -1)} className={styles.choiceBtn}
            style={{ width: 52, height: 44, fontSize: '1.2rem', padding: 0 }} disabled={!!feedback}>
            ←
          </button>
          <button type="button" onClick={() => move(1, 0)} className={styles.choiceBtn}
            style={{ width: 52, height: 44, fontSize: '1.2rem', padding: 0 }} disabled={!!feedback}>
            ↓
          </button>
          <button type="button" onClick={() => move(0, 1)} className={styles.choiceBtn}
            style={{ width: 52, height: 44, fontSize: '1.2rem', padding: 0 }} disabled={!!feedback}>
            →
          </button>
        </div>
      </div>

      {feedback === 'correct' && <p className={styles.feedbackOk}>All gems collected!</p>}
      {feedback === 'wrong' && (
        <div className={styles.feedbackBad}>
          <p>You missed some gems! Collect them all next time.</p>
        </div>
      )}
    </div>
  );
}
