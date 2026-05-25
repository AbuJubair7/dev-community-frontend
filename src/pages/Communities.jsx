import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import {
  getCommunities,
  getMyInvitations,
  acceptInvite,
  declineInvite,
} from '../services/community.service.js';
import Spinner from '../components/Spinner.jsx';
import ErrorCard from '../components/ErrorCard.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { Users, AlertCircle, Check, X, Shield } from 'lucide-react';

export default function Communities() {
  const { token, isAuth } = useAuth();
  const navigate = useNavigate();
  const [communities, setCommunities] = useState([]);
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionBusy, setActionBusy] = useState(false);

  useEffect(() => {
    if (!isAuth) navigate('/login', { replace: true });
  }, [isAuth, navigate]);

  const fetchData = useCallback(async () => {
    if (!token) return;
    try {
      const [commData, invitesData] = await Promise.all([
        getCommunities(token),
        getMyInvitations(token),
      ]);
      setCommunities(commData);
      setInvites(invitesData);
    } catch (err) {
      setError(err.message || 'Failed to fetch communities.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAcceptInvite = async (inviteId) => {
    if (actionBusy) return;
    setActionBusy(true);
    try {
      await acceptInvite(inviteId, token);
      await fetchData();
    } catch (err) {
      alert(err.message || 'Failed to accept invitation.');
    } finally {
      setActionBusy(false);
    }
  };

  const handleDeclineInvite = async (inviteId) => {
    if (actionBusy) return;
    setActionBusy(true);
    try {
      await declineInvite(inviteId, token);
      await fetchData();
    } catch (err) {
      alert(err.message || 'Failed to decline invitation.');
    } finally {
      setActionBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="page">
        <div className="container">
          <Spinner />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <div className="container">
          <ErrorCard message={error} />
        </div>
      </div>
    );
  }

  const getCommunityName = (communityId) => {
    const comm = communities.find((c) => c._id === communityId);
    return comm ? comm.name : `Community (ID: ${communityId})`;
  };

  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <div>
            <h1 className="page-title">Communities</h1>
            <p className="page-subtitle">Connect with developers in structured community subgroups.</p>
          </div>
          <Link to="/communities/new" className="btn-primary">
            Create Community
          </Link>
        </div>

        {/* ── Pending Invitations ── */}
        {invites.length > 0 && (
          <div style={{ marginBottom: 32 }}>
            <div className="section-header">
              <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--accent-light)' }}>
                <AlertCircle size={15} /> Pending Invitations ({invites.length})
              </h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {invites.map((invite) => (
                <div key={invite._id} className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderLeft: '4px solid var(--accent)' }}>
                  <div>
                    <h3 style={{ fontSize: 14.5, fontWeight: 700 }}>Invitation</h3>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
                      You have been invited to join <strong>{getCommunityName(invite.communityId)}</strong>.
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      className="btn-primary btn-sm"
                      onClick={() => handleAcceptInvite(invite._id)}
                      disabled={actionBusy}
                      style={{ background: 'var(--success)' }}
                    >
                      <Check size={14} /> Accept
                    </button>
                    <button
                      className="btn-danger btn-sm"
                      onClick={() => handleDeclineInvite(invite._id)}
                      disabled={actionBusy}
                    >
                      <X size={14} /> Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Communities List ── */}
        <div className="section-header">
          <h2 className="section-title">All Communities</h2>
        </div>

        {communities.length === 0 ? (
          <EmptyState
            title="No Communities Yet"
            description="Be the first to create a developer community subgroup."
          />
        ) : (
          <div className="members-grid">
            {communities.map((comm) => (
              <div
                key={comm._id}
                onClick={() => navigate(`/communities/${comm._id}`)}
                className="card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: 20,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 'var(--radius)',
                        background: 'linear-gradient(135deg, var(--accent), var(--accent-light))',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontWeight: 'bold',
                        fontSize: 16,
                      }}
                    >
                      <Users size={20} />
                    </div>
                    <h3 style={{ fontSize: 15.5, fontWeight: 750, color: 'var(--text-primary)' }}>{comm.name}</h3>
                  </div>
                  <p
                    style={{
                      fontSize: 13,
                      color: 'var(--text-secondary)',
                      lineHeight: 1.6,
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      marginBottom: 16,
                    }}
                  >
                    {comm.description || 'No description provided.'}
                  </p>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'auto' }}>
                  <span className="btn-ghost btn-sm" style={{ fontSize: 11.5 }}>
                    Enter Community
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
