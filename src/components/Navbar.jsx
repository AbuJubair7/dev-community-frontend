import { useState, useEffect, useCallback, useRef } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import {
  getMyInvitations,
  getMyManagedRequests,
  acceptInvite,
  declineInvite,
  acceptRequest,
  declineRequest,
} from '../services/community.service.js';
import { Bell, Check, X } from 'lucide-react';

function initials(user) {
  if (!user) return '?';
  return `${user.fname?.[0] ?? ''}${user.lname?.[0] ?? ''}`.toUpperCase();
}

export default function Navbar() {
  const { isAuth, token, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [invites, setInvites] = useState([]);
  const [requests, setRequests] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const fetchPendingData = useCallback(async () => {
    if (!isAuth || !token) return;
    try {
      const [invitesData, requestsData] = await Promise.all([
        getMyInvitations(token),
        getMyManagedRequests(token),
      ]);
      setInvites(invitesData);
      setRequests(requestsData);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  }, [token, isAuth]);

  useEffect(() => {
    fetchPendingData();
  }, [fetchPendingData, location]);

  useEffect(() => {
    if (!isAuth) return;
    const interval = setInterval(() => {
      fetchPendingData();
    }, 10000);
    return () => clearInterval(interval);
  }, [fetchPendingData, isAuth]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownRef]);

  const handleAcceptInvite = async (inviteId) => {
    try {
      await acceptInvite(inviteId, token);
      await fetchPendingData();
      alert('Accepted community invitation!');
      navigate(`/communities`);
    } catch (err) {
      alert(err.message || 'Failed to accept invitation.');
    }
  };

  const handleDeclineInvite = async (inviteId) => {
    try {
      await declineInvite(inviteId, token);
      await fetchPendingData();
    } catch (err) {
      alert(err.message || 'Failed to decline invitation.');
    }
  };

  const handleAcceptRequest = async (communityId, requestId) => {
    try {
      await acceptRequest(communityId, requestId, token);
      await fetchPendingData();
      alert('Approved join request!');
    } catch (err) {
      alert(err.message || 'Failed to approve request.');
    }
  };

  const handleDeclineRequest = async (communityId, requestId) => {
    try {
      await declineRequest(communityId, requestId, token);
      await fetchPendingData();
    } catch (err) {
      alert(err.message || 'Failed to decline request.');
    }
  };

  const badgeCount = invites.length + requests.length;

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <NavLink to="/" className="navbar-logo">
          <div className="navbar-logo-mark">🌐</div>
          DevCom
        </NavLink>

        <div className="navbar-links">
          {isAuth && (
            <>
              <NavLink to="/feed" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>Feed</NavLink>
              <NavLink to="/communities" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>Communities</NavLink>
              <NavLink to="/members" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>Members</NavLink>
            </>
          )}
        </div>

        <div className="navbar-right">
          {isAuth ? (
            <>
              {/* Taskbar Requests & Invites Option (Bell Menu) */}
              <div className="navbar-notifications-container" ref={dropdownRef} style={{ position: 'relative' }}>
                <button
                  className="btn-ghost"
                  onClick={() => setIsOpen(!isOpen)}
                  title="Invitations & Requests"
                  style={{
                    position: 'relative',
                    padding: '8px 10px',
                    borderRadius: 'var(--radius)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    gap: 6,
                    height: 38,
                  }}
                >
                  <Bell size={17} />
                  {badgeCount > 0 && (
                    <span
                      style={{
                        background: 'var(--danger)',
                        color: 'white',
                        borderRadius: '12px',
                        fontSize: '10px',
                        fontWeight: 'bold',
                        padding: '2px 6px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        lineHeight: 1,
                      }}
                    >
                      {badgeCount}
                    </span>
                  )}
                </button>

                {isOpen && (
                  <div
                    className="card"
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 8px)',
                      right: 0,
                      width: 320,
                      maxHeight: 400,
                      overflowY: 'auto',
                      zIndex: 1000,
                      boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                      padding: 16,
                      background: 'var(--bg-surface)',
                      borderRadius: 'var(--radius)',
                      border: '1px solid rgba(0,0,0,0.08)',
                    }}
                  >
                    <h3 style={{ fontSize: 13, fontWeight: 750, marginBottom: 12, borderBottom: '1px solid rgba(0,0,0,0.06)', paddingBottom: 6, color: 'var(--text-primary)' }}>
                      Invitations & Requests ({badgeCount})
                    </h3>
                    
                    {badgeCount === 0 ? (
                      <p style={{ fontSize: 12, color: 'var(--text-secondary)', textAlign: 'center', padding: '16px 0' }}>
                        No pending items.
                      </p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {/* Invites list */}
                        {invites.map((invite) => (
                          <div key={invite._id} style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '8px 0', borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
                            <span style={{ fontSize: 12.5, lineHeight: 1.4, color: 'var(--text-primary)' }}>
                              Invited to <strong>{invite.communityName}</strong> by <em>{invite.inviterName}</em>.
                            </span>
                            <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                              <button
                                className="btn-primary btn-sm"
                                onClick={() => handleAcceptInvite(invite._id)}
                                style={{ background: 'var(--success)', padding: '2px 8px', fontSize: 11, height: 26 }}
                              >
                                <Check size={11} style={{ marginRight: 2 }} /> Accept
                              </button>
                              <button
                                className="btn-danger btn-sm"
                                onClick={() => handleDeclineInvite(invite._id)}
                                style={{ padding: '2px 8px', fontSize: 11, height: 26 }}
                              >
                                <X size={11} style={{ marginRight: 2 }} /> Decline
                              </button>
                            </div>
                          </div>
                        ))}

                        {/* Requests list */}
                        {requests.map((reqItem) => (
                          <div key={reqItem._id} style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '8px 0', borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
                            <span style={{ fontSize: 12.5, lineHeight: 1.4, color: 'var(--text-primary)' }}>
                              <strong>{reqItem.userName}</strong> requests to join <strong>{reqItem.communityName}</strong>.
                            </span>
                            <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                              <button
                                className="btn-primary btn-sm"
                                onClick={() => handleAcceptRequest(reqItem.communityId, reqItem._id)}
                                style={{ background: 'var(--success)', padding: '2px 8px', fontSize: 11, height: 26 }}
                              >
                                <Check size={11} style={{ marginRight: 2 }} /> Approve
                              </button>
                              <button
                                className="btn-danger btn-sm"
                                onClick={() => handleDeclineRequest(reqItem.communityId, reqItem._id)}
                                style={{ padding: '2px 8px', fontSize: 11, height: 26 }}
                              >
                                <X size={11} style={{ marginRight: 2 }} /> Decline
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <NavLink to="/profile" className="navbar-user" style={{ textDecoration: 'none' }}>
                <div className="avatar avatar-sm">{initials(user)}</div>
                <span>{user?.fname} {user?.lname}</span>
              </NavLink>
              <button className="btn-ghost btn-sm" onClick={() => { logout(); navigate('/'); }}>Logout</button>
            </>
          ) : (
            <>
              <NavLink to="/login" className="btn-ghost btn-sm">Log in</NavLink>
              <NavLink to="/register" className="btn-primary btn-sm">Get Started</NavLink>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
