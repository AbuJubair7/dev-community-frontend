import { useState, useEffect, useCallback } from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import {
  getPostReactCounts,
  upsertPostReact,
  getCommentReactCounts,
  upsertCommentReact,
} from '../services/reacts.service.js';

// ─── Session-state cache ───────────────────────────────────────────────────────
// The backend has no "get my react state" endpoint, so we persist the current
// user's react state in sessionStorage, keyed by `${type}:${targetId}:${userId}`.
// This survives page navigations within a tab and is cleared on tab close.

function cacheKey(type, targetId, userId) {
  return `react:${type}:${targetId}:${userId}`;
}

function readCached(type, targetId, userId) {
  try {
    return sessionStorage.getItem(cacheKey(type, targetId, userId)) ?? 'NEUTRAL';
  } catch {
    return 'NEUTRAL';
  }
}

function writeCached(type, targetId, userId, state) {
  try {
    sessionStorage.setItem(cacheKey(type, targetId, userId), state);
  } catch { /* ignore */ }
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * ReactBar
 * ════════
 * Like / Dislike widget that maps 1-to-1 with the backend API.
 *
 * Backend contract (from reacts.service.ts):
 *  • GET  /reacts/{post|comment}?{post|comment}Id=X
 *        → { likeCount: number, dislikeCount: number }
 *  • POST /reacts/{post|comment}   (body: { userId, postId|commentId, state })
 *        → upserts the user's react (creates if none, updates if exists)
 *        → returns the saved react document
 *
 * Interaction rules:
 *  • Default/initial state is NEUTRAL.
 *  • Pressing LIKE   while NEUTRAL  → LIKE.
 *  • Pressing LIKE   while LIKE     → NEUTRAL  (toggle off).
 *  • Pressing LIKE   while DISLIKE  → LIKE     (switch, mutual exclusion).
 *  • Pressing DISLIKE while NEUTRAL → DISLIKE.
 *  • Pressing DISLIKE while DISLIKE → NEUTRAL  (toggle off).
 *  • Pressing DISLIKE while LIKE    → DISLIKE  (switch, mutual exclusion).
 *
 * Props:
 *  targetId  — post._id or comment._id
 *  type      — 'post' | 'comment'
 *  size      — 'sm' | 'md'  (default 'md')
 */
export default function ReactBar({ targetId, type = 'post', size = 'md' }) {
  const { user, token } = useAuth();

  // ── Counts from the server ─────────────────────────────────────────────────
  const [likeCount, setLikeCount]       = useState(0);
  const [dislikeCount, setDislikeCount] = useState(0);
  const [countsLoading, setCountsLoading] = useState(true);

  // ── User's own state (LIKE | DISLIKE | NEUTRAL) ────────────────────────────
  // Initialised from session cache so it persists across route changes.
  const [myState, setMyState] = useState(() =>
    user ? readCached(type, targetId, user._id) : 'NEUTRAL',
  );

  // ── Request state ──────────────────────────────────────────────────────────
  const [busy, setBusy]       = useState(false);
  const [ripple, setRipple]   = useState(null); // 'LIKE' | 'DISLIKE' | null

  // ── Fetch counts on mount ──────────────────────────────────────────────────
  const fetchCounts = useCallback(async () => {
    if (!targetId || !token) { setCountsLoading(false); return; }
    try {
      const data =
        type === 'post'
          ? await getPostReactCounts(targetId, token)
          : await getCommentReactCounts(targetId, token);
      setLikeCount(data.likeCount ?? 0);
      setDislikeCount(data.dislikeCount ?? 0);
    } catch {
      // non-critical — leave counts at 0
    } finally {
      setCountsLoading(false);
    }
  }, [targetId, type, token]);

  useEffect(() => { fetchCounts(); }, [fetchCounts]);

  // Keep myState in sync when user changes (e.g. logout → login as someone else)
  useEffect(() => {
    setMyState(user ? readCached(type, targetId, user._id) : 'NEUTRAL');
  }, [user, type, targetId]);

  // ── Handle press ──────────────────────────────────────────────────────────
  const handleReact = async (pressed) => {
    if (!user || busy) return;

    const nextState = myState === pressed ? 'NEUTRAL' : pressed;

    // ── Trigger bounce animation ─────────────────────────────────────────
    setRipple(pressed);
    setTimeout(() => setRipple(null), 400);

    // ── Optimistic update ────────────────────────────────────────────────
    // Adjust counts immediately so the UI feels instant.
    const prevState = myState;
    setMyState(nextState);

    setLikeCount((c) => {
      let n = c;
      if (prevState === 'LIKE') n--;       // removing old LIKE
      if (nextState === 'LIKE') n++;       // adding new LIKE
      return Math.max(0, n);
    });
    setDislikeCount((c) => {
      let n = c;
      if (prevState === 'DISLIKE') n--;    // removing old DISLIKE
      if (nextState === 'DISLIKE') n++;    // adding new DISLIKE
      return Math.max(0, n);
    });

    // ── Persist to session cache ─────────────────────────────────────────
    writeCached(type, targetId, user._id, nextState);

    // ── Call backend (single upsert) ─────────────────────────────────────
    setBusy(true);
    try {
      if (type === 'post') {
        await upsertPostReact(targetId, user._id, nextState, token);
      } else {
        await upsertCommentReact(targetId, user._id, nextState, token);
      }
      // Re-fetch counts from server to stay accurate
      await fetchCounts();
    } catch {
      // Revert optimistic update on failure
      setMyState(prevState);
      writeCached(type, targetId, user._id, prevState);
      await fetchCounts();
    } finally {
      setBusy(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  const isSm = size === 'sm';

  const likeClasses = [
    'react-btn',
    'react-btn-like',
    myState === 'LIKE' ? 'is-active' : '',
    ripple === 'LIKE'  ? 'is-rippling' : '',
  ].filter(Boolean).join(' ');

  const dislikeClasses = [
    'react-btn',
    'react-btn-dislike',
    myState === 'DISLIKE' ? 'is-active' : '',
    ripple === 'DISLIKE'  ? 'is-rippling' : '',
  ].filter(Boolean).join(' ');

  return (
    <div
      className={`react-bar react-bar-${size}`}
      role="group"
      aria-label="Reactions"
    >
      {/* ── Like ────────────────────────────────────────────────────────── */}
      <button
        id={`react-like-${targetId}`}
        type="button"
        className={likeClasses}
        onClick={() => handleReact('LIKE')}
        disabled={busy || countsLoading || !user}
        aria-pressed={myState === 'LIKE'}
        title={
          !user
            ? 'Log in to react'
            : myState === 'LIKE'
            ? 'Remove like'
            : 'Like'
        }
      >
        <span className="react-btn-inner">
          <ThumbsUp
            size={isSm ? 13 : 15}
            strokeWidth={myState === 'LIKE' ? 2.5 : 2}
            className="react-icon"
          />
          {(countsLoading ? 0 : likeCount) > 0 && (
            <span className="react-count">
              {countsLoading ? '' : likeCount}
            </span>
          )}
        </span>
        {!isSm && (
          <span className="react-label">
            {myState === 'LIKE' ? 'Liked' : 'Like'}
          </span>
        )}
      </button>

      {/* ── Separator ───────────────────────────────────────────────────── */}
      <div className="react-divider" aria-hidden="true" />

      {/* ── Dislike ─────────────────────────────────────────────────────── */}
      <button
        id={`react-dislike-${targetId}`}
        type="button"
        className={dislikeClasses}
        onClick={() => handleReact('DISLIKE')}
        disabled={busy || countsLoading || !user}
        aria-pressed={myState === 'DISLIKE'}
        title={
          !user
            ? 'Log in to react'
            : myState === 'DISLIKE'
            ? 'Remove dislike'
            : 'Dislike'
        }
      >
        <span className="react-btn-inner">
          <ThumbsDown
            size={isSm ? 13 : 15}
            strokeWidth={myState === 'DISLIKE' ? 2.5 : 2}
            className="react-icon"
          />
          {(countsLoading ? 0 : dislikeCount) > 0 && (
            <span className="react-count">
              {countsLoading ? '' : dislikeCount}
            </span>
          )}
        </span>
        {!isSm && (
          <span className="react-label">
            {myState === 'DISLIKE' ? 'Disliked' : 'Dislike'}
          </span>
        )}
      </button>
    </div>
  );
}
