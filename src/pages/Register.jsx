import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { register as registerApi, getGoogleLink } from '../services/auth.service.js';
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

  const handleGoogleSignIn = async () => {
    setError('');
    try {
      const res = await getGoogleLink();
      if (res.url) {
        window.location.href = res.url;
      } else {
        throw new Error('Google sign-in URL not found.');
      }
    } catch (err) {
      setError(err.message || 'Failed to initialize Google Sign-In.');
    }
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

        <div className="auth-divider">or</div>

        <button className="btn-google" onClick={handleGoogleSignIn} type="button">
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
          </svg>
          Sign in with Google
        </button>

        <div className="auth-footer">Already have an account? <Link to="/login">Log in</Link></div>
      </div>
    </div>
  );
}
