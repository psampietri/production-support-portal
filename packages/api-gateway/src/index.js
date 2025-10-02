import express from 'express';
import cors from 'cors';
import { createProxyMiddleware } from 'http-proxy-middleware';
import pinoHttp from 'pino-http';
import logger from '@production-support-portal/logger';

const app = express();
app.use(cors());
app.use(pinoHttp({ logger }));

const PORT = process.env.API_GATEWAY_PORT || 4000;

const serviceTargets = {
    users: `http://localhost:${process.env.USER_SERVICE_PORT || 5001}`,
    templates: `http://localhost:${process.env.TEMPLATE_SERVICE_PORT || 5002}`,
    onboarding: `http://localhost:${process.env.ONBOARDING_SERVICE_PORT || 5003}`,
    analytics: `http://localhost:${process.env.ANALYTICS_SERVICE_PORT || 5004}`,
    jira: `http://localhost:${process.env.JIRA_SERVICE_PORT || 5005}`,
    notifications: `http://localhost:${process.env.NOTIFICATION_SERVICE_PORT || 5006}`,
    kpis: `http://localhost:${process.env.KPI_SERVICE_PORT || 5007}`,
};

// Define a common proxy configuration
const proxyOptions = {
    changeOrigin: true,
    pathRewrite: {
        '^/api': '', // FIX: This single rule correctly rewrites all paths
    },
    on: {
        proxyReq: (proxyReq, req) => {
            logger.info(`Proxying request from ${req.originalUrl} to ${serviceTargets[req.context.serviceName]}${proxyReq.path}`);
        },
        error: (err, req) => {
            logger.error({ err }, `Error proxying request for ${req.originalUrl}`);
        }
    }
};

// Add a small middleware to identify the service being called
const setServiceContext = (serviceName) => (req, res, next) => {
    req.context = { serviceName };
    next();
};

// Create a proxy for each service using the common options
app.use('/api/users', setServiceContext('users'), createProxyMiddleware({ target: serviceTargets.users, ...proxyOptions }));
app.use('/api/templates', setServiceContext('templates'), createProxyMiddleware({ target: serviceTargets.templates, ...proxyOptions }));
app.use('/api/onboarding', setServiceContext('onboarding'), createProxyMiddleware({ target: serviceTargets.onboarding, ...proxyOptions }));
app.use('/api/analytics', setServiceContext('analytics'), createProxyMiddleware({ target: serviceTargets.analytics, ...proxyOptions }));
app.use('/api/audit', setServiceContext('analytics'), createProxyMiddleware({ target: serviceTargets.analytics, ...proxyOptions }));
app.use('/api/jira', setServiceContext('jira'), createProxyMiddleware({ target: serviceTargets.jira, ...proxyOptions }));
app.use('/api/notifications', setServiceContext('notifications'), createProxyMiddleware({ target: serviceTargets.notifications, ...proxyOptions }));
app.use('/api/kpis', setServiceContext('kpis'), createProxyMiddleware({ target: serviceTargets.kpis, ...proxyOptions }));

app.listen(PORT, () => {
    logger.info(`🚀 API Gateway running on http://localhost:${PORT}`);
});