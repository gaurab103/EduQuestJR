import Sticker from '../models/Sticker.js';

const STICKERS = [
  { slug: 'star', emoji: '⭐', name: 'Gold Star', price: 10, category: 'rewards', imageUrl: 'https://cdn-icons-png.flaticon.com/128/3222/3222683.png' },
  { slug: 'heart', emoji: '❤️', name: 'Love Heart', price: 10, category: 'emotions', imageUrl: 'https://cdn-icons-png.flaticon.com/128/833/833472.png' },
  { slug: 'rainbow', emoji: '🌈', name: 'Rainbow', price: 15, category: 'nature', imageUrl: 'https://cdn-icons-png.flaticon.com/128/3222/3222801.png' },
  { slug: 'rocket', emoji: '🚀', name: 'Rocket Ship', price: 20, category: 'space', imageUrl: 'https://cdn-icons-png.flaticon.com/128/3031/3031702.png' },
  { slug: 'unicorn', emoji: '🦄', name: 'Unicorn', price: 25, category: 'animals', imageUrl: 'https://cdn-icons-png.flaticon.com/128/3940/3940424.png' },
  { slug: 'crown', emoji: '👑', name: 'Crown', price: 30, category: 'rewards', imageUrl: 'https://cdn-icons-png.flaticon.com/128/3064/3064197.png' },
  { slug: 'butterfly', emoji: '🦋', name: 'Butterfly', price: 15, category: 'nature', imageUrl: 'https://cdn-icons-png.flaticon.com/128/3940/3940430.png' },
  { slug: 'dolphin', emoji: '🐬', name: 'Dolphin', price: 20, category: 'animals', imageUrl: 'https://cdn-icons-png.flaticon.com/128/3940/3940416.png' },
  { slug: 'pizza', emoji: '🍕', name: 'Pizza', price: 10, category: 'food', imageUrl: 'https://cdn-icons-png.flaticon.com/128/3595/3595455.png' },
  { slug: 'ice-cream', emoji: '🍦', name: 'Ice Cream', price: 10, category: 'food', imageUrl: 'https://cdn-icons-png.flaticon.com/128/3595/3595587.png' },
  { slug: 'trophy', emoji: '🏆', name: 'Trophy', price: 30, category: 'rewards', imageUrl: 'https://cdn-icons-png.flaticon.com/128/3176/3176298.png' },
  { slug: 'sun', emoji: '☀️', name: 'Sunshine', price: 15, category: 'nature', imageUrl: 'https://cdn-icons-png.flaticon.com/128/869/869869.png' },
  { slug: 'cat', emoji: '🐱', name: 'Kitty Cat', price: 20, category: 'animals', imageUrl: 'https://cdn-icons-png.flaticon.com/128/1864/1864514.png' },
  { slug: 'dragon', emoji: '🐲', name: 'Dragon', price: 35, category: 'fantasy', imageUrl: 'https://cdn-icons-png.flaticon.com/128/3940/3940415.png' },
  { slug: 'gem', emoji: '💎', name: 'Diamond', price: 40, category: 'rewards', imageUrl: 'https://cdn-icons-png.flaticon.com/128/3222/3222769.png' },
  { slug: 'music', emoji: '🎵', name: 'Music Note', price: 15, category: 'fun', imageUrl: 'https://cdn-icons-png.flaticon.com/128/3039/3039386.png' },
  { slug: 'flower', emoji: '🌸', name: 'Cherry Blossom', price: 15, category: 'nature', imageUrl: 'https://cdn-icons-png.flaticon.com/128/3069/3069186.png' },
  { slug: 'alien', emoji: '👽', name: 'Alien', price: 25, category: 'space', imageUrl: 'https://cdn-icons-png.flaticon.com/128/3940/3940405.png' },
  { slug: 'dino', emoji: '🦕', name: 'Dinosaur', price: 30, category: 'animals', imageUrl: 'https://cdn-icons-png.flaticon.com/128/3940/3940429.png' },
  { slug: 'party', emoji: '🎉', name: 'Party Popper', price: 20, category: 'fun', imageUrl: 'https://cdn-icons-png.flaticon.com/128/3159/3159066.png' },
  { slug: 'penguin', emoji: '🐧', name: 'Penguin', price: 20, category: 'animals', imageUrl: 'https://cdn-icons-png.flaticon.com/128/3940/3940407.png' },
  { slug: 'panda', emoji: '🐼', name: 'Panda', price: 25, category: 'animals', imageUrl: 'https://cdn-icons-png.flaticon.com/128/3940/3940404.png' },
  { slug: 'lightning', emoji: '⚡', name: 'Lightning Bolt', price: 20, category: 'nature', imageUrl: 'https://cdn-icons-png.flaticon.com/128/3222/3222769.png' },
  { slug: 'robot', emoji: '🤖', name: 'Robot', price: 30, category: 'space', imageUrl: 'https://cdn-icons-png.flaticon.com/128/4712/4712031.png' },
  { slug: 'cake', emoji: '🎂', name: 'Birthday Cake', price: 15, category: 'food', imageUrl: 'https://cdn-icons-png.flaticon.com/128/3595/3595513.png' },
];

export async function seedStickers() {
  for (const s of STICKERS) {
    await Sticker.findOneAndUpdate({ slug: s.slug }, s, { upsert: true });
  }
}
