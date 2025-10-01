import axios from 'axios';
import logger from '@production-support-portal/logger';

// In-memory cache for Jira field schemas to avoid repeated API calls.
const schemaCache = new Map();

/**
 * Creates the appropriate authorization headers based on the instance config.
 * @param {object} instance - The Jira instance configuration.
 * @returns {object} The headers object for Axios.
 */
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
        }),
        //
        serviceDesk: axios.create({ 
            baseURL: `https://${instance.host}/rest/servicedeskapi`, 
            headers: headers 
        })
    };

    clientMap.set(instanceId, clients);
    return clients;
}

/**
 * A robust, centralized function for making all Jira API calls.
 * @param {object} client - The pre-configured Axios client to use.
 * @param {string} endpoint - The API endpoint to call.
 * @param {string} [method='GET'] - The HTTP method.
 * @param {object|null} [payload=null] - The request payload.
 * @returns {Promise<any>} The JSON response from the API.
 */
export const callJiraApi = async (client, endpoint, method = 'GET', payload = null, params = null) => {
    try {
        const options = { method, url: endpoint };
        if (payload) options.data = payload;
        if (params) options.params = params;

        const response = await client(options);
        return response.status === 204 ? { success: true } : response.data;
    } catch (error) {
        const errorDetails = {
            status: error.response?.status,
            data: error.response?.data,
            endpoint
        };
        logger.error({ err: errorDetails }, 'Jira API Error');
        // Re-throw a structured error
        throw {
            message: 'Jira API request failed.',
            ...errorDetails
        };
    }
};

/**
 * Fetches the field schema for a given request type, using a cache to improve performance.
 * @param {object} serviceDeskClient - The Axios client for the Service Desk API.
 * @param {string} serviceDeskId - The ID of the service desk.
 * @param {string} requestTypeId - The ID of the request type.
 * @returns {Promise<Map<string, object>>} A map of field IDs to their schemas.
 */
const getRequestTypeSchema = async (serviceDeskClient, serviceDeskId, requestTypeId) => {
    const cacheKey = `${serviceDeskId}-${requestTypeId}`;
    if (schemaCache.has(cacheKey)) {
        logger.info({ cacheKey }, 'Jira schema cache hit.');
        return schemaCache.get(cacheKey);
    }
    logger.info({ cacheKey }, 'Jira schema cache miss. Fetching from API.');

    const response = await callJiraApi(serviceDeskClient, `/servicedesk/${serviceDeskId}/requesttype/${requestTypeId}/field`);
    const fieldSchemas = new Map(response.requestTypeFields.map(field => [field.fieldId, field.jiraSchema]));
    
    schemaCache.set(cacheKey, fieldSchemas);
    return fieldSchemas;
};

/**
 * Formats the payload for creating a Jira ticket by using the dynamically fetched field schema.
 * @param {object} serviceDeskClient - The Axios client for the Service Desk API.
 * @param {string} serviceDeskId - The ID of the service desk.
 * @param {string} requestTypeId - The ID of the request type.
 * @param {object} fieldMappings - The field mappings from the template.
 * @param {object} user - The user data.
 * @returns {Promise<object>} The formatted requestFieldValues for the Jira API.
 */
export const formatJiraPayload = async (serviceDeskClient, serviceDeskId, requestTypeId, fieldMappings, user) => {
    const fieldSchemas = await getRequestTypeSchema(serviceDeskClient, serviceDeskId, requestTypeId);
    const requestFieldValues = {};
    const isNumeric = (val) => val !== null && !isNaN(parseFloat(val)) && isFinite(String(val));

    for (const [fieldId, mapping] of Object.entries(fieldMappings)) {
        const rawValue = mapping.type === 'dynamic' ? user[mapping.value] : mapping.value;
        if (rawValue === undefined || rawValue === null) continue;

        const schema = fieldSchemas.get(fieldId);
        if (schema) {
            const { type, items } = schema;
            if (type === 'array') {
                const values = Array.isArray(rawValue) ? rawValue : [rawValue];
                if (items === 'user') requestFieldValues[fieldId] = values.map(v => ({ name: v }));
                else if (items === 'option') requestFieldValues[fieldId] = values.map(v => (isNumeric(v) ? { id: String(v) } : { value: String(v) }));
                else requestFieldValues[fieldId] = values;
            } else if (type === 'option') {
                requestFieldValues[fieldId] = isNumeric(rawValue) ? { id: String(rawValue) } : { value: String(rawValue) };
            } else if (type === 'user') {
                requestFieldValues[fieldId] = { name: rawValue };
            } else {
                requestFieldValues[fieldId] = rawValue;
            }
        } else {
            requestFieldValues[fieldId] = rawValue;
        }
    }
    return requestFieldValues;
};