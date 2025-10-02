import * as AnalyticsModel from '../models/analyticsModel.js';
import { subDays, format } from 'date-fns';
import logger from '@production-support-portal/logger';

const formatLeadTime = (totalSeconds) => {
    if (totalSeconds === null || totalSeconds === undefined) return 'N/A';
    const days = Math.floor(totalSeconds / (3600 * 24));
    const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
    return `${days}d ${hours}h`;
};

export const getKpis = async () => {
    logger.info('getKpis called.');
    try {
        const [
            activeOnboardings,
            completedOnboardings,
            totalUsers,
            rawTaskLeadTime,
            rawTicketLeadTime,
            rawAverageCompletionTime,
        ] = await Promise.all([
            AnalyticsModel.countOnboardingInstancesByStatus('in_progress'),
            AnalyticsModel.countOnboardingInstancesByStatus('completed'),
            AnalyticsModel.countTotalUsers(),
            AnalyticsModel.getAverageTaskLeadTime(),
            AnalyticsModel.getAverageTicketLeadTime(),
            AnalyticsModel.getAverageCompletionTime(),
        ]);
        logger.info('All KPI queries completed.');

        const totalOnboardings = activeOnboardings + completedOnboardings;
        const completionRate = totalOnboardings > 0
            ? Math.round((completedOnboardings / totalOnboardings) * 100)
            : 0;

        const kpis = {
            activeOnboardings,
            totalUsers,
            averageCompletionTime: formatLeadTime(rawAverageCompletionTime),
            completionRate,
            taskLeadTime: formatLeadTime(rawTaskLeadTime),
            ticketLeadTime: formatLeadTime(rawTicketLeadTime),
        };
        logger.info({ kpis }, 'KPIs calculated.');
        return kpis;
    } catch (error) {
        logger.error({ err: error }, 'FATAL ERROR in getKpis:');
        throw error;
    }
};

export const getChartData = async () => {
    logger.info('Fetching chart data.');
    const [statusDistributionRes, taskTypeDistributionRes, completionTrend] = await Promise.all([
        AnalyticsModel.getStatusDistribution(),
        AnalyticsModel.getTaskTypeDistribution(),
        AnalyticsModel.getCompletionTrend(),
    ]);

    const statusDistribution = statusDistributionRes.map(item => ({
        name: item.status,
        value: item._count.status,
    }));

    // FIX: Update mapping for the new query result structure
    const taskTypeDistribution = taskTypeDistributionRes.map(item => ({
        name: item.task_type,
        value: item._count._all,
    }));

    logger.info('Chart data processed successfully.');

    return {
        statusDistribution,
        taskTypeDistribution,
        completionTrend,
    };
};