import * as TemplateModel from '../models/templateModel.js';
import * as OnboardingService from '../../../onboarding-service/src/services/onboardingService.js';
import prisma from '../../../database/client.js';

export const createOnboardingTemplate = async (templateData) => {
    return await prisma.$transaction(async (tx) => {
        return await TemplateModel.createOnboardingTemplate(templateData, tx);
    });
};

export const getAllOnboardingTemplates = async () => {
    return await TemplateModel.findAllOnboardingTemplates();
};

export const getOnboardingTemplateById = async (id) => {
    return await TemplateModel.findOnboardingTemplateById(parseInt(id, 10));
};

export const deleteOnboardingTemplate = async (id) => {
    return await TemplateModel.deleteOnboardingTemplate(parseInt(id, 10));
};

export const duplicateOnboardingTemplate = async (templateId, createdBy) => {
    return await prisma.$transaction(async (tx) => {
        return await TemplateModel.duplicateOnboardingTemplate(parseInt(templateId, 10), createdBy, tx);
    });
};

export const createTaskTemplate = async (templateData) => {
    return await prisma.$transaction(async (tx) => {
        return await TemplateModel.createTaskTemplate(templateData, tx);
    });
};

export const getAllTaskTemplates = async () => {
    return await TemplateModel.findAllTaskTemplates();
};

export const getTaskTemplateById = async (id) => {
    return await TemplateModel.getTaskTemplateById(parseInt(id, 10));
};

export const updateTaskTemplate = async (id, templateData) => {
    return await prisma.$transaction(async (tx) => {
        return await TemplateModel.updateTaskTemplate(parseInt(id, 10), templateData, tx);
    });
};

export const deleteTaskTemplate = async (id) => {
    return await TemplateModel.deleteTaskTemplate(parseInt(id, 10));
};

export const duplicateTaskTemplate = async (templateId, createdBy) => {
     return await prisma.$transaction(async (tx) => {
        return await TemplateModel.duplicateTaskTemplate(parseInt(templateId, 10), createdBy, tx);
    });
};

export const updateOnboardingTemplate = async (id, templateData) => {
    const updatedTemplate = await prisma.$transaction(async (tx) => {
        return await TemplateModel.updateOnboardingTemplate(parseInt(id, 10), templateData, tx);
    });
    
    // This call should itself be transactional
    await OnboardingService.syncTemplateChangesToInstances(parseInt(id, 10), templateData.tasks);
    
    return updatedTemplate;
};