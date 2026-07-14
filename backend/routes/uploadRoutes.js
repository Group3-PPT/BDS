import { Router } from 'express';
import { uploadImages, deleteImage, setThumbnail } from '../controllers/uploadController.js';

const router = Router();

router.post('/', uploadImages);
router.delete('/:id', deleteImage);
router.put('/thumbnail', setThumbnail);

export default router;
