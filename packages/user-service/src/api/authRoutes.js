import { Router } from 'express';
import { registerUser, loginUser } from '../services/authService.js';

const router = Router();

router.post('/register', async (req, res) => {
    try {
        // Pass the entire request body to the registerUser service
        const newUser = await registerUser(req.body);
        res.status(201).json(newUser);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const { token, user } = await loginUser(email, password);
        res.json({ token, user });
    } catch (error) {
        res.status(401).json({ error: error.message });
    }
});

export default router;