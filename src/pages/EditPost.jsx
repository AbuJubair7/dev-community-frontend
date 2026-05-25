import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { getPostById, updatePost } from '../services/posts.service.js';
import Spinner from '../components/Spinner.jsx';
import ErrorCard from '../components/ErrorCard.jsx';

export default function EditPost() {
  const { id } = useParams(); // post id
  const { token, user, isAuth } = useAuth();
  const navigate = useNavigate();

  const [form, setForm]       = useState({ title: '', content: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');

  useEffect(() => {
    if (!isAuth) { navigate('/login', { replace: true }); return; }

    getPostById(id, token)
      .then((post) => {
        // Only the owner can edit
        if (post.userId !== user._id) {
          navigate(`/posts/${id}`, { replace: true });
          return;
        }
        setForm({ title: post.title, content: post.content });
      })
      .catch((err) => setError(err.message || 'Failed to load post.'))
      .finally(() => setLoading(false));
  }, [id, token, isAuth, user, navigate]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      // Pass the post's own _id — backend verifies ownership via JWT userId
      await updatePost(id, form, token);
      navigate(`/posts/${id}`);
    } catch (err) {
      setError(err.message || 'Failed to update post.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="page"><div className="container"><Spinner /></div></div>;
  if (error && !form.title) return <div className="page"><div className="container"><ErrorCard message={error} /></div></div>;

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 680 }}>
        <div style={{ marginBottom: 24 }}>
          <Link to={`/posts/${id}`} className="btn-ghost btn-sm">← Back to post</Link>
        </div>

        <div className="page-header">
          <div>
            <h1 className="page-title">Edit Post</h1>
            <p className="page-subtitle">Make changes and save</p>
          </div>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="form-group">
              <label className="form-label">Title</label>
              <input
                className="input"
                placeholder="Post title"
                value={form.title}
                onChange={set('title')}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Content</label>
              <textarea
                className="textarea"
                placeholder="What's on your mind?"
                style={{ minHeight: 220 }}
                value={form.content}
                onChange={set('content')}
                required
              />
            </div>

            {error && <div className="form-error">⚠️ {error}</div>}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <Link to={`/posts/${id}`} className="btn-ghost">Cancel</Link>
              <button className="btn-primary" type="submit" disabled={saving}>
                {saving ? <span className="spinner spinner-sm" /> : '✓ Save changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
