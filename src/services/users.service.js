import { apiFetch } from './api.js';
export const getUsers       = (token)      => apiFetch('/users',           {}, token);
export const getUserById    = (id, token)  => apiFetch(`/users/${id}`,     {}, token);
export const updateUser     = (body, token)=> apiFetch('/users',           { method: 'PATCH',  body: JSON.stringify(body) }, token);
export const updatePassword = (body, token)=> apiFetch('/users/password',  { method: 'PATCH',  body: JSON.stringify(body) }, token);
export const deleteUser     = (token)      => apiFetch('/users',           { method: 'DELETE' }, token);
