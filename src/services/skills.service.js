import { apiFetch } from './api.js';
export const getSkills          = (token)                  => apiFetch('/skills',                 {}, token);
export const getSkillById       = (id, token)              => apiFetch(`/skills/${id}`,           {}, token);
export const getSkillsByUserId  = (userId, token)          => apiFetch(`/skills/user/${userId}`,  {}, token);
export const createSkill        = (body, token)            => apiFetch('/skills',                 { method: 'POST',   body: JSON.stringify(body) }, token);
// PATCH/DELETE use the skill's own _id — backend verifies userId from JWT
export const updateSkill        = (skillId, body, token)   => apiFetch(`/skills/${skillId}`,      { method: 'PATCH',  body: JSON.stringify(body) }, token);
export const deleteSkill        = (skillId, token)         => apiFetch(`/skills/${skillId}`,      { method: 'DELETE' }, token);
