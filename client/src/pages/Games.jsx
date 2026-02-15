import { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useChildMode } from '../context/ChildModeContext';
import { games as gamesApi, children as childrenApi, ai as aiApi, challenges as challengesApi } from '../api/client';
import DailyTasks from '../components/DailyTasks';
import PersonalMascot from '../components/PersonalMascot';
import styles from './Games.module.css';

const CATEGORY_LABELS = {
  cognitive: '🧠 Cognitive',
  literacy: '🔤 Literacy',
  numeracy: '🔢 Numeracy',
  creativity: '🎨 Creativity',
  sel: '😊 Social & Emotional',
  future_skills: '💻 Future Skills',
  motor: '🏃 Motor Skills',
  auditory: '🔊 Auditory',
};

const CATEGORY_IMAGES = {
  cognitive: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f9e0.svg',
  literacy: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f4da.svg',
  numeracy: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f4ca.svg',
  creativity: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f3a8.svg',
  sel: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/2764.svg',
  future_skills: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f4bb.svg',
  motor: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/270f.svg',
  auditory: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f3b5.svg',
};

const DIFFICULTY_BADGE = {
  easy: { label: 'Easy', color: '#4ade80' },
  medium: { label: 'Medium', color: '#fbbf24' },
  hard: { label: 'Hard', color: '#f87171' },
};

// Card accent colors per category
const CATEGORY_ACCENTS = {
  cognitive: ['#38bdf8', '#818cf8'],
  literacy: ['#f472b6', '#a78bfa'],
  numeracy: ['#fbbf24', '#fb923c'],
  creativity: ['#4ade80', '#38bdf8'],
  sel: ['#f9a8d4', '#c084fc'],
  future_skills: ['#818cf8', '#38bdf8'],
  motor: ['#fb923c', '#ef4444'],
  auditory: ['#38bdf8', '#4ade80'],
};

