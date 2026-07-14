import { Router } from 'express';
import { previewImport, confirmImport } from '../controllers/importController.js';

const router = Router();

router.post('/preview', previewImport);
router.post('/confirm', confirmImport);

export default router;
