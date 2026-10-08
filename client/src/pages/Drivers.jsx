import React, { useState, useEffect, useCallback } from 'react';
import { getAllDrivers, createDriver, updateDriver } from '../api/drivers';
import { useAuth } from '../context/AuthContext';
import { DriverStatus, UserRoles } from '../utils/constants';
import PageHeader from '../components/PageHeader';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import FormField from '../components/FormField';
import Button from '../components/Button';
import './Drivers.css';

const LICENSE_CATEGORIES = ['A', 'B', 'C', 'C1', 'D', 'D1', 'EB', 'EC', 'EC1'];

const emptyForm = {
  license_no: '',
  license_category: '',
  license_expiry: '',
  phone: '',
  safety_score: '100',
  status: DriverStatus.AVAILABLE,
};

const isExpired = (dateStr) => dateStr && new Date(dateStr) <= new Date();
const isExpiringSoon = (dateStr) => {
  if (!dateStr) return false;
  const diff = (new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24);
  return diff > 0 && diff <= 30;
};

const getLicenseStatus = (expiryDate) => {
  if (!expiryDate) return { label: 'Unknown', variant: 'default' };
  const expiry = new Date(expiryDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  expiry.setHours(0, 0, 0, 0);
  
  if (expiry < today) {
    return { label: 'Expired', variant: 'danger' };
  }
  
  const daysUntilExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
  if (daysUntilExpiry <= 30) {
    return { label: 'Expiring Soon', variant: 'warning' };
  }
  
  return { label: 'Valid', variant: 'success' };
};

const Drivers = () => {
  const { hasRole } = useAuth();
  const canEdit = hasRole([UserRoles.FLEET_MANAGER, UserRoles.SAFETY_OFFICER]);

  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const filters = {};
      if (statusFilter) filters.status = statusFilter;
      if (search) filters.search = search;
      const data = await getAllDrivers(filters);
      setDrivers(data);
    } catch {
      setError('Failed to load drivers');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormError('');
    setShowModal(true);
  };

  const openEdit = (d) => {
    setEditing(d);
    setForm({
      license_no: d.license_no,
      license_category: d.license_category,
      license_expiry: d.license_expiry?.split('T')[0] ?? '',
      phone: d.phone || '',
      safety_score: String(d.safety_score ?? 100),
      status: d.status,
    });
    setFormError('');
    setShowModal(true);
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      const payload = {
        ...form,
        safety_score: parseInt(form.safety_score, 10),
      };
      if (editing) {
        await updateDriver(editing.id, payload);
      } else {
        await createDriver(payload);
      }
      setShowModal(false);
      load();
    } catch (err) {
      setFormError(err.message || 'Failed to save driver');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleSuspend = async (d) => {
    const newStatus = d.status === DriverStatus.SUSPENDED ? DriverStatus.AVAILABLE : DriverStatus.SUSPENDED;
    const action = newStatus === DriverStatus.SUSPENDED ? 'suspend' : 'reactivate';
    try {
      await updateDriver(d.id, { status: newStatus });
      load();
    } catch (err) {
      // show inline — use a page-level error for this action
      setError(`Failed to ${action} driver: ${err.message}`);
    }
  };

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    ...Object.values(DriverStatus).map((s) => ({ value: s, label: s })),
  ];

  const columns = [
    {
      header: 'Name / Email',
      accessor: 'user_name',
      render: (r) => (
        <span>
          <strong>{r.user_name || '—'}</strong>
          <br /><span className="sub-text">{r.user_email || '—'}</span>
        </span>
      ),
    },
    { header: 'Licence No.', accessor: 'license_no' },
    { header: 'Category', accessor: 'license_category' },
    {
      header: 'Licence Expiry',
      accessor: 'license_expiry',
      render: (r) => {
        const d = r.license_expiry?.split('T')[0];
        if (!d) return '—';
        const status = getLicenseStatus(d);
        return (
          <div>
            <div>{d}</div>
            <StatusBadge status={status.label} variant={status.variant} />
          </div>
        );
      },
    },
    { header: 'Phone', accessor: 'phone', render: (r) => r.phone || '—' },
    {
      header: 'Safety Score',
      accessor: 'safety_score',
      render: (r) => (
        <span className={`score score-${r.safety_score >= 80 ? 'good' : r.safety_score >= 50 ? 'mid' : 'bad'}`}>
          {r.safety_score}
        </span>
      ),
    },
    { header: 'Status', accessor: 'status', render: (r) => <StatusBadge status={r.status} /> },
    ...(canEdit ? [{
      header: 'Actions',
      accessor: 'id',
      render: (r) => (
        <div className="action-btns">
          <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); openEdit(r); }}>
            Edit
          </Button>
          {r.status !== DriverStatus.ON_TRIP && (
            r.status === DriverStatus.SUSPENDED
              ? <Button size="sm" variant="success" onClick={(e) => { e.stopPropagation(); handleToggleSuspend(r); }}>Reactivate</Button>
              : <Button size="sm" variant="warning" onClick={(e) => { e.stopPropagation(); handleToggleSuspend(r); }}>Suspend</Button>
          )}
        </div>
      ),
    }] : []),
  ];

  return (
    <div className="page-container">
      <PageHeader
        title="Drivers"
        subtitle="Manage driver profiles and eligibility"
        actions={canEdit && <Button onClick={openAdd}>+ Add Driver</Button>}
      />

      <div className="toolbar">
        <input
          className="search-input"
          placeholder="Search by name, licence or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="filter-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          {statusOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {error && <div className="page-error">{error}</div>}

      <DataTable
        columns={columns}
        data={drivers}
        loading={loading}
        emptyMessage="No drivers found"
      />

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? `Edit Driver — ${editing.license_no}` : 'Add Driver'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="modal-form">
          {formError && <div className="form-banner-error">{formError}</div>}
          <div className="form-grid-2">
            <FormField
              label="Licence No."
              name="license_no"
              value={form.license_no}
              onChange={handleChange}
              required
              placeholder="e.g. DL-123456"
              disabled={!!editing}
            />
            <FormField
              label="Licence Category"
              name="license_category"
              type="select"
              value={form.license_category}
              onChange={handleChange}
              required
              options={LICENSE_CATEGORIES.map((c) => ({ value: c, label: c }))}
            />
            <FormField
              label="Licence Expiry"
              name="license_expiry"
              type="date"
              value={form.license_expiry}
              onChange={handleChange}
              required
            />
            <FormField
              label="Phone"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="e.g. +1 555 0100"
            />
            <FormField
              label="Safety Score (0–100)"
              name="safety_score"
              type="number"
              value={form.safety_score}
              onChange={handleChange}
              required
            />
            {editing && (
              <FormField
                label="Status"
                name="status"
                type="select"
                value={form.status}
                onChange={handleChange}
                required
                options={Object.values(DriverStatus).map((s) => ({ value: s, label: s }))}
              />
            )}
          </div>
          <div className="modal-actions">
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>{editing ? 'Save Changes' : 'Add Driver'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Drivers;
