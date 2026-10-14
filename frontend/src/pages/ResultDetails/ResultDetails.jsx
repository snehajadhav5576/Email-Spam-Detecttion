import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { analysisService } from '../../services/services';
import {
  ShieldAlert, ShieldCheck, AlertTriangle, ArrowLeft,
  Mail, Copy, Clock, Cpu, CheckCircle
} from 'lucide-react';

function copyToClipboard(text) {
  navigator.clipboard?.writeText(text);
}

export function ResultDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    analysisService.getById(id)
      .then((res) => setResult(res.data.data))
      .catch(() => setError('Analysis not found or access denied'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="full-page-loader"><div className="spinner" /></div>;
  if (error) return <div className="error-state">{error}</div>;
  if (!result) return null;

  const isSpam = result.prediction === 'SPAM';
  const scorePercent = (Number(result.modelScore) * 100).toFixed(1);

  const handleCopy = () => {
    const summary = [
      `SpamShield Analysis Result`,
      `ID: ${result.id}`,
      `Subject: ${result.subject || 'N/A'}`,
      `Sender: ${result.sender || 'N/A'}`,
      `Result: ${result.prediction}`,
      `Confidence Score: ${scorePercent}% (${result.scoreType})`,
      `Risk Level: ${result.riskLevel}`,
      `Model Version: ${result.modelVersion}`,
      `Date: ${new Date(result.createdAt).toLocaleString()}`,
      ``,
      `Indicators:`,
      ...(result.indicators || []).map(i => `  - ${i.description}`),
      ``,
      result.disclaimer,
    ].join('\n');
    copyToClipboard(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ maxWidth: 860, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button className="btn btn-ghost" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> Back
        </button>
        <span style={{ color: '#64748b' }}>Analysis #{result.id}</span>
      </div>

      {/* Main result card */}
      <div className={`result-card ${isSpam ? 'spam' : 'legit'}`} style={{ marginBottom: 20 }}>
        <div className={`result-icon ${isSpam ? 'spam' : 'legit'}`}>
          {isSpam ? <ShieldAlert size={32} /> : <ShieldCheck size={32} />}
        </div>
        <div className={`result-label ${isSpam ? 'spam' : 'legit'}`}>
          {isSpam ? '⚠ SPAM DETECTED' : '✓ LEGITIMATE EMAIL'}
        </div>
        <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: 16 }}>
          {isSpam
            ? 'This email has characteristics commonly associated with spam or phishing.'
            : 'This email appears to be legitimate based on the analysis.'}
        </p>

        <div className="score-bar-container">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.8rem', color: '#94a3b8' }}>
            <span>Spam Confidence Score ({result.scoreType})</span>
            <span style={{ fontWeight: 600, color: isSpam ? '#ef4444' : '#10b981' }}>{scorePercent}%</span>
          </div>
          <div className="score-bar-bg">
            <div
              className={`score-bar-fill ${isSpam ? 'spam' : 'legit'}`}
              style={{ width: `${scorePercent}%` }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 16, flexWrap: 'wrap' }}>
          <span className={`badge ${isSpam ? 'badge-spam' : 'badge-legit'}`}>{result.prediction}</span>
          <span className={`badge badge-${result.riskLevel?.toLowerCase()}`}>
            Risk: {result.riskLevel}
          </span>
        </div>
      </div>

      {/* Metadata */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-title" style={{ marginBottom: 16 }}>Analysis Details</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          {[
            { icon: Mail, label: 'Subject', value: result.subject || 'Not provided' },
            { icon: Mail, label: 'Sender', value: result.sender || 'Not provided' },
            { icon: Clock, label: 'Analyzed At', value: new Date(result.createdAt).toLocaleString() },
            { icon: Cpu, label: 'Model Version', value: result.modelVersion },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} style={{ display: 'flex', gap: 10 }}>
              <Icon size={16} style={{ color: '#64748b', flexShrink: 0, marginTop: 2 }} />
              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: 2 }}>{label}</div>
                <div style={{ fontSize: '0.875rem', wordBreak: 'break-all' }}>{value}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Indicators */}
      {result.indicators?.length > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-title" style={{ marginBottom: 4 }}>Risk Indicators</div>
          <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: 16 }}>
            These are heuristic rule-based signals, separate from the ML model prediction.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {result.indicators.map((ind, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 14px', background: 'rgba(245,158,11,0.07)',
                borderRadius: 8, border: '1px solid rgba(245,158,11,0.15)',
                fontSize: '0.875rem', color: '#f59e0b'
              }}>
                <AlertTriangle size={14} style={{ flexShrink: 0 }} />
                {ind.description}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <div className="disclaimer" style={{ marginBottom: 20 }}>
        <AlertTriangle size={16} style={{ flexShrink: 0 }} />
        <span>{result.disclaimer}</span>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <Link to="/analyze" className="btn btn-primary">
          <Mail size={16} /> Analyze Another
        </Link>
        <Link to="/history" className="btn btn-secondary">View History</Link>
        <button className="btn btn-secondary" onClick={handleCopy}>
          {copied ? <CheckCircle size={16} color="#10b981" /> : <Copy size={16} />}
          {copied ? 'Copied!' : 'Copy Summary'}
        </button>
      </div>
    </div>
  );
}
