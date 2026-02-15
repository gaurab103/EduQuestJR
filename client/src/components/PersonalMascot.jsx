import { useState, useEffect } from 'react';
import { ai as aiApi } from '../api/client';
import styles from './PersonalMascot.module.css';

export default function PersonalMascot({ child, compact = false }) {
  const [greeting, setGreeting] = useState('');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!child) return;

    // Try AI greeting, fallback to smart template
    const timeGreeting = getTimeGreeting();
    const fallback = buildFallbackGreeting(child, timeGreeting);

    aiApi.encouragement({
      childName: child.name,
      childAge: child.age,
      level: child.level,
      streak: child.currentStreak || 0,
      recentAccuracy: 0,
    })
      .then(res => setGreeting(res.message || fallback))
      .catch(() => setGreeting(fallback));

    setVisible(true);
  }, [child?._id]);

  if (!child || !visible) return null;

  return (
    <div className={`${styles.mascot} ${compact ? styles.compact : ''}`}>
      <div className={styles.mascotBody}>
        <span className={styles.mascotEmoji}>🐻</span>
        {!compact && <span className={styles.mascotName}>Buddy</span>}
      </div>
      <div className={styles.speechBubble}>
        <p className={styles.speechText}>
          {greeting || `Hi ${child.name}! Ready to learn?`}
        </p>
      </div>
    </div>
  );
}

function getTimeGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function buildFallbackGreeting(child, timeGreeting) {
  const name = child.name || 'friend';
  const streak = child.currentStreak || 0;
  const level = child.level || 1;

  const templates = [
    `${timeGreeting}, ${name}! Ready for a fun adventure?`,
    `Hey ${name}! Let's learn something amazing today! 🌟`,
    `Welcome back, ${name}! You're doing so well!`,
  ];

  if (streak >= 3) {
    templates.push(`Wow ${name}, ${streak} days in a row! You're a superstar! ⭐`);
  }
  if (level >= 5) {
    templates.push(`Level ${level} ${name}! You're becoming a super learner! 🚀`);
  }

  return templates[Math.floor(Math.random() * templates.length)];
}
