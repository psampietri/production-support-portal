import * as TemplateModel from '../models/templateModel.js';
import * as OnboardingService from '../../../onboarding-service/src/services/onboardingService.js';

export const createOnboardingTemplate = async (templateData) => {
    return await TemplateModel.createOnboardingTemplate(templateData);
};

export const getAllOnboardingTemplates = async () => {
    return await TemplateModel.findAllOnboardingTemplates();
};

export const getOnboardingTemplateById = async (id) => {
    return await TemplateModel.findOnboardingTemplateById(id);
};

export const deleteOnboardingTemplate = async (id) => {
    return await TemplateModel.deleteOnboardingTemplate(id);
};

export const duplicateOnboardingTemplate = async (templateId, createdBy) => {
    return await TemplateModel.duplicateOnboardingTemplate(templateId, createdBy);
};

export const createTaskTemplate = async (templateData) => {
    // The model function already handles dependencies, so we just pass the data through.
    return await TemplateModel.createTaskTemplate(templateData);
};

export const getAllTaskTemplates = async () => {
    return await TemplateModel.findAllTaskTemplates();
};

export const getTaskTemplateById = async (id) => {
    return await TemplateModel.findTaskTemplateById(id);
};

export const updateTaskTemplate = async (id, templateData) => {
    // The model function already handles dependencies, so we just pass the data through.
    return await TemplateModel.updateTaskTemplate(id, templateData);
};

export const deleteTaskTemplate = async (id) => {
    return await TemplateModel.deleteTaskTemplate(id);
};

export const duplicateTaskTemplate = async (templateId, createdBy) => {
    return await TemplateModel.duplicateTaskTemplate(templateId, createdBy);
};

export const updateOnboardingTemplate = async (id, templateData) => {
    const updatedTemplate = await TemplateModel.updateOnboardingTemplate(id, templateData);
    
    await OnboardingService.syncTemplateChangesToInstances(id, templateData.tasks);
    
    return updatedTemplate;
};