import api from '../api'; // This path is correct now

export const login = async (email, password) => {
    // The path must match the gateway's proxy rules.
    // The gateway listens for /api/users and forwards the rest of the path to the user-service.
    const response = await api.post('/api/users/auth/login', { email, password });
    if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
};

export const register = async (userData) => {
    // Corrected path for registration as well
    const response = await api.post('/api/users/auth/register', userData);
    return response.data;
};

export const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
};