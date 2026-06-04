import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { loginWithGoogle } from '../services/auth.service.js';

export default function GoogleCallback() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState('');
  const calledRef = useRef(false);

  useEffect(() => {
    const code = searchParams.get('code');
    if (!code) {
      setError('Authorization code is missing from Google redirect.');
      return;
    }

    if (calledRef.current) return;
    calledRef.current = true;

    async function handleAuth() {
      try {
        const res = await loginWithGoogle(code);
        
        const token = res.token || res.access_token;
        const userData = res.user;
        
        if (!token) {
          throw new Error('Authentication failed: No token received.');
        }

        login(token, userData);
        navigate('/');
      } catch (err) {
        console.error('Google Auth Error:', err);
        setError(err.message || 'Failed to sign in with Google. Please try again.');
      }
    }

    handleAuth();
  }, [searchParams, login, navigate]);

  return (
    <div className="page-centered">
      <div className="auth-card" style={{ textAlign: 'center' }}>
        {error ? (
          <>
            <h1 className="auth-title" style={{ color: 'var(--danger)' }}>Authentication Error</h1>
            <p className="auth-subtitle" style={{ marginTop: 12 }}>⚠️ {error}</p>
            <Link to="/login" className="btn-primary" style={{ display: 'inline-flex', width: '100%', marginTop: 16 }}>
              Back to Login
            </Link>
          </>
        ) : (
          <>
            <h1 className="auth-title">Authenticating</h1>
            <p className="auth-subtitle">Verifying your credentials with Google...</p>
            <div className="spinner-wrap" style={{ padding: '24px 0 0 0' }}>
              <div className="spinner" />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
