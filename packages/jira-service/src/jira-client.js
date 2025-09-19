import axios from 'axios';
import logger from '@production-support-portal/logger';

// This function creates the appropriate headers based on the instance config
function getJiraHeaders(instance) {
    const headers = { 'Content-Type': 'application/json' };
    if (instance.authMethod === 'token') {
        const buffer = Buffer.from(`${instance.email}:${instance.token}`);
        headers['Authorization'] = `Basic ${buffer.toString('base64')}`;
    } else if (instance.authMethod === 'cookie') {
        headers['Cookie'] = `${instance.cookie_name}=${instance.cookie_value}`;
    } else {
        throw new Error(`Invalid authentication method for Jira instance "${instance.id}".`);
    }
    return headers;
}

// Store clients in a map so they are only created once
const clientMap = new Map();

/**
 * Gets a set of pre-configured Jira API clients for a specific instance.
 * This is the main function that will be used by the server.
 */
export function getJiraClients(instanceId) {
    if (clientMap.has(instanceId)) {
        return clientMap.get(instanceId);
    }

    const jiraInstances = JSON.parse(process.env.JIRA_INSTANCES || '[]');
    const instance = jiraInstances.find(inst => inst.id === instanceId);

    if (!instance) {
        logger.error({ instanceId }, 'Jira instance configuration not found.');
        throw new Error(`Jira instance with id "${instanceId}" not found in configuration.`);
    }

    const headers = getJiraHeaders(instance);

    const clients = {
        // Client for the main REST API v3
        api: axios.create({
            baseURL: `https://${instance.host}/rest/api/3`,
            headers: headers
        }),
        // Client for the modern Agile API
        agile: axios.create({
            baseURL: `https://${instance.host}/rest/agile/1.0`,
            headers: headers
        }),
        // Client for the legacy Greenhopper API (for sprint reports)
        greenhopper: axios.create({
            baseURL: `https://${instance.host}/rest/greenhopper/1.0`,
            headers: { 'Authorization': headers.Authorization, 'Cookie': headers.Cookie } // Only send auth headers
        })
    };

    clientMap.set(instanceId, clients);
    return clients;
}