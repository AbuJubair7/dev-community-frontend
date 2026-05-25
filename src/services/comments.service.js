import { apiFetch } from './api.js';

const toQuery = (params = {}) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, value);
    }
  });

  const queryString = query.toString();
  return queryString ? `?${queryString}` : '';
};

// GET /comments/post/:postId?page=1&limit=3&replyLimit=3
export const getCommentsByPost = (postId, token, params = {}) =>
  apiFetch(`/comments/post/${postId}${toQuery(params)}`, {}, token);

// GET /comments/:id/replies?page=1&limit=3
export const getRepliesByComment = (commentId, token, params = {}) =>
  apiFetch(`/comments/${commentId}/replies${toQuery(params)}`, {}, token);

// POST /comments  — create a top-level comment or a reply
// body: { postId, content, parentId? }
export const createComment = (body, token) =>
  apiFetch('/comments', { method: 'POST', body: JSON.stringify(body) }, token);

// PATCH /comments/:id
export const updateComment = (id, body, token) =>
  apiFetch(`/comments/${id}`, { method: 'PATCH', body: JSON.stringify(body) }, token);

// DELETE /comments/:id  — also deletes all replies
export const deleteComment = (id, token) =>
  apiFetch(`/comments/${id}`, { method: 'DELETE' }, token);
