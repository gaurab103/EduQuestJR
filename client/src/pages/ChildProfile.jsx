import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { children as childrenApi, progress as progressApi, stickers as stickersApi, ai as aiApi } from '../api/client';
import { useChildMode } from '../context/ChildModeContext';
import { useAudio } from '../context/AudioContext';
import AvatarPicker from '../components/AvatarPicker';
import BadgeShelf from '../components/BadgeShelf';
import styles from './ChildProfile.module.css';

const ALL_ACHIEVEMENTS = [
  { slug: 'first-steps', title: 'First Steps', description: 'Complete your first game', icon: '👣' },
  { slug: 'rising-star', title: 'Rising Star', description: 'Complete 5 games', icon: '⭐' },
  { slug: 'game-master', title: 'Game Master', description: 'Complete 25 games', icon: '🏅' },
  { slug: 'century', title: 'Century Club', description: 'Complete 100 games', icon: '💯' },
  { slug: 'perfectionist', title: 'Perfectionist', description: 'Get a perfect score', icon: '💎' },
  { slug: 'streak-3', title: 'Hot Streak', description: '3-day play streak', icon: '🔥' },
  { slug: 'streak-7', title: 'Streak Master', description: '7-day play streak', icon: '🌟' },
  { slug: 'streak-30', title: 'Unstoppable', description: '30-day play streak', icon: '🏆' },
  { slug: 'explorer-3', title: 'Explorer', description: 'Try 3 different categories', icon: '🧭' },
  { slug: 'explorer-all', title: 'World Traveler', description: 'Try all 7 categories', icon: '🌍' },
  { slug: 'level-5', title: 'Growing Up', description: 'Reach level 5', icon: '🌱' },
  { slug: 'level-10', title: 'Super Learner', description: 'Reach level 10', icon: '🚀' },
  { slug: 'xp-500', title: 'XP Hunter', description: 'Earn 500 XP total', icon: '✨' },
  { slug: 'xp-2000', title: 'XP Legend', description: 'Earn 2000 XP total', icon: '👑' },
  { slug: 'brain-power', title: 'Brain Power', description: 'Complete 50 games', icon: '🧠' },
];

export default function ChildProfile() {
  const { childId } = useParams();
  const navigate = useNavigate();
  const { isAdultMode } = useChildMode();
  const { speak } = useAudio();
  const [child, setChild] = useState(null);
  const [recentGames, setRecentGames] = useState([]);
  const [allStickers, setAllStickers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editAge, setEditAge] = useState(4);
  const [editAvatar, setEditAvatar] = useState('🐻');
  const [saving, setSaving] = useState(false);
  const [aiGreeting, setAiGreeting] = useState('');

  useEffect(() => {
    Promise.all([
      childrenApi.get(childId),
      progressApi.listByChild(childId),
      stickersApi.list(),
    ]).then(([childRes, progressRes, stickersRes]) => {
      setChild(childRes.child);
      setRecentGames((progressRes.progress || []).slice(0, 10));
      setAllStickers(stickersRes.stickers || []);
      setEditName(childRes.child.name);
      setEditAge(childRes.child.age);
      setEditAvatar(childRes.child.avatarConfig?.emoji || '🐻');

      const c = childRes.child;
      const recentAcc = progressRes.progress?.length > 0
        ? Math.round(progressRes.progress.slice(0, 5).reduce((s, p) => s + p.accuracy, 0) / Math.min(5, progressRes.progress.length))
        : 0;
      aiApi.encouragement({
        childName: c.name,
        childAge: c.age,
        level: c.level,
        streak: c.currentStreak || 0,
        recentAccuracy: recentAcc,
      }).then(res => {
        setAiGreeting(res.message);
        speak(res.message);
      }).catch(() => {});
    }).catch(() => {})
      .finally(() => setLoading(false));
  }, [childId]);

  async function handleSave() {
    setSaving(true);
    try {
      const { child: updated } = await childrenApi.update(childId, {
        name: editName.trim(),
        age: editAge,
        avatarConfig: { emoji: editAvatar },
      });
      setChild(updated);
      setEditing(false);
    } catch (_) {}
    setSaving(false);
  }

  async function handleDelete() {
    if (!window.confirm(`Delete ${child?.name}'s profile? This cannot be undone.`)) return;
    try {
      await childrenApi.remove(childId);
      navigate('/dashboard');
    } catch (_) {}
  }

  if (loading) return <div className="loading-screen">Loading...</div>;
  if (!child) return <p>Child not found. <Link to="/dashboard">Go back</Link></p>;

  const xpPct = Math.min(100, ((child.xp || 0) % 100));
  const equippedStickers = (child.equippedStickers || []).map(slug => allStickers.find(s => s.slug === slug)).filter(Boolean);
  const earnedCount = (child.achievements || []).length;
  const ownedStickerCount = (child.ownedStickers || []).length;
  const completedLevelsCount = (child.completedGameLevels || []).length;

  return (
    <div className={styles.page}>
      <Link to={isAdultMode ? '/dashboard' : '/games'} className={styles.back}>
        ← {isAdultMode ? 'Back to Dashboard' : 'Back to Games'}
      </Link>

      {/* Profile card */}
      <div className={styles.profileCard}>
        <div className={styles.profileTop}>
          <div className={styles.avatarWrapper}>
            <span className={styles.avatar}>{child.avatarConfig?.emoji || '👤'}</span>
            <span className={styles.levelBadge}>Lv {child.level}</span>
          </div>
          <div className={styles.profileInfo}>
            <h1 className={styles.name}>{child.name}</h1>
            <p className={styles.meta}>Age {child.age} · Level {child.level}</p>
            {/* Equipped stickers with real images */}
            {equippedStickers.length > 0 && (
              <div className={styles.equippedRow}>
                {equippedStickers.map(s => (
                  <span key={s.slug} className={styles.equippedSticker} title={s.name}>
                    {s.imageUrl ? (
                      <img src={s.imageUrl} alt={s.name} className={styles.equippedImg} />
                    ) : (
                      s.emoji
                    )}
                  </span>
                ))}
              </div>
            )}
          </div>
          {(child.currentStreak || 0) > 0 && (
            <div className={styles.streakBadge}>🔥 {child.currentStreak} day{child.currentStreak > 1 ? 's' : ''}</div>
          )}
        </div>

        {/* AI greeting with Buddy avatar */}
        {aiGreeting && (
          <div className={styles.aiGreeting}>
            <img
              src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f43b.svg"
              alt="Buddy"
              className={styles.mascotImg}
            />
            <p className={styles.greetingText}>{aiGreeting}</p>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f3af.svg" alt="" className={styles.statImg} />
          <span className={styles.statValue}>{child.xp || 0}</span>
          <span className={styles.statLabel}>Total XP</span>
        </div>
        <div className={styles.statCard}>
          <img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f4b0.svg" alt="" className={styles.statImg} />
          <span className={styles.statValue}>{child.coins || 0}</span>
          <span className={styles.statLabel}>Coins</span>
        </div>
        <div className={styles.statCard}>
          <img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f3c5.svg" alt="" className={styles.statImg} />
          <span className={styles.statValue}>{earnedCount}</span>
          <span className={styles.statLabel}>Badges</span>
        </div>
        <div className={styles.statCard}>
          <img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f48e.svg" alt="" className={styles.statImg} />
          <span className={styles.statValue}>{ownedStickerCount}</span>
          <span className={styles.statLabel}>Stickers</span>
        </div>
        <div className={styles.statCard}>
          <img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f3c5.svg" alt="" className={styles.statImg} />
          <span className={styles.statValue}>{completedLevelsCount}</span>
          <span className={styles.statLabel}>Levels Done</span>
        </div>
      </div>

      <div className={styles.xpBar}>
        <div className={styles.xpFill} style={{ width: `${xpPct}%` }} />
        <span className={styles.xpLabel}>{xpPct}% to next level</span>
      </div>

      {/* Action buttons */}
      <div className={styles.actions}>
        <Link to={`/games?child=${childId}`} className={styles.actionPrimary}>🎮 Play Games</Link>
        <Link to={`/shop?child=${childId}`} className={styles.actionBtn}>🎁 Sticker Shop</Link>
        <Link to={`/map?child=${childId}`} className={styles.actionBtn}>🗺️ Adventure Map</Link>
        <Link to="#" onClick={(e) => { e.preventDefault(); document.querySelector('[aria-label="Talk to Buddy Bear"]')?.click(); }} className={styles.actionBtn}>
          🐻 Talk to Buddy
        </Link>
        {isAdultMode && <Link to={`/analytics/${childId}`} className={styles.actionBtn}>📊 Analytics</Link>}
        {isAdultMode && (
          <button type="button" onClick={() => setEditing(!editing)} className={styles.actionBtn}>
            ✏️ Edit
          </button>
        )}
      </div>

      {editing && isAdultMode && (
        <div className={styles.editSection}>
          <h3>Edit Profile</h3>
          <AvatarPicker value={editAvatar} onChange={setEditAvatar} size="small" />
          <input
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            className={styles.editInput}
            placeholder="Name"
          />
          <select value={editAge} onChange={(e) => setEditAge(Number(e.target.value))} className={styles.editInput}>
            {[1,2,3,4,5,6,7,8].map(n => <option key={n} value={n}>Age {n}</option>)}
          </select>
          <div className={styles.editActions}>
            <button type="button" onClick={handleSave} disabled={saving} className={styles.saveBtn}>
              Save Changes
            </button>
            <button type="button" onClick={handleDelete} className={styles.deleteBtn}>
              Delete Profile
            </button>
          </div>
        </div>
      )}

      {/* Performance Overview */}
      {recentGames.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Performance Overview</h2>
          <div className={styles.perfGrid}>
            {(() => {
              const catMap = {};
              const CAT_NAMES = {
                cognitive: 'Thinking', literacy: 'Reading', numeracy: 'Math',
                creativity: 'Art', sel: 'Emotions', motor: 'Motor',
                future_skills: 'Coding', auditory: 'Listening',
              };
              const CAT_COLORS = {
                cognitive: '#38bdf8', literacy: '#a78bfa', numeracy: '#fbbf24',
                creativity: '#f472b6', sel: '#4ade80', motor: '#fb923c',
                future_skills: '#818cf8', auditory: '#ef4444',
              };
              recentGames.forEach(p => {
                const cat = p.gameId?.category || 'other';
                if (!catMap[cat]) catMap[cat] = { scores: [], total: 0 };
                catMap[cat].scores.push(p.accuracy || 0);
                catMap[cat].total++;
              });
              return Object.entries(catMap).map(([cat, data]) => {
                const avg = Math.round(data.scores.reduce((s, v) => s + v, 0) / data.scores.length);
                return (
                  <div key={cat} className={styles.perfCard} style={{ borderTop: `3px solid ${CAT_COLORS[cat] || '#94a3b8'}` }}>
                    <span className={styles.perfCategory}>{CAT_NAMES[cat] || cat}</span>
                    <div className={styles.perfCircle}>
                      <svg viewBox="0 0 40 40" className={styles.perfSvg}>
                        <circle cx="20" cy="20" r="16" fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="4" />
                        <circle cx="20" cy="20" r="16" fill="none"
                          stroke={CAT_COLORS[cat] || '#94a3b8'} strokeWidth="4"
                          strokeLinecap="round"
                          strokeDasharray={`${avg} ${100 - avg}`}
                          strokeDashoffset="25"
                          style={{ transition: 'stroke-dasharray 0.6s ease' }} />
                      </svg>
                      <span className={styles.perfPct}>{avg}%</span>
                    </div>
                    <span className={styles.perfCount}>{data.total} games</span>
                  </div>
                );
              });
            })()}
          </div>
        </section>
      )}

      {/* Achievements */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Achievements ({earnedCount}/{ALL_ACHIEVEMENTS.length})</h2>
        </div>
        <BadgeShelf earned={child.achievements || []} all={ALL_ACHIEVEMENTS} />
      </section>

      {/* Recent Games */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Recent Games</h2>
        {recentGames.length === 0 ? (
          <div className={styles.emptySection}>
            <span style={{ fontSize: '2rem' }}>🎮</span>
            <p>No games played yet.</p>
            <Link to={`/games?child=${childId}`}>Start playing!</Link>
          </div>
        ) : (
          <div className={styles.gameList}>
            {recentGames.map((p) => {
              const acc = p.accuracy || 0;
              return (
                <div key={p._id} className={styles.gameItem}>
                  <div className={styles.gameItemLeft}>
                    <span className={styles.gameAccBadge} style={{
                      background: acc >= 80 ? 'rgba(74,222,128,0.15)' : acc >= 50 ? 'rgba(251,191,36,0.15)' : 'rgba(0,0,0,0.05)',
                      color: acc >= 80 ? 'var(--success)' : acc >= 50 ? 'var(--accent)' : 'var(--text-muted)',
                    }}>
                      {acc}%
                    </span>
                    <div>
                      <span className={styles.gameTitle}>{p.gameId?.title || 'Game'}</span>
                      <span className={styles.gameMeta}>Score {p.score}</span>
                    </div>
                  </div>
                  <span className={styles.gameDate}>{new Date(p.completedAt).toLocaleDateString()}</span>
                </div>
              );
            })}
          </div>
        )}
      </section>

    </div>
  );
}
