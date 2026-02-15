import styles from './AvatarPicker.module.css';

const AVATARS = [
  '🐻', '🐱', '🐶', '🦊', '🐰', '🐼',
  '🦁', '🐸', '🐵', '🐔', '🦄', '🐲',
  '🐧', '🦋', '🐬', '🐨',
];

export default function AvatarPicker({ value, onChange, size = 'normal' }) {
  return (
    <div className={`${styles.grid} ${size === 'small' ? styles.gridSmall : ''}`}>
      {AVATARS.map((emoji) => (
        <button
          key={emoji}
          type="button"
          onClick={() => onChange(emoji)}
          className={`${styles.avatar} ${value === emoji ? styles.active : ''}`}
          aria-label={`Select ${emoji}`}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}

export { AVATARS };
