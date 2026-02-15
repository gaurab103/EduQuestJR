import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';

import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import childRoutes from './routes/childRoutes.js';
import gameRoutes from './routes/gameRoutes.js';
import progressRoutes from './routes/progressRoutes.js';
import stickerRoutes from './routes/stickerRoutes.js';
import challengeRoutes from './routes/challengeRoutes.js';
import subscriptionRoutes from './routes/subscriptionRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import * as subscriptionController from './controllers/subscriptionController.js';
import { errorHandler } from './utils/errorHandler.js';
import { seedGames } from './services/seedGames.js';
import { seedAchievements } from './services/seedAchievements.js';
import { seedStickers } from './services/seedStickers.js';

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/eduquestjr';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
const IS_VERCEL = process.env.VERCEL === '1';

// Middleware - CORS for production & dev
app.use(cors({
  origin: (origin, cb) => {
    // Allow no-origin requests (server-to-server, Postman, etc.)
    if (!origin) return cb(null, true);
    // Allow any localhost in dev
    if (origin.startsWith('http://localhost')) return cb(null, true);
    // Allow configured client URL
    if (origin === CLIENT_URL) return cb(null, true);
    // Allow any *.vercel.app domain
    if (origin.endsWith('.vercel.app')) return cb(null, true);
    cb(null, false);
  },
  credentials: true,
}));
app.use(express.json());

// Health check
app.get('/api/health', (_, res) => {
  res.json({ status: 'ok', message: 'EduQuestJr API is running' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/children', childRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/stickers', stickerRoutes);
app.use('/api/challenges', challengeRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/ai', aiRoutes);

// PayPal webhook (no auth; body already parsed by express.json())
app.post('/api/webhook/paypal', (req, res, next) => {
  subscriptionController.handleWebhook(req, res, next);
});

// 404
app.use((_, res) => res.status(404).json({ message: 'Route not found' }));

// Error handler
app.use(errorHandler);

// Database connection (cached for serverless)
let isConnected = false;
async function connectDB() {
  if (isConnected) return;
  await mongoose.connect(MONGODB_URI);
  isConnected = true;
  await seedGames();
  await seedAchievements();
  await seedStickers();
}

// For Vercel serverless: export the app and connect on first request
if (IS_VERCEL) {
  app.use(async (req, res, next) => {
    try {
      await connectDB();
      next();
    } catch (err) {
      console.error('DB connection error:', err.message);
      res.status(500).json({ message: 'Database connection failed' });
    }
  });
} else {
  // Traditional server startup
  mongoose
    .connect(MONGODB_URI)
    .then(async () => {
      await seedGames();
      await seedAchievements();
      await seedStickers();
      app.listen(PORT, () => {
        console.log('EduQuestJr API running on http://localhost:' + PORT);
      });
    })
    .catch((err) => {
      console.error('MongoDB connection error:', err.message);
      process.exit(1);
    });
}

// Export for Vercel serverless
export default app;
