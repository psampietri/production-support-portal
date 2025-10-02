import express from 'express';
import cors from 'cors';
import prisma from '../../database/client.js'; // Use Prisma client
import onboardingRoutes from './api/onboardingRoutes.js';
import logger from '@production-support-portal/logger';

const app = express();
const PORT = process.env.ONBOARDING_SERVICE_PORT || 5003;

app.use(cors());
app.use(express.json());

app.use('/', onboardingRoutes);

const startServer = async () => {
    try {
        await prisma.$connect();
        logger.info('Database connection verified for onboarding-service.');

        app.listen(PORT, () => {
            logger.info(`onboarding-service listening on port ${PORT}`);
        });
    } catch (err) {
        logger.error({ err }, 'FATAL: onboarding-service failed to connect to the database on startup.');
        process.exit(1);
    }
};

startServer();