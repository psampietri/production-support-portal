import express from 'express';
import cors from 'cors';
import proxy from 'express-http-proxy';
import dotenv from 'dotenv';
import { createProxyMiddleware } from 'http-proxy-middleware';

const app = express();

dotenv.config();

app.use(cors());
app.use(express.json());

// Health check for the gateway
app.get('/api', (req, res) => {
    res.send('Production Support Portal Gateway is running');
});

// --- Proxy Middleware Setup ---

// KPI Dashboard Routes
app.use('/api/kpis', createProxyMiddleware({
    target: process.env.KPI_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: {
        '^/api/kpis': '',
    },
}));

// Vulnerability Dashboard Routes
app.use('/api/vulnerabilities', createProxyMiddleware({
    target: process.env.VULNERABILITY_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: {
        '^/api/vulnerabilities': '',
    },
}));

// Onboarding Tool Routes
app.use('/api/users', proxy(process.env.USER_SERVICE_URL));
app.use('/api/templates', proxy(process.env.TEMPLATE_SERVICE_URL));
app.use('/api/onboarding', proxy(process.env.ONBOARDING_SERVICE_URL));
app.use('/api/analytics', proxy(process.env.ANALYTICS_SERVICE_URL));
app.use('/api/integrations', proxy(process.env.INTEGRATION_SERVICE_URL));
app.use('/api/notifications', proxy(process.env.NOTIFICATION_SERVICE_URL));


// --- Start Server ---
const PORT = process.env.GATEWAY_PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 API Gateway started on http://localhost:${PORT}`);
});