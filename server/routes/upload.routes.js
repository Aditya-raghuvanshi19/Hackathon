import express from 'express';
import { uploadFiles, downloadReport, getMetrics, getProcessedData } from '../controllers/upload.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import multer from 'multer';

const router = express.Router();
const upload = multer({ dest: 'uploads/' }); // You can customize storage

router.post('/', authMiddleware, upload.array('files'), uploadFiles);
router.get('/metrics', authMiddleware, getMetrics);
router.get('/processed', authMiddleware, getProcessedData);
router.get('/download/:type', authMiddleware, downloadReport);

export default router;