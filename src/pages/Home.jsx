import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Home() {
  const { isAuth } = useAuth();
  const navigate = useNavigate();
  useEffect(() => { if (isAuth) navigate('/feed', { replace: true }); }, [isAuth, navigate]);

  return (
    <div className="hero">
      <div className="hero-eyebrow">✦ Developer Community Platform</div>
      <h1 className="hero-title">Connect with <span>developers</span> who build things</h1>
      <p className="hero-subtitle">Share your work, showcase your skills, and connect with a community of developers passionate about building great software.</p>
      <div className="hero-actions">
        <Link to="/register" className="btn-primary" style={{ height: 44, padding: '0 28px', fontSize: 15 }}>Join the community</Link>
        <Link to="/login"    className="btn-ghost"   style={{ height: 44, padding: '0 24px', fontSize: 15 }}>Log in</Link>
      </div>
    </div>
  );
}
