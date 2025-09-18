import axios from 'axios';
import logger from '@production-support-portal/logger';

const jiraInstances = JSON.parse(process.env.JIRA_INSTANCES || '[]');
const instanceMap = new Map(jiraInstances.map(inst => [inst.id, inst]));

export const getJiraClient = (instanceId) => {
    const instance = instanceMap.get(instanceId);

    if (!instance) {
        logger.error({ instanceId }, 'Jira instance configuration not found.');
        throw new Error(`Jira instance with id "${instanceId}" not found in configuration.`);
    }

    const headers = { 'Content-Type': 'application/json' };

    if (instance.authMethod === 'token') {
        const buffer = Buffer.from(`${instance.email}:${instance.token}`);
        headers['Authorization'] = `Basic ${buffer.toString('base64')}`;
    } else if (instance.authMethod === 'cookie') {
        headers['Cookie'] = `${instance.cookie_name}=${instance.cookie_value}`;
    } else {
        logger.error({ instanceId, authMethod: instance.authMethod }, 'Invalid authentication method specified.');
        throw new Error(`Invalid authentication method for Jira instance "${instanceId}".`);
    }

    return axios.create({
        baseURL: `https://${instance.host}/rest/api/3`,
        headers,
    });
};