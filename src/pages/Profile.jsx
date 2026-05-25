import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { getSkills, createSkill, deleteSkill } from '../services/skills.service.js';
import { getExperiences, createExperience, updateExperience, deleteExperience } from '../services/experiences.service.js';
import { deleteUser } from '../services/users.service.js';
import Spinner from '../components/Spinner.jsx';
import ErrorCard from '../components/ErrorCard.jsx';
import EmptyState from '../components/EmptyState.jsx';
import SkillTag from '../components/SkillTag.jsx';

function initials(u) {
  if (!u) return '?';
  return `${u.fname?.[0] ?? ''}${u.lname?.[0] ?? ''}`.toUpperCase();
}

function fmt(str) {
  if (!str) return '';
  return new Date(str).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

const EMPTY_EXP = { companyName: '', role: '', startDate: '', endDate: '', description: '' };

export default function Profile() {
  const { token, user, isAuth, logout } = useAuth();
  const navigate = useNavigate();

  const [skills, setSkills]         = useState([]);
  const [experiences, setExp]       = useState([]);
  const [loadingSkills, setLSkills] = useState(true);
  const [loadingExp, setLExp]       = useState(true);
  const [error, setError]           = useState('');

  // Skill form
  const [newSkill, setNewSkill]     = useState('');
  const [addingSkill, setAddSkill]  = useState(false);

  // Experience form (used for both add and edit)
  const [showExpForm, setShowExp]   = useState(false);
  const [editingExpId, setEditingExpId] = useState(null); // null = adding, string = editing
  const [expForm, setExpForm]       = useState(EMPTY_EXP);
  const [addingExp, setAddExp]      = useState(false);
  const [expError, setExpError]     = useState('');

  // Delete account
  const [confirmDel, setConfirmDel] = useState(false);
  const [deleting, setDeleting]     = useState(false);

  useEffect(() => {
    if (!isAuth) { navigate('/login', { replace: true }); return; }
    getSkills(token).then(setSkills).catch(() => {}).finally(() => setLSkills(false));
    getExperiences(token).then(setExp).catch(() => {}).finally(() => setLExp(false));
  }, [token, isAuth, navigate]);

  // ── Skills ──────────────────────────────────────────────────────────────
  const handleAddSkill = async (e) => {
    e.preventDefault();
    if (!newSkill.trim()) return;
    setAddSkill(true);
    try {
      await createSkill({ name: newSkill.trim() }, token);
      setSkills(await getSkills(token));
      setNewSkill('');
    } catch (err) { setError(err.message || 'Failed to add skill.'); }
    finally { setAddSkill(false); }
  };

  const handleDeleteSkill = async (skillId) => {
    try {
      await deleteSkill(skillId, token);
      setSkills(await getSkills(token));
    } catch (err) { setError(err.message || 'Failed to remove skill.'); }
  };

  // ── Experience ───────────────────────────────────────────────────────────
  const setExpField = (k) => (e) => setExpForm((f) => ({ ...f, [k]: e.target.value }));

  const openAddExp = () => {
    setEditingExpId(null);
    setExpForm(EMPTY_EXP);
    setExpError('');
    setShowExp(true);
  };

  const openEditExp = (exp) => {
    setEditingExpId(exp._id);
    setExpForm({
      companyName: exp.companyName || '',
      role: exp.role || '',
      startDate: exp.startDate ? exp.startDate.slice(0, 10) : '',
      endDate: exp.endDate ? exp.endDate.slice(0, 10) : '',
      description: exp.description || '',
    });
    setExpError('');
    setShowExp(true);
  };

  const handleSaveExp = async (e) => {
    e.preventDefault();
    setExpError('');
    setAddExp(true);
    try {
      if (editingExpId) {
        await updateExperience(editingExpId, expForm, token);
      } else {
        await createExperience(expForm, token);
      }
      setExp(await getExperiences(token));
      setShowExp(false);
      setEditingExpId(null);
      setExpForm(EMPTY_EXP);
    } catch (err) { setExpError(err.message || 'Failed to save experience.'); }
    finally { setAddExp(false); }
  };

  const handleDeleteExp = async (expId) => {
    try {
      await deleteExperience(expId, token);
      setExp(await getExperiences(token));
    } catch (err) { setError(err.message || 'Failed to remove experience.'); }
  };

  // ── Delete account ───────────────────────────────────────────────────────
  const handleDeleteAccount = async () => {
    setDeleting(true);
    try { await deleteUser(token); logout(); navigate('/'); }
    catch (err) { setError(err.message || 'Failed to delete account.'); setDeleting(false); }
  };

  if (!user) return null;

  return (
    <div className="page">
      <div className="container">
        {/* Header */}
        <div className="profile-header">
          <div className="avatar avatar-lg">{initials(user)}</div>
          <div className="profile-info">
            <h1>{user.fname} {user.lname}</h1>
            <p>{user.email}</p>
          </div>
          <Link to="/profile/edit" className="btn-ghost btn-sm" style={{ marginLeft: 'auto' }}>Edit Profile</Link>
        </div>

        {error && <ErrorCard message={error} />}
        <div className="divider" />

        {/* Skills */}
        <div>
          <div className="section-header"><span className="section-title">Skills</span></div>
          {loadingSkills ? <Spinner /> : (
            <>
              <div className="skills-wrap">
                {skills.length === 0 && <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>No skills added yet.</span>}
                {skills.map((s) => (
                  <SkillTag key={s._id} name={s.name} onDelete={() => handleDeleteSkill(s._id)} />
                ))}
              </div>
              <form className="inline-form" onSubmit={handleAddSkill}>
                <input className="input" placeholder="Add a skill…" style={{ maxWidth: 220 }} value={newSkill} onChange={(e) => setNewSkill(e.target.value)} />
                <button className="btn-ghost btn-sm" type="submit" disabled={addingSkill || !newSkill.trim()}>
                  {addingSkill ? <span className="spinner spinner-sm" /> : '+ Add'}
                </button>
              </form>
            </>
          )}
        </div>

        <div className="divider" />

        {/* Experience */}
        <div>
          <div className="section-header">
            <span className="section-title">Experience</span>
            {!showExpForm && (
              <button className="btn-ghost btn-sm" onClick={openAddExp}>+ Add</button>
            )}
          </div>

          {showExpForm && (
            <div className="card" style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 16 }}>
                {editingExpId ? 'Edit Experience' : 'Add Experience'}
              </p>
              <form onSubmit={handleSaveExp} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">Company</label>
                    <input className="input" placeholder="Tech Corp" value={expForm.companyName} onChange={setExpField('companyName')} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Role</label>
                    <input className="input" placeholder="Software Engineer" value={expForm.role} onChange={setExpField('role')} required />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">Start Date</label>
                    <input className="input" type="date" value={expForm.startDate} onChange={setExpField('startDate')} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">End Date <span style={{ opacity: 0.5 }}>(optional)</span></label>
                    <input className="input" type="date" value={expForm.endDate} onChange={setExpField('endDate')} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Description <span style={{ opacity: 0.5 }}>(optional)</span></label>
                  <textarea className="textarea" style={{ minHeight: 80 }} value={expForm.description} onChange={setExpField('description')} />
                </div>
                {expError && <div className="form-error">⚠️ {expError}</div>}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                  <button type="button" className="btn-ghost btn-sm" onClick={() => { setShowExp(false); setEditingExpId(null); }}>Cancel</button>
                  <button type="submit" className="btn-primary btn-sm" disabled={addingExp}>
                    {addingExp ? <span className="spinner spinner-sm" /> : editingExpId ? '✓ Save changes' : 'Add Experience'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {loadingExp ? <Spinner /> : experiences.length === 0
            ? <EmptyState icon="💼" title="No experiences yet" message="Add your work history." />
            : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {experiences.map((exp) => (
                  <div key={exp._id} className="exp-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div className="exp-card-title">{exp.role}</div>
                        <div className="exp-card-company">{exp.companyName}</div>
                        <div className="exp-card-dates">{fmt(exp.startDate)} — {exp.endDate ? fmt(exp.endDate) : 'Present'}</div>
                        {exp.description && <div className="exp-card-desc">{exp.description}</div>}
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexShrink: 0, marginLeft: 12 }}>
                        <button className="btn-ghost btn-sm" onClick={() => openEditExp(exp)}>Edit</button>
                        <button className="btn-danger btn-sm" onClick={() => handleDeleteExp(exp._id)}>Remove</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          }
        </div>

        <div className="divider" />

        {/* Danger zone */}
        <div>
          <p className="section-title" style={{ color: 'var(--danger)', marginBottom: 12 }}>Danger Zone</p>
          {!confirmDel
            ? <button className="btn-danger btn-sm" onClick={() => setConfirmDel(true)}>Delete account</button>
            : <div className="confirm-banner">
                <span>This will permanently delete your account. Are you sure?</span>
                <div className="confirm-banner-actions">
                  <button className="btn-ghost btn-sm" onClick={() => setConfirmDel(false)}>Cancel</button>
                  <button className="btn-danger btn-sm" onClick={handleDeleteAccount} disabled={deleting}>
                    {deleting ? <span className="spinner spinner-sm" /> : 'Yes, delete'}
                  </button>
                </div>
              </div>
          }
        </div>
      </div>
    </div>
  );
}
