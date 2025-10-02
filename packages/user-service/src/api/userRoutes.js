import { Router } from 'express';
// FIX: Import the correctly named functions
import { 
    getAllUsers, 
    getUserById, 
    updateUser, 
    deleteUser, 
    findUserCustomFields, 
    addUserCustomField, 
    deleteUserCustomField 
} from '../services/userService.js';

const router = Router();

// --- User Field Management ---

router.get('/fields', async (req, res) => {
    try {
        // FIX: Use the correct function name
        const fields = await findUserCustomFields();
        res.json(fields);
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve user fields.' });
    }
});

router.post('/fields', async (req, res) => {
    try {
        const { fieldName } = req.body;
        // FIX: Use the correct function name
        const newField = await addUserCustomField(fieldName);
        res.status(201).json(newField);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.delete('/fields/:fieldKey', async (req, res) => {
    try {
        const { fieldKey } = req.params;
        // FIX: Use the correct function name
        await deleteUserCustomField(fieldKey);
        res.status(200).json({ message: `Field '${fieldKey}' deleted successfully.` });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});


// --- User Management ---

router.get('/', async (req, res) => {
    try {
        const users = await getAllUsers();
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve users.' });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const user = await getUserById(req.params.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve user.' });
    }
});

router.put('/:id', async (req, res) => {
    try {
        const updatedUser = await updateUser(req.params.id, req.body);
        res.json(updatedUser);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const { newOwnerId } = req.body;
        if (!newOwnerId) {
            return res.status(400).json({ error: 'A new owner ID is required to reassign assets.' });
        }
        await deleteUser(req.params.id, newOwnerId);
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete user.' });
    }
});

export default router;