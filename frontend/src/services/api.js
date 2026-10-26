import axios from 'axios';
import toast from 'react-hot-toast';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api',
});

const getUserId = () => {
  if (typeof window === 'undefined') return null;

  let userId = localStorage.getItem('userId');
  if (!userId) {
    const randomPart = window.crypto?.randomUUID?.()
      || `${Date.now()}_${Math.random().toString(36).slice(2)}`;
    userId = `user_${randomPart}`;
    localStorage.setItem('userId', userId);
  }
  return userId;
};

// Request interceptor to attach the anonymous user id used by MongoDB and Neo4j
API.interceptors.request.use(
  (config) => {
    const userId = getUserId();
    if (userId) config.headers['x-user-id'] = userId;
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for global error handling
API.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || error.message || 'Something went wrong';
    // Graph insights and the health check are optional; don't toast when a
    // database is down, the UI shows an inline status instead.
    const isSilentRequest = error.config?.url?.startsWith('/graph')
      || error.config?.url?.startsWith('/health');
    if (!isSilentRequest) toast.error(message);
    return Promise.reject(error);
  }
);

export const uploadResume = (formData) => API.post('/resume/upload', formData);

export const analyzeText = (data) => API.post('/resume/analyze-text', data);

export const getResumeHistory = (params) => API.get('/resume/history', { params });

export const generateCoverLetter = (data) => API.post('/coverletter/generate', data);

export const generateQuestions = (data) => API.post('/interview/generate', data);

export const scoreAnswer = (data) => API.post('/interview/score-answer', data);

export const getGraphStatus = () => API.get('/graph/status');

export const getHealth = () => API.get('/health');

export const getGraphInsights = (resumeId) => API.get(`/graph/insights/${encodeURIComponent(resumeId)}`);

export const getGraphRoles = () => API.get('/graph/roles');

export const getGraphStats = () => API.get('/graph/stats');

export default API;
