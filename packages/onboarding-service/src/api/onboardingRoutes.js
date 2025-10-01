import { Router } from 'express';
import * as OnboardingService from '../services/onboardingService.js';

const router = Router();

// --- Onboarding Instances ---
router.post('/instances', async (req, res) => {
    try {
        const newInstance = await OnboardingService.createOnboardingInstance(req.body);
        res.status(201).json(newInstance);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.get('/instances', async (req, res) => {
    const instances = await OnboardingService.getAllOnboardingInstances();
    res.json(instances);
});

router.get('/instances/:id', async (req, res) => {
    const instance = await OnboardingService.getOnboardingInstanceById(req.params.id);
    if (!instance) {
        return res.status(404).json({ error: 'Onboarding instance not found.' });
    }
    res.json(instance);
});

router.put('/instances/:id', async (req, res) => {
    try {
        const updatedInstance = await OnboardingService.updateOnboardingInstance(req.params.id, req.body);
        if (!updatedInstance) {
            return res.status(404).json({ error: 'Onboarding instance not found.' });
        }
        res.json(updatedInstance);
    } catch (error) {
        console.error('Error updating onboarding instance:', error);
        res.status(400).json({ error: error.message });
    }
});

router.delete('/instances/:id', async (req, res) => {
    try {
        await OnboardingService.deleteOnboardingInstance(req.params.id);
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting onboarding instance:', error);
        res.status(500).json({ error: 'Failed to delete onboarding instance.' });
    }
});


// --- Task Instances ---

router.get('/users/:userId/tasks', async (req, res) => {
    try {
        const tasks = await OnboardingService.getTasksByUserId(req.params.userId);
        res.json(tasks);
    } catch (error) {
        console.error("Error fetching user tasks:", error);
        res.status(500).json({ error: 'Failed to retrieve user tasks.' });
    }
});

// --- Comment routes placed before generic /tasks/:id route ---
router.put('/tasks/comments/:commentId', async (req, res) => {
    try {
        const { userId, commentText } = req.body;
        const updatedComment = await OnboardingService.updateComment(req.params.commentId, userId, commentText);
        if (!updatedComment) {
            return res.status(404).json({ error: 'Comment not found or user not authorized.' });
        }
        res.json(updatedComment);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.delete('/tasks/comments/:commentId', async (req, res) => {
    try {
        const { userId } = req.body;
        const deletedCount = await OnboardingService.deleteComment(req.params.commentId, userId);
        if (deletedCount === 0) {
            return res.status(404).json({ error: 'Comment not found or user not authorized.' });
        }
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete comment.' });
    }
});

router.get('/tasks/:id/comments', async (req, res) => {
    try {
        const comments = await OnboardingService.getCommentsForTask(req.params.id);
        res.json(comments);
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve comments.' });
    }
});

router.post('/tasks/:id/comments', async (req, res) => {
    try {
        const { userId, commentText } = req.body;
        const newComment = await OnboardingService.addCommentToTask(req.params.id, userId, commentText);
        res.status(201).json(newComment);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.put('/tasks/:id', async (req, res) => {
    try {
        // The entire body, which includes { status, ticketInfo }, is now passed.
        const updatedTask = await OnboardingService.updateTaskStatus(req.params.id, req.body);
        res.json(updatedTask);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.post('/tasks/:id/execute', async (req, res) => {
    try {
        const result = await OnboardingService.executeAutomatedTask(req.params.id);
        res.json(result);
    } catch (error) {
        console.error("Execution Error:", error);
        res.status(400).json({ error: error.message });
    }
});

router.post('/tasks/:id/dry-run', async (req, res) => {
    try {
        const result = await OnboardingService.dryRunAutomatedTask(req.params.id);
        res.json(result);
    } catch (error) {
        console.error("Dry Run Error:", error);
        res.status(400).json({ error: error.message });
    }
});

router.post('/tasks/:id/associate', async (req, res) => {
    try {
        const { issue_key } = req.body;
        const result = await OnboardingService.associateTicket(req.params.id, issue_key);
        res.json(result);
    } catch (error) {
        console.error("Association Error:", error);
        res.status(400).json({ error: error.message });
    }
});

router.post('/tasks/:id/unassign', async (req, res) => {
    try {
        const result = await OnboardingService.unassignTicket(req.params.id);
        res.json(result);
    } catch (error) {
        console.error("Unassign Error:", error);
        res.status(400).json({ error: error.message });
    }
});

router.post('/tasks/:id/manual-complete', async (req, res) => {
    try {
        const result = await OnboardingService.markAsComplete(req.params.id);
        res.json(result);
    } catch (error) {
        console.error("Manual Completion Error:", error);
        res.status(400).json({ error: error.message });
    }
});

router.post('/tasks/:id/bypass', async (req, res) => {
    try {
        const result = await OnboardingService.bypassDependency(req.params.id);
        res.json(result);
    } catch (error) {
        console.error("Bypass Error:", error);
        res.status(400).json({ error: error.message });
    }
});

router.get('/users/:userId/active-onboarding', async (req, res) => {
    try {
        const instance = await OnboardingService.getActiveOnboardingForUser(req.params.userId);
        if (!instance) {
            // It's not an error to not have an active onboarding, so return null or an empty object.
            return res.json(null);
        }
        res.json(instance);
    } catch (error) {
        console.error("Error fetching user's active onboarding:", error);
        res.status(500).json({ error: "Failed to retrieve active onboarding progress." });
    }
});

export default router;