import styles from './LoadingSpinner.module.css';

export default function LoadingSpinner({ message = 'Loading...', size = 'normal' }) {
  return (
    <div className={`${styles.wrapper} ${size === 'small' ? styles.small : ''}`}>
      <div className={styles.spinner}>
        <span className={styles.dot} />
        <span className={styles.dot} />
        <span className={styles.dot} />
      </div>
      {message && <p className={styles.message}>{message}</p>}
    </div>
  );
}
