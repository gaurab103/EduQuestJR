import express from 'express';
import { list, getOne } from '../controllers/gameController.js';
import { optionalAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', optionalAuth, list);
router.get('/:slug', optionalAuth, getOne);

export default router;