export default function Games() {
  const { user } = useAuth();
  const { isAdultMode } = useChildMode();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlChildId = searchParams.get('child');
  const [allGames, setAllGames] = useState([]);
  const [childList, setChildList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [aiRecommendation, setAiRecommendation] = useState(null);
  const [dailyChallenge, setDailyChallenge] = useState(null);

  const selectedChildId = urlChildId || (childList.length > 0 ? childList[0]._id : null);
  const selectedChild = childList.find(c => c._id === selectedChildId) || null;

  useEffect(() => {
    if (!urlChildId && childList.length > 0) {
      setSearchParams({ child: childList[0]._id }, { replace: true });
    }
  }, [childList, urlChildId, setSearchParams]);

  useEffect(() => {
    if (selectedChildId) {
      aiApi.recommendation(selectedChildId)
        .then(({ recommendedSlug, game }) => setAiRecommendation(game || { slug: recommendedSlug, title: recommendedSlug }))
        .catch(() => setAiRecommendation(null));
    } else {
      setAiRecommendation(null);
    }
  }, [selectedChildId]);

  useEffect(() => {
    Promise.all([gamesApi.list(), childrenApi.list(), challengesApi.daily()])
      .then(([gamesRes, childrenRes, challengeRes]) => {
        setAllGames(gamesRes.games || []);
        setChildList(childrenRes.children || []);
        setDailyChallenge(challengeRes.challenge || null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const isPremium = user?.subscriptionStatus === 'active';

  const filtered = useMemo(() => {
    let list = allGames;
    if (filter) list = list.filter((g) => g.category === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((g) => g.title.toLowerCase().includes(q) || g.category.includes(q));
    }
    return list;
  }, [allGames, filter, search]);

  function handleChildChange(e) {
    const id = e.target.value;
    if (id) setSearchParams({ child: id });
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <img src="/logo.png" alt="EduQuestJr" className={styles.headerLogo} />
        <div>
          <h1 className={styles.title}>
            {isAdultMode ? 'Game Library' : "Let's Play!"}
          </h1>
          <p className={styles.subtitle}>
            {isAdultMode
              ? `${allGames.length} games across ${Object.keys(CATEGORY_LABELS).length} categories. ${!isPremium ? 'Some games require Premium.' : ''}`
              : 'Pick a game and have fun learning!'}
          </p>
        </div>
      </div>

      {/* Child selector */}
      {childList.length > 0 && (
        <div className={styles.childBanner}>
          <div className={styles.childBannerLeft}>
            <span className={styles.childBannerAvatar}>{selectedChild?.avatarConfig?.emoji || '👤'}</span>
            <div>
              <span className={styles.childBannerName}>Playing as {selectedChild?.name || 'Select child'}</span>
              {selectedChild && (
                <span className={styles.childBannerMeta}>Level {selectedChild.level} · ⭐ {selectedChild.xp || 0} XP · 🪙 {selectedChild.coins || 0}</span>
              )}
            </div>
          </div>
          {childList.length > 1 && (
            <select
              value={selectedChildId || ''}
              onChange={handleChildChange}
              className={styles.childSelect}
            >
              {childList.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name} (Level {c.level})
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      {childList.length === 0 && !loading && (
        <div className={styles.noChildBanner}>
          <img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f9d2.svg" alt="" className={styles.noChildImg} />
          <div>
            <strong>No child profile found</strong>
            <p><Link to="/dashboard">Add a child profile</Link> on the dashboard to start playing games.</p>
          </div>
        </div>
      )}

      {selectedChildId && selectedChild && (
        <PersonalMascot child={selectedChild} compact />
      )}

      {dailyChallenge && selectedChildId && (
        <Link to={`/play/${dailyChallenge.game.slug}?child=${selectedChildId}`} className={styles.dailyChallenge}>
          <img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f3c6.svg" alt="" className={styles.challengeImg} />
          <div className={styles.challengeInfo}>
            <span className={styles.challengeLabel}>{dailyChallenge.label}</span>
            <span className={styles.challengeGame}>{dailyChallenge.game.title}</span>
          </div>
          <span className={styles.challengeArrow}>→</span>
        </Link>
      )}

      {selectedChildId && <DailyTasks childId={selectedChildId} />}

      {aiRecommendation && selectedChildId && (
        <Link to={`/play/${aiRecommendation.slug}?child=${selectedChildId}`} className={styles.aiRecommendation}>
          <img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f43b.svg" alt="Buddy" className={styles.aiRecImg} />
          <span className={styles.aiLabel}>Buddy suggests:</span>
          <span className={styles.aiGame}>{aiRecommendation.title}</span>
          <span className={styles.challengeArrow}>→</span>
        </Link>
      )}

      {/* Search + Filters */}
      <div className={styles.toolBar}>
        <input
          type="search"
          placeholder="🔍 Search games..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={styles.searchInput}
        />
        <div className={styles.filters}>
          <button
            type="button"
            onClick={() => setFilter('')}
            className={filter === '' ? styles.filterActive : styles.filterBtn}
          >
            All ({allGames.length})
          </button>
          {Object.entries(CATEGORY_LABELS).map(([key, label]) => {
            const count = allGames.filter(g => g.category === key).length;
            if (count === 0) return null;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                className={filter === key ? styles.filterActive : styles.filterBtn}
              >
                {label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className="loading-screen">Loading games...</div>
      ) : filtered.length === 0 ? (
        <div className={styles.empty}>
          <img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f3ae.svg" alt="" style={{ width: 48, opacity: 0.5 }} />
          <p>No games found. Try a different filter or search.</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {filtered.map((game) => {
            const locked = game.isPremium && !isPremium;
            const catImg = CATEGORY_IMAGES[game.category] || CATEGORY_IMAGES.cognitive;
            const diff = DIFFICULTY_BADGE[game.difficulty] || DIFFICULTY_BADGE.easy;
            const isChallenge = dailyChallenge?.game?.slug === game.slug;
            const accent = CATEGORY_ACCENTS[game.category] || ['#38bdf8', '#818cf8'];

            return (
              <div
                key={game._id}
                className={`${styles.card} ${locked ? styles.cardLocked : ''} ${isChallenge ? styles.cardChallenge : ''}`}
              >
                {isChallenge && <div className={styles.challengeBadge}>🏆 Daily</div>}
                {/* Colored top strip */}
                <div className={styles.cardStrip} style={{ background: `linear-gradient(135deg, ${accent[0]}, ${accent[1]})` }} />
                <div className={styles.cardBody}>
                  <div className={styles.cardTop}>
                    {locked ? (
                      <span className={styles.cardLockIcon}>🔒</span>
                    ) : (
                      <img src={catImg} alt="" className={styles.cardImg} />
                    )}
                    <span className={styles.diffBadge} style={{ background: `${diff.color}22`, color: diff.color }}>
                      {diff.label}
                    </span>
                  </div>
                  <h3 className={styles.cardTitle}>{game.title}</h3>
                  <span className={styles.cardCategory}>
                    {CATEGORY_LABELS[game.category] || game.category}
                  </span>
                  <span className={styles.cardLevels}>30 Levels</span>
                  {locked ? (
                    <Link to="/subscription" className={styles.lockedBtn}>
                      🔒 Premium
                    </Link>
                  ) : (
                    <Link
                      to={selectedChildId ? `/play/${game.slug}?child=${selectedChildId}` : '#'}
                      className={styles.playBtn}
                      onClick={(e) => { if (!selectedChildId) e.preventDefault(); }}
                    >
                      {selectedChildId ? '▶ Play Now' : 'Select child first'}
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
