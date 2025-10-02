// backend/services/analytics-service/src/index.js
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import prisma from '../../database/client.js'; // Use prisma client
import analyticsRoutes from './api/analyticsRoutes.js';
import auditRoutes from './api/auditRoutes.js';
import logger from '@production-support-portal/logger';

const app = express();
const PORT = process.env.ANALYTICS_SERVICE_PORT || 5004;

app.use(cors());
app.use(bodyParser.json());

// Routes
app.use('/', analyticsRoutes); // Added /analytics prefix
app.use('/', auditRoutes);       // Added /audit prefix

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'Analytics Service is running' });
});

const startServer = async () => {
    try {
        // Test the database connection using Prisma
        await prisma.$connect();
        logger.info('Database connection verified for analytics-service.');

        app.listen(PORT, () => {
            logger.info(`Analytics service is running on port ${PORT}`);
        });
    } catch (err) {
        logger.error({ err }, 'FATAL: analytics-service failed to connect to the database on startup.');
        process.exit(1);
    }
};

startServer();