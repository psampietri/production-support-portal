const express = require('express');
const cors = require('cors');
const proxy = require('express-http-proxy');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

app.use(cors());
app.use(express.json());

// --- Service URLs ---
const ONBOARDING_SERVICE_URL = 'http://localhost:3003'; // Assuming this is the main service for onboarding
const KPIS_SERVICE_URL = 'http://localhost:7001';
const VULNERABILITY_SERVICE_URL = 'http://localhost:5001';
// Add other onboarding microservice URLs as needed
const USER_SERVICE_URL = 'http://localhost:3001';
const TEMPLATE_SERVICE_URL = 'http://localhost:3002';
const ANALYTICS_SERVICE_URL = 'http://localhost:3004';
const INTEGRATION_SERVICE_URL = 'http://localhost:3005';
const NOTIFICATION_SERVICE_URL = 'http://localhost:3006';

// Health check for the gateway
app.get('/api', (req, res) => {
    res.send('Production Support Portal Gateway is running');
});

// --- Proxy Middleware Setup ---

// KPI Dashboard Routes
app.use('/api/kpis', createProxyMiddleware({
    target: KPIS_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: {
        '^/api/kpis': '/api',
    },
}));

// Vulnerability Dashboard Routes
app.use('/api/vulnerabilities', createProxyMiddleware({
    target: VULNERABILITY_SERVICE_URL,
    changeOrigin: true,
}));

// Onboarding Tool Routes
app.use('/api/users', proxy(USER_SERVICE_URL));
app.use('/api/templates', proxy(TEMPLATE_SERVICE_URL));
app.use('/api/onboarding', proxy(ONBOARDING_SERVICE_URL));
app.use('/api/analytics', proxy(ANALYTICS_SERVICE_URL));
app.use('/api/integrations', proxy(INTEGRATION_SERVICE_URL));
app.use('/api/notifications', proxy(NOTIFICATION_SERVICE_URL));


// --- Start Server ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 API Gateway started on http://localhost:${PORT}`);
});