import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { children as childrenApi } from '../api/client';
import styles from './Analytics.module.css';

const CAT_LABELS = {
  cognitive: '🧠 Cognitive',
  literacy: '🔤 Literacy',
  numeracy: '🔢 Numeracy',
  creativity: '🎨 Creativity',
  sel: '😊 SEL',
  future_skills: '💻 Future Skills',
  motor: '🏃 Motor',
};

export default function Analytics() {
  const { childId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    childrenApi.analytics(childId)
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [childId]);

  if (loading) return <div className="loading-screen">Loading analytics...</div>;
  if (!data) return <p>Could not load analytics. <Link to="/dashboard">Go back</Link></p>;

  const { child, totalGames, avgAccuracy, categoryStats, topGames, accuracyTrend, recentGames, dailyActivity } = data;

  // Calculate max daily for bar chart scaling
  const dailyValues = Object.values(dailyActivity);
  const maxDaily = Math.max(1, ...dailyValues);

  // Last 14 days for chart
  const chartDays = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    chartDays.push({ date: key, label: d.toLocaleDateString('en', { month: 'short', day: 'numeric' }), count: dailyActivity[key] || 0 });
  }

  // Compute week-over-week insight
  const last7Days = chartDays.slice(-7);
  const prev7Days = chartDays.slice(-14, -7);
  const sumLast7 = last7Days.reduce((s, d) => s + d.count, 0);
  const sumPrev7 = prev7Days.reduce((s, d) => s + d.count, 0);
  const weekTrend = sumPrev7 > 0 ? Math.round(((sumLast7 - sumPrev7) / sumPrev7) * 100) : null;

  return (
    <div className={styles.page}>
      <Link to={`/child/${childId}`} className={styles.back}>← Back to {child.name}</Link>

      <div className={styles.heroBanner}>
        <div className={styles.heroAvatar}>{child.avatarConfig?.emoji || '👤'}</div>
        <div className={styles.heroContent}>
          <h1 className={styles.title}>Learning Analytics</h1>
          <p className={styles.heroSub}>{child.name}&apos;s progress & insights</p>
          {weekTrend !== null && (
            <span className={styles.trendBadge} data-trend={weekTrend >= 0 ? 'up' : 'down'}>
              {weekTrend >= 0 ? '↑' : '↓'} {Math.abs(weekTrend)}% vs last week
            </span>
          )}
        </div>
      </div>

      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <span className={styles.summaryValue}>{totalGames}</span>
          <span className={styles.summaryLabel}>Games Played</span>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryValue}>{avgAccuracy}%</span>
          <span className={styles.summaryLabel}>Avg Accuracy</span>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryValue}>{child.currentStreak}</span>
          <span className={styles.summaryLabel}>Day Streak</span>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryValue}>Level {child.level}</span>
          <span className={styles.summaryLabel}>{child.xp} XP</span>
        </div>
      </div>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>📈 Daily Activity (Last 14 Days)</h2>
        <div className={styles.barChart}>
          {chartDays.map((d) => (
            <div key={d.date} className={styles.barCol}>
              <div className={styles.bar} style={{ height: `${(d.count / maxDaily) * 100}%` }}>
                {d.count > 0 && <span className={styles.barValue}>{d.count}</span>}
              </div>
              <span className={styles.barLabel}>{d.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>🧠 Category Breakdown</h2>
        <div className={styles.catList}>
          {categoryStats.map((c) => (
            <div key={c.category} className={styles.catItem}>
              <span className={styles.catLabel}>{CAT_LABELS[c.category] || c.category}</span>
              <div className={styles.catBar}>
                <div className={styles.catFill} style={{ width: `${Math.min(100, c.avgAccuracy)}%` }} />
              </div>
              <span className={styles.catValue}>{c.count} games · {c.avgAccuracy}% avg</span>
            </div>
          ))}
        </div>
      </section>

      {topGames.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>🏆 Top Games</h2>
          <div className={styles.topList}>
            {topGames.map((g, i) => (
              <div key={g.slug} className={styles.topItem}>
                <span className={styles.topRank}>#{i + 1}</span>
                <span className={styles.topName}>{g.title}</span>
                <span className={styles.topCount}>{g.count}x played</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {accuracyTrend.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>📊 Accuracy Trend (Last 10 Games)</h2>
          <div className={styles.trendChart}>
            {accuracyTrend.map((t, i) => (
              <div key={i} className={styles.trendCol}>
                <div className={styles.trendBar} style={{ height: `${t.accuracy}%` }} />
                <span className={styles.trendValue}>{t.accuracy}%</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {recentGames.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>🎮 Recent Games</h2>
          <div className={styles.recentList}>
            {recentGames.map((g, i) => (
              <div key={i} className={styles.recentItem}>
                <span className={styles.recentTitle}>{g.game}</span>
                <span className={styles.recentScore}>Score {g.score} · {g.accuracy}%</span>
                <span className={styles.recentDate}>{new Date(g.date).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
