import { Link } from 'react-router-dom';
import { Shield, Zap, Lock, BarChart2, ArrowRight, CheckCircle } from 'lucide-react';

const features = [
  { icon: Zap, title: 'Instant Analysis', desc: 'Real-time email classification using a trained ML model with TF-IDF and Naive Bayes.' },
  { icon: Shield, title: 'Smart Detection', desc: 'Combines machine learning predictions with heuristic rule-based indicators for comprehensive analysis.' },
  { icon: Lock, title: 'Private & Secure', desc: 'Your emails are analyzed server-side. Content is never shared or sold. Retention controls are in your hands.' },
  { icon: BarChart2, title: 'Detailed Analytics', desc: 'Visual dashboards showing classification trends, risk patterns, and historical analysis data.' },
  { icon: CheckCircle, title: 'Confidence Scores', desc: 'Every prediction includes a confidence score, risk level, and heuristic indicators — not just a binary label.' },
  { icon: Shield, title: 'Role-Based Access', desc: 'USER and ADMIN roles with appropriate permissions. All access is enforced on the server.' },
];

export function Landing() {
  return (
    <div className="landing">
      <nav className="landing-nav">
        <div className="landing-nav-logo">
          <Shield size={24} color="#4f8ef7" />
          <span className="landing-nav-logo-text">SpamShield</span>
        </div>
        <div className="landing-nav-links">
          <Link to="/login" className="btn btn-ghost">Sign In</Link>
          <Link to="/register" className="btn btn-primary">Get Started</Link>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-badge">
          <Shield size={14} />
          Email Spam Detection System
        </div>
        <h1>
          Protect Your Inbox from <span className="hero-gradient">Spam & Phishing</span>
        </h1>
        <p>
          Paste any email and get an instant machine-learning classification. 
          Understand why it was flagged, see confidence scores, and track your analysis history.
        </p>
        <div className="hero-cta">
          <Link to="/register" className="btn btn-primary btn-lg">
            Start Analyzing Free <ArrowRight size={18} />
          </Link>
          <Link to="/login" className="btn btn-secondary btn-lg">Sign In</Link>
        </div>
      </section>

      <section className="features">
        <h2>Everything You Need</h2>
        <p className="features-subtitle">
          A complete spam detection workflow — from pasting email text to detailed risk reports.
        </p>
        <div className="features-grid">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="feature-card">
              <div className="feature-icon"><Icon size={24} /></div>
              <h3>{title}</h3>
              <p>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section style={{ padding: '60px', background: 'rgba(79,142,247,0.04)', textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: 16 }}>How It Works</h2>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 40, flexWrap: 'wrap', marginTop: 32 }}>
          {[
            ['1', 'Paste Email', 'Copy and paste the email subject and body into the analysis form.'],
            ['2', 'ML Analysis', 'Our model classifies the email and heuristic rules identify suspicious patterns.'],
            ['3', 'View Results', 'See the prediction, confidence score, risk level, and detailed indicators.'],
          ].map(([num, title, desc]) => (
            <div key={num} style={{ maxWidth: 260, textAlign: 'center' }}>
              <div style={{
                width: 56, height: 56, borderRadius: '50%',
                background: 'linear-gradient(135deg, #4f8ef7, #8b5cf6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px', fontSize: '1.3rem', fontWeight: 700, color: 'white'
              }}>{num}</div>
              <h3 style={{ fontWeight: 600, marginBottom: 8 }}>{title}</h3>
              <p style={{ fontSize: '0.875rem', color: '#94a3b8', lineHeight: 1.6 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <div style={{ background: 'rgba(245,158,11,0.06)', borderTop: '1px solid rgba(245,158,11,0.15)', padding: '20px 60px', textAlign: 'center' }}>
        <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
          ⚠️ <strong>Important:</strong> Spam detection is a prediction, not a guarantee. Always exercise caution before opening links or attachments in emails, regardless of classification results.
        </p>
      </div>

      <footer className="landing-footer">
        <p>© 2024 SpamShield. Built for email security awareness.</p>
      </footer>
    </div>
  );
}
