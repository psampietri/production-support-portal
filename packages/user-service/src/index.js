import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import prisma from '../../database/client.js';
import authRoutes from './api/authRoutes.js';
import userRoutes from './api/userRoutes.js';
import logger from '@production-support-portal/logger';

const app = express();
const PORT = process.env.USER_SERVICE_PORT || 5001;

app.use(cors());
app.use(bodyParser.json());

// FIX: Mount all routes under a single, consistent prefix
app.use('/', authRoutes);
app.use('/', userRoutes);

const startServer = async () => {
    try {
        await prisma.$connect();
        logger.info('Database connection verified for user-service.');
        app.listen(PORT, () => {
            logger.info(`user-service listening on port ${PORT}`);
        });
    } catch (err) {
        logger.error({ err }, 'FATAL: user-service failed to connect to the database on startup.');
        process.exit(1);
    }
};

startServer();