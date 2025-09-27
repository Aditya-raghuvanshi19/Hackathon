import { Router } from 'express';
import { createReview, getServiceReviews, getAllReviews } from '../controllers/review.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/', authMiddleware, createReview);
router.get('/service/:serviceId', getServiceReviews);
router.get('/getReviews', getAllReviews);

export default router;