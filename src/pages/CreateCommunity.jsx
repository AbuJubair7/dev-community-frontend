import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { createCommunity } from '../services/community.service.js';

export default function CreateCommunity() {
  const { token, isAuth } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', description: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuth) navigate('/login', { replace: true });
  }, [isAuth, navigate]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const comm = await createCommunity(form, token);
      navigate(`/communities/${comm._id}`);
    } catch (err) {
      setError(err.message || 'Failed to create community.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 680 }}>
        <div style={{ marginBottom: 24 }}>
          <Link to="/communities" className="btn-ghost btn-sm">
            ← Back to communities
          </Link>
        </div>
        <div className="page-header">
          <h1 className="page-title">New Community</h1>
        </div>
        <div className="card">
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="form-group">
              <label className="form-label">Community Name</label>
              <input
                className="input"
                placeholder="e.g. JavaScript Experts, Android Devs"
                value={form.name}
                onChange={set('name')}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                className="textarea"
                placeholder="What is this community about? Share its goals and guidelines…"
                style={{ minHeight: 140 }}
                value={form.description}
                onChange={set('description')}
                required
              />
            </div>
            {error && <div className="form-error">⚠️ {error}</div>}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <Link to="/communities" className="btn-ghost">
                Cancel
              </Link>
              <button className="btn-primary" type="submit" disabled={loading}>
                {loading ? <span className="spinner spinner-sm" /> : 'Create Community'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
