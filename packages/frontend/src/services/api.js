import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
});

// Request interceptor to add the auth token to headers
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Response interceptor to handle auth errors globally
api.interceptors.response.use(
    (response) => response, // Directly return successful responses
    (error) => {
        // Check if the error is for an unauthorized (forbidden) request
        if (error.response && error.response.status === 403) {
            // Clear user session data from local storage
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            
            // Redirect to the login page to re-authenticate
            // Using window.location.href ensures a full page reload, clearing any component state.
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }
        
        // Return the error so that individual component catch blocks can still handle other types of errors if needed
        return Promise.reject(error);
    }
);

export default api;
