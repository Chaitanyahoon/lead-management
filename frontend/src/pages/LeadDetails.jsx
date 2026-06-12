import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../api/axios';
import Loader from '../components/Loader';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const statusBadge = {
  new: 'bg-primary',
  contacted: 'bg-info text-dark',
  qualified: 'bg-warning text-dark',
  won: 'bg-success',
  lost: 'bg-secondary',
};

const actionLabels = {
  lead_created: { icon: 'bi-plus-circle', color: 'success', label: 'Lead Created' },
  lead_updated: { icon: 'bi-pencil', color: 'primary', label: 'Lead Updated' },
  lead_assigned: { icon: 'bi-person-check', color: 'info', label: 'Lead Assigned' },
  status_changed: { icon: 'bi-arrow-repeat', color: 'warning', label: 'Status Changed' },
  lead_deleted: { icon: 'bi-trash', color: 'danger', label: 'Lead Deleted' },
};

export default function LeadDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasRole } = useAuth();

  const [lead, setLead] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [leadRes, activityRes] = await Promise.all([
          API.get(`/leads/${id}`),
          API.get(`/activity/lead/${id}`),
        ]);
        setLead(leadRes.data.data);
        setActivities(activityRes.data.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load lead');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleDelete = async () => {
    try {
      await API.delete(`/leads/${id}`);
      toast.success('Lead deleted');
      setShowDeleteModal(false);
      navigate('/leads');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  if (loading) return <Loader />;

  if (error) {
    return (
      <div className="alert alert-danger">
        <i className="bi bi-exclamation-triangle me-2"></i>{error}
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
        <div className="d-flex align-items-center">
          <button className="btn btn-outline-secondary btn-sm me-3" onClick={() => navigate('/leads')}>
            <i className="bi bi-arrow-left"></i>
          </button>
          <div>
            <h4 className="fw-bold mb-0">{lead.name}</h4>
            <small className="text-muted">ID: {lead.id}</small>
          </div>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-primary btn-sm" onClick={() => navigate(`/leads/${id}/edit`)}>
            <i className="bi bi-pencil me-1"></i>Edit
          </button>
          {hasRole('admin', 'manager') && (
            <button className="btn btn-outline-danger btn-sm" onClick={() => setShowDeleteModal(true)}>
              <i className="bi bi-trash me-1"></i>Delete
            </button>
          )}
        </div>
      </div>

      <div className="row g-4">
        {/* Lead Info */}
        <div className="col-lg-6">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white fw-semibold border-bottom-0 pt-3">
              <i className="bi bi-info-circle me-2"></i>Lead Information
            </div>
            <div className="card-body">
              <table className="table table-borderless mb-0">
                <tbody>
                  <tr>
                    <td className="text-muted" style={{ width: 140 }}>Status</td>
                    <td>
                      <span className={`badge ${statusBadge[lead.status]}`}>{lead.status}</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="text-muted">Email</td>
                    <td>{lead.email || <span className="text-muted">—</span>}</td>
                  </tr>
                  <tr>
                    <td className="text-muted">Phone</td>
                    <td>{lead.phone || <span className="text-muted">—</span>}</td>
                  </tr>
                  <tr>
                    <td className="text-muted">Source</td>
                    <td className="text-capitalize">{lead.source || <span className="text-muted">—</span>}</td>
                  </tr>
                  <tr>
                    <td className="text-muted">Assigned To</td>
                    <td>
                      {lead.assigned_agent_name ? (
                        <><i className="bi bi-person me-1"></i>{lead.assigned_agent_name}</>
                      ) : (
                        <span className="text-muted">Unassigned</span>
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td className="text-muted">Created</td>
                    <td>{new Date(lead.created_at).toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td className="text-muted">Updated</td>
                    <td>{new Date(lead.updated_at).toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>

              {lead.notes && (
                <div className="mt-3 p-3 bg-light rounded">
                  <strong className="d-block mb-1">Notes</strong>
                  <p className="mb-0 text-muted" style={{ whiteSpace: 'pre-wrap' }}>{lead.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Activity Timeline */}
        <div className="col-lg-6">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white fw-semibold border-bottom-0 pt-3">
              <i className="bi bi-clock-history me-2"></i>Activity Timeline
            </div>
            <div className="card-body" style={{ maxHeight: 500, overflowY: 'auto' }}>
              {activities.length === 0 ? (
                <p className="text-muted text-center py-4">No activity recorded</p>
              ) : (
                <div className="timeline">
                  {activities.map((act) => {
                    const info = actionLabels[act.action] || { icon: 'bi-circle', color: 'secondary', label: act.action };
                    return (
                      <div key={act.id} className="d-flex mb-3">
                        <div className="me-3 text-center" style={{ minWidth: 36 }}>
                          <div
                            className={`rounded-circle bg-${info.color} bg-opacity-10 d-flex align-items-center justify-content-center mx-auto`}
                            style={{ width: 36, height: 36 }}
                          >
                            <i className={`bi ${info.icon} text-${info.color}`}></i>
                          </div>
                        </div>
                        <div className="flex-grow-1">
                          <div className="fw-semibold small">{info.label}</div>
                          <div className="text-muted small">
                            by {act.performed_by_name || 'System'} &middot;{' '}
                            {new Date(act.created_at).toLocaleString()}
                          </div>
                          {act.meta && (
                            <div className="mt-1 small">
                              {act.action === 'status_changed' && (
                                <span>
                                  <span className={`badge ${statusBadge[act.meta.from]} me-1`}>{act.meta.from}</span>
                                  → <span className={`badge ${statusBadge[act.meta.to]} ms-1`}>{act.meta.to}</span>
                                </span>
                              )}
                              {act.action === 'lead_updated' && act.meta.updatedFields && (
                                <span className="text-muted">
                                  Fields: {act.meta.updatedFields.join(', ')}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modern Minimalist Confirmation Modal */}
      {showDeleteModal && (
        <>
          <div className="modal-backdrop fade show" style={{ opacity: 0.4 }}></div>
          <div className="modal show d-block" tabIndex="-1" onClick={() => setShowDeleteModal(false)}>
            <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '380px' }} onClick={e => e.stopPropagation()}>
              <div className="modal-content border-0 shadow" style={{ borderRadius: '16px' }}>
                <div className="modal-body p-4 text-center">
                  <div className="text-danger mb-3">
                    <i className="bi bi-exclamation-triangle-fill fs-1"></i>
                  </div>
                  <h5 className="fw-bold text-dark mb-1">Delete Lead</h5>
                  <p className="text-muted small mb-4">
                    Are you sure you want to delete <strong>{lead.name}</strong>? This action is permanent.
                  </p>
                  <div className="d-flex gap-2">
                    <button className="btn btn-light w-100 fw-semibold text-secondary" onClick={() => setShowDeleteModal(false)}>
                      Cancel
                    </button>
                    <button className="btn btn-danger w-100 fw-semibold" onClick={handleDelete}>
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
