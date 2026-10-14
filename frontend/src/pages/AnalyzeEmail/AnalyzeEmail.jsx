import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { analysisService } from '../../services/services';
import { useToast } from '../../context/ToastContext';
import { Mail, Send, Trash2, AlertTriangle, Info } from 'lucide-react';

const MAX_BODY = 50000;
const MAX_SUBJECT = 500;

export function AnalyzeEmail() {
  const { addToast } = useToast();
  const navigate = useNavigate();
  const submitRef = useRef(false); // Prevent duplicate submissions

  const [form, setForm] = useState({
    subject: '',
    sender: '',
    body: '',
    headers: '',
    urls: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.body.trim()) e.body = 'Email body is required';
    else if (form.body.length < 5) e.body = 'Body is too short';
    else if (form.body.length > MAX_BODY) e.body = `Body must be under ${MAX_BODY} characters`;
    if (form.subject.length > MAX_SUBJECT) e.subject = `Subject must be under ${MAX_SUBJECT} characters`;
    return e;
  };

  const handleChange = (field) => (evt) => {
    setForm((f) => ({ ...f, [field]: evt.target.value }));
    setErrors((e) => { const next = { ...e }; delete next[field]; return next; });
  };

  const handleClear = () => {
    setForm({ subject: '', sender: '', body: '', headers: '', urls: '' });
    setErrors({});
  };

  const handleSubmit = async (evt) => {
    evt.preventDefault();
    if (submitRef.current) return; // Prevent accidental duplicate
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }

    submitRef.current = true;
    setLoading(true);
    setErrors({});

    try {
      const res = await analysisService.analyze({
        subject: form.subject || undefined,
        sender: form.sender || undefined,
        body: form.body,
        headers: form.headers || undefined,
        urls: form.urls || undefined,
      });
      const analysisId = res.data.data.id;
      navigate(`/result/${analysisId}`);
    } catch (err) {
      if (err.response?.status === 503) {
        addToast('ML service is currently unavailable. The email could not be classified. Please try again later.', 'error');
      } else {
        addToast(err.response?.data?.message || 'Analysis failed. Please try again.', 'error');
      }
    } finally {
      setLoading(false);
      submitRef.current = false;
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2>Analyze Email</h2>
        <p>Paste email content below to check if it is spam or legitimate</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' }}>
        <div className="card">
          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label className="form-label" htmlFor="email-subject">Subject <span style={{ color: '#64748b' }}>(optional)</span></label>
              <input
                id="email-subject"
                type="text"
                className="form-input"
                placeholder="Email subject line"
                value={form.subject}
                onChange={handleChange('subject')}
                maxLength={MAX_SUBJECT}
              />
              <span className="char-count">{form.subject.length}/{MAX_SUBJECT}</span>
              {errors.subject && <span className="form-error">{errors.subject}</span>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="email-sender">Sender email <span style={{ color: '#64748b' }}>(optional)</span></label>
              <input
                id="email-sender"
                type="email"
                className="form-input"
                placeholder="sender@example.com"
                value={form.sender}
                onChange={handleChange('sender')}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="email-body">Email body <span style={{ color: '#ef4444' }}>*</span></label>
              <textarea
                id="email-body"
                className="form-textarea"
                placeholder="Paste the full email body here..."
                value={form.body}
                onChange={handleChange('body')}
                style={{ minHeight: 220 }}
                maxLength={MAX_BODY}
                required
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {errors.body
                  ? <span className="form-error">{errors.body}</span>
                  : <span className="form-hint">Paste the plain text of the email body.</span>}
                <span className={`char-count ${form.body.length > MAX_BODY * 0.9 ? 'style="color:var(--accent-orange)"' : ''}`}>
                  {form.body.length.toLocaleString()}/{MAX_BODY.toLocaleString()}
                </span>
              </div>
            </div>

            <details style={{ marginBottom: 16 }}>
              <summary style={{ cursor: 'pointer', fontSize: '0.875rem', color: '#94a3b8', marginBottom: 12 }}>
                Advanced options (headers, URLs)
              </summary>
              <div className="form-group">
                <label className="form-label" htmlFor="email-headers">Email headers <span style={{ color: '#64748b' }}>(optional)</span></label>
                <textarea
                  id="email-headers"
                  className="form-textarea"
                  placeholder="Paste raw email headers here..."
                  value={form.headers}
                  onChange={handleChange('headers')}
                  style={{ minHeight: 80 }}
                  maxLength={5000}
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="email-urls">URLs found in email <span style={{ color: '#64748b' }}>(optional)</span></label>
                <textarea
                  id="email-urls"
                  className="form-textarea"
                  placeholder="One URL per line..."
                  value={form.urls}
                  onChange={handleChange('urls')}
                  style={{ minHeight: 60 }}
                  maxLength={2000}
                />
              </div>
            </details>

            <div className="disclaimer">
              <AlertTriangle size={16} style={{ flexShrink: 0 }} />
              <span>Email content is analyzed as plain text. No URLs will be visited. No attachments will be executed.</span>
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
              <button
                id="analyze-submit"
                type="submit"
                className="btn btn-primary btn-lg"
                disabled={loading}
              >
                {loading ? <span className="spinner spinner-sm" /> : <Send size={18} />}
                {loading ? 'Analyzing...' : 'Analyze Email'}
              </button>
              <button
                id="analyze-clear"
                type="button"
                className="btn btn-secondary"
                onClick={handleClear}
                disabled={loading}
              >
                <Trash2 size={16} />
                Clear
              </button>
            </div>
          </form>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <Info size={18} color="#4f8ef7" />
            <span className="card-title">How to use</span>
          </div>
          <ol style={{ paddingLeft: 20, fontSize: '0.875rem', color: '#94a3b8', lineHeight: 2 }}>
            <li>Copy the email content from your email client</li>
            <li>Paste the subject and body into the fields</li>
            <li>Optionally add the sender address</li>
            <li>Click <strong style={{ color: '#e2e8f0' }}>Analyze Email</strong></li>
            <li>Review the result and indicators</li>
          </ol>
          <div style={{ marginTop: 20, padding: 14, background: 'rgba(239,68,68,0.06)', borderRadius: 8, border: '1px solid rgba(239,68,68,0.15)' }}>
            <p style={{ fontSize: '0.8rem', color: '#ef4444', lineHeight: 1.6 }}>
              ⚠️ <strong>Never open links or attachments</strong> in suspicious emails based solely on this result. This tool is a guide, not a guarantee.
            </p>
          </div>
          <div style={{ marginTop: 12, padding: 14, background: 'rgba(79,142,247,0.06)', borderRadius: 8, border: '1px solid rgba(79,142,247,0.15)' }}>
            <p style={{ fontSize: '0.8rem', color: '#4f8ef7', lineHeight: 1.6 }}>
              📊 The confidence score is a model probability estimate. It is not a calibrated guarantee of spam or legitimacy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
