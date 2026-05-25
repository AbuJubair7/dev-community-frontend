import { apiFetch } from './api.js';
export const getPosts         = (token)                  => apiFetch('/posts',                    {}, token);
export const getPostById      = (id, token)              => apiFetch(`/posts/${id}`,              {}, token);
export const getPostsByUserId = (userId, token)          => apiFetch(`/posts/user/${userId}`,     {}, token);
export const createPost       = (body, token)            => apiFetch('/posts',                    { method: 'POST',   body: JSON.stringify(body) }, token);
// PATCH/DELETE use the post's own _id — backend verifies ownership via userId from JWT
export const updatePost       = (postId, body, token)   => apiFetch(`/posts/${postId}`,           { method: 'PATCH',  body: JSON.stringify(body) }, token);
export const deletePost       = (postId, token)         => apiFetch(`/posts/${postId}`,           { method: 'DELETE' }, token);
