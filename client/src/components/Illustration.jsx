/**
 * ECD-friendly illustrations - cartoon-style visuals.
 * Use Open Doodles (opendoodles.com) or Storyset (storyset.com) SVGs by path.
 */
const EMOJI_ILLUSTRATIONS = {
  reading: '📖',
  learning: '🎓',
  playing: '🎮',
  star: '⭐',
  trophy: '🏆',
  rocket: '🚀',
  happy: '😊',
  game: '🕹️',
  crayons: '🖍️',
  match: '🧩',
  count: '🔢',
};
export default function Illustration({ name, size = 80, alt = '', className = '' }) {
  const emoji = EMOJI_ILLUSTRATIONS[name] || EMOJI_ILLUSTRATIONS.happy;
  return (
    <span
      role="img"
      aria-label={alt || name}
      className={className}
      style={{ fontSize: size, lineHeight: 1, display: 'inline-block' }}
    >
      {emoji}
    </span>
  );
}
