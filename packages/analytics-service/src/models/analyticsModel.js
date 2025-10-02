import prisma from '../../../database/client.js';

export const getAverageCompletionTime = async () => {
    const result = await prisma.$queryRaw`
        SELECT AVG(EXTRACT(EPOCH FROM (updated_at - created_at))) as avg_epoch
        FROM onboarding_instances
        WHERE status = 'completed'`;

    return result[0]?.avg_epoch || null;
};

export const countActiveOnboardings = async () => {
    return await prisma.onboardingInstance.count({
        where: { status: 'in_progress' },
    });
};

export const countTotalUsers = async () => {
    return await prisma.user.count();
};

export const getStatusDistribution = async () => {
    return await prisma.onboardingInstance.groupBy({
        by: ['status'],
        _count: {
            status: true,
        },
    });
};

export const getTaskTypeDistribution = async () => {
    // FIX: Corrected the groupBy query to be valid in Prisma
    return await prisma.taskTemplate.groupBy({
        by: ['task_type'],
        _count: {
            _all: true,
        },
    });
};

export const getCompletionTrend = async () => {
    return await prisma.$queryRaw`
        WITH date_series AS (
            SELECT generate_series(
                CURRENT_DATE - interval '13 days',
                CURRENT_DATE,
                '1 day'::interval
            )::date AS day
        )
        SELECT
            to_char(ds.day, 'Mon DD') as date,
            COALESCE(s.started_count, 0)::int AS started,
            COALESCE(c.completed_count, 0)::int AS completed
        FROM date_series ds
        LEFT JOIN (
            SELECT created_at::date AS day, COUNT(*) AS started_count
            FROM onboarding_instances
            WHERE created_at >= CURRENT_DATE - interval '13 days'
            GROUP BY day
        ) s ON ds.day = s.day
        LEFT JOIN (
            SELECT updated_at::date AS day, COUNT(*) AS completed_count
            FROM onboarding_instances
            WHERE status = 'completed' AND updated_at >= CURRENT_DATE - interval '13 days'
            GROUP BY day
        ) c ON ds.day = c.day
        ORDER BY ds.day;`;
};

export const getAverageTaskLeadTime = async () => {
    const result = await prisma.$queryRaw`
        SELECT AVG(EXTRACT(EPOCH FROM (task_completed_at - task_started_at))) as avg_epoch
        FROM task_instances
        WHERE status = 'completed' AND task_started_at IS NOT NULL AND task_completed_at IS NOT NULL`;

    return result[0]?.avg_epoch || null;
};

export const getAverageTicketLeadTime = async () => {
    const result = await prisma.$queryRaw`
        SELECT AVG(EXTRACT(EPOCH FROM (ticket_closed_at - ticket_created_at))) as avg_epoch
        FROM task_instances
        WHERE ticket_info IS NOT NULL AND ticket_created_at IS NOT NULL AND ticket_closed_at IS NOT NULL`;

    return result[0]?.avg_epoch || null;
};

export const countOnboardingInstancesByStatus = async (status) => {
    return await prisma.onboardingInstance.count({
        where: { status },
    });
};