import { Router } from 'express';
import { register, login } from '../controllers/auth.controller.js';
import { validateRegistration } from '../middleware/validation.middleware.js';

const router = Router();

router.post('/register', validateRegistration, register);
router.post('/login', login);

export default router;