import express from 'express';
import cors from 'cors';
import prisma from '../../database/client.js'; // Use prisma client
import templateRoutes from './api/templateRoutes.js';
import logger from '@production-support-portal/logger';

const app = express();
const PORT = process.env.TEMPLATE_SERVICE_PORT || 5002;

app.use(cors());
app.use(express.json());

app.use('/', templateRoutes); // Add /templates prefix

const startServer = async () => {
    try {
        await prisma.$connect();
        logger.info('Database connection verified for template-service.');
        
        app.listen(PORT, () => {
            logger.info(`template-service listening on port ${PORT}`);
        });
    } catch (err) {
        logger.error({ err }, 'FATAL: template-service failed to connect to the database on startup.');
        process.exit(1);
    }
}

startServer();