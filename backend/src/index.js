
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import connectDB from './utils/db.js';

import { router } from './routes/userRoutes.js';
import { propertyRouter } from './routes/propertyRouter.js';
import { bookingRouter } from './routes/bookingRouter.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 8081;



app.use(cors({
    origin: [
        'https://homelyhub-pearl.vercel.app',
        'http://localhost:5173'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));


app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({
    limit: '10mb',
    extended: true
}));
app.use(cookieParser());

app.get('/', (req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'HomelyHub API is running'
    });
});

app.use('/api/v1/rent/user', router);
app.use('/api/v1/rent/listing', propertyRouter);
app.use('/api/v1/rent/user/booking', bookingRouter);


const startServer = async () => {
    try {
        await connectDB();

        app.listen(port, '0.0.0.0', () => {
            console.log(`HomelyHub API running on port ${port}`);
        });
    } catch (error) {
        console.error('Failed to start server:');
        console.error(error);
        console.error(error?.stack);
        process.exit(1);
    }
};

startServer();

