import prisma from '../../../database/client.js';

// --- Onboarding Templates ---

export const createOnboardingTemplate = async ({ name, description, created_by, tasks }, client = prisma) => {
    const newTemplate = await client.onboardingTemplate.create({
        data: {
            name,
            description,
            created_by,
        },
    });

    if (tasks && tasks.length > 0) {
        await client.onboardingTemplateTask.createMany({
            data: tasks.map(task => ({
                onboarding_template_id: newTemplate.id,
                task_template_id: task.id,
                order: task.order,
            })),
        });
    }

    return newTemplate;
};

export const findAllOnboardingTemplates = async () => {
    return await prisma.onboardingTemplate.findMany({
        orderBy: { name: 'asc' },
    });
};

export const findOnboardingTemplateById = async (id) => {
    const template = await prisma.onboardingTemplate.findUnique({
        where: { id },
        include: {
            tasks: {
                orderBy: { order: 'asc' },
            },
        },
    });

    if (!template) return null;

    // Format tasks to match the previous structure (an array of task_template_id)
    return {
        ...template,
        tasks: template.tasks.map(t => t.task_template_id),
    };
};

export const updateOnboardingTemplate = async (id, { name, description, tasks }, client = prisma) => {
    const updatedTemplate = await client.onboardingTemplate.update({
        where: { id },
        data: { name, description },
    });

    // Delete existing task associations and create new ones
    await client.onboardingTemplateTask.deleteMany({
        where: { onboarding_template_id: id },
    });

    if (tasks && tasks.length > 0) {
        await client.onboardingTemplateTask.createMany({
            data: tasks.map(task => ({
                onboarding_template_id: updatedTemplate.id,
                task_template_id: task.id,
                order: task.order,
            })),
        });
    }

    return updatedTemplate;
};

export const deleteOnboardingTemplate = async (id) => {
    // Relational integrity (onDelete: Cascade) should handle deleting OnboardingTemplateTask entries
    return await prisma.onboardingTemplate.delete({
        where: { id },
    });
};

export const duplicateOnboardingTemplate = async (templateId, createdBy, client = prisma) => {
    const originalTemplate = await client.onboardingTemplate.findUnique({
        where: { id: templateId },
        include: { tasks: true },
    });

    if (!originalTemplate) {
        throw new Error('Template not found');
    }

    const newName = `Copy of ${originalTemplate.name}`;
    return await client.onboardingTemplate.create({
        data: {
            name: newName,
            description: originalTemplate.description,
            created_by: createdBy,
            tasks: {
                create: originalTemplate.tasks.map(task => ({
                    task_template_id: task.task_template_id,
                    order: task.order,
                })),
            },
        },
    });
};

// --- Task Templates ---

export const createTaskTemplate = async ({ name, description, instructions, task_type, config, created_by, dependencies }, client = prisma) => {
    return await client.taskTemplate.create({
        data: {
            name,
            description,
            instructions,
            task_type,
            config,
            created_by,
            dependencies: dependencies && dependencies.length > 0 ? {
                create: dependencies.map(depId => ({
                    depends_on_id: depId,
                })),
            } : undefined,
        },
    });
};

export const findAllTaskTemplates = async () => {
    const templates = await prisma.taskTemplate.findMany({
        include: {
            dependencies: true,
        },
        orderBy: { name: 'asc' },
    });

    // Map to the legacy structure
    return templates.map(t => ({
        ...t,
        dependencies: t.dependencies.map(d => d.depends_on_id),
    }));
};

export const findTaskTemplateById = async (id) => {
    return await prisma.taskTemplate.findUnique({
        where: { id },
    });
};

export const updateTaskTemplate = async (id, { name, description, instructions, task_type, config, dependencies }, client = prisma) => {
    // Delete old dependencies
    await client.taskTemplateDependency.deleteMany({
        where: { task_template_id: id },
    });

    // Update template and create new dependencies
    return await client.taskTemplate.update({
        where: { id },
        data: {
            name,
            description,
            instructions,
            task_type,
            config,
            dependencies: dependencies && dependencies.length > 0 ? {
                create: dependencies.map(depId => ({
                    depends_on_id: depId,
                })),
            } : undefined,
        },
    });
};

export const deleteTaskTemplate = async (id) => {
    const { count } = await prisma.taskTemplate.deleteMany({
        where: { id },
    });
    return count;
};

export const duplicateTaskTemplate = async (templateId, createdBy, client = prisma) => {
    const originalTemplate = await client.taskTemplate.findUnique({
        where: { id: templateId },
        include: { dependencies: true },
    });

    if (!originalTemplate) {
        throw new Error('Template not found');
    }

    const newName = `Copy of ${originalTemplate.name}`;

    return await client.taskTemplate.create({
        data: {
            name: newName,
            description: originalTemplate.description,
            instructions: originalTemplate.instructions,
            task_type: originalTemplate.task_type,
            config: originalTemplate.config,
            created_by: createdBy,
            dependencies: originalTemplate.dependencies.length > 0 ? {
                create: originalTemplate.dependencies.map(dep => ({
                    depends_on_id: dep.depends_on_id,
                })),
            } : undefined,
        },
    });
};