import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import API from '../api/axios';
import LeadTable from '../components/LeadTable';
import PaginationComponent from '../components/Pagination';
import Loader from '../components/Loader';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

const STATUSES = ['', 'new', 'contacted', 'qualified', 'won', 'lost'];
const SOURCES = ['', 'web', 'referral', 'cold_call', 'social', 'other'];

export default function LeadsList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { hasRole } = useAuth();

  const handleExportCSV = async () => {
    try {
      const isMock = localStorage.getItem('mock_mode') === 'true' || localStorage.getItem('token')?.startsWith('mock-token');
      let data;
      if (isMock) {
        const leads = JSON.parse(localStorage.getItem('mock_leads') || '[]');
        const headers = ['Name', 'Email', 'Phone', 'Source', 'Status', 'Notes', 'Created At'];
        const csvRows = [headers.join(',')];
        leads.forEach(l => {
          const values = [
            l.name,
            l.email || '',
            l.phone || '',
            l.source || '',
            l.status || '',
            (l.notes || '').replace(/"/g, '""').replace(/\n/g, ' '),
            l.created_at
          ].map(val => `"${val}"`);
          csvRows.push(values.join(','));
        });
        data = csvRows.join('\n');
      } else {
        const response = await API.get('/leads/export', { responseType: 'blob' });
        data = response.data;
      }

      const url = window.URL.createObjectURL(new Blob([data], { type: 'text/csv' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `leads_export_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Leads CSV exported successfully!');
    } catch (err) {
      toast.error('Failed to export CSV. Please try again.');
    }
  };

  const [leads, setLeads] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');

  // Filters from URL
  const page = parseInt(searchParams.get('page')) || 1;
  const limit = parseInt(searchParams.get('limit')) || 10;
  const status = searchParams.get('status') || '';
  const source = searchParams.get('source') || '';
  const search = searchParams.get('search') || '';
  const sortBy = searchParams.get('sortBy') || 'created_at';
  const order = searchParams.get('order') || 'desc';

  const [searchInput, setSearchInput] = useState(search);

  const updateParams = (updates) => {
    const newParams = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([k, v]) => {
      if (v) newParams.set(k, v);
      else newParams.delete(k);
    });
    // Reset to page 1 when filters change (unless page is being set explicitly)
    if (!updates.page) newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page, limit, sortBy, order };
      if (status) params.status = status;
      if (source) params.source = source;
      if (search) params.search = search;

      const { data } = await API.get('/leads', { params });
      setLeads(data.data);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load leads');
    } finally {
      setLoading(false);
    }
  }, [page, limit, status, source, search, sortBy, order]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const handleSearch = (e) => {
    e.preventDefault();
    updateParams({ search: searchInput });
  };

  const handleDeleteClick = (id, name) => {
    setDeleteConfirmId(id);
    setDeleteConfirmName(name);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await API.delete(`/leads/${deleteConfirmId}`);
      toast.success(`Lead "${deleteConfirmName}" deleted`);
      setDeleteConfirmId(null);
      fetchLeads();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  const handleSort = (field, dir) => {
    updateParams({ sortBy: field, order: dir, page: String(page) });
  };

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div className="d-flex align-items-center gap-2">
          <h4 className="fw-bold mb-0">Leads</h4>
          <span className="badge bg-secondary text-light">{total} total</span>
        </div>
        {hasRole('admin', 'manager') && (
          <button className="btn btn-outline-primary btn-sm fw-semibold" onClick={handleExportCSV}>
            <i className="bi bi-download me-1"></i>Export CSV
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="card shadow-sm mb-3">
        <div className="card-body py-3">
          <form onSubmit={handleSearch} className="row g-2 align-items-end">
            <div className="col-12 col-md-4">
              <label className="form-label small text-muted mb-1">Search</label>
              <div className="input-group input-group-sm">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Name, email, or phone…"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
                <button className="btn btn-primary" type="submit">
                  <i className="bi bi-search"></i>
                </button>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <label className="form-label small text-muted mb-1">Status</label>
              <select
                className="form-select form-select-sm"
                value={status}
                onChange={(e) => updateParams({ status: e.target.value })}
              >
                <option value="">All Statuses</option>
                {STATUSES.filter(Boolean).map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="col-6 col-md-3">
              <label className="form-label small text-muted mb-1">Source</label>
              <select
                className="form-select form-select-sm"
                value={source}
                onChange={(e) => updateParams({ source: e.target.value })}
              >
                <option value="">All Sources</option>
                {SOURCES.filter(Boolean).map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="col-auto">
              {(status || source || search) && (
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => {
                    setSearchInput('');
                    setSearchParams({});
                  }}
                >
                  <i className="bi bi-x-lg me-1"></i>Clear
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* Content */}
      {error && (
        <div className="alert alert-danger">
          <i className="bi bi-exclamation-triangle me-2"></i>{error}
        </div>
      )}

      {loading ? (
        <Loader />
      ) : (
        <>
          <div className="card shadow-sm">
            <LeadTable
              leads={leads}
              onDelete={handleDeleteClick}
              sortBy={sortBy}
              order={order}
              onSort={handleSort}
            />
          </div>
          <div className="mt-3">
            <PaginationComponent
              page={page}
              totalPages={totalPages}
              onPageChange={(p) => updateParams({ page: String(p) })}
            />
          </div>
        </>
      )}

      {/* Modern Minimalist Confirmation Modal */}
      {deleteConfirmId && (
        <>
          <div className="modal-backdrop fade show" style={{ opacity: 0.4 }}></div>
          <div className="modal show d-block" tabIndex="-1" onClick={() => setDeleteConfirmId(null)}>
            <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '380px' }} onClick={e => e.stopPropagation()}>
              <div className="modal-content border-0 shadow" style={{ borderRadius: '16px' }}>
                <div className="modal-body p-4 text-center">
                  <div className="text-danger mb-3">
                    <i className="bi bi-exclamation-triangle-fill fs-1"></i>
                  </div>
                  <h5 className="fw-bold mb-1">Delete Lead</h5>
                  <p className="text-muted small mb-4">
                    Are you sure you want to delete <strong>{deleteConfirmName}</strong>? This action is permanent.
                  </p>
                  <div className="d-flex gap-2">
                    <button className="btn btn-light w-100 fw-semibold text-secondary" onClick={() => setDeleteConfirmId(null)}>
                      Cancel
                    </button>
                    <button className="btn btn-danger w-100 fw-semibold" onClick={confirmDelete}>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
