import { useState, useEffect } from 'react';
import { challenges as challengesApi } from '../api/client';
import { useAudio } from '../context/AudioContext';
import styles from './DailyTasks.module.css';

export default function DailyTasks({ childId }) {
  const { playSuccess, playCelebration } = useAudio();
  const [tasks, setTasks] = useState([]);
  const [progress, setProgress] = useState(null);
  const [completedIds, setCompletedIds] = useState(new Set());
  const [claiming, setClaiming] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!childId) return;
    Promise.all([
      challengesApi.daily(childId),
      challengesApi.dailyProgress(childId),
    ]).then(([daily, prog]) => {
      setTasks(daily.dailyTasks || []);
      setProgress(prog.progress || {});
      setCompletedIds(new Set(prog.completedTaskIds || []));
    }).catch(() => {})
      .finally(() => setLoading(false));
  }, [childId]);

  function getTaskProgress(task) {
    if (!progress) return { current: 0, target: task.target, pct: 0 };
    let current = 0;
    switch (task.type) {
      case 'games_count':
        current = progress.gamesPlayedToday || 0;
        break;
      case 'perfect_score':
        current = progress.hasPerfectToday ? 1 : 0;
        break;
      case 'category_variety':
        current = progress.categoriesPlayedToday || 0;
        break;
      case 'accuracy_min':
        current = progress.bestAccuracyToday || 0;
        break;
      case 'game_levels': {
        // Count levels completed today for the specific game within the target range
        const levels = progress.gameLevelsToday?.[task.gameSlug] || [];
        current = levels.filter(l => l >= task.fromLevel && l <= task.toLevel).length;
        break;
      }
      default:
        current = 0;
    }
    const pct = Math.min(100, (current / task.target) * 100);
    return { current, target: task.target, pct };
  }

  function isTaskReady(task) {
    const { pct } = getTaskProgress(task);
    return pct >= 100 && !completedIds.has(task.taskId);
  }

  async function claimReward(task) {
    if (!childId || claiming) return;
    setClaiming(task.taskId);
    try {
      await challengesApi.completeTask(childId, task.taskId);
      setCompletedIds(prev => new Set([...prev, task.taskId]));
      playSuccess();
      if ([...completedIds].length + 1 >= tasks.length) {
        playCelebration();
      }
    } catch (_) {}
    setClaiming(null);
  }

  if (loading || !childId || tasks.length === 0) return null;

  const allDone = tasks.every(t => completedIds.has(t.taskId));

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <h3 className={styles.title}>
          <img src="https://cdn-icons-png.flaticon.com/128/3176/3176298.png" alt="" className={styles.titleIcon} />
          Daily Quests
        </h3>
        {allDone && <span className={styles.allDone}>All Done!</span>}
      </div>
      <div className={styles.taskList}>
        {tasks.map((task) => {
          const done = completedIds.has(task.taskId);
          const ready = isTaskReady(task);
          const { current, target, pct } = getTaskProgress(task);

          return (
            <div key={task.taskId} className={`${styles.task} ${done ? styles.taskDone : ''}`}>
              <span className={styles.taskIcon}>{done ? '✅' : task.icon}</span>
              <div className={styles.taskInfo}>
                <span className={styles.taskTitle}>{task.title}</span>
                <span className={styles.taskDesc}>{task.description}</span>
                {!done && (
                  <div className={styles.progressBar}>
                    <div className={styles.progressFill} style={{ width: `${pct}%` }} />
                  </div>
                )}
                {!done && (
                  <span className={styles.taskProgress}>
                    {task.type === 'accuracy_min'
                      ? `Best: ${current}% / ${target}%`
                      : `${current} / ${target}`}
                  </span>
                )}
              </div>
              <div className={styles.taskRight}>
                <span className={styles.taskReward}>+{task.reward.coins}🪙 +{task.reward.xp}⭐</span>
                {done ? (
                  <span className={styles.claimed}>Claimed</span>
                ) : ready ? (
                  <button type="button" onClick={() => claimReward(task)} disabled={claiming === task.taskId} className={styles.claimBtn}>
                    {claiming === task.taskId ? '...' : 'Claim!'}
                  </button>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
