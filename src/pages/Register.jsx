import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { register as registerApi } from '../services/auth.service.js';
import { login as loginApi } from '../services/auth.service.js';

export default function Register() {
  const { login, isAuth } = useAuth();
  const navigate = useNavigate();
  const [form, setForm]     = useState({ fname: '', lname: '', email: '', password: '' });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  if (isAuth) { navigate('/feed', { replace: true }); return null; }

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      await registerApi(form);
      // Auto-login after register
      const res = await loginApi({ email: form.email, password: form.password });
      const token = res.token || res.access_token;
      const userData = res.user || { email: form.email, fname: form.fname, lname: form.lname };
      login(token, userData);
      navigate('/feed');
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally { setLoading(false); }
  };

  return (
    <div className="page-centered">
      <div className="auth-card">
        <h1 className="auth-title">Create your account</h1>
        <p className="auth-subtitle">Join the DevCom developer community</p>
        <form className="auth-form" onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">First name</label>
              <input className="input" placeholder="John" value={form.fname} onChange={set('fname')} required />
            </div>
            <div className="form-group">
              <label className="form-label">Last name</label>
              <input className="input" placeholder="Doe" value={form.lname} onChange={set('lname')} required />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="input" type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="input" type="password" placeholder="Min 6 chars" value={form.password} onChange={set('password')} required minLength={6} />
          </div>
          {error && <div className="form-error">⚠️ {error}</div>}
          <button className="btn-primary" type="submit" disabled={loading} style={{ width: '100%', height: 42 }}>
            {loading ? <span className="spinner spinner-sm" /> : 'Create account'}
          </button>
        </form>
        <div className="auth-footer">Already have an account? <Link to="/login">Log in</Link></div>
      </div>
    </div>
  );
}
