import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const statusBadge = {
  new: 'bg-primary',
  contacted: 'bg-info text-dark',
  qualified: 'bg-warning text-dark',
  won: 'bg-success',
  lost: 'bg-secondary',
};

export default function LeadTable({ leads, onDelete, sortBy, order, onSort }) {
  const navigate = useNavigate();
  const { hasRole } = useAuth();

  const handleSort = (field) => {
    if (sortBy === field) {
      onSort(field, order === 'asc' ? 'desc' : 'asc');
    } else {
      onSort(field, 'asc');
    }
  };

  const SortIcon = ({ field }) => {
    if (sortBy !== field) return <i className="bi bi-arrow-down-up text-muted ms-1 small"></i>;
    return order === 'asc'
      ? <i className="bi bi-sort-up ms-1"></i>
      : <i className="bi bi-sort-down ms-1"></i>;
  };

  if (!leads || leads.length === 0) {
    return (
      <div className="text-center py-5 text-muted">
        <i className="bi bi-inbox display-4 d-block mb-2"></i>
        No leads found
      </div>
    );
  }

  return (
    <div className="table-responsive">
      <table className="table table-hover align-middle mb-0">
        <thead className="table-light">
          <tr>
            <th role="button" onClick={() => handleSort('name')}>
              Name <SortIcon field="name" />
            </th>
            <th className="d-none d-md-table-cell">Email</th>
            <th className="d-none d-lg-table-cell">Phone</th>
            <th role="button" onClick={() => handleSort('source')}>
              Source <SortIcon field="source" />
            </th>
            <th role="button" onClick={() => handleSort('status')}>
              Status <SortIcon field="status" />
            </th>
            <th className="d-none d-md-table-cell">Agent</th>
            <th role="button" onClick={() => handleSort('created_at')}>
              Created <SortIcon field="created_at" />
            </th>
            <th className="text-end">Actions</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => (
            <tr key={lead.id}>
              <td className="fw-semibold">{lead.name}</td>
              <td className="d-none d-md-table-cell text-muted">{lead.email || '—'}</td>
              <td className="d-none d-lg-table-cell text-muted">{lead.phone || '—'}</td>
              <td>
                <span className="text-capitalize">{lead.source || '—'}</span>
              </td>
              <td>
                <span className={`badge ${statusBadge[lead.status] || 'bg-secondary'}`}>
                  {lead.status}
                </span>
              </td>
              <td className="d-none d-md-table-cell">{lead.assigned_agent_name || '—'}</td>
              <td>{new Date(lead.created_at).toLocaleDateString()}</td>
              <td className="text-end">
                <div className="btn-group btn-group-sm">
                  <button
                    className="btn btn-outline-primary"
                    title="View"
                    onClick={() => navigate(`/leads/${lead.id}`)}
                  >
                    <i className="bi bi-eye"></i>
                  </button>
                  <button
                    className="btn btn-outline-secondary"
                    title="Edit"
                    onClick={() => navigate(`/leads/${lead.id}/edit`)}
                  >
                    <i className="bi bi-pencil"></i>
                  </button>
                  {hasRole('admin', 'manager') && (
                    <button
                      className="btn btn-outline-danger"
                      title="Delete"
                      onClick={() => onDelete(lead.id, lead.name)}
                    >
                      <i className="bi bi-trash"></i>
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
