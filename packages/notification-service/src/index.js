import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import pool from '../../database/client.js'
import notificationRoutes from './api/notificationRoutes.js';
import logger from '@production-support-portal/logger';

const app = express();
const PORT = process.env.PORT || 5006;

app.use(cors());
app.use(bodyParser.json());

// Test database connection
pool.query('SELECT NOW()', (err) => {
    if (err) {
        logger.error({ err }, 'Database connection error:');
        process.exit(1);
    } else {
        logger.info('Database connection successful');
    }
});

// Routes
app.use('/', notificationRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'Notification Service is running' });
});

app.listen(PORT, () => {
    logger.info(`Notification service is running on port ${PORT}`);
});