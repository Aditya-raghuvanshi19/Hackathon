import express from 'express';
import cors from 'cors';

import { errorHandler } from './middleware/error.middleware.js';

import authRoutes from './routes/auth.routes.js';
import repairRoutes from './routes/repair.routes.js';
import serviceRoutes from './routes/service.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import reviewRoutes from './routes/review.routes.js';
import appointmentRoutes from './routes/appointment.routes.js';

const app = express();

app.use(cors());

app.use(express.json());

app.get("/", (req, res) => {
    res.send("Server Running OK")
})

app.use('/api/auth', authRoutes);
app.use('/api/repairs', repairRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/appointments', appointmentRoutes);

app.use(errorHandler);

export default app;