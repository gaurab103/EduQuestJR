import mongoose from 'mongoose';

const stickerSchema = new mongoose.Schema({
  slug: { type: String, required: true, unique: true },
  emoji: { type: String, required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: String, default: 'fun' },
  imageUrl: { type: String, default: '' }, // Real cartoon image URL
});

export default mongoose.model('Sticker', stickerSchema);
