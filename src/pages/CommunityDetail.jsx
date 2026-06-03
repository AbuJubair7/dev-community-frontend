import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import {
  getCommunity,
  getCommunityMembers,
  getCommunityRequests,
  getMyCommunityRole,
  requestToJoin,
  inviteUser,
  acceptRequest,
  declineRequest,
  changeMemberRole,
  removeMember,
  deleteCommunity,
  acceptInvite,
  declineInvite,
} from '../services/community.service.js';
import { getPosts } from '../services/posts.service.js';
import { getUsers } from '../services/users.service.js';
import Spinner from '../components/Spinner.jsx';
import ErrorCard from '../components/ErrorCard.jsx';
import PostCard from '../components/PostCard.jsx';
import EmptyState from '../components/EmptyState.jsx';
import {
  Shield,
  UserPlus,
  Trash2,
  Users,
  MessageSquare,
  UserCheck,
  Crown,
  ChevronRight,
  LogOut,
} from 'lucide-react';

export default function CommunityDetail() {
  const { id } = useParams();
  const { token, user, isAuth } = useAuth();
  const navigate = useNavigate();

  // Core Community state
  const [community, setCommunity] = useState(null);
  const [members, setMembers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [myRole, setMyRole] = useState(null); // 'admin' | 'moderator' | 'member' | null
  const [relationStatus, setRelationStatus] = useState('none'); // 'member' | 'requested' | 'invited' | 'none'
  const [inviteId, setInviteId] = useState(null);
  const [posts, setPosts] = useState([]);
  const [allUsers, setAllUsers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('posts'); // 'posts' | 'members' | 'manage'

  // Action states
  const [actionBusy, setActionBusy] = useState(false);
  const [inviteUserId, setInviteUserId] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState('');
  const [inviteError, setInviteError] = useState('');

  useEffect(() => {
    if (!isAuth) navigate('/login', { replace: true });
  }, [isAuth, navigate]);

  const fetchCommunityData = useCallback(async () => {
    if (!token || !id) return;
    try {
      const [comm, roleRes, mems, users] = await Promise.all([
        getCommunity(id, token),
        getMyCommunityRole(id, token),
        getCommunityMembers(id, token),
        getUsers(token),
      ]);

      setCommunity(comm);
      setMyRole(roleRes.role);
      setRelationStatus(roleRes.status || 'none');
      setInviteId(roleRes.inviteId || null);
      setMembers(mems);
      setAllUsers(users);

      // If user is member, fetch posts & pending requests if admin/mod
      if (roleRes.status === 'member') {
        const allPosts = await getPosts(token);
        // Filter posts that belong to this community and are published
        const commPosts = allPosts.filter((p) => p.communityId === id && p.status !== 'scheduled');
        setPosts(commPosts);

        if (roleRes.role === 'admin' || roleRes.role === 'moderator') {
          const reqs = await getCommunityRequests(id, token);
          setRequests(reqs);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load community details.');
    } finally {
      setLoading(false);
    }
  }, [id, token]);

  useEffect(() => {
    fetchCommunityData();
  }, [fetchCommunityData]);

  const handleJoinRequest = async () => {
    if (actionBusy) return;
    setActionBusy(true);
    try {
      await requestToJoin(id, token);
      alert('Join request sent successfully!');
      fetchCommunityData();
    } catch (err) {
      alert(err.message || 'Failed to submit join request.');
    } finally {
      setActionBusy(false);
    }
  };

  const handleAcceptInvite = async (invId) => {
    if (actionBusy) return;
    setActionBusy(true);
    try {
      await acceptInvite(invId, token);
      alert('Invitation accepted successfully!');
      await fetchCommunityData();
    } catch (err) {
      alert(err.message || 'Failed to accept invitation.');
    } finally {
      setActionBusy(false);
    }
  };

  const handleDeclineInvite = async (invId) => {
    if (actionBusy) return;
    setActionBusy(true);
    try {
      await declineInvite(invId, token);
      alert('Invitation declined.');
      await fetchCommunityData();
    } catch (err) {
      alert(err.message || 'Failed to decline invitation.');
    } finally {
      setActionBusy(false);
    }
  };

  const handleInviteUser = async (e) => {
    e.preventDefault();
    if (!inviteUserId || actionBusy) return;
    setActionBusy(true);
    setInviteSuccess('');
    setInviteError('');
    try {
      await inviteUser(id, inviteUserId, token);
      setInviteSuccess('Invitation sent successfully!');
      setInviteUserId('');
    } catch (err) {
      setInviteError(err.message || 'Failed to send invitation.');
    } finally {
      setActionBusy(false);
    }
  };

  const handleAcceptRequest = async (requestId) => {
    if (actionBusy) return;
    setActionBusy(true);
    try {
      await acceptRequest(id, requestId, token);
      await fetchCommunityData();
    } catch (err) {
      alert(err.message || 'Failed to accept request.');
    } finally {
      setActionBusy(false);
    }
  };

  const handleDeclineRequest = async (requestId) => {
    if (actionBusy) return;
    setActionBusy(true);
    try {
      await declineRequest(id, requestId, token);
      await fetchCommunityData();
    } catch (err) {
      alert(err.message || 'Failed to decline request.');
    } finally {
      setActionBusy(false);
    }
  };

  const handleChangeRole = async (memberId, currentRole) => {
    if (actionBusy) return;
    const nextRole = currentRole === 'moderator' ? 'member' : 'moderator';
    setActionBusy(true);
    try {
      await changeMemberRole(id, memberId, nextRole, token);
      await fetchCommunityData();
    } catch (err) {
      alert(err.message || 'Failed to change role.');
    } finally {
      setActionBusy(false);
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (actionBusy) return;
    if (!confirm('Are you sure you want to remove this member?')) return;
    setActionBusy(true);
    try {
      await removeMember(id, memberId, token);
      await fetchCommunityData();
    } catch (err) {
      alert(err.message || 'Failed to remove member.');
    } finally {
      setActionBusy(false);
    }
  };

  const handleDeleteCommunity = async () => {
    if (actionBusy) return;
    if (
      !confirm(
        'CRITICAL: Are you sure you want to delete this community? All posts, members, and details will be deleted permanently. This cannot be undone.',
      )
    )
      return;
    setActionBusy(true);
    try {
      await deleteCommunity(id, token);
      navigate('/communities');
    } catch (err) {
      alert(err.message || 'Failed to delete community.');
      setActionBusy(false);
    }
  };

  const getUserDetails = (userId) => {
    const u = allUsers.find((userItem) => userItem._id === userId);
    return u
      ? { name: `${u.fname} ${u.lname}`.trim(), email: u.email }
      : { name: 'Unknown User', email: '' };
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

  if (error || !community) {
    return (
      <div className="page">
        <div className="container">
          <ErrorCard message={error || 'Community not found.'} />
        </div>
      </div>
    );
  }

  const isMember = relationStatus === 'member';
  const isAdmin = myRole === 'admin';
  const isMod = myRole === 'moderator' || isAdmin;

  // Filter users who are not already community members
  const memberUserIds = new Set(members.map((m) => m.userId));
  const inviteCandidates = allUsers.filter((u) => !memberUserIds.has(u._id));

  return (
    <div className="page">
      <div className="container">
        <div style={{ marginBottom: 24 }}>
          <Link to="/communities" className="btn-ghost btn-sm">
            ← All Communities
          </Link>
        </div>

        {/* ── Community Header Card ── */}
        <div
          className="card"
          style={{
            background: 'linear-gradient(to bottom right, var(--bg-surface), #f8fafc)',
            marginBottom: 28,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: 140,
              height: 140,
              background: 'radial-gradient(circle, var(--accent-glow) 0%, transparent 70%)',
              pointerEvents: 'none',
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <h1 className="page-title" style={{ margin: 0 }}>
                  {community.name}
                </h1>
                {myRole && (
                  <span
                    className="reply-pill"
                    style={{
                      background: isAdmin
                        ? 'rgba(217,119,6,0.1)'
                        : isMod
                        ? 'var(--accent-subtle)'
                        : 'var(--bg-elevated)',
                      color: isAdmin ? 'var(--warning)' : isMod ? 'var(--accent)' : 'var(--text-secondary)',
                      border: '1px solid rgba(0,0,0,0.05)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    {isAdmin ? <Crown size={12} /> : isMod ? <Shield size={12} /> : null}
                    {myRole.toUpperCase()}
                  </span>
                )}
              </div>
              <p style={{ marginTop: 12, color: 'var(--text-secondary)', fontSize: 14.5, lineHeight: 1.7, maxWidth: 680 }}>
                {community.description}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 16, fontSize: 12.5, color: 'var(--text-muted)' }}>
                <Users size={14} />
                <span>{members.length} member{members.length !== 1 ? 's' : ''}</span>
              </div>
            </div>
            <div>
              {isMember ? (
                <Link to={`/posts/new?communityId=${id}`} className="btn-primary">
                  New Post
                </Link>
              ) : relationStatus === 'requested' ? (
                <button className="btn-ghost" disabled style={{ background: 'var(--bg-elevated)', cursor: 'not-allowed', color: 'var(--text-muted)' }}>
                  Request Pending
                </button>
              ) : relationStatus === 'invited' ? (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    className="btn-primary btn-sm"
                    onClick={() => handleAcceptInvite(inviteId)}
                    disabled={actionBusy}
                    style={{ background: 'var(--success)' }}
                  >
                    Accept Invite
                  </button>
                  <button
                    className="btn-danger btn-sm"
                    onClick={() => handleDeclineInvite(inviteId)}
                    disabled={actionBusy}
                  >
                    Decline
                  </button>
                </div>
              ) : (
                <button className="btn-primary" onClick={handleJoinRequest} disabled={actionBusy}>
                  Request to Join
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Tabs (Only shown if member) ── */}
        {isMember ? (
          <>
            <div className="profile-tabs">
              <button
                className={`profile-tab ${activeTab === 'posts' ? 'active' : ''}`}
                onClick={() => setActiveTab('posts')}
              >
                <MessageSquare size={14} />
                Posts
                <span className="tab-count">{posts.length}</span>
              </button>
              <button
                className={`profile-tab ${activeTab === 'members' ? 'active' : ''}`}
                onClick={() => setActiveTab('members')}
              >
                <Users size={14} />
                Members
                <span className="tab-count">{members.length}</span>
              </button>
              {isMod && (
                <button
                  className={`profile-tab ${activeTab === 'manage' ? 'active' : ''}`}
                  onClick={() => setActiveTab('manage')}
                >
                  <Shield size={14} />
                  Manage
                  {requests.length > 0 && <span className="tab-count" style={{ background: 'var(--danger)', color: '#fff' }}>{requests.length}</span>}
                </button>
              )}
            </div>

            <div style={{ marginTop: 20 }}>
              {/* ── Posts Tab ── */}
              {activeTab === 'posts' && (
                <div>
                  {posts.length === 0 ? (
                    <EmptyState
                      title="No Posts Yet"
                      description="Create a post to start conversations in this community."
                    />
                  ) : (
                    <div className="posts-grid">
                      {posts.map((post) => {
                        const author = getUserDetails(post.userId);
                        return (
                          <PostCard
                            key={post._id}
                            post={{
                              ...post,
                              userName: author.name,
                            }}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ── Members Tab ── */}
              {activeTab === 'members' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {members.map((m) => {
                    const author = getUserDetails(m.userId);
                    const memberIsAdmin = m.role === 'admin';
                    const memberIsMod = m.role === 'moderator';
                    return (
                      <div
                        key={m._id}
                        className="card"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '12px 18px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div className="avatar avatar-sm">
                            {author.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 650, fontSize: 13.5, display: 'flex', alignItems: 'center', gap: 6 }}>
                              {author.name}
                              {memberIsAdmin ? (
                                <Crown size={12} style={{ color: 'var(--warning)' }} />
                              ) : memberIsMod ? (
                                <Shield size={12} style={{ color: 'var(--accent)' }} />
                              ) : null}
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>{author.email}</div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              padding: '2px 8px',
                              background: 'var(--bg-elevated)',
                              borderRadius: 'var(--radius-sm)',
                              color: 'var(--text-secondary)',
                            }}
                          >
                            {m.role}
                          </span>
                          {isAdmin && !memberIsAdmin && (
                            <button
                              className="btn-ghost btn-sm"
                              onClick={() => handleChangeRole(m.userId, m.role)}
                              disabled={actionBusy}
                              style={{ fontSize: 11 }}
                            >
                              {memberIsMod ? 'Demote' : 'Promote'}
                            </button>
                          )}
                          {isMod && !memberIsAdmin && (m.role !== 'moderator' || isAdmin) && (
                            <button
                              className="btn-danger btn-sm"
                              onClick={() => handleRemoveMember(m.userId)}
                              disabled={actionBusy}
                              style={{ padding: 6, height: 28, width: 28 }}
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ── Manage Tab ── */}
              {activeTab === 'manage' && isMod && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  {/* Invite user */}
                  <div className="card">
                    <h3 style={{ fontSize: 14.5, fontWeight: 750, marginBottom: 12 }}>Invite Developer</h3>
                    <form onSubmit={handleInviteUser} style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                      <div className="form-group" style={{ flex: 1, minWidth: 200 }}>
                        <label className="form-label">Select User</label>
                        <select
                          className="input"
                          value={inviteUserId}
                          onChange={(e) => setInviteUserId(e.target.value)}
                          required
                        >
                          <option value="">-- Choose User --</option>
                          {inviteCandidates.map((u) => (
                            <option key={u._id} value={u._id}>
                              {u.fname} {u.lname} ({u.email})
                            </option>
                          ))}
                        </select>
                      </div>
                      <button className="btn-primary" type="submit" disabled={actionBusy || !inviteUserId} style={{ height: 40 }}>
                        <UserPlus size={14} /> Send Invitation
                      </button>
                    </form>
                    {inviteSuccess && <div style={{ color: 'var(--success)', fontSize: 13, marginTop: 8 }}>✓ {inviteSuccess}</div>}
                    {inviteError && <div style={{ color: 'var(--danger)', fontSize: 13, marginTop: 8 }}>⚠️ {inviteError}</div>}
                  </div>

                  {/* Join requests */}
                  <div>
                    <div className="section-header">
                      <h3 className="section-title">Pending Join Requests ({requests.length})</h3>
                    </div>
                    {requests.length === 0 ? (
                      <div
                        className="card"
                        style={{
                          textAlign: 'center',
                          padding: 24,
                          color: 'var(--text-muted)',
                          fontSize: 13,
                        }}
                      >
                        No pending join requests.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {requests.map((reqItem) => {
                          const requester = getUserDetails(reqItem.userId);
                          return (
                            <div
                              key={reqItem._id}
                              className="card"
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '14px 20px',
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div className="avatar avatar-sm">
                                  {requester.name.slice(0, 2).toUpperCase()}
                                </div>
                                <div>
                                  <div style={{ fontWeight: 650, fontSize: 13.5 }}>{requester.name}</div>
                                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>{requester.email}</div>
                                </div>
                              </div>
                              <div style={{ display: 'flex', gap: 8 }}>
                                <button
                                  className="btn-primary btn-sm"
                                  onClick={() => handleAcceptRequest(reqItem._id)}
                                  disabled={actionBusy}
                                  style={{ background: 'var(--success)' }}
                                >
                                  <UserCheck size={13} /> Approve
                                </button>
                                <button
                                  className="btn-danger btn-sm"
                                  onClick={() => handleDeclineRequest(reqItem._id)}
                                  disabled={actionBusy}
                                >
                                  Decline
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Admin controls */}
                  {isAdmin && (
                    <div
                      className="card"
                      style={{
                        border: '1px solid rgba(220,38,38,0.2)',
                        background: 'rgba(220,38,38,0.03)',
                        padding: 20,
                        marginTop: 12,
                      }}
                    >
                      <h3 style={{ fontSize: 14, fontWeight: 750, color: 'var(--danger)', marginBottom: 6 }}>
                        Danger Zone
                      </h3>
                      <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginBottom: 16 }}>
                        Deleting this community deletes all its history, posts, and memberships permanently.
                      </p>
                      <button className="btn-danger" onClick={handleDeleteCommunity} disabled={actionBusy}>
                        <Trash2 size={14} /> Delete Community
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="card" style={{ textAlign: 'center', padding: 40, marginTop: 20, color: 'var(--text-secondary)' }}>
            <Users size={40} style={{ opacity: 0.2, marginBottom: 12 }} />
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
              {relationStatus === 'requested'
                ? 'Join Request Pending'
                : relationStatus === 'invited'
                ? 'You have been Invited!'
                : 'Join to Access Community Posts'}
            </h3>
            <p style={{ fontSize: 13.5, maxWidth: 360, margin: '0 auto 20px auto', lineHeight: 1.6 }}>
              {relationStatus === 'requested'
                ? 'Your request to join this community is pending review by the community administrators.'
                : relationStatus === 'invited'
                ? 'An administrator or moderator has invited you to join this community. Accept the invitation to access threads.'
                : 'You are currently viewing this community from the outside. Request to join this community to participate in discussion threads.'}
            </p>
            {relationStatus === 'invited' && (
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 16 }}>
                <button
                  className="btn-primary"
                  onClick={() => handleAcceptInvite(inviteId)}
                  disabled={actionBusy}
                  style={{ background: 'var(--success)' }}
                >
                  Accept Invitation
                </button>
                <button
                  className="btn-danger"
                  onClick={() => handleDeclineInvite(inviteId)}
                  disabled={actionBusy}
                >
                  Decline
                </button>
              </div>
            )}
            {relationStatus === 'none' && (
              <button className="btn-primary" onClick={handleJoinRequest} disabled={actionBusy}>
                Request to Join
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
