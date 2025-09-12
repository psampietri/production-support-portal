import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { prisma } from 'database-service';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.NOTIFICATION_SERVICE_PORT || 3006;

// --- API Endpoints ---

// Get notifications for a user
app.get('/api/notifications/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const notifications = await prisma.notification.findMany({
            where: { userId: parseInt(userId) },
            orderBy: { createdAt: 'desc' },
        });
        res.json(notifications);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch notifications.' });
    }
});

// Mark a notification as read
app.put('/api/notifications/:notificationId/read', async (req, res) => {
    try {
        const { notificationId } = req.params;
        await prisma.notification.update({
            where: { id: parseInt(notificationId) },
            data: { isRead: true },
        });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Failed to update notification.' });
    }
});

// (Internal endpoint for other services to create notifications)
app.post('/api/notifications/create', async (req, res) => {
    try {
        const { userId, message } = req.body;
        const notification = await prisma.notification.create({
            data: {
                userId,
                message,
            },
        });
        res.status(201).json(notification);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create notification.' });
    }
});


app.listen(PORT, () => {
    console.log(`🚀 Notification Service running on http://localhost:${PORT}`);
});