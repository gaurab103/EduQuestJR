import Sticker from '../models/Sticker.js';

const TWEMOJI_BASE = 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg';

const STICKERS = [
  { slug: 'star', emoji: '⭐', name: 'Gold Star', price: 10, category: 'rewards', imageUrl: `${TWEMOJI_BASE}/2b50.svg` },
  { slug: 'heart', emoji: '❤️', name: 'Love Heart', price: 10, category: 'emotions', imageUrl: `${TWEMOJI_BASE}/2764-fe0f.svg` },
  { slug: 'rainbow', emoji: '🌈', name: 'Rainbow', price: 15, category: 'nature', imageUrl: `${TWEMOJI_BASE}/1f308.svg` },
  { slug: 'rocket', emoji: '🚀', name: 'Rocket Ship', price: 20, category: 'space', imageUrl: `${TWEMOJI_BASE}/1f680.svg` },
  { slug: 'unicorn', emoji: '🦄', name: 'Unicorn', price: 25, category: 'animals', imageUrl: `${TWEMOJI_BASE}/1f984.svg` },
  { slug: 'crown', emoji: '👑', name: 'Crown', price: 30, category: 'rewards', imageUrl: `${TWEMOJI_BASE}/1f451.svg` },
  { slug: 'butterfly', emoji: '🦋', name: 'Butterfly', price: 15, category: 'nature', imageUrl: `${TWEMOJI_BASE}/1f98b.svg` },
  { slug: 'dolphin', emoji: '🐬', name: 'Dolphin', price: 20, category: 'animals', imageUrl: `${TWEMOJI_BASE}/1f42c.svg` },
  { slug: 'pizza', emoji: '🍕', name: 'Pizza', price: 10, category: 'food', imageUrl: `${TWEMOJI_BASE}/1f355.svg` },
  { slug: 'ice-cream', emoji: '🍦', name: 'Ice Cream', price: 10, category: 'food', imageUrl: `${TWEMOJI_BASE}/1f366.svg` },
  { slug: 'trophy', emoji: '🏆', name: 'Trophy', price: 30, category: 'rewards', imageUrl: `${TWEMOJI_BASE}/1f3c6.svg` },
  { slug: 'sun', emoji: '☀️', name: 'Sunshine', price: 15, category: 'nature', imageUrl: `${TWEMOJI_BASE}/2600-fe0f.svg` },
  { slug: 'cat', emoji: '🐱', name: 'Kitty Cat', price: 20, category: 'animals', imageUrl: `${TWEMOJI_BASE}/1f431.svg` },
  { slug: 'dragon', emoji: '🐲', name: 'Dragon', price: 35, category: 'fantasy', imageUrl: `${TWEMOJI_BASE}/1f432.svg` },
  { slug: 'gem', emoji: '💎', name: 'Diamond', price: 40, category: 'rewards', imageUrl: `${TWEMOJI_BASE}/1f48e.svg` },
  { slug: 'music', emoji: '🎵', name: 'Music Note', price: 15, category: 'fun', imageUrl: `${TWEMOJI_BASE}/1f3b5.svg` },
  { slug: 'flower', emoji: '🌸', name: 'Cherry Blossom', price: 15, category: 'nature', imageUrl: `${TWEMOJI_BASE}/1f338.svg` },
  { slug: 'alien', emoji: '👽', name: 'Alien', price: 25, category: 'space', imageUrl: `${TWEMOJI_BASE}/1f47d.svg` },
  { slug: 'dino', emoji: '🦕', name: 'Dinosaur', price: 30, category: 'animals', imageUrl: `${TWEMOJI_BASE}/1f995.svg` },
  { slug: 'party', emoji: '🎉', name: 'Party Popper', price: 20, category: 'fun', imageUrl: `${TWEMOJI_BASE}/1f389.svg` },
  { slug: 'penguin', emoji: '🐧', name: 'Penguin', price: 20, category: 'animals', imageUrl: `${TWEMOJI_BASE}/1f427.svg` },
  { slug: 'panda', emoji: '🐼', name: 'Panda', price: 25, category: 'animals', imageUrl: `${TWEMOJI_BASE}/1f43c.svg` },
  { slug: 'lightning', emoji: '⚡', name: 'Lightning Bolt', price: 20, category: 'nature', imageUrl: `${TWEMOJI_BASE}/26a1.svg` },
  { slug: 'robot', emoji: '🤖', name: 'Robot', price: 30, category: 'space', imageUrl: `${TWEMOJI_BASE}/1f916.svg` },
  { slug: 'cake', emoji: '🎂', name: 'Birthday Cake', price: 15, category: 'food', imageUrl: `${TWEMOJI_BASE}/1f382.svg` },
];

export async function seedStickers() {
  for (const s of STICKERS) {
    await Sticker.findOneAndUpdate({ slug: s.slug }, s, { upsert: true });
  }
}
