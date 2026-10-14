import { useEffect, useState } from 'react';
import { adminService } from '../../services/services';
import { useToast } from '../../context/ToastContext';
import { Users, BarChart2, Shield, Cpu, ToggleLeft, ToggleRight } from 'lucide-react';

function StatCard({ value, label, icon: Icon, color }) {
  return (
    <div className={`stat-card ${color}`}>
      <div className={`stat-icon ${color}`}><Icon size={22} /></div>
      <div>
        <div className="stat-value">{value ?? '—'}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}

export function Admin() {
  const { addToast } = useToast();
  const [dashboard, setDashboard] = useState(null);
  const [users, setUsers] = useState([]);
  const [modelInfo, setModelInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [usersPage, setUsersPage] = useState(0);
  const [usersTotalPages, setUsersTotalPages] = useState(0);
  const [togglingId, setTogglingId] = useState(null);

  const loadData = (page = 0) => {
    setLoading(true);
    Promise.all([
      adminService.getDashboard(),
      adminService.getUsers({ page, size: 20 }),
      adminService.getModelInfo(),
    ])
      .then(([dashRes, usersRes, modelRes]) => {
        setDashboard(dashRes.data.data);
        const userPage = usersRes.data.data;
        setUsers(userPage?.content || []);
        setUsersTotalPages(userPage?.totalPages || 0);
        setUsersPage(page);
        setModelInfo(modelRes.data.data);
      })
      .catch(() => addToast('Failed to load admin data', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(0); }, []);

  const handleToggleUser = async (id, currentActive) => {
    setTogglingId(id);
    try {
      await adminService.toggleUserStatus(id, !currentActive);
      addToast(`User ${currentActive ? 'disabled' : 'enabled'} successfully`, 'success');
      loadData(usersPage);
    } catch {
      addToast('Failed to update user status', 'error');
    } finally {
      setTogglingId(null);
    }
  };

  if (loading && !dashboard) {
    return (
      <div>
        <div className="stats-grid">
          {[1, 2, 3, 4].map(i => <div key={i} className="skeleton" style={{ height: 90 }} />)}
        </div>
        <div className="skeleton" style={{ height: 300, marginTop: 20 }} />
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h2>Admin Panel</h2>
        <p>System overview, user management, and model information</p>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <StatCard value={dashboard?.totalUsers?.toLocaleString()} label="Total Users" icon={Users} color="blue" />
        <StatCard value={dashboard?.activeUsers?.toLocaleString()} label="Active Users" icon={Shield} color="green" />
        <StatCard value={dashboard?.totalAnalyses?.toLocaleString()} label="Total Analyses" icon={BarChart2} color="purple" />
        <StatCard value={modelInfo?.version || '—'} label="Model Version" icon={Cpu} color="orange" />
      </div>

      {/* Model Info */}
      {modelInfo && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header">
            <span className="card-title">ML Model Information</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginTop: 8 }}>
            {[
              { label: 'Version', value: modelInfo.version },
              { label: 'Model Type', value: modelInfo.modelType },
              { label: 'Accuracy', value: modelInfo.metrics?.accuracy ? `${(modelInfo.metrics.accuracy * 100).toFixed(1)}%` : '—' },
              { label: 'F1 Score', value: modelInfo.metrics?.f1_score ? `${(modelInfo.metrics.f1_score * 100).toFixed(1)}%` : '—' },
              { label: 'False Positive Rate', value: modelInfo.metrics?.false_positive_rate !== undefined ? `${(modelInfo.metrics.false_positive_rate * 100).toFixed(2)}%` : '—' },
              { label: 'Dataset', value: modelInfo.metrics?.dataset || '—' },
            ].map(({ label, value }) => (
              <div key={label} style={{ padding: 12, background: 'rgba(79,142,247,0.06)', borderRadius: 8, border: '1px solid rgba(79,142,247,0.1)' }}>
                <div style={{ fontSize: '0.7rem', color: '#64748b', marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: '0.9rem', color: '#e2e8f0', fontWeight: 600 }}>{value}</div>
              </div>
            ))}
          </div>
          {modelInfo.metrics?.note && (
            <div className="disclaimer" style={{ marginTop: 16 }}>
              <span style={{ fontSize: '0.8rem' }}>⚠️ {modelInfo.metrics.note}</span>
            </div>
          )}
        </div>
      )}

      {/* Users table */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">User Management</span>
        </div>
        {users.length === 0 ? (
          <div className="empty-state"><p>No users found</p></div>
        ) : (
          <>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Joined</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td style={{ color: '#64748b', fontSize: '0.8rem' }}>#{u.id}</td>
                      <td>{u.name}</td>
                      <td style={{ color: '#64748b', fontSize: '0.85rem' }}>{u.email}</td>
                      <td>
                        <span className={`badge ${u.role === 'ADMIN' ? 'badge-spam' : 'badge-legit'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${u.active ? 'badge-legit' : 'badge-high'}`}>
                          {u.active ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td style={{ color: '#64748b', fontSize: '0.8rem' }}>
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td>
                        <button
                          className={`btn btn-sm ${u.active ? 'btn-danger' : 'btn-primary'}`}
                          onClick={() => handleToggleUser(u.id, u.active)}
                          disabled={togglingId === u.id}
                          title={u.active ? 'Disable user' : 'Enable user'}
                        >
                          {togglingId === u.id
                            ? <span className="spinner spinner-sm" />
                            : u.active ? <ToggleLeft size={14} /> : <ToggleRight size={14} />}
                          {u.active ? 'Disable' : 'Enable'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {usersTotalPages > 1 && (
              <div className="pagination">
                <button className="pagination-btn" disabled={usersPage === 0} onClick={() => loadData(usersPage - 1)}>‹</button>
                {Array.from({ length: usersTotalPages }, (_, i) => (
                  <button key={i} className={`pagination-btn ${i === usersPage ? 'active' : ''}`} onClick={() => loadData(i)}>
                    {i + 1}
                  </button>
                ))}
                <button className="pagination-btn" disabled={usersPage >= usersTotalPages - 1} onClick={() => loadData(usersPage + 1)}>›</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
