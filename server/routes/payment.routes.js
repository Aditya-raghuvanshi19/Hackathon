import { Router } from 'express';
import { processPayment, getPaymentDetails, fetchUserPayments } from '../controllers/payment.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/', authMiddleware, processPayment);
router.post('/user/:id', authMiddleware, fetchUserPayments);
router.get('/:id', authMiddleware, getPaymentDetails);

export default router;