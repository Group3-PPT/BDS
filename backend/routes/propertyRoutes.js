import { Router } from 'express';
import {
  getProperties,
  getPropertyById,
  createProperty,
  updateProperty,
  updateStatus,
  deleteProperty,
  getDistricts,
  exportExcel
} from '../controllers/propertyController.js';

const router = Router();

router.get('/districts', getDistricts);
router.get('/export/excel', exportExcel);
router.get('/', getProperties);
router.get('/:id', getPropertyById);
router.post('/', createProperty);
router.put('/:id', updateProperty);
router.patch('/:id/status', updateStatus);
router.delete('/:id', deleteProperty);

export default router;
