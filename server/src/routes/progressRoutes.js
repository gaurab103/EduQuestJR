import express from 'express';
import { submitProgress } from '../controllers/progressController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { requireParent } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.post('/', authMiddleware, requireParent, submitProgress);

export default router;