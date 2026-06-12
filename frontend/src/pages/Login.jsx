import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

export default function Login() {
  const { login, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isMockMode, setIsMockMode] = useState(
    localStorage.getItem('mock_mode') === 'true'
  );

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleToggleMock = (e) => {
    const checked = e.target.checked;
    setIsMockMode(checked);
    localStorage.setItem('mock_mode', checked ? 'true' : 'false');
    if (checked) {
      toast.info('Demo Mode Enabled (using mock data)');
    } else {
      toast.info('API Backend Mode Enabled');
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    const result = await login(email, password);
    if (result.success) {
      toast.success('Welcome to LeadFlow!');
      navigate('/dashboard');
    } else {
      setError(result.message);
    }
  };

  const handleQuickLogin = async (selectedEmail, selectedPassword) => {
    setEmail(selectedEmail);
    setPassword(selectedPassword);
    setError('');

    const result = await login(selectedEmail, selectedPassword);
    if (result.success) {
      toast.success(`Logged in as ${selectedEmail.split('@')[0]}`);
      navigate('/dashboard');
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: '#f8fafc' }}>
      <div className="card shadow-sm border-0" style={{ maxWidth: '400px', width: '100%', borderRadius: '16px' }}>
        <div className="card-body p-4 p-md-5">
          <div className="text-center mb-4">
            <div className="d-inline-flex align-items-center justify-content-center bg-primary bg-opacity-10 text-primary rounded-circle mb-3" style={{ width: '56px', height: '56px' }}>
              <i className="bi bi-funnel-fill fs-3"></i>
            </div>
            <h4 className="fw-bold text-dark mb-1">LeadFlow</h4>
            <p className="text-muted small">Modern Sales Pipeline & Assignment</p>
          </div>

          {error && (
            <div className="alert alert-danger py-2 small border-0 shadow-sm mb-3" role="alert">
              <i className="bi bi-exclamation-circle me-2"></i>{error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="email" className="form-label small fw-semibold text-secondary">Email address</label>
              <input
                id="email"
                type="email"
                className="form-control"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
                required
                autoComplete="username"
              />
            </div>

            <div className="mb-4">
              <label htmlFor="password" className="form-label small fw-semibold text-secondary">Password</label>
              <input
                id="password"
                type="password"
                className="form-control"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            {/* Toggle Mock Mode */}
            <div className="form-check form-switch mb-4 small">
              <input
                className="form-check-input"
                type="checkbox"
                id="mockModeToggle"
                checked={isMockMode}
                onChange={handleToggleMock}
              />
              <label className="form-check-label text-muted" htmlFor="mockModeToggle">
                Demo Mode (Offline / Mock data)
              </label>
            </div>

            <button
              type="submit"
              className="btn btn-primary w-100 py-2 fw-semibold shadow-sm"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Quick Sign In Buttons */}
          <div className="mt-4 pt-4 border-top text-center">
            <p className="text-muted small mb-2 fw-semibold">Quick Demo Login</p>
            <div className="d-flex flex-wrap justify-content-center gap-2">
              <button
                onClick={() => handleQuickLogin('admin@test.com', 'password123')}
                className="btn btn-sm btn-outline-secondary px-3 py-1.5"
                disabled={loading}
              >
                Admin
              </button>
              <button
                onClick={() => handleQuickLogin('manager@test.com', 'password123')}
                className="btn btn-sm btn-outline-secondary px-3 py-1.5"
                disabled={loading}
              >
                Manager
              </button>
              <button
                onClick={() => handleQuickLogin('agent1@test.com', 'password123')}
                className="btn btn-sm btn-outline-secondary px-3 py-1.5"
                disabled={loading}
              >
                Agent
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
