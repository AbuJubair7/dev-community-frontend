import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { createPost } from '../services/posts.service.js';
import { getMyCommunities } from '../services/community.service.js';
import Spinner from '../components/Spinner.jsx';

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

  useEffect(() => {
    if (!isAuth) {
      navigate('/login', { replace: true });
      return;
    }

    // Fetch user's joined communities
    getMyCommunities(token)
      .then((data) => {
        setCommunities(data);
        if (data.length > 0 && !communityIdParam) {
          // Default to the first community
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.communityId) {
      setError('You must select a community to publish this post.');
      return;
    }
    setLoading(true);
    try {
      await createPost(form, token);
      navigate(`/communities/${form.communityId}`);
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
          <h1 className="page-title">New Post</h1>
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
                <button className="btn-primary" type="submit" disabled={loading}>
                  {loading ? <span className="spinner spinner-sm" /> : 'Publish post'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
