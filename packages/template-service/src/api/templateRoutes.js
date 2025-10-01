import { Router } from 'express';
import * as TemplateService from '../services/templateService.js';

const router = Router();

// --- Onboarding Templates ---
router.post('/onboarding', async (req, res) => {
    try {
        const newTemplate = await TemplateService.createOnboardingTemplate(req.body);
        res.status(201).json(newTemplate);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.post('/onboarding/:id/duplicate', async (req, res) => {
    try {
        const { created_by } = req.body;
        const duplicatedTemplate = await TemplateService.duplicateOnboardingTemplate(req.params.id, created_by);
        res.status(201).json(duplicatedTemplate);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.get('/onboarding', async (req, res) => {
    const templates = await TemplateService.getAllOnboardingTemplates();
    res.json(templates);
});

router.get('/onboarding/:id', async (req, res) => {
    const template = await TemplateService.getOnboardingTemplateById(req.params.id);
    if (!template) return res.status(404).json({ error: 'Template not found.' });
    res.json(template);
});

router.put('/onboarding/:id', async (req, res) => {
    try {
        const updatedTemplate = await TemplateService.updateOnboardingTemplate(req.params.id, req.body);
        res.json(updatedTemplate);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.delete('/onboarding/:id', async (req, res) => {
    try {
        await TemplateService.deleteOnboardingTemplate(req.params.id);
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete template.' });
    }
});


// --- Task Templates ---
router.post('/tasks', async (req, res) => {
    try {
        const newTemplate = await TemplateService.createTaskTemplate(req.body);
        res.status(201).json(newTemplate);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.post('/tasks/:id/duplicate', async (req, res) => {
    try {
        const { created_by } = req.body;
        const duplicatedTemplate = await TemplateService.duplicateTaskTemplate(req.params.id, created_by);
        res.status(201).json(duplicatedTemplate);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.get('/tasks', async (req, res) => {
    const templates = await TemplateService.getAllTaskTemplates();
    res.json(templates);
});

router.get('/tasks/:id', async (req, res) => {
    const template = await TemplateService.getTaskTemplateById(req.params.id);
    if (!template) return res.status(404).json({ error: 'Template not found.' });
    res.json(template);
});

router.put('/tasks/:id', async (req, res) => {
    try {
        const updatedTemplate = await TemplateService.updateTaskTemplate(req.params.id, req.body);
        res.json(updatedTemplate);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.delete('/tasks/:id', async (req, res) => {
    try {
        const deletedCount = await TemplateService.deleteTaskTemplate(req.params.id);
        if (deletedCount === 0) {
            return res.status(404).json({ error: 'Task template not found.' });
        }
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting task template:', error);
        res.status(500).json({ error: 'Failed to delete template.', details: error.message });
    }
});

export default router;