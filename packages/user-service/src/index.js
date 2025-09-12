import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from 'database-service';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.USER_SERVICE_PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-that-should-be-in-env';

// --- API Endpoints ---

// User Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await prisma.user.findUnique({ where: { username } });

        if (user && bcrypt.compareSync(password, user.password)) {
            const accessToken = jwt.sign({ userId: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '8h' });
            res.json({ accessToken, userId: user.id, role: user.role });
        } else {
            res.status(401).json({ message: 'Invalid username or password' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all users (protected route, example)
app.get('/api/users', async (req, res) => {
    // In a real app, you'd have middleware here to verify the JWT
    try {
        const users = await prisma.user.findMany({
            select: { id: true, username: true, email: true, role: true } // Exclude password hash
        });
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 User Service running on http://localhost:${PORT}`);
});