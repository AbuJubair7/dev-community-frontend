import { apiFetch } from './api.js';

// CRUD
export const createCommunity = (body, token) =>
  apiFetch('/community', { method: 'POST', body: JSON.stringify(body) }, token);

export const getCommunities = (token) =>
  apiFetch('/community', {}, token);

export const getCommunity = (id, token) =>
  apiFetch(`/community/${id}`, {}, token);

export const updateCommunity = (id, body, token) =>
  apiFetch(`/community/${id}`, { method: 'PATCH', body: JSON.stringify(body) }, token);

export const deleteCommunity = (id, token) =>
  apiFetch(`/community/${id}`, { method: 'DELETE' }, token);

// Invites & Requests
export const inviteUser = (communityId, inviteeId, token) =>
  apiFetch(`/community/${communityId}/invite`, { method: 'POST', body: JSON.stringify({ inviteeId }) }, token);

export const requestToJoin = (communityId, token) =>
  apiFetch(`/community/${communityId}/request`, { method: 'POST' }, token);

export const acceptInvite = (inviteId, token) =>
  apiFetch(`/community/invite/${inviteId}/accept`, { method: 'POST' }, token);

export const declineInvite = (inviteId, token) =>
  apiFetch(`/community/invite/${inviteId}/decline`, { method: 'POST' }, token);

export const acceptRequest = (communityId, requestId, token) =>
  apiFetch(`/community/${communityId}/request/${requestId}/accept`, { method: 'POST' }, token);

export const declineRequest = (communityId, requestId, token) =>
  apiFetch(`/community/${communityId}/request/${requestId}/decline`, { method: 'POST' }, token);

// Member Management
export const changeMemberRole = (communityId, userId, role, token) =>
  apiFetch(`/community/${communityId}/member/${userId}/role`, { method: 'PATCH', body: JSON.stringify({ role }) }, token);

export const removeMember = (communityId, userId, token) =>
  apiFetch(`/community/${communityId}/member/${userId}`, { method: 'DELETE' }, token);

// Queries
export const getCommunityMembers = (communityId, token) =>
  apiFetch(`/community/${communityId}/members`, {}, token);

export const getCommunityRequests = (communityId, token) =>
  apiFetch(`/community/${communityId}/requests`, {}, token);

export const getMyInvitations = (token) =>
  apiFetch('/community/invites/my', {}, token);

export const getMyManagedRequests = (token) =>
  apiFetch('/community/requests/managed', {}, token);

export const getMyCommunityRole = (communityId, token) =>
  apiFetch(`/community/${communityId}/my-role`, {}, token);

export const getMyCommunities = (token) =>
  apiFetch('/community/member/my', {}, token);

