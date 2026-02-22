/**
 * Displays child avatar: photo if photoUrl exists, else emoji.
 * Supports both avatar styles for a personalized experience.
 */
import { useState } from 'react';
import styles from './ChildAvatar.module.css';

export default function ChildAvatar({ child, size = 'normal', className = '' }) {
  const photoUrl = child?.avatarConfig?.photoUrl;
  const emoji = child?.avatarConfig?.emoji || '👤';
  const name = child?.name || 'Avatar';
  const [imgError, setImgError] = useState(false);

  const showPhoto = photoUrl && !imgError;

  if (showPhoto) {
    return (
      <div className={`${styles.wrapper} ${styles[size]} ${className}`}>
        <img
          src={photoUrl}
          alt={name}
          className={styles.photo}
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  return (
    <div className={`${styles.wrapper} ${styles.emoji} ${styles[size]} ${className}`}>
      <span className={styles.emojiText}>{emoji}</span>
    </div>
  );
}
