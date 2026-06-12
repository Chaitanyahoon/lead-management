import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import Loader from '../components/Loader';

const statCards = [
  { key: 'total', label: 'Total Leads', icon: 'bi-people-fill', bg: 'primary' },
  { key: 'new', label: 'New Leads', icon: 'bi-plus-circle-fill', bg: 'info' },
  { key: 'qualified', label: 'Qualified', icon: 'bi-check-circle-fill', bg: 'warning' },
  { key: 'won', label: 'Won', icon: 'bi-trophy-fill', bg: 'success' },
];

export default function Dashboard() {
  const { user, hasRole } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        if (hasRole('admin', 'manager')) {
          const { data } = await API.get('/leads/stats');
          setStats(data.data);
        } else {
          // Agents: fetch their own leads and compute basic stats
          const { data } = await API.get('/leads?limit=100');
          const leads = data.data || [];
          const byStatus = { new: 0, contacted: 0, qualified: 0, won: 0, lost: 0 };
          leads.forEach((l) => { byStatus[l.status] = (byStatus[l.status] || 0) + 1; });
          setStats({ total: data.total || leads.length, byStatus, bySource: {}, agentLoad: [] });
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load stats');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <Loader />;

  if (error) {
    return (
      <div className="alert alert-danger">
        <i className="bi bi-exclamation-triangle me-2"></i>{error}
      </div>
    );
  }

  const getCardValue = (key) => {
    if (!stats) return 0;
    if (key === 'total') return stats.total;
    return stats.byStatus?.[key] || 0;
  };

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-1">Dashboard</h4>
          <p className="text-muted mb-0">Welcome back, {user?.name}</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="row g-3 mb-4">
        {statCards.map((card) => (
          <div key={card.key} className="col-6 col-lg-3">
            <div className={`card border-0 shadow-sm h-100`}>
              <div className="card-body d-flex align-items-center gap-3">
                <div className={`rounded-circle bg-${card.bg} bg-opacity-10 d-flex align-items-center justify-content-center`}
                     style={{ width: 52, height: 52, minWidth: 52 }}>
                  <i className={`bi ${card.icon} text-${card.bg} fs-4`}></i>
                </div>
                <div>
                  <div className="text-muted small">{card.label}</div>
                  <div className="fs-4 fw-bold">{getCardValue(card.key)}</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Source & Agent Load (admin/manager only) */}
      {hasRole('admin', 'manager') && stats && (
        <div className="row g-3">
          {/* By Source */}
          <div className="col-md-6">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-header fw-semibold border-bottom-0 pt-3">
                <i className="bi bi-bar-chart me-2"></i>Leads by Source
              </div>
              <div className="card-body pt-0">
                {Object.keys(stats.bySource || {}).length === 0 ? (
                  <p className="text-muted mb-0">No source data yet</p>
                ) : (
                  <ul className="list-group list-group-flush">
                    {Object.entries(stats.bySource).map(([source, count]) => (
                      <li key={source} className="list-group-item d-flex justify-content-between px-0">
                        <span className="text-capitalize">{source}</span>
                        <span className="badge bg-primary rounded-pill">{count}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          {/* Agent Load */}
          <div className="col-md-6">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-header fw-semibold border-bottom-0 pt-3">
                <i className="bi bi-person-workspace me-2"></i>Agent Workload
              </div>
              <div className="card-body pt-0">
                {(!stats.agentLoad || stats.agentLoad.length === 0) ? (
                  <p className="text-muted mb-0">No agents assigned yet</p>
                ) : (
                  <ul className="list-group list-group-flush">
                    {stats.agentLoad.map((agent, i) => (
                      <li key={i} className="list-group-item d-flex justify-content-between align-items-center px-0">
                        <span>
                          <i className="bi bi-person me-2 text-muted"></i>
                          {agent.agentName}
                        </span>
                        <span className="badge bg-info text-dark rounded-pill">
                          {agent.activeLeads} active
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status breakdown bar */}
      {stats && stats.total > 0 && (
        <div className="card border-0 shadow-sm mt-3">
          <div className="card-header fw-semibold border-bottom-0 pt-3">
            <i className="bi bi-pie-chart me-2"></i>Pipeline Overview
          </div>
          <div className="card-body">
            <div className="progress" style={{ height: 28 }}>
              {['new', 'contacted', 'qualified', 'won', 'lost'].map((s) => {
                const pct = ((stats.byStatus?.[s] || 0) / stats.total) * 100;
                if (pct === 0) return null;
                const colors = { new: 'bg-primary', contacted: 'bg-info', qualified: 'bg-warning', won: 'bg-success', lost: 'bg-secondary' };
                return (
                  <div key={s}
                    className={`progress-bar ${colors[s]}`}
                    style={{ width: `${pct}%` }}
                    title={`${s}: ${stats.byStatus[s]}`}
                  >
                    {pct > 8 ? `${s} (${stats.byStatus[s]})` : ''}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
