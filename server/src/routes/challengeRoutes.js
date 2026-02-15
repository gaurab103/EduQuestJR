import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { getDailyChallenge, getDailyTaskProgress, completeDailyTask } from '../controllers/challengeController.js';

const router = express.Router();
router.use(authMiddleware);
router.get('/daily', getDailyChallenge);
router.get('/daily/progress', getDailyTaskProgress);
router.post('/daily/complete', completeDailyTask);

export default router;
