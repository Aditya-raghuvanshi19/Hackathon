import express from 'express';
import cors from 'cors';

import { errorHandler } from './middleware/error.middleware.js';


const app = express();

app.use(cors());

app.use(express.json());

app.get("/", (req, res) => {
    res.send("Server Running OK")
})

app.use('/api/auth', authRoutes);


app.use(errorHandler);

export default app;