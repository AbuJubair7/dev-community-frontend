import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { login as loginApi } from '../services/auth.service.js';

export default function Login() {
  const { login, isAuth } = useAuth();
  const navigate = useNavigate();
  const [form, setForm]     = useState({ email: '', password: '' });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  if (isAuth) { navigate('/feed', { replace: true }); return null; }

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const res = await loginApi(form);
      // Backend returns { token, user: { _id, fname, lname, email, ... } }
      const token = res.token || res.access_token;
      const userData = res.user || { email: form.email };
      login(token, userData); // AuthContext will enrich _id from JWT payload
      navigate('/feed');
    } catch (err) {
      setError(err.message || 'Invalid email or password.');
    } finally { setLoading(false); }
  };

  return (
    <div className="page-centered">
      <div className="auth-card">
        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-subtitle">Log in to your DevCom account</p>
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="input" type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="input" type="password" placeholder="••••••••" value={form.password} onChange={set('password')} required />
          </div>
          {error && <div className="form-error">⚠️ {error}</div>}
          <button className="btn-primary" type="submit" disabled={loading} style={{ width: '100%', height: 42 }}>
            {loading ? <span className="spinner spinner-sm" /> : 'Log in'}
          </button>
        </form>
        <div className="auth-footer">Don't have an account? <Link to="/register">Create one</Link></div>
      </div>
    </div>
  );
}
