import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { analyticsService, analysisService } from '../../services/services';
import { Mail, ShieldAlert, ShieldCheck, TrendingUp, ArrowRight, Activity } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, ResponsiveContainer, Legend
} from 'recharts';

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

const PIE_COLORS = ['#ef4444', '#10b981'];

export function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [trends, setTrends] = useState([]);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([
      analyticsService.getSummary(),
      analyticsService.getTrends(30),
      analysisService.getHistory({ page: 0, size: 5 }),
    ])
      .then(([sumRes, trendRes, histRes]) => {
        setSummary(sumRes.data.data);
        setTrends(trendRes.data.data);
        setRecent(histRes.data.data?.content || []);
      })
      .catch(() => setError('Failed to load dashboard data'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div>
        <div className="stats-grid">
          {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 90 }} />)}
        </div>
        <div className="skeleton" style={{ height: 300 }} />
      </div>
    );
  }

  if (error) return <div className="error-state">{error}</div>;

  const pieData = summary ? [
    { name: 'Spam', value: Number(summary.spam) },
    { name: 'Legitimate', value: Number(summary.legitimate) },
  ] : [];

  const spamPct = summary?.total > 0
    ? ((summary.spam / summary.total) * 100).toFixed(1)
    : '0.0';

  return (
    <div>
      <div className="page-header">
        <h2>Dashboard</h2>
        <p>Your email analysis overview</p>
      </div>

      <div className="stats-grid">
        <StatCard value={summary?.total?.toLocaleString()} label="Total Analyzed" icon={Mail} color="blue" />
        <StatCard value={summary?.spam?.toLocaleString()} label="Spam Detected" icon={ShieldAlert} color="red" />
        <StatCard value={summary?.legitimate?.toLocaleString()} label="Legitimate" icon={ShieldCheck} color="green" />
        <StatCard value={`${spamPct}%`} label="Spam Rate (sample)" icon={TrendingUp} color="purple" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 24 }}>
        <div className="card">
          <div className="card-header">
            <span className="card-title">30-Day Analysis Trend</span>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f8ef7" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#4f8ef7" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradSpam" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,130,220,0.1)" />
                <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: '#131929', border: '1px solid rgba(99,130,220,0.2)', borderRadius: 8 }}
                  labelStyle={{ color: '#e2e8f0' }}
                />
                <Area type="monotone" dataKey="total" stroke="#4f8ef7" fill="url(#gradTotal)" name="Total" />
                <Area type="monotone" dataKey="spam" stroke="#ef4444" fill="url(#gradSpam)" name="Spam" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Distribution</span>
          </div>
          <div className="chart-container" style={{ height: 240 }}>
            {pieData[0]?.value + pieData[1]?.value > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value">
                    {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                  </Pie>
                  <Legend iconType="circle" formatter={(v) => <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{v}</span>} />
                  <Tooltip contentStyle={{ background: '#131929', border: '1px solid rgba(99,130,220,0.2)', borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state">
                <p>No data yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Recent Analyses</span>
          <Link to="/history" className="btn btn-ghost btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            View All <ArrowRight size={14} />
          </Link>
        </div>
        {recent.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📭</div>
            <h3>No analyses yet</h3>
            <p style={{ marginBottom: 16 }}>Analyze your first email to see results here</p>
            <Link to="/analyze" className="btn btn-primary">Analyze Email</Link>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>#</th><th>Subject</th><th>Result</th><th>Score</th><th>Risk</th><th>Date</th><th>Action</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((a) => (
                  <tr key={a.id}>
                    <td style={{ color: '#64748b' }}>{a.id}</td>
                    <td>{a.subject || <em style={{ color: '#64748b' }}>No subject</em>}</td>
                    <td>
                      <span className={`badge ${a.prediction === 'SPAM' ? 'badge-spam' : 'badge-legit'}`}>
                        {a.prediction === 'SPAM' ? '⚠ SPAM' : '✓ LEGITIMATE'}
                      </span>
                    </td>
                    <td>{(a.modelScore * 100).toFixed(1)}%</td>
                    <td>
                      <span className={`badge badge-${a.riskLevel?.toLowerCase()}`}>{a.riskLevel}</span>
                    </td>
                    <td style={{ color: '#64748b' }}>{new Date(a.createdAt).toLocaleDateString()}</td>
                    <td>
                      <Link to={`/result/${a.id}`} className="btn btn-ghost btn-sm">View</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="disclaimer" style={{ marginTop: 24 }}>
        <Activity size={16} style={{ flexShrink: 0 }} />
        <span>Spam rate reflects your analyzed emails only — not your entire mailbox. Detection is a prediction, not a guarantee.</span>
      </div>
    </div>
  );
}
