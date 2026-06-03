import { Link } from 'react-router-dom';
import { Calendar } from 'lucide-react';

function formatDate(str) {
  if (!str) return '';
  return new Date(str).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatScheduledDate(str) {
  if (!str) return '';
  return new Date(str).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function PostCard({ post }) {
  const excerpt = post.content?.length > 140 ? post.content.slice(0, 140) + '…' : post.content;
  const isScheduled = post.status === 'scheduled';

  const displayName = post.userName
    || (post.userId && typeof post.userId === 'object'
      ? `${post.userId.fname || ''} ${post.userId.lname || ''}`.trim()
      : null)
    || 'Unknown';

  const authorId = post.userId && typeof post.userId === 'object' ? post.userId._id : post.userId;

  return (
    <Link
      to={`/posts/${post._id}`}
      className={`post-card${isScheduled ? ' post-card-scheduled' : ''}`}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8, justifyContent: 'space-between' }}>
        <div className="post-card-title" style={{ marginBottom: 0 }}>{post.title}</div>
        {isScheduled && (
          <span className="post-status-badge post-status-scheduled">
            <Calendar size={11} />
            Scheduled
          </span>
        )}
      </div>
      {excerpt && <div className="post-card-excerpt">{excerpt}</div>}
      <div className="post-card-meta">
        <span>
          By{' '}
          {authorId ? (
            <Link to={`/users/${authorId}`} className="post-card-author" onClick={(e) => e.stopPropagation()}>
              {displayName}
            </Link>
          ) : (
            <span>{displayName}</span>
          )}
        </span>
        {post.communityName && (
          <>
            <span>in</span>
            <Link
              to={`/communities/${post.communityId}`}
              className="post-card-author"
              onClick={(e) => e.stopPropagation()}
              style={{ color: 'var(--accent-light)' }}
            >
              {post.communityName}
            </Link>
          </>
        )}
        <span>·</span>
        {isScheduled && post.postAt ? (
          <span style={{ color: 'var(--warning)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Calendar size={11} />
            {formatScheduledDate(post.postAt)}
          </span>
        ) : (
          <span>{formatDate(post.createdAt)}</span>
        )}
      </div>
    </Link>
  );
}
