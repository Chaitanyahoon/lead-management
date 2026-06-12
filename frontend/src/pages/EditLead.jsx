import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import API from '../api/axios';
import Loader from '../components/Loader';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const SOURCES = ['web', 'referral', 'cold_call', 'social', 'other'];
const STATUSES = ['new', 'contacted', 'qualified', 'won', 'lost'];

export default function EditLead() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasRole } = useAuth();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    source: '',
    status: '',
    notes: '',
  });

  useEffect(() => {
    const fetchLead = async () => {
      try {
        const { data } = await API.get(`/leads/${id}`);
        const lead = data.data;
        setForm({
          name: lead.name || '',
          email: lead.email || '',
          phone: lead.phone || '',
          source: lead.source || '',
          status: lead.status || 'new',
          notes: lead.notes || '',
        });
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load lead');
      } finally {
        setLoading(false);
      }
    };
    fetchLead();
  }, [id]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
  };

  const validate = () => {
    const errs = {};
    if (!form.name || form.name.trim().length < 2) errs.name = 'Name is required (min 2 chars)';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Invalid email';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    setSubmitting(true);
    try {
      await API.put(`/leads/${id}`, form);
      toast.success('Lead updated!');
      navigate(`/leads/${id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update lead');
    } finally {
      setSubmitting(false);
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
      <div className="d-flex align-items-center mb-4">
        <button className="btn btn-outline-secondary btn-sm me-3" onClick={() => navigate(-1)}>
          <i className="bi bi-arrow-left"></i>
        </button>
        <h4 className="fw-bold mb-0">Edit Lead</h4>
      </div>

      <div className="row justify-content-center">
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm">
            <div className="card-body p-4">
              <form onSubmit={handleSubmit}>
                <div className="row g-3">
                  {/* Name */}
                  <div className="col-md-6">
                    <label htmlFor="name" className="form-label fw-semibold">
                      Name <span className="text-danger">*</span>
                    </label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                      value={form.name}
                      onChange={handleChange}
                    />
                    {errors.name && <div className="invalid-feedback">{errors.name}</div>}
                  </div>

                  {/* Email */}
                  <div className="col-md-6">
                    <label htmlFor="email" className="form-label fw-semibold">Email</label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                      value={form.email}
                      onChange={handleChange}
                    />
                    {errors.email && <div className="invalid-feedback">{errors.email}</div>}
                  </div>

                  {/* Phone */}
                  <div className="col-md-6">
                    <label htmlFor="phone" className="form-label fw-semibold">Phone</label>
                    <input
                      id="phone"
                      name="phone"
                      type="text"
                      className="form-control"
                      value={form.phone}
                      onChange={handleChange}
                    />
                  </div>

                  {/* Source */}
                  <div className="col-md-6">
                    <label htmlFor="source" className="form-label fw-semibold">Source</label>
                    <select id="source" name="source" className="form-select" value={form.source} onChange={handleChange}>
                      <option value="">Select source…</option>
                      {SOURCES.map((s) => (
                        <option key={s} value={s}>{s.replace('_', ' ')}</option>
                      ))}
                    </select>
                  </div>

                  {/* Status */}
                  <div className="col-md-6">
                    <label htmlFor="status" className="form-label fw-semibold">Status</label>
                    <select id="status" name="status" className="form-select" value={form.status} onChange={handleChange}>
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  {/* Notes */}
                  <div className="col-12">
                    <label htmlFor="notes" className="form-label fw-semibold">Notes</label>
                    <textarea
                      id="notes"
                      name="notes"
                      className="form-control"
                      rows="3"
                      value={form.notes}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="d-flex justify-content-end gap-2 mt-4">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => navigate(-1)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary px-4" disabled={submitting}>
                    {submitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Saving…
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check-lg me-2"></i>Save Changes
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
