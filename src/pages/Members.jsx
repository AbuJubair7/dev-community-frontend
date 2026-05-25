import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { getUsers } from '../services/users.service.js';
import Spinner from '../components/Spinner.jsx';
import ErrorCard from '../components/ErrorCard.jsx';
import EmptyState from '../components/EmptyState.jsx';

function initials(u) { return `${u.fname?.[0] ?? ''}${u.lname?.[0] ?? ''}`.toUpperCase(); }

const PALETTE = [
  ['rgba(99,102,241,0.18)', '#818cf8'], ['rgba(34,197,94,0.15)',  '#4ade80'],
  ['rgba(251,146,60,0.15)', '#fb923c'], ['rgba(232,121,249,0.15)','#e879f9'],
  ['rgba(251,191,36,0.15)', '#fbbf24'], ['rgba(56,189,248,0.15)', '#38bdf8'],
];
const avatarColor = (name) => PALETTE[(name || 'A').charCodeAt(0) % PALETTE.length];

export default function Members() {
  const { token, isAuth, user: me } = useAuth();
  const navigate = useNavigate();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [search, setSearch]   = useState('');

  useEffect(() => {
    if (!isAuth) { navigate('/login', { replace: true }); return; }
    getUsers(token)
      .then(setMembers)
      .catch((err) => setError(err.message || 'Failed to load members.'))
      .finally(() => setLoading(false));
  }, [token, isAuth, navigate]);

  const filtered = members.filter((m) => {
    const q = search.toLowerCase();
    return !q || m.fname?.toLowerCase().includes(q) || m.lname?.toLowerCase().includes(q) || m.email?.toLowerCase().includes(q);
  });

  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <div>
            <h1 className="page-title">Community Members</h1>
            <p className="page-subtitle">{loading ? '…' : `${members.length} developers in the community`}</p>
          </div>
        </div>
        <div style={{ marginBottom: 24 }}>
          <input className="input" placeholder="Search by name or email…" value={search} onChange={(e) => setSearch(e.target.value)} style={{ maxWidth: 360 }} />
        </div>
        {loading && <Spinner />}
        {error && <ErrorCard message={error} />}
        {!loading && !error && filtered.length === 0 && (
          <EmptyState icon="👥" title="No members found" message={search ? 'Try a different search.' : 'No members yet.'} />
        )}
        {!loading && !error && filtered.length > 0 && (
          <div className="members-grid">
            {filtered.map((m) => {
              const isMe = me && m._id === me._id;
              const [bg, color] = avatarColor(m.fname);
              return (
                <Link to={isMe ? '/profile' : `/users/${m._id}`} key={m._id} className="member-card">
                  <div className="member-card-avatar" style={{ background: bg, color }}>{initials(m)}</div>
                  <div className="member-card-info">
                    <div className="member-card-name">
                      {m.fname} {m.lname}
                      {isMe && <span className="member-you-badge">You</span>}
                    </div>
                    <div className="member-card-email">{m.email}</div>
                  </div>
                  <div className="member-card-arrow">→</div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
