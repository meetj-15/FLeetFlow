import React, { useState, useEffect, useCallback } from 'react';
import { getAllMaintenance, openMaintenance, closeMaintenance } from '../api/maintenance';
import { getAllVehicles } from '../api/vehicles';
import { useAuth } from '../context/AuthContext';
import { MaintenanceStatus, UserRoles } from '../utils/constants';
import PageHeader from '../components/PageHeader';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import FormField from '../components/FormField';
import Button from '../components/Button';
import './Maintenance.css';

const MAINTENANCE_TYPES = [
  'Oil Change', 'Tyre Replacement', 'Brake Service', 'Engine Repair',
  'Transmission Service', 'Electrical', 'Body Work', 'Scheduled Service', 'Other',
];

const emptyForm = {
  vehicle_id: '',
  maintenance_type: '',
  description: '',
  cost: '',
  start_date: new Date().toISOString().split('T')[0],
};

const Maintenance = () => {
  const { hasRole } = useAuth();
  const canEdit = hasRole([UserRoles.FLEET_MANAGER, UserRoles.SAFETY_OFFICER]);

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [vehicles, setVehicles] = useState([]);

  const [showOpen, setShowOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const [showClose, setShowClose] = useState(false);
  const [closingRecord, setClosingRecord] = useState(null);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [closing, setClosing] = useState(false);
  const [closeError, setCloseError] = useState('');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const filters = {};
      if (statusFilter) filters.status = statusFilter;
      const data = await getAllMaintenance(filters);
      setRecords(data);
    } catch {
      setError('Failed to load maintenance records');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  const loadVehicles = async () => {
    try {
      const vs = await getAllVehicles();
      setVehicles(vs.filter((v) => v.status !== 'Retired'));
    } catch { /* non-fatal */ }
  };

  const openOpenModal = () => {
    setForm(emptyForm);
    setFormError('');
    loadVehicles();
    setShowOpen(true);
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleOpen = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      const payload = {
        ...form,
        cost: parseFloat(form.cost) || 0,
      };
      await openMaintenance(payload);
      setShowOpen(false);
      setToast('Maintenance opened — vehicle status set to In Shop');
      setTimeout(() => setToast(''), 4000);
      load();
    } catch (err) {
      setFormError(err.message || 'Failed to open maintenance');
    } finally {
      setSaving(false);
    }
  };

  const openCloseModal = (record) => {
    setClosingRecord(record);
    setEndDate(new Date().toISOString().split('T')[0]);
    setCloseError('');
    setShowClose(true);
  };

  const handleClose = async (e) => {
    e.preventDefault();
    setClosing(true);
    setCloseError('');
    try {
      await closeMaintenance(closingRecord.id, { end_date: endDate });
      setShowClose(false);
      setToast('Maintenance closed — vehicle status restored to Available');
      setTimeout(() => setToast(''), 4000);
      load();
    } catch (err) {
      setCloseError(err.message || 'Failed to close maintenance');
    } finally {
      setClosing(false);
    }
  };

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    ...Object.values(MaintenanceStatus).map((s) => ({ value: s, label: s })),
  ];

  const columns = [
    {
      header: 'Vehicle',
      accessor: 'vehicle_registration',
      render: (r) => (
        <span>
          <strong>{r.vehicle_registration}</strong>
          <br /><span className="sub-text">{r.vehicle_name}</span>
        </span>
      ),
    },
    { header: 'Type', accessor: 'maintenance_type' },
    {
      header: 'Description',
      accessor: 'description',
      render: (r) => <span className="desc-cell">{r.description || '—'}</span>,
    },
    {
      header: 'Cost',
      accessor: 'cost',
      render: (r) => `$${parseFloat(r.cost).toFixed(2)}`,
    },
    { header: 'Start Date', accessor: 'start_date', render: (r) => r.start_date?.split('T')[0] ?? '—' },
    { header: 'End Date', accessor: 'end_date', render: (r) => r.end_date?.split('T')[0] ?? '—' },
    { header: 'Record Status', accessor: 'status', render: (r) => <StatusBadge status={r.status} /> },
    ...(canEdit ? [{
      header: 'Actions',
      accessor: 'id',
      render: (r) => r.status === MaintenanceStatus.ACTIVE ? (
        <Button size="sm" variant="success" onClick={(e) => { e.stopPropagation(); openCloseModal(r); }}>
          Close
        </Button>
      ) : (
        <span className="sub-text">Done</span>
      ),
    }] : []),
  ];

  return (
    <div className="page-container">
      <PageHeader
        title="Maintenance"
        subtitle="Track vehicle maintenance and workshop records"
        actions={canEdit && <Button onClick={openOpenModal}>+ Open Maintenance</Button>}
      />

      <div className="toolbar">
        <select
          className="filter-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          {statusOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {error && <div className="page-error">{error}</div>}
      {toast && <div className="page-toast">{toast}</div>}

      <DataTable
        columns={columns}
        data={records}
        loading={loading}
        emptyMessage="No maintenance records found"
      />

      {/* Open Maintenance Modal */}
      <Modal isOpen={showOpen} onClose={() => setShowOpen(false)} title="Open Maintenance Record" size="md">
        <form onSubmit={handleOpen} className="modal-form">
          {formError && <div className="form-banner-error">{formError}</div>}
          <FormField
            label="Vehicle"
            name="vehicle_id"
            type="select"
            value={form.vehicle_id}
            onChange={handleChange}
            required
            options={vehicles.map((v) => ({
              value: v.id,
              label: `${v.registration_no} — ${v.vehicle_name} [${v.status}]`,
            }))}
          />
          <FormField
            label="Maintenance Type"
            name="maintenance_type"
            type="select"
            value={form.maintenance_type}
            onChange={handleChange}
            required
            options={MAINTENANCE_TYPES.map((t) => ({ value: t, label: t }))}
          />
          <FormField
            label="Description"
            name="description"
            type="textarea"
            value={form.description}
            onChange={handleChange}
            placeholder="Describe the maintenance work..."
          />
          <div className="form-grid-2">
            <FormField
              label="Estimated Cost ($)"
              name="cost"
              type="number"
              value={form.cost}
              onChange={handleChange}
              placeholder="e.g. 500"
            />
            <FormField
              label="Start Date"
              name="start_date"
              type="date"
              value={form.start_date}
              onChange={handleChange}
              required
            />
          </div>
          <div className="modal-actions">
            <Button type="button" variant="secondary" onClick={() => setShowOpen(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>Open Record</Button>
          </div>
        </form>
      </Modal>

      {/* Close Maintenance Modal */}
      <Modal isOpen={showClose} onClose={() => setShowClose(false)} title="Close Maintenance" size="sm">
        {closingRecord && (
          <form onSubmit={handleClose} className="modal-form">
            <p className="close-info">
              <strong>{closingRecord.maintenance_type}</strong> on {closingRecord.vehicle_registration}
            </p>
            {closeError && <div className="form-banner-error">{closeError}</div>}
            <FormField
              label="End Date"
              name="end_date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
            <div className="modal-actions">
              <Button type="button" variant="secondary" onClick={() => setShowClose(false)}>Cancel</Button>
              <Button type="submit" variant="success" loading={closing}>Close Maintenance</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default Maintenance;
