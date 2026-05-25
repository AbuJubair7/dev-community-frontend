import { apiFetch } from './api.js';
export const register = (body) => apiFetch('/auth/register', { method: 'POST', body: JSON.stringify(body) });
export const login    = (body) => apiFetch('/auth/login',    { method: 'POST', body: JSON.stringify(body) });
