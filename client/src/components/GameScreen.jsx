/**
 * ECD-friendly game screen layout:
 * Top: Mascot + instruction (one task per screen)
 * Middle: Game activity
 * Bottom: Big colorful action buttons
 * No sidebars, mobile-first, one action per screen.
 */
import Mascot from './Mascot';
import styles from './GameScreen.module.css';

export default function GameScreen({ instruction, mascotMood = 'happy', children, actions }) {
  return (
    <div className={styles.screen}>
      <Mascot message={instruction} mood={mascotMood} />
      <div className={styles.activity}>
        {children}
      </div>
      {actions && (
        <div className={styles.actions}>
          {actions}
        </div>
      )}
    </div>
  );
}
