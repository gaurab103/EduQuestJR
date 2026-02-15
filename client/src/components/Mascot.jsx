import styles from './Mascot.module.css';

export default function Mascot({ message, mood = 'happy' }) {
  return (
    <div className={styles.mascot}>
      <div className={styles.mascotFace} role="img" aria-label="Friendly mascot">
        {mood === 'happy' && '🐻'}
        {mood === 'excited' && '🌟'}
        {mood === 'thinking' && '🤔'}
        {mood === 'celebrate' && '🎉'}
      </div>
      {message && (
        <div className={styles.speechBubble}>
          <p>{message}</p>
        </div>
      )}
    </div>
  );
}
