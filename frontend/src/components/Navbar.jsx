import { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();

  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const roleBadge = {
    admin: 'bg-danger',
    manager: 'bg-warning text-dark',
    agent: 'bg-info text-dark',
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-custom sticky-top">
      <div className="container-fluid">
        <Link className="navbar-brand fw-bold" to="/dashboard">
          <i className="bi bi-funnel-fill me-2 text-primary"></i>
          LeadFlow
        </Link>

        <button
          className="navbar-toggler border-0"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#mainNav"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="mainNav">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <NavLink className="nav-link" to="/dashboard">
                <i className="bi bi-speedometer2 me-1"></i>Dashboard
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link" to="/leads">
                <i className="bi bi-people me-1"></i>Leads
              </NavLink>
            </li>
            {hasRole('admin', 'manager') && (
              <li className="nav-item">
                <NavLink className="nav-link" to="/leads/create">
                  <i className="bi bi-plus-circle me-1"></i>New Lead
                </NavLink>
              </li>
            )}
          </ul>

          <div className="d-flex align-items-center gap-3">
            <button
              className="btn btn-link nav-link p-1 text-secondary me-1 border-0"
              onClick={toggleTheme}
              title="Toggle Theme"
              style={{ background: 'none', border: 'none' }}
            >
              <i className={`bi ${theme === 'light' ? 'bi-moon-fill text-dark' : 'bi-sun-fill text-warning'} fs-5`}></i>
            </button>
            <span className="text-secondary d-none d-md-inline small fw-medium">
              {user?.name}
              <span className={`badge ${roleBadge[user?.role] || 'bg-secondary'} ms-2`}>
                {user?.role}
              </span>
            </span>
            <button className="btn btn-outline-secondary btn-sm" onClick={handleLogout}>
              <i className="bi bi-box-arrow-right me-1"></i>Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
