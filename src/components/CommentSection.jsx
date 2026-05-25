import { useEffect, useState } from 'react';
import {
  ChevronDown,
  MessageCircle,
  Pencil,
  Reply,
  Send,
  Trash2,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import {
  createComment,
  deleteComment,
  getRepliesByComment,
  updateComment,
} from '../services/comments.service.js';
import ReactBar from './ReactBar.jsx';

const REPLY_LIMIT = 3;

function formatDate(str) {
  if (!str) return '';
  return new Date(str).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function avatarLabel(comment, currentUser, isOwner) {
  if (isOwner) {
    return (currentUser?.fname || currentUser?.email || 'Y')[0].toUpperCase();
  }

  return (comment.userId || 'M')[0].toUpperCase();
}

function ActionButton({ icon: Icon, children, tone = 'default', ...props }) {
  return (
    <button className={`comment-action comment-action-${tone}`} type="button" {...props}>
      <Icon size={14} strokeWidth={2} />
      <span>{children}</span>
    </button>
  );
}

function CommentComposer({
  value,
  onChange,
  onSubmit,
  onCancel,
  busy,
  error,
  placeholder,
  submitLabel,
  compact = false,
  autoFocus = false,
}) {
  return (
    <div className={compact ? 'comment-composer compact' : 'comment-composer'}>
      <textarea
        className="comment-input"
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoFocus={autoFocus}
      />
      {error && <p className="form-error">{error}</p>}
      <div className="comment-composer-actions">
        {onCancel && (
          <button className="btn-ghost btn-sm" type="button" onClick={onCancel}>
            <X size={14} />
            Cancel
          </button>
        )}
        <button
          className="btn-primary btn-sm"
          type="button"
          onClick={onSubmit}
          disabled={busy || !value.trim()}
        >
          {busy ? <span className="spinner spinner-sm" /> : <Send size={14} />}
          {submitLabel}
        </button>
      </div>
    </div>
  );
}

function CommentItem({
  comment,
  postId,
  depth = 0,
  onCommentUpdated,
  onCommentDeleted,
  onRepliesLoaded,
  onReplyCreated,
}) {
  const { token, user } = useAuth();
  const [replying, setReplying] = useState(false);
  const [editing, setEditing] = useState(false);
  const [repliesOpen, setRepliesOpen] = useState(Boolean(comment.replies?.length));
  const [replyText, setReplyText] = useState('');
  const [editText, setEditText] = useState(comment.content);
  const [busy, setBusy] = useState(false);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [error, setError] = useState('');

  const isOwner = user && comment.userId === user._id;
  const replies = comment.replies || [];
  const repliesPagination = comment.repliesPagination;
  const knownReplyTotal = repliesPagination?.total || replies.length;
  const canLoadMoreReplies = Boolean(repliesPagination?.nextPage);

  useEffect(() => {
    setEditText(comment.content);
    if (comment.replies?.length) setRepliesOpen(true);
  }, [comment.content, comment.replies?.length]);

  const loadReplies = async (page = 1, append = false) => {
    setLoadingReplies(true);
    setError('');

    try {
      const response = await getRepliesByComment(
        comment._id,
        token,
        { page, limit: REPLY_LIMIT },
      );
      onRepliesLoaded(comment._id, response, append);
      setRepliesOpen(true);
    } catch (err) {
      setError(err.message || 'Failed to load replies.');
    } finally {
      setLoadingReplies(false);
    }
  };

  const handleReply = async () => {
    if (!replyText.trim()) return;
    setBusy(true);
    setError('');

    try {
      const reply = await createComment(
        { postId, content: replyText.trim(), parentId: comment._id },
        token,
      );
      onReplyCreated(comment._id, {
        ...reply,
        replies: [],
        repliesPagination: null,
      });
      setReplyText('');
      setReplying(false);
      setRepliesOpen(true);
    } catch (err) {
      setError(err.message || 'Failed to post reply.');
    } finally {
      setBusy(false);
    }
  };

  const handleEdit = async () => {
    if (!editText.trim()) return;
    setBusy(true);
    setError('');

    try {
      const updated = await updateComment(comment._id, { content: editText.trim() }, token);
      onCommentUpdated(updated);
      setEditing(false);
    } catch (err) {
      setError(err.message || 'Failed to update comment.');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    setBusy(true);
    setError('');

    try {
      await deleteComment(comment._id, token);
      onCommentDeleted(comment._id);
    } catch (err) {
      setError(err.message || 'Failed to delete comment.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <article
      className={depth > 0 ? 'comment-row reply-row' : 'comment-row'}
      style={{ '--comment-depth': Math.min(depth, 4) }}
    >
      <div className="comment-avatar">
        {avatarLabel(comment, user, isOwner)}
      </div>

      <div className="comment-body">
        <div className="comment-bubble">
          <div className="comment-header">
            <div>
              <span className="comment-author">{isOwner ? 'You' : 'Member'}</span>
              <span className="comment-date">{formatDate(comment.createdAt)}</span>
            </div>
            {depth > 0 && <span className="reply-pill">Reply</span>}
          </div>

          {editing && !comment.isDeleted ? (
            <CommentComposer
              value={editText}
              onChange={setEditText}
              onSubmit={handleEdit}
              onCancel={() => {
                setEditing(false);
                setEditText(comment.content);
                setError('');
              }}
              busy={busy}
              error={error}
              placeholder="Update your comment"
              submitLabel="Save"
              compact
              autoFocus
            />
          ) : (
            <p className={comment.isDeleted ? 'comment-text deleted' : 'comment-text'}>
              {comment.content}
            </p>
          )}
        </div>

        {!editing && (
          <div className="comment-toolbar">
            {/* ─ Reacts ─ */}
            <ReactBar targetId={comment._id} type="comment" size="sm" />

            {!comment.isDeleted && (
              <ActionButton
                icon={Reply}
                onClick={() => {
                  setReplying((current) => !current);
                  setError('');
                }}
              >
                Reply
              </ActionButton>
            )}

            {knownReplyTotal > 0 && (
              <ActionButton
                icon={MessageCircle}
                onClick={() =>
                  replies.length ? setRepliesOpen((current) => !current) : loadReplies()
                }
              >
                {repliesOpen ? 'Hide replies' : `${knownReplyTotal} replies`}
              </ActionButton>
            )}

            {isOwner && !comment.isDeleted && (
              <>
                <ActionButton icon={Pencil} onClick={() => setEditing(true)}>
                  Edit
                </ActionButton>
                <ActionButton icon={Trash2} tone="danger" onClick={handleDelete} disabled={busy}>
                  Delete
                </ActionButton>
              </>
            )}
          </div>
        )}

        {replying && (
          <CommentComposer
            value={replyText}
            onChange={setReplyText}
            onSubmit={handleReply}
            onCancel={() => {
              setReplying(false);
              setReplyText('');
              setError('');
            }}
            busy={busy}
            error={error}
            placeholder="Write a thoughtful reply"
            submitLabel="Reply"
            compact
            autoFocus
          />
        )}

        {!replying && !editing && error && <p className="form-error">{error}</p>}

        {repliesOpen && replies.length > 0 && (
          <div className="reply-stack">
            {replies.map((reply) => (
              <CommentItem
                key={reply._id}
                comment={reply}
                postId={postId}
                depth={depth + 1}
                onCommentUpdated={onCommentUpdated}
                onCommentDeleted={onCommentDeleted}
                onRepliesLoaded={onRepliesLoaded}
                onReplyCreated={onReplyCreated}
              />
            ))}
          </div>
        )}

        {repliesOpen && canLoadMoreReplies && (
          <button
            className="comment-load-more inline"
            type="button"
            onClick={() => loadReplies(repliesPagination.nextPage, true)}
            disabled={loadingReplies}
          >
            {loadingReplies ? <span className="spinner spinner-sm" /> : <MessageCircle size={14} />}
            Load more replies
          </button>
        )}
      </div>
    </article>
  );
}

export default function CommentSection({
  postId,
  comments,
  pagination,
  loading,
  loadingMore,
  onRefresh,
  onLoadMore,
  onCommentUpdated,
  onCommentDeleted,
  onRepliesLoaded,
  onReplyCreated,
  onCommentCreated,
}) {
  const { user, token } = useAuth();
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handlePost = async () => {
    if (!text.trim()) return;
    setBusy(true);
    setError('');

    try {
      const comment = await createComment(
        { postId, content: text.trim(), parentId: null },
        token,
      );
      setText('');
      onCommentCreated?.({
        ...comment,
        replies: [],
        repliesPagination: {
          page: 1,
          limit: REPLY_LIMIT,
          total: 0,
          totalPages: 0,
          hasNextPage: false,
          nextPage: null,
        },
      });
    } catch (err) {
      setError(err.message || 'Failed to post comment.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="comment-section">
      <div className="comment-section-head">
        <div>
          <h3 className="comment-section-title">Discussion</h3>
          <p className="comment-section-subtitle">
            {pagination?.total
              ? `${pagination.total} comment${pagination.total === 1 ? '' : 's'}`
              : 'Start the conversation'}
          </p>
        </div>
        {pagination?.total > 0 && (
          <span className="comment-count">{pagination.total}</span>
        )}
      </div>

      {user && (
        <div className="comment-new-form">
          <div className="comment-avatar self">
            {(user.fname || user.email || '?')[0].toUpperCase()}
          </div>
          <CommentComposer
            value={text}
            onChange={setText}
            onSubmit={handlePost}
            busy={busy}
            error={error}
            placeholder="Share your perspective"
            submitLabel="Post"
          />
        </div>
      )}

      {loading ? (
        <div className="comment-loading">
          <span className="spinner" />
        </div>
      ) : comments.length === 0 ? (
        <div className="comment-empty">
          <MessageCircle size={28} strokeWidth={1.8} />
          <p>No comments yet.</p>
        </div>
      ) : (
        <>
          <div className="comment-list">
            {comments.map((comment) => (
              <CommentItem
                key={comment._id}
                comment={comment}
                postId={postId}
                onRefresh={onRefresh}
                onCommentUpdated={onCommentUpdated}
                onCommentDeleted={onCommentDeleted}
                onRepliesLoaded={onRepliesLoaded}
                onReplyCreated={onReplyCreated}
              />
            ))}
          </div>

          {pagination?.hasNextPage && (
            <button
              className="comment-load-more"
              type="button"
              onClick={onLoadMore}
              disabled={loadingMore}
            >
              {loadingMore ? <span className="spinner spinner-sm" /> : <ChevronDown size={14} />}
              Load more comments
            </button>
          )}
        </>
      )}
    </section>
  );
}
