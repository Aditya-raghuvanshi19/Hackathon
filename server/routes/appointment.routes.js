import { Router } from 'express';
import {
  createAppointment,
  getAppointments,
  updateAppointment,
  deleteAppointment
} from '../controllers/appointment.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/', authMiddleware, createAppointment);
router.get('/', authMiddleware, getAppointments);
router.put('/:id', authMiddleware, updateAppointment);
router.delete('/:id', authMiddleware, deleteAppointment);

export default router;