import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { games as gamesApi, progress as progressApi, children as childrenApi } from '../api/client';
import PersonalMascot from '../components/PersonalMascot';
import styles from './AdventureMap.module.css';

const CAT_COLORS = {
  cognitive: '#38bdf8',
  literacy: '#a78bfa',
  numeracy: '#fb923c',
  creativity: '#f472b6',
  sel: '#4ade80',
  future_skills: '#818cf8',
  motor: '#fbbf24',
};

const CAT_EMOJI = {
  cognitive: '🧠',
  literacy: '🔤',
  numeracy: '🔢',
  creativity: '🎨',
  sel: '😊',
  future_skills: '💻',
  motor: '🏃',
};

const WORLD_ICONS = ['🌳', '🌺', '🌻', '🍄', '🌈', '⭐', '🦋', '☁️', '🌸', '🍀'];

export default function AdventureMap() {
  const [searchParams] = useSearchParams();
  const childIdParam = searchParams.get('child');
  const [allGames, setAllGames] = useState([]);
  const [progressMap, setProgressMap] = useState({});
  const [childList, setChildList] = useState([]);
  const [selectedChild, setSelectedChild] = useState(childIdParam || '');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([gamesApi.list(), childrenApi.list()])
      .then(([gRes, chRes]) => {
        setAllGames(gRes.games || []);
        setChildList(chRes.children || []);
        const firstId = childIdParam || chRes.children?.[0]?._id;
        if (firstId) setSelectedChild(firstId);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [childIdParam]);

  useEffect(() => {
    if (!selectedChild) return;
    progressApi.listByChild(selectedChild)
      .then(({ progress }) => {
        const map = {};
        for (const p of progress) {
          const slug = p.gameId?.slug;
          if (!slug) continue;
          if (!map[slug] || p.accuracy > map[slug].accuracy) {
            map[slug] = { accuracy: p.accuracy, score: p.score };
          }
        }
        setProgressMap(map);
      })
      .catch(() => setProgressMap({}));
  }, [selectedChild]);

  if (loading) return <div className="loading-screen">Loading map...</div>;

  function getStars(accuracy) {
    if (accuracy >= 80) return 3;
    if (accuracy >= 50) return 2;
    if (accuracy > 0) return 1;
    return 0;
  }

  const totalStars = allGames.reduce((sum, g) => sum + (progressMap[g.slug] ? getStars(progressMap[g.slug].accuracy) : 0), 0);
  const maxStars = allGames.length * 3;
  const completedCount = allGames.filter(g => progressMap[g.slug]).length;
  const child = childList.find(c => c._id === selectedChild) || null;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>🗺️ Adventure Map</h1>
          <p className={styles.subtitle}>
            {completedCount} of {allGames.length} explored · ⭐ {totalStars}/{maxStars} stars
          </p>
        </div>
        {childList.length > 1 && (
          <select value={selectedChild} onChange={(e) => setSelectedChild(e.target.value)} className={styles.select}>
            {childList.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
        )}
      </div>

      {child && <PersonalMascot child={child} compact />}

      {/* World progress bar */}
      <div className={styles.worldProgress}>
        <div className={styles.worldBar}>
          <div className={styles.worldFill} style={{ width: `${(completedCount / Math.max(1, allGames.length)) * 100}%` }} />
        </div>
        <div className={styles.worldLabels}>
          <span>🏠 Start</span>
          <span>🏰 Master</span>
        </div>
      </div>

      <div className={styles.map}>
        {allGames.map((game, i) => {
          const played = progressMap[game.slug];
          const stars = played ? getStars(played.accuracy) : 0;
          const locked = game.isPremium;
          const color = CAT_COLORS[game.category] || '#94a3b8';
          const emoji = CAT_EMOJI[game.category] || '🎮';
          const isEven = i % 2 === 0;
          const deco = WORLD_ICONS[i % WORLD_ICONS.length];

          return (
            <div key={game.slug} className={styles.nodeRow} style={{ justifyContent: isEven ? 'flex-start' : 'flex-end' }}>
              {i > 0 && (
                <div className={styles.pathLine}>
                  <span className={styles.pathDeco}>{deco}</span>
                </div>
              )}
              <Link
                to={selectedChild && !locked ? `/play/${game.slug}?child=${selectedChild}` : '#'}
                className={`${styles.node} ${played ? styles.nodeCompleted : ''} ${locked ? styles.nodeLocked : ''}`}
                style={{ borderColor: color, '--node-color': color }}
              >
                <span className={styles.nodeEmoji}>{locked ? '🔒' : emoji}</span>
                <span className={styles.nodeTitle}>{game.title}</span>
                {stars > 0 && (
                  <span className={styles.nodeStars}>
                    {'★'.repeat(stars)}{'☆'.repeat(3 - stars)}
                  </span>
                )}
                {played && stars === 3 && <span className={styles.nodePerfect}>🏆</span>}
                {!played && !locked && (
                  <span className={styles.nodeNew}>New!</span>
                )}
                {played && (
                  <span className={styles.nodeAccuracy}>{played.accuracy}%</span>
                )}
              </Link>
            </div>
          );
        })}

        {/* End marker */}
        <div className={styles.endMarker}>
          <span className={styles.endEmoji}>🏰</span>
          <span className={styles.endText}>
            {completedCount >= allGames.length ? 'All Explored! You are a Master Explorer! 🎉' : 'Keep exploring to reach the castle!'}
          </span>
        </div>
      </div>
    </div>
  );
}
