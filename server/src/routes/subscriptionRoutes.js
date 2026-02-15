import express from 'express';
import * as subscriptionController from '../controllers/subscriptionController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/create', authMiddleware, subscriptionController.createSubscription);
router.post('/plan-id', authMiddleware, subscriptionController.getPlanId);
router.post('/activate', authMiddleware, subscriptionController.activateSubscription);
router.get('/status', authMiddleware, subscriptionController.getStatus);
router.get('/sync', authMiddleware, subscriptionController.subscriptionSuccess);

export default router;
