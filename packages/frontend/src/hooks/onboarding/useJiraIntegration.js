import { useState, useEffect, useCallback } from 'react';
import { getServiceDesks, getRequestTypes, getRequestTypeFields } from '../../services/onboarding/integrationService';
import { getUserFields as fetchUserFields } from '../../services/onboarding/userService';

const useJiraIntegration = (taskType, serviceDeskId, requestTypeId) => {
    const [serviceDesks, setServiceDesks] = useState([]);
    const [requestTypes, setRequestTypes] = useState([]);
    const [jiraFields, setJiraFields] = useState([]);
    const [userFields, setUserFields] = useState([]);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const fields = await fetchUserFields();
                setUserFields(fields);
                if (taskType === 'automated_access_request') {
                    const desks = await getServiceDesks('jira', 'MSI');
                    setServiceDesks(desks.values);
                }
            } catch (err) {
                setError('Failed to fetch initial Jira data.');
            }
        };
        fetchInitialData();
    }, [taskType]);

    useEffect(() => {
        if (serviceDeskId) {
            const fetchRequestTypes = async () => {
                try {
                    const types = await getRequestTypes('jira', 'MSI', serviceDeskId);
                    setRequestTypes(types.values);
                } catch (err) {
                    setError('Failed to fetch request types.');
                }
            };
            fetchRequestTypes();
        }
    }, [serviceDeskId]);

    useEffect(() => {
        if (requestTypeId) {
            const fetchFields = async () => {
                try {
                    const fieldsData = await getRequestTypeFields('jira', 'MSI', serviceDeskId, requestTypeId);
                    setJiraFields(fieldsData.requestTypeFields);
                } catch (err) {
                    setError('Failed to fetch request type fields.');
                }
            };
            fetchFields();
        }
    }, [requestTypeId, serviceDeskId]);

    return { serviceDesks, requestTypes, jiraFields, userFields, error };
};

export default useJiraIntegration;