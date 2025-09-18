import express from 'express';
import cors from 'cors';
import { createProxyMiddleware } from 'http-proxy-middleware';
import pinoHttp from 'pino-http';
import logger from '@production-support-portal/logger';

const app = express();
app.use(cors());
app.use(pinoHttp({ logger })); // Use pino-http for automated request logging

const PORT = process.env.API_GATEWAY_PORT;

const JIRA_SERVICE_URL = `http://localhost:${process.env.JIRA_SERVICE_PORT}`;
const KPI_SERVICE_URL = `http://localhost:${process.env.KPI_SERVICE_PORT}`;

// --- Proxy Middleware Setup ---

const createProxy = (path, target) => {
    return createProxyMiddleware({
        target,
        changeOrigin: true,
        pathRewrite: { [`^/api/${path}`]: '/api' },
        on: {
            proxyReq: (proxyReq, req, res) => {
                req.log.info({ service: path, target }, `Proxying request to ${path} service`);
            },
            error: (err, req, res) => {
                req.log.error({ err, service: path }, `Error proxying to ${path} service`);
            }
        }
    });
};

app.use('/api/jira', createProxy('jira', JIRA_SERVICE_URL));
app.use('/api/kpis', createProxy('kpis', KPI_SERVICE_URL));


app.listen(PORT, () => {
    logger.info(`🚀 API Gateway running on http://localhost:${PORT}`);
});