import prisma from '../../../database/client.js';

export const createOnboardingInstance = async (userId, templateId, assignedBy, client = prisma) => {
    // This function will now be called within a transaction in the service layer
    const instance = await client.onboardingInstance.create({
        data: {
            user_id: userId,
            onboarding_template_id: templateId,
            assigned_by: assignedBy,
        },
    });

    const template = await client.onboardingTemplate.findUnique({
        where: { id: templateId },
        include: {
            tasks: {
                include: {
                    taskTemplate: {
                        include: {
                            dependencies: true,
                        },
                    },
                },
            },
        },
    });

    if (!template) {
        throw new Error('Onboarding template not found');
    }

    for (const templateTask of template.tasks) {
        const hasDependencies = templateTask.taskTemplate.dependencies.length > 0;
        const status = hasDependencies ? 'blocked' : 'not_started';
        await client.taskInstance.create({
            data: {
                onboarding_instance_id: instance.id,
                task_template_id: templateTask.task_template_id,
                status: status,
            },
        });
    }

    return instance;
};


export const findActiveOnboardingByUserId = async (userId) => {
    const instance = await prisma.onboardingInstance.findFirst({
        where: {
            user_id: userId,
            status: { in: ['in_progress', 'not_started'] },
        },
        include: {
            onboardingTemplate: {
                select: { name: true },
            },
            taskInstances: {
                include: {
                    taskTemplate: {
                        include: {
                            dependencies: true,
                        },
                    },
                },
                orderBy: {
                    id: 'asc'
                }
            },
        },
        orderBy: {
            created_at: 'desc',
        },
    });

    if (!instance) return null;

    // Format the data to match the expected structure from the old queries
    return {
        ...instance,
        template_name: instance.onboardingTemplate.name,
        tasks: instance.taskInstances.map(ti => ({
            ...ti,
            ...ti.taskTemplate,
            dependencies: ti.taskTemplate.dependencies.map(d => d.depends_on_id)
        }))
    };
};

export const findAllOnboardingInstances = async () => {
    const instances = await prisma.onboardingInstance.findMany({
        include: {
            user: { select: { name: true } },
            assigner: { select: { name: true } },
            onboardingTemplate: { select: { name: true } },
        },
        orderBy: {
            created_at: 'desc',
        },
    });

    // Map to the legacy structure the frontend expects
    return instances.map(inst => ({
        id: inst.id,
        status: inst.status,
        created_at: inst.created_at,
        user_name: inst.user.name,
        admin_name: inst.assigner.name,
        template_name: inst.onboardingTemplate.name,
    }));
};

export const findOnboardingInstanceById = async (id) => {
    const instance = await prisma.onboardingInstance.findUnique({
        where: { id },
        include: {
            user: { select: { name: true } },
            assigner: { select: { name: true } },
            taskInstances: {
                include: {
                    taskTemplate: {
                        include: {
                            dependencies: true,
                        },
                    },
                },
                 orderBy: {
                    id: 'asc'
                }
            },
        },
    });

    if (!instance) return null;

    return {
        ...instance,
        user_name: instance.user.name,
        admin_name: instance.assigner.name,
        tasks: instance.taskInstances.map(ti => ({
            ...ti,
            ...ti.taskTemplate,
            dependencies: ti.taskTemplate.dependencies.map(d => d.depends_on_id)
        }))
    };
};

export const findTaskInstanceById = async (id, client = prisma) => {
    return await client.taskInstance.findUnique({
        where: { id },
        include: {
            taskTemplate: true,
            onboardingInstance: {
                select: { user_id: true }
            }
        },
    });
};

export const findTasksByUserId = async (userId) => {
    const instances = await prisma.onboardingInstance.findMany({
        where: {
            user_id: userId,
            status: { not: 'completed' },
        },
        include: {
            taskInstances: {
                include: {
                    taskTemplate: {
                        include: {
                            dependencies: true,
                        },
                    },
                },
            },
        },
    });

    // Flatten tasks from all instances
    const allTasks = instances.flatMap(instance => instance.taskInstances);
    return allTasks.map(ti => ({
        ...ti,
        ...ti.taskTemplate,
        dependencies: ti.taskTemplate.dependencies.map(d => d.depends_on_id)
    }));
};

export const updateTaskInstance = async (taskId, fields, client = prisma) => {
    return await client.taskInstance.update({
        where: { id: taskId },
        data: fields,
    });
};

export const findDependentTaskInstances = async (onboardingInstanceId, dependsOnId, client = prisma) => {
     return await client.taskInstance.findMany({
        where: {
            onboarding_instance_id: onboardingInstanceId,
            taskTemplate: {
                dependencies: {
                    some: {
                        depends_on_id: dependsOnId
                    }
                }
            }
        }
    });
};

export const checkAllDependenciesComplete = async (onboardingInstanceId, taskTemplateId, client = prisma) => {
    const incompleteDependencies = await client.taskInstance.count({
        where: {
            onboarding_instance_id: onboardingInstanceId,
            status: { not: 'completed' },
            taskTemplate: {
                dependencyFor: {
                    some: {
                        task_template_id: taskTemplateId,
                    },
                },
            },
        },
    });
    return incompleteDependencies === 0;
};

export const updateOnboardingInstance = async (id, { status }) => {
    return await prisma.onboardingInstance.update({
        where: { id },
        data: { status },
    });
};

export const deleteOnboardingInstance = async (id) => {
    // Prisma's onDelete: Cascade handles deleting related task instances
    return await prisma.onboardingInstance.delete({
        where: { id },
    });
};

export const findCommentsByTaskId = async (taskId) => {
    return await prisma.taskComment.findMany({
        where: { task_instance_id: taskId },
        include: {
            user: {
                select: { name: true },
            },
        },
        orderBy: {
            created_at: 'asc',
        },
    });
};

export const createComment = async (taskId, userId, commentText) => {
    return await prisma.taskComment.create({
        data: {
            task_instance_id: taskId,
            user_id: userId,
            comment_text: commentText,
        },
    });
};

export const updateComment = async (commentId, userId, commentText) => {
    return await prisma.taskComment.updateMany({
        where: {
            id: commentId,
            user_id: userId,
        },
        data: {
            comment_text: commentText,
        },
    });
};

export const deleteComment = async (commentId, userId) => {
    const { count } = await prisma.taskComment.deleteMany({
        where: {
            id: commentId,
            user_id: userId,
        },
    });
    return count;
};