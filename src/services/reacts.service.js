import { apiFetch } from './api.js';

// ─── Post Reacts ──────────────────────────────────────────────────────────────

/**
 * GET /reacts/post?postId=X
 * Returns { likeCount, dislikeCount }
 */
export function getPostReactCounts(postId, token) {
  return apiFetch(`/reacts/post?postId=${postId}`, {}, token);
}

/**
 * GET /reacts/post/:id
 * Returns the post react object.
 */
export function getPostReactById(reactId, token) {
  return apiFetch(`/reacts/post/${reactId}`, {}, token);
}

/**
 * POST /reacts/post
 * Upsert — backend creates or updates the user's react in one call.
 * Body: { userId, postId, state: 'LIKE' | 'DISLIKE' | 'NEUTRAL' }
 * Returns the saved react object.
 */
export function upsertPostReact(postId, userId, state, token) {
  return apiFetch(
    '/reacts/post',
    { method: 'POST', body: JSON.stringify({ postId, userId, state }) },
    token,
  );
}

/**
 * PATCH /reacts/post?postId=X&userId=Y
 * Body: { state: 'LIKE' | 'DISLIKE' | 'NEUTRAL' }
 * Returns the updated react object.
 */
export function updatePostReact(postId, userId, state, token) {
  return apiFetch(
    `/reacts/post?postId=${postId}&userId=${userId}`,
    { method: 'PATCH', body: JSON.stringify({ state }) },
    token,
  );
}

/**
 * DELETE /reacts/post/:id?userId=Y
 * Returns the deleted react object.
 */
export function deletePostReact(reactId, userId, token) {
  return apiFetch(
    `/reacts/post/${reactId}?userId=${userId}`,
    { method: 'DELETE' },
    token,
  );
}

// ─── Comment Reacts ───────────────────────────────────────────────────────────

/**
 * GET /reacts/comment?commentId=X
 * Returns { likeCount, dislikeCount }
 */
export function getCommentReactCounts(commentId, token) {
  return apiFetch(`/reacts/comment?commentId=${commentId}`, {}, token);
}

/**
 * GET /reacts/comment/:id
 * Returns the comment react object.
 */
export function getCommentReactById(reactId, token) {
  return apiFetch(`/reacts/comment/${reactId}`, {}, token);
}

/**
 * POST /reacts/comment
 * Upsert — backend creates or updates the user's react in one call.
 * Body: { userId, commentId, state: 'LIKE' | 'DISLIKE' | 'NEUTRAL' }
 * Returns the saved react object.
 */
export function upsertCommentReact(commentId, userId, state, token) {
  return apiFetch(
    '/reacts/comment',
    { method: 'POST', body: JSON.stringify({ commentId, userId, state }) },
    token,
  );
}

/**
 * PATCH /reacts/comment?commentId=X&userId=Y
 * Body: { state: 'LIKE' | 'DISLIKE' | 'NEUTRAL' }
 * Returns the updated react object.
 */
export function updateCommentReact(commentId, userId, state, token) {
  return apiFetch(
    `/reacts/comment?commentId=${commentId}&userId=${userId}`,
    { method: 'PATCH', body: JSON.stringify({ state }) },
    token,
  );
}

/**
 * DELETE /reacts/comment/:id?userId=Y
 * Returns the deleted react object.
 */
export function deleteCommentReact(reactId, userId, token) {
  return apiFetch(
    `/reacts/comment/${reactId}?userId=${userId}`,
    { method: 'DELETE' },
    token,
  );
}

