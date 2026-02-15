import styles from './BadgeShelf.module.css';

export default function BadgeShelf({ earned = [], all = [] }) {
  const earnedSlugs = new Set(earned.map(a => a.slug));

  return (
    <div className={styles.shelf}>
      {all.map((ach) => {
        const isEarned = earnedSlugs.has(ach.slug);
        return (
          <div key={ach.slug} className={`${styles.badge} ${isEarned ? styles.earned : styles.locked}`}>
            <span className={styles.icon}>{isEarned ? ach.icon : '🔒'}</span>
            <span className={styles.title}>{ach.title}</span>
            <span className={styles.desc}>{ach.description}</span>
          </div>
        );
      })}
    </div>
  );
}
