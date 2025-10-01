// backend/services/analytics-service/src/index.js
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import pool from '../../database/client.js'
import analyticsRoutes from './api/analyticsRoutes.js';
import auditRoutes from './api/auditRoutes.js'; // Import the audit routes
import logger from '@production-support-portal/logger';

const app = express();
const PORT = process.env.PORT || 5004;

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
app.use('/', analyticsRoutes);
app.use('/', auditRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'Analytics Service is running' });
});

app.listen(PORT, () => {
    logger.info(`Analytics service is running on port ${PORT}`);
});