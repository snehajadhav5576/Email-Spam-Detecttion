import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { profileService } from '../../services/services';
import { useToast } from '../../context/ToastContext';
import { User, Lock, Trash2, Save, AlertTriangle } from 'lucide-react';

function Section({ title, icon: Icon, children }) {
  return (
    <div className="card" style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <Icon size={18} color="#4f8ef7" />
        <span className="card-title">{title}</span>
      </div>
      {children}
    </div>
  );
}

export function Profile() {
  const { user, refreshUser, logout } = useAuth();
  const { addToast } = useToast();

  const [nameForm, setNameForm] = useState({ name: user?.name || '' });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [saving, setSaving] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [deletingHistory, setDeletingHistory] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!nameForm.name.trim() || nameForm.name.trim().length < 2) {
      addToast('Name must be at least 2 characters', 'error');
      return;
    }
    setSaving(true);
    try {
      await profileService.updateProfile({ name: nameForm.name.trim() });
      await refreshUser();
      addToast('Profile updated successfully', 'success');
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword.length < 8) {
      addToast('New password must be at least 8 characters', 'error');
      return;
    }
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      addToast('Passwords do not match', 'error');
      return;
    }
    setSavingPw(true);
    try {
      await profileService.changePassword({
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      addToast('Password changed. Please sign in again.', 'success');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => logout(), 1500);
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to change password', 'error');
    } finally {
      setSavingPw(false);
    }
  };

  const handleDeleteHistory = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setDeletingHistory(true);
    try {
      await profileService.deleteHistory();
      addToast('All analysis history deleted', 'success');
      setConfirmDelete(false);
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to delete history', 'error');
    } finally {
      setDeletingHistory(false);
    }
  };

  return (
    <div style={{ maxWidth: 640 }}>
      <div className="page-header">
        <h2>Profile &amp; Settings</h2>
        <p>Manage your account information and preferences</p>
      </div>

      {/* Account Info */}
      <Section title="Account Information" icon={User}>
        <div style={{ marginBottom: 16, padding: 14, background: 'rgba(79,142,247,0.06)', borderRadius: 8, border: '1px solid rgba(79,142,247,0.15)' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: 2 }}>Email address (cannot be changed)</div>
          <div style={{ fontSize: '0.9rem', color: '#e2e8f0' }}>{user?.email}</div>
        </div>
        <div style={{ marginBottom: 16, padding: 14, background: 'rgba(79,142,247,0.06)', borderRadius: 8, border: '1px solid rgba(79,142,247,0.15)' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: 2 }}>Role</div>
          <div style={{ fontSize: '0.9rem', color: '#e2e8f0' }}>{user?.role}</div>
        </div>
        <form onSubmit={handleUpdateProfile}>
          <div className="form-group">
            <label className="form-label" htmlFor="profile-name">Display name</label>
            <input
              id="profile-name"
              type="text"
              className="form-input"
              value={nameForm.name}
              onChange={e => setNameForm({ name: e.target.value })}
              maxLength={120}
              required
            />
          </div>
          <button
            id="profile-save"
            type="submit"
            className="btn btn-primary"
            disabled={saving}
          >
            {saving ? <span className="spinner spinner-sm" /> : <Save size={16} />}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </Section>

      {/* Change Password */}
      <Section title="Change Password" icon={Lock}>
        <form onSubmit={handleChangePassword}>
          <div className="form-group">
            <label className="form-label" htmlFor="curr-password">Current password</label>
            <input
              id="curr-password"
              type="password"
              className="form-input"
              value={pwForm.currentPassword}
              onChange={e => setPwForm(f => ({ ...f, currentPassword: e.target.value }))}
              autoComplete="current-password"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="new-password">New password</label>
            <input
              id="new-password"
              type="password"
              className="form-input"
              value={pwForm.newPassword}
              onChange={e => setPwForm(f => ({ ...f, newPassword: e.target.value }))}
              autoComplete="new-password"
              minLength={8}
              required
            />
            <span className="form-hint">At least 8 characters</span>
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="confirm-password">Confirm new password</label>
            <input
              id="confirm-password"
              type="password"
              className="form-input"
              value={pwForm.confirmPassword}
              onChange={e => setPwForm(f => ({ ...f, confirmPassword: e.target.value }))}
              autoComplete="new-password"
              required
            />
          </div>
          <button
            id="change-password-submit"
            type="submit"
            className="btn btn-primary"
            disabled={savingPw}
          >
            {savingPw ? <span className="spinner spinner-sm" /> : <Lock size={16} />}
            {savingPw ? 'Changing...' : 'Change Password'}
          </button>
        </form>
      </Section>

      {/* Danger Zone */}
      <Section title="Danger Zone" icon={AlertTriangle}>
        <p style={{ fontSize: '0.875rem', color: '#94a3b8', marginBottom: 16 }}>
          Delete all your analysis history. This action cannot be undone.
        </p>
        {confirmDelete && (
          <div className="disclaimer" style={{ marginBottom: 12 }}>
            <AlertTriangle size={16} style={{ flexShrink: 0 }} />
            <span>Are you sure? All analysis history will be permanently deleted.</span>
          </div>
        )}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            id="delete-history-btn"
            className="btn btn-danger"
            onClick={handleDeleteHistory}
            disabled={deletingHistory}
          >
            {deletingHistory ? <span className="spinner spinner-sm" /> : <Trash2 size={16} />}
            {confirmDelete ? 'Confirm Delete All History' : 'Delete All History'}
          </button>
          {confirmDelete && (
            <button className="btn btn-secondary" onClick={() => setConfirmDelete(false)}>
              Cancel
            </button>
          )}
        </div>
      </Section>
    </div>
  );
}
