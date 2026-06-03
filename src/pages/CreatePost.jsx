import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Calendar, Clock, X, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { createPost } from '../services/posts.service.js';
import { getMyCommunities } from '../services/community.service.js';
import Spinner from '../components/Spinner.jsx';

/** Returns a datetime-local string like "2025-12-25T10:00" (local time) */
function toDatetimeLocal(date) {
  const d = date instanceof Date ? date : new Date(date);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Minimum value: 5 minutes from now */
function minDatetimeLocal() {
  return toDatetimeLocal(new Date(Date.now() + 5 * 60 * 1000));
}

export default function CreatePost() {
  const { token, isAuth } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const communityIdParam = searchParams.get('communityId') || '';

  const [form, setForm] = useState({ title: '', content: '', communityId: communityIdParam });
  const [communities, setCommunities] = useState([]);
  const [loadingComms, setLoadingComms] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Scheduling state
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduledAt, setScheduledAt] = useState('');

  useEffect(() => {
    if (!isAuth) {
      navigate('/login', { replace: true });
      return;
    }

    getMyCommunities(token)
      .then((data) => {
        setCommunities(data);
        if (data.length > 0 && !communityIdParam) {
          setForm((f) => ({ ...f, communityId: data[0]._id }));
        }
      })
      .catch((err) => {
        setError(err.message || 'Failed to load your communities.');
      })
      .finally(() => {
        setLoadingComms(false);
      });
  }, [isAuth, navigate, token, communityIdParam]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleToggleSchedule = () => {
    const next = !scheduleEnabled;
    setScheduleEnabled(next);
    if (next && !scheduledAt) {
      // Default to 1 hour from now
      setScheduledAt(toDatetimeLocal(new Date(Date.now() + 60 * 60 * 1000)));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.communityId) {
      setError('You must select a community to publish this post.');
      return;
    }
    if (scheduleEnabled) {
      if (!scheduledAt) {
        setError('Please select a date and time to schedule the post.');
        return;
      }
      const scheduledDate = new Date(scheduledAt);
      if (scheduledDate <= new Date()) {
        setError('Scheduled time must be in the future.');
        return;
      }
    }
    setLoading(true);
    try {
      const payload = { ...form };
      if (scheduleEnabled && scheduledAt) {
        // Convert local datetime-local value to ISO string
        payload.postAt = new Date(scheduledAt).toISOString();
      }
      await createPost(payload, token);
      if (scheduleEnabled) {
        navigate('/profile', { state: { scheduledSuccess: true } });
      } else {
        navigate(`/communities/${form.communityId}`);
      }
    } catch (err) {
      setError(err.message || 'Failed to create post.');
    } finally {
      setLoading(false);
    }
  };

  if (loadingComms) {
    return (
      <div className="page">
        <div className="container">
          <Spinner />
        </div>
      </div>
    );
  }

  const isScheduleReady = scheduleEnabled && scheduledAt && new Date(scheduledAt) > new Date();

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 680 }}>
        <div style={{ marginBottom: 24 }}>
          <button
            onClick={() => {
              if (communityIdParam) {
                navigate(`/communities/${communityIdParam}`);
              } else {
                navigate('/feed');
              }
            }}
            className="btn-ghost btn-sm"
          >
            ← Back
          </button>
        </div>

        <div className="page-header">
          <div>
            <h1 className="page-title">New Post</h1>
            <p className="page-subtitle">Share something with your community</p>
          </div>
        </div>

        <div className="card">
          {communities.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
                You must join a community before you can publish posts.
              </p>
              <Link to="/communities" className="btn-primary">
                Explore Communities
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Community selector */}
              <div className="form-group">
                <label className="form-label">Post to Community</label>
                <select
                  className="input"
                  value={form.communityId}
                  onChange={set('communityId')}
                  disabled={!!communityIdParam}
                  required
                >
                  {communities.map((comm) => (
                    <option key={comm._id} value={comm._id}>
                      {comm.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div className="form-group">
                <label className="form-label">Title</label>
                <input
                  className="input"
                  placeholder="What's on your mind?"
                  value={form.title}
                  onChange={set('title')}
                  required
                />
              </div>

              {/* Content */}
              <div className="form-group">
                <label className="form-label">Content</label>
                <textarea
                  className="textarea"
                  placeholder="Share your thoughts…"
                  style={{ minHeight: 200 }}
                  value={form.content}
                  onChange={set('content')}
                  required
                />
              </div>

              {/* ── Scheduling section ─────────────────────── */}
              <div className="schedule-section">
                <button
                  type="button"
                  className={`schedule-toggle-btn${scheduleEnabled ? ' active' : ''}`}
                  onClick={handleToggleSchedule}
                >
                  <Calendar size={15} />
                  {scheduleEnabled ? 'Scheduling enabled' : 'Schedule for later'}
                  {scheduleEnabled && (
                    <span
                      className="schedule-toggle-close"
                      onClick={(e) => {
                        e.stopPropagation();
                        setScheduleEnabled(false);
                        setScheduledAt('');
                      }}
                    >
                      <X size={13} />
                    </span>
                  )}
                </button>

                {scheduleEnabled && (
                  <div className="schedule-picker-panel">
                    <div className="schedule-picker-header">
                      <Clock size={14} />
                      <span>Choose publish date & time</span>
                    </div>
                    <input
                      type="datetime-local"
                      className="input schedule-datetime-input"
                      value={scheduledAt}
                      onChange={(e) => setScheduledAt(e.target.value)}
                      min={minDatetimeLocal()}
                      required={scheduleEnabled}
                    />
                    {scheduledAt && new Date(scheduledAt) > new Date() && (
                      <div className="schedule-preview">
                        <Zap size={12} />
                        <span>
                          Will publish on{' '}
                          <strong>
                            {new Date(scheduledAt).toLocaleString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit',
                            })}
                          </strong>
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
              {/* ─────────────────────────────────────────────── */}

              {error && <div className="form-error">⚠️ {error}</div>}

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => {
                    if (communityIdParam) {
                      navigate(`/communities/${communityIdParam}`);
                    } else {
                      navigate('/feed');
                    }
                  }}
                >
                  Cancel
                </button>
                <button
                  className={scheduleEnabled ? 'btn-schedule' : 'btn-primary'}
                  type="submit"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="spinner spinner-sm" />
                  ) : scheduleEnabled ? (
                    <>
                      <Calendar size={14} />
                      {isScheduleReady ? 'Schedule post' : 'Schedule post'}
                    </>
                  ) : (
                    'Publish post'
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
