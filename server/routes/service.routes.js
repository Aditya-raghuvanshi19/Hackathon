import { Router } from 'express';
import {
  getServices,
  createService,
  deleteService,
  getServicesByVendorId,
  authorizeService,
  getAllServices
} from '../controllers/service.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { adminMiddleware } from '../middleware/admin.middleware.js';
import { vendorMiddleware } from '../middleware/vendor.middleware.js';

const router = Router();

router.get('/', getServices);
router.get('/admin/getAll', getAllServices);
router.get('/vendor/:id', getServicesByVendorId);
router.post('/create', authMiddleware, createService);
router.delete('/:id', authMiddleware, adminMiddleware, deleteService);
router.delete('/vendor/:id', authMiddleware, vendorMiddleware, deleteService);
router.post('/authorize', authMiddleware, adminMiddleware, authorizeService);
export default router;