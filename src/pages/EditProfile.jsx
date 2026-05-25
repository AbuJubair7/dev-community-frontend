import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { updateUser, updatePassword } from '../services/users.service.js';

export default function EditProfile() {
  const { token, user, isAuth, updateUser: setCtxUser } = useAuth();
  const navigate = useNavigate();
  const [profileForm, setProfileForm] = useState({ fname: '', lname: '' });
  const [passForm, setPassForm]       = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [profileMsg, setProfileMsg]   = useState('');
  const [profileErr, setProfileErr]   = useState('');
  const [passMsg, setPassMsg]         = useState('');
  const [passErr, setPassErr]         = useState('');
  const [savingP, setSavingP]         = useState(false);
  const [savingPw, setSavingPw]       = useState(false);

  useEffect(() => {
    if (!isAuth) { navigate('/login', { replace: true }); return; }
    if (user) setProfileForm({ fname: user.fname || '', lname: user.lname || '' });
  }, [isAuth, user, navigate]);

  const setP  = (k) => (e) => setProfileForm((f) => ({ ...f, [k]: e.target.value }));
  const setPw = (k) => (e) => setPassForm((f) => ({ ...f, [k]: e.target.value }));

  const handleProfileSave = async (e) => {
    e.preventDefault(); setProfileErr(''); setProfileMsg(''); setSavingP(true);
    try {
      await updateUser(profileForm, token);
      setCtxUser({ ...user, ...profileForm });
      setProfileMsg('✓ Profile updated successfully.');
    } catch (err) { setProfileErr(err.message || 'Failed to update profile.'); }
    finally { setSavingP(false); }
  };

  const handlePassSave = async (e) => {
    e.preventDefault(); setPassErr(''); setPassMsg('');
    if (passForm.newPassword !== passForm.confirmPassword) { setPassErr('Passwords do not match.'); return; }
    setSavingPw(true);
    try {
      await updatePassword(passForm, token);
      setPassMsg('✓ Password updated successfully.');
      setPassForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) { setPassErr(err.message || 'Failed to update password.'); }
    finally { setSavingPw(false); }
  };

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 560 }}>
        <div style={{ marginBottom: 24 }}><Link to="/profile" className="btn-ghost btn-sm">← Back to profile</Link></div>
        <div className="page-header"><h1 className="page-title">Edit Profile</h1></div>

        <div className="card" style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, color: 'var(--text-secondary)' }}>Personal Info</h2>
          <form onSubmit={handleProfileSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group"><label className="form-label">First name</label><input className="input" value={profileForm.fname} onChange={setP('fname')} required /></div>
              <div className="form-group"><label className="form-label">Last name</label><input className="input" value={profileForm.lname} onChange={setP('lname')} required /></div>
            </div>
            {profileErr && <div className="form-error">⚠️ {profileErr}</div>}
            {profileMsg && <div style={{ fontSize: 13, color: 'var(--success)' }}>{profileMsg}</div>}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn-primary btn-sm" disabled={savingP}>
                {savingP ? <span className="spinner spinner-sm" /> : 'Save changes'}
              </button>
            </div>
          </form>
        </div>

        <div className="card">
          <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, color: 'var(--text-secondary)' }}>Change Password</h2>
          <form onSubmit={handlePassSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group"><label className="form-label">Current password</label><input className="input" type="password" value={passForm.oldPassword} onChange={setPw('oldPassword')} required /></div>
            <div className="form-group"><label className="form-label">New password</label><input className="input" type="password" placeholder="Min 6 chars" value={passForm.newPassword} onChange={setPw('newPassword')} required /></div>
            <div className="form-group"><label className="form-label">Confirm new password</label><input className="input" type="password" value={passForm.confirmPassword} onChange={setPw('confirmPassword')} required /></div>
            {passErr && <div className="form-error">⚠️ {passErr}</div>}
            {passMsg && <div style={{ fontSize: 13, color: 'var(--success)' }}>{passMsg}</div>}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn-primary btn-sm" disabled={savingPw}>
                {savingPw ? <span className="spinner spinner-sm" /> : 'Update password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
