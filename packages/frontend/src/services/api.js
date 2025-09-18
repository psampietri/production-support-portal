import axios from 'axios';

// The API Gateway's URL
const API_BASE_URL = 'http://localhost:4000';

const api = axios.create({
  baseURL: API_BASE_URL,
});

export default api;