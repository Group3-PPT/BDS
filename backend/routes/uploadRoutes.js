import { Router } from 'express';
import upload from '../middleware/upload.js';
import { uploadImages, deleteImage, setThumbnail } from '../controllers/uploadController.js';

const router = Router();

router.post('/', upload.array('images', 10), uploadImages);
router.delete('/:id', deleteImage);
router.put('/thumbnail', setThumbnail);

export default router;
