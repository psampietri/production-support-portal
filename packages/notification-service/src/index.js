import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import prisma from '../../database/client.js'; // Use prisma client
import notificationRoutes from './api/notificationRoutes.js';
import logger from '@production-support-portal/logger';

const app = express();
const PORT = process.env.NOTIFICATION_SERVICE_PORT || 5006;

app.use(cors());
app.use(bodyParser.json());

// Routes
app.use('/notifications', notificationRoutes); // Added /notifications prefix

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'Notification Service is running' });
});

const startServer = async () => {
    try {
        await prisma.$connect();
        logger.info('Database connection verified for notification-service.');

        app.listen(PORT, () => {
            logger.info(`Notification service is running on port ${PORT}`);
        });
    } catch (err) {
        logger.error({ err }, 'FATAL: notification-service failed to connect to the database on startup.');
        process.exit(1);
    }
};

startServer();