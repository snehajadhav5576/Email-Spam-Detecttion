import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { analysisService } from '../../services/services';
import { useToast } from '../../context/ToastContext';
import { Search, Trash2, Eye, Filter, ChevronLeft, ChevronRight, Download } from 'lucide-react';

function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h3>Confirm Delete</h3>
        <p>{message}</p>
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          <button className="btn btn-danger" onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  );
}

export function History() {
  const { addToast } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [filters, setFilters] = useState({ subject: '', prediction: '', from: '', to: '' });
  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = useCallback((pg = 0, f = filters) => {
    setLoading(true);
    const params = { page: pg, size: 20, ...Object.fromEntries(Object.entries(f).filter(([, v]) => v)) };
    analysisService.getHistory(params)
      .then(res => { setData(res.data.data); setPage(pg); })
      .catch(() => addToast('Failed to load history', 'error'))
      .finally(() => setLoading(false));
  }, [filters]);

  useEffect(() => { load(0); }, []);

  const handleFilterSubmit = (e) => { e.preventDefault(); load(0, filters); };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await analysisService.delete(deleteTarget);
      addToast('Analysis deleted', 'success');
      setDeleteTarget(null);
      load(page);
    } catch {
      addToast('Failed to delete', 'error');
      setDeleteTarget(null);
    }
  };

  const exportCSV = () => {
    const rows = data?.content || [];
    if (!rows.length) return;
    const header = 'ID,Subject,Prediction,Score,Risk Level,Date\n';
    const lines = rows.map(r =>
      `${r.id},"${(r.subject || '').replace(/"/g, '""')}",${r.prediction},${r.modelScore},${r.riskLevel},${new Date(r.createdAt).toISOString()}`
    );
    const blob = new Blob([header + lines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'history.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const rows = data?.content || [];
  const total = data?.totalPages || 0;

  return (
    <div>
      <div className="page-header">
        <h2>Analysis History</h2>
        <p>All your email analyses — searchable and filterable</p>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 20 }}>
        <form onSubmit={handleFilterSubmit}>
          <div className="filters-row">
            <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
              <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
              <input
                className="form-input"
                style={{ paddingLeft: 36 }}
                placeholder="Search by subject..."
                value={filters.subject}
                onChange={e => setFilters(f => ({ ...f, subject: e.target.value }))}
              />
            </div>
            <select
              className="form-select"
              style={{ maxWidth: 160 }}
              value={filters.prediction}
              onChange={e => setFilters(f => ({ ...f, prediction: e.target.value }))}
            >
              <option value="">All results</option>
              <option value="SPAM">Spam</option>
              <option value="NOT_SPAM">Legitimate</option>
            </select>
            <input type="date" className="form-input" style={{ maxWidth: 160 }}
              value={filters.from}
              onChange={e => setFilters(f => ({ ...f, from: e.target.value ? new Date(e.target.value).toISOString() : '' }))}
            />
            <input type="date" className="form-input" style={{ maxWidth: 160 }}
              value={filters.to}
              onChange={e => setFilters(f => ({ ...f, to: e.target.value ? new Date(e.target.value + 'T23:59:59').toISOString() : '' }))}
            />
            <button type="submit" className="btn btn-primary">
              <Filter size={15} /> Filter
            </button>
            <button type="button" className="btn btn-secondary" onClick={exportCSV} title="Export to CSV">
              <Download size={15} /> Export CSV
            </button>
          </div>
        </form>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1,2,3,4,5].map(i => <div key={i} className="skeleton" style={{ height: 44 }} />)}
          </div>
        ) : rows.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📭</div>
            <h3>No analyses found</h3>
            <p style={{ marginBottom: 16 }}>Try adjusting your filters or analyze a new email</p>
            <Link to="/analyze" className="btn btn-primary">Analyze Email</Link>
          </div>
        ) : (
          <>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>ID</th><th>Subject</th><th>Result</th><th>Score</th>
                    <th>Risk</th><th>Date</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(r => (
                    <tr key={r.id}>
                      <td style={{ color: '#64748b', fontSize: '0.8rem' }}>#{r.id}</td>
                      <td style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {r.subject || <em style={{ color: '#64748b' }}>No subject</em>}
                      </td>
                      <td>
                        <span className={`badge ${r.prediction === 'SPAM' ? 'badge-spam' : 'badge-legit'}`}>
                          {r.prediction === 'SPAM' ? '⚠ SPAM' : '✓ LEGIT'}
                        </span>
                      </td>
                      <td>{(Number(r.modelScore) * 100).toFixed(1)}%</td>
                      <td><span className={`badge badge-${r.riskLevel?.toLowerCase()}`}>{r.riskLevel}</span></td>
                      <td style={{ color: '#64748b', fontSize: '0.8rem' }}>
                        {new Date(r.createdAt).toLocaleDateString()}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <Link to={`/result/${r.id}`} className="btn btn-ghost btn-sm" title="View details">
                            <Eye size={14} />
                          </Link>
                          <button
                            className="btn btn-danger btn-sm"
                            title="Delete"
                            onClick={() => setDeleteTarget(r.id)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {total > 1 && (
              <div className="pagination">
                <button
                  className="pagination-btn"
                  disabled={page === 0}
                  onClick={() => load(page - 1)}
                  aria-label="Previous page"
                >
                  <ChevronLeft size={16} />
                </button>
                {Array.from({ length: Math.min(total, 7) }, (_, i) => {
                  const pg = total <= 7 ? i : Math.max(0, page - 3) + i;
                  if (pg >= total) return null;
                  return (
                    <button
                      key={pg}
                      className={`pagination-btn ${pg === page ? 'active' : ''}`}
                      onClick={() => load(pg)}
                    >
                      {pg + 1}
                    </button>
                  );
                })}
                <button
                  className="pagination-btn"
                  disabled={page >= total - 1}
                  onClick={() => load(page + 1)}
                  aria-label="Next page"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {deleteTarget && (
        <ConfirmModal
          message="Are you sure you want to delete this analysis? This action cannot be undone."
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
