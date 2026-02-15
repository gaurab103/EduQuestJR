import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { requireParent } from '../middleware/roleMiddleware.js';
import * as stickerController from '../controllers/stickerController.js';

const router = express.Router();

router.use(authMiddleware, requireParent);
router.get('/', stickerController.listStickers);
router.post('/buy', stickerController.buySticker);
router.post('/equip', stickerController.equipStickers);

export default router;
