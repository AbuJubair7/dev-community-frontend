import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { getUserById } from '../services/users.service.js';
import { getSkillsByUserId } from '../services/skills.service.js';
import { getExperiencesByUserId } from '../services/experiences.service.js';
import { getPostsByUserId } from '../services/posts.service.js';
import Spinner from '../components/Spinner.jsx';
import ErrorCard from '../components/ErrorCard.jsx';
import EmptyState from '../components/EmptyState.jsx';
import SkillTag from '../components/SkillTag.jsx';
import ExperienceCard from '../components/ExperienceCard.jsx';
import PostCard from '../components/PostCard.jsx';

function initials(u) { return `${u.fname?.[0] ?? ''}${u.lname?.[0] ?? ''}`.toUpperCase(); }

const PALETTE = [
  ['rgba(99,102,241,0.18)', '#818cf8'], ['rgba(34,197,94,0.15)',  '#4ade80'],
  ['rgba(251,146,60,0.15)', '#fb923c'], ['rgba(232,121,249,0.15)','#e879f9'],
  ['rgba(251,191,36,0.15)', '#fbbf24'], ['rgba(56,189,248,0.15)', '#38bdf8'],
];
const avatarColor = (name) => PALETTE[(name || 'A').charCodeAt(0) % PALETTE.length];

export default function UserProfile() {
  const { id } = useParams();
  const { token, isAuth } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile]     = useState(null);
  const [skills, setSkills]       = useState([]);
  const [experiences, setExp]     = useState([]);
  const [posts, setPosts]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [activeTab, setActiveTab] = useState('posts');

  useEffect(() => {
    if (!isAuth) { navigate('/login', { replace: true }); return; }
    Promise.all([
      getUserById(id, token),
      getSkillsByUserId(id, token),
      getExperiencesByUserId(id, token),
      getPostsByUserId(id, token),
    ])
      .then(([u, s, e, p]) => {
        setProfile(u);
        setSkills(Array.isArray(s) ? s : s ? [s] : []);
        setExp(Array.isArray(e) ? e : e ? [e] : []);
        const postsArr = Array.isArray(p) ? p : p ? [p] : [];
        const authorName = `${u.fname} ${u.lname}`.trim();
        setPosts(postsArr.map((post) => ({ ...post, userName: authorName })));
      })
      .catch((err) => setError(err.message || 'Failed to load profile.'))
      .finally(() => setLoading(false));
  }, [id, token, isAuth, navigate]);

  if (loading) return <div className="page"><div className="container"><Spinner /></div></div>;
  if (error)   return <div className="page"><div className="container"><ErrorCard message={error} /></div></div>;
  if (!profile) return null;

  const [bg, color] = avatarColor(profile.fname);

  return (
    <div className="page">
      <div className="container">
        <div style={{ marginBottom: 24 }}><Link to="/members" className="btn-ghost btn-sm">← Back to members</Link></div>

        {/* Header */}
        <div className="profile-header">
          <div className="avatar avatar-lg" style={{ background: bg, color }}>{initials(profile)}</div>
          <div className="profile-info">
            <h1>{profile.fname} {profile.lname}</h1>
            <p>{profile.email}</p>
            <p style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 4 }}>
              {posts.length} post{posts.length !== 1 ? 's' : ''} · {skills.length} skill{skills.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="profile-tabs">
          {['posts', 'skills', 'experience'].map((tab) => (
            <button key={tab} className={`profile-tab${activeTab === tab ? ' active' : ''}`} onClick={() => setActiveTab(tab)}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              <span className="tab-count">
                {tab === 'posts' ? posts.length : tab === 'skills' ? skills.length : experiences.length}
              </span>
            </button>
          ))}
        </div>
        <div className="divider" style={{ margin: '0 0 24px' }} />

        {activeTab === 'posts' && (
          posts.length === 0
            ? <EmptyState icon="📝" title="No posts yet" message="This member hasn't shared anything yet." />
            : <div className="posts-grid">{posts.map((p) => <PostCard key={p._id} post={p} />)}</div>
        )}
        {activeTab === 'skills' && (
          skills.length === 0
            ? <EmptyState icon="🏷️" message="No skills listed." />
            : <div className="skills-wrap">{skills.map((s) => <SkillTag key={s._id} name={s.name} />)}</div>
        )}
        {activeTab === 'experience' && (
          experiences.length === 0
            ? <EmptyState icon="💼" message="No experience listed." />
            : <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {experiences.map((exp) => <ExperienceCard key={exp._id} exp={exp} />)}
              </div>
        )}
      </div>
    </div>
  );
}
