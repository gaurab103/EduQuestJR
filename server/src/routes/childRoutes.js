import express from 'express';
import * as childController from '../controllers/childController.js';
import * as progressController from '../controllers/progressController.js';
import * as analyticsController from '../controllers/analyticsController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { requireParent } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(authMiddleware, requireParent);

router.get('/', childController.list);
router.post('/', childController.create);
router.get('/:id', childController.getOne);
router.patch('/:id', childController.update);
router.delete('/:id', childController.remove);

// Play status for a child + game (used before launching game)
router.get('/:childId/play-status', progressController.getPlayStatus);
// Progress history for analytics
router.get('/:childId/progress', progressController.listProgress);
router.get('/:childId/completed-levels', progressController.getCompletedLevels);
router.get('/:childId/analytics', analyticsController.getAnalytics);

export default router;
