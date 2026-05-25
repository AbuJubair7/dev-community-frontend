import { apiFetch } from './api.js';
export const getExperiences         = (token)              => apiFetch('/experiences',                 {}, token);
export const getExperienceById      = (id, token)          => apiFetch(`/experiences/${id}`,           {}, token);
export const getExperiencesByUserId = (userId, token)      => apiFetch(`/experiences/user/${userId}`,  {}, token);
export const createExperience       = (body, token)        => apiFetch('/experiences',                 { method: 'POST',   body: JSON.stringify(body) }, token);
// PATCH/DELETE use the experience's own _id — backend verifies userId from JWT
export const updateExperience       = (expId, body, token) => apiFetch(`/experiences/${expId}`,        { method: 'PATCH',  body: JSON.stringify(body) }, token);
export const deleteExperience       = (expId, token)       => apiFetch(`/experiences/${expId}`,        { method: 'DELETE' }, token);
