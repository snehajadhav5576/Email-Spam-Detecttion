import { useEffect, useState } from 'react';
import { analyticsService } from '../../services/services';
import { useAuth } from '../../context/AuthContext';
import { adminService } from '../../services/services';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar, ResponsiveContainer, Legend
} from 'recharts';
import { TrendingUp, AlertTriangle, ShieldAlert, Activity } from 'lucide-react';

export function Analytics() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [trends, setTrends] = useState([]);
  const [indicators, setIndicators] = useState([]);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    const svc = isAdmin ? adminService : analyticsService;
    Promise.all([
      svc.getTrends(days),
      svc.getIndicators(days),
    ])
      .then(([trendRes, indRes]) => {
        setTrends(trendRes.data.data || []);
        setIndicators(indRes.data.data || []);
      })
      .catch(() => setError('Failed to load analytics data'))
      .finally(() => setLoading(false));
  }, [days, isAdmin]);

  if (loading) {
    return (
      <div>
        <div className="stats-grid">
          {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 90 }} />)}
        </div>
        <div className="skeleton" style={{ height: 320, marginTop: 20 }} />
      </div>
    );
  }

  if (error) return <div className="error-state">{error}</div>;

  const totalSpam = trends.reduce((s, d) => s + (d.spam || 0), 0);
  const totalLegit = trends.reduce((s, d) => s + ((d.total || 0) - (d.spam || 0)), 0);
  const totalAll = totalSpam + totalLegit;
  const spamRate = totalAll > 0 ? ((totalSpam / totalAll) * 100).toFixed(1) : '0.0';

  return (
    <div>
      <div className="page-header">
        <h2>Analytics &amp; Reports</h2>
        <p>Spam detection trends and indicator breakdown</p>
      </div>

      {/* Day range selector */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[7, 14, 30, 90].map(d => (
          <button
            key={d}
            className={`btn ${days === d ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            onClick={() => setDays(d)}
          >
            {d}d
          </button>
        ))}
      </div>

      {/* Summary stats */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card blue">
          <div className="stat-icon blue"><Activity size={22} /></div>
          <div>
            <div className="stat-value">{totalAll.toLocaleString()}</div>
            <div className="stat-label">Total Analyzed</div>
          </div>
        </div>
        <div className="stat-card red">
          <div className="stat-icon red"><ShieldAlert size={22} /></div>
          <div>
            <div className="stat-value">{totalSpam.toLocaleString()}</div>
            <div className="stat-label">Spam Detected</div>
          </div>
        </div>
        <div className="stat-card purple">
          <div className="stat-icon purple"><TrendingUp size={22} /></div>
          <div>
            <div className="stat-value">{spamRate}%</div>
            <div className="stat-label">Spam Rate</div>
          </div>
        </div>
      </div>

      {/* Trend chart */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <span className="card-title">Analysis Trend ({days} days)</span>
        </div>
        {trends.length === 0 ? (
          <div className="empty-state"><p>No trend data for this period</p></div>
        ) : (
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f8ef7" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#4f8ef7" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gSpam" x1="0" y1="0" x2="0" y2="1">
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
                <Legend formatter={(v) => <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{v}</span>} />
                <Area type="monotone" dataKey="total" stroke="#4f8ef7" fill="url(#gTotal)" name="Total" />
                <Area type="monotone" dataKey="spam" stroke="#ef4444" fill="url(#gSpam)" name="Spam" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Top indicators */}
      {indicators.length > 0 && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Top Spam Indicators</span>
          </div>
          <div className="chart-container" style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={indicators.slice(0, 10)} layout="vertical" margin={{ left: 10, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,130,220,0.1)" />
                <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis dataKey="indicator" type="category" tick={{ fill: '#94a3b8', fontSize: 11 }} width={160} />
                <Tooltip
                  contentStyle={{ background: '#131929', border: '1px solid rgba(99,130,220,0.2)', borderRadius: 8 }}
                  labelStyle={{ color: '#e2e8f0' }}
                />
                <Bar dataKey="count" fill="#4f8ef7" radius={[0, 4, 4, 0]} name="Occurrences" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="disclaimer" style={{ marginTop: 24 }}>
        <AlertTriangle size={16} style={{ flexShrink: 0 }} />
        <span>Analytics reflect only emails analyzed through SpamShield — not your entire mailbox.</span>
      </div>
    </div>
  );
}
