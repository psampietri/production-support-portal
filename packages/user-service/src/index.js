import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import pool from '../../database/client.js'
import authRoutes from './api/authRoutes.js';
import userRoutes from './api/userRoutes.js';
import logger from '@production-support-portal/logger';

const app = express();
const PORT = process.env.PORT || 5001;

// Standard middleware setup
app.use(cors());
app.use(bodyParser.json());

// Define routes for this service
app.use('/', authRoutes);
app.use('/', userRoutes); 

const startServer = async () => {
    try {
        // Test the database connection before starting
        const client = await pool.connect();
        logger.info('Database connection verified for user-service.');
        client.release();

        // If the connection is successful, start the server
        app.listen(PORT, () => {
            logger.info(`user-service listening on port ${PORT}`);
        });
    } catch (err) {
        logger.error({ err }, 'FATAL: user-service failed to connect to the database on startup.');
        process.exit(1);
    }
};

startServer();