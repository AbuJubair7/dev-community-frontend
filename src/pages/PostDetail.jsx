import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Pencil, ShieldCheck, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { getPostById, deletePost } from '../services/posts.service.js';
import { getUsers } from '../services/users.service.js';
import { getCommentsByPost } from '../services/comments.service.js';
import CommentSection from '../components/CommentSection.jsx';
import ReactBar from '../components/ReactBar.jsx';
import Spinner from '../components/Spinner.jsx';
import ErrorCard from '../components/ErrorCard.jsx';

function formatDate(str) {
  if (!str) return '';
  return new Date(str).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

const COMMENT_LIMIT = 3;
const REPLY_LIMIT = 3;

function updateCommentTree(comments, commentId, updater) {
  return comments.map((comment) => {
    if (comment._id === commentId) return updater(comment);
    if (!comment.replies?.length) return comment;

    return {
      ...comment,
      replies: updateCommentTree(comment.replies, commentId, updater),
    };
  });
}

export default function PostDetail() {
  const { id } = useParams();
  const { token, user, isAuth } = useAuth();
  const navigate = useNavigate();
  const [post, setPost]             = useState(null);
  const [authorName, setAuthor]     = useState('');
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [deleting, setDeleting]     = useState(false);
  const [confirmDelete, setConfirm] = useState(false);

  // Comments state
  const [comments, setComments] = useState([]);
  const [commentsPagination, setCommentsPagination] = useState(null);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [loadingMoreComments, setLoadingMoreComments] = useState(false);

  useEffect(() => {
    if (!isAuth) { navigate('/login', { replace: true }); return; }
    Promise.all([getPostById(id, token), getUsers(token)])
      .then(([p, users]) => {
        setPost(p);
        const author = users.find((u) => u._id === p.userId);
        setAuthor(author ? `${author.fname} ${author.lname}`.trim() : 'Unknown');
      })
      .catch((err) => setError(err.message || 'Failed to load post.'))
      .finally(() => setLoading(false));
  }, [id, token, isAuth, navigate]);

  // Fetch comments — extracted so it can be called to refresh after add/edit/delete
  const fetchComments = useCallback((page = 1, { append = false } = {}) => {
    if (!token) return;
    append ? setLoadingMoreComments(true) : setCommentsLoading(true);

    getCommentsByPost(id, token, {
      page,
      limit: COMMENT_LIMIT,
      replyLimit: REPLY_LIMIT,
    })
      .then((res) => {
        const nextComments = res.data || [];
        setComments((current) => append ? [...current, ...nextComments] : nextComments);
        setCommentsPagination(res.pagination || null);
      })
      .catch(() => {
        if (!append) {
          setComments([]);
          setCommentsPagination(null);
        }
      })
      .finally(() => {
        append ? setLoadingMoreComments(false) : setCommentsLoading(false);
      });
  }, [id, token]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const isOwner = user && post && post.userId === user._id;

  const loadMoreComments = () => {
    if (!commentsPagination?.nextPage || loadingMoreComments) return;
    fetchComments(commentsPagination.nextPage, { append: true });
  };

  const handleCommentUpdated = (updatedComment) => {
    setComments((current) =>
      updateCommentTree(current, updatedComment._id, (comment) => ({
        ...comment,
        ...updatedComment,
        replies: comment.replies,
        repliesPagination: comment.repliesPagination,
      })),
    );
  };

  const handleCommentDeleted = (commentId) => {
    setComments((current) =>
      updateCommentTree(current, commentId, (comment) => ({
        ...comment,
        content: '[This comment has been deleted]',
        isDeleted: true,
      })),
    );
  };

  const handleRepliesLoaded = (commentId, response, append = false) => {
    setComments((current) =>
      updateCommentTree(current, commentId, (comment) => ({
        ...comment,
        replies: append
          ? [...(comment.replies || []), ...(response.data || [])]
          : response.data || [],
        repliesPagination: response.pagination || null,
      })),
    );
  };

  const handleReplyCreated = (commentId, reply) => {
    setComments((current) =>
      updateCommentTree(current, commentId, (comment) => {
        const replies = comment.replies || [];
        const pagination = comment.repliesPagination;

        return {
          ...comment,
          replies: [...replies, reply],
          repliesPagination: pagination
            ? { ...pagination, total: pagination.total + 1 }
            : { page: 1, limit: REPLY_LIMIT, total: 1, totalPages: 1, hasNextPage: false, nextPage: null },
        };
      }),
    );
  };

  const handleCommentCreated = (comment) => {
    setComments((current) => [...current, comment]);
    setCommentsPagination((current) =>
      current
        ? { ...current, total: current.total + 1 }
        : { page: 1, limit: COMMENT_LIMIT, total: 1, totalPages: 1, hasNextPage: false, nextPage: null },
    );
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deletePost(post._id, token);
      navigate('/feed');
    } catch (err) {
      setError(err.message || 'Failed to delete post.');
      setDeleting(false);
      setConfirm(false);
    }
  };

  if (loading) return <div className="page"><div className="container"><Spinner /></div></div>;
  if (error)   return <div className="page"><div className="container"><ErrorCard message={error} /></div></div>;
  if (!post)   return null;

  return (
    <div className="page">
      <div className="container">
        <div style={{ marginBottom: 24 }}>
          <Link to="/feed" className="btn-ghost btn-sm">
            <ArrowLeft size={14} />
            Back to feed
          </Link>
        </div>

        <h1 className="post-detail-title">{post.title}</h1>

        <div className="post-detail-meta">
          <span>
            By{' '}
            {isOwner
              ? <Link to="/profile" className="post-card-author">You</Link>
              : <Link to={`/users/${post.userId}`} className="post-card-author">{authorName}</Link>
            }
          </span>
          <span>·</span>
          <span>Posted {formatDate(post.createdAt)}</span>
          {isOwner && (
            <>
              <span>·</span>
              <span className="post-owner-badge">
                <ShieldCheck size={13} />
                Your post
              </span>
            </>
          )}
        </div>

        <div className="post-detail-content">{post.content}</div>

        {/* ── Reacts ── */}
        <div className="post-react-bar">
          <ReactBar targetId={post._id} type="post" size="md" />
        </div>

        {/* Owner actions */}
        {isOwner && !confirmDelete && (
          <div className="post-actions">
            <Link to={`/posts/${id}/edit`} className="btn-ghost btn-sm">
              <Pencil size={14} />
              Edit post
            </Link>
            <button className="btn-danger btn-sm" onClick={() => setConfirm(true)}>
              <Trash2 size={14} />
              Delete post
            </button>
          </div>
        )}

        {/* Delete confirmation */}
        {confirmDelete && (
          <div className="confirm-banner">
            <span>Are you sure you want to delete this post? This cannot be undone.</span>
            <div className="confirm-banner-actions">
              <button className="btn-ghost btn-sm" onClick={() => setConfirm(false)}>Cancel</button>
              <button className="btn-danger btn-sm" onClick={handleDelete} disabled={deleting}>
                {deleting ? <span className="spinner spinner-sm" /> : 'Yes, delete'}
              </button>
            </div>
          </div>
        )}

        {/* ── Comments ── */}
        <div className="divider" />
        <CommentSection
          postId={id}
          comments={comments}
          pagination={commentsPagination}
          loading={commentsLoading}
          loadingMore={loadingMoreComments}
          onRefresh={() => fetchComments(1)}
          onLoadMore={loadMoreComments}
          onCommentUpdated={handleCommentUpdated}
          onCommentDeleted={handleCommentDeleted}
          onRepliesLoaded={handleRepliesLoaded}
          onReplyCreated={handleReplyCreated}
          onCommentCreated={handleCommentCreated}
        />
      </div>
    </div>
  );
}
