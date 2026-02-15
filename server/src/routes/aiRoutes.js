import express from 'express';
import { getHint, getRecommendation, getEncouragement, getSuggestedLevel, chatWithBuddy } from '../controllers/aiController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/hint', authMiddleware, getHint);
router.get('/recommendation', authMiddleware, getRecommendation);
router.get('/encouragement', authMiddleware, getEncouragement);
router.get('/suggested-level', authMiddleware, getSuggestedLevel);
router.post('/chat', authMiddleware, chatWithBuddy);

export default router;
