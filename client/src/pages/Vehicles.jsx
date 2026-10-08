import React, { useState, useEffect, useCallback } from 'react';
import { getAllVehicles, createVehicle, updateVehicle, deleteVehicle } from '../api/vehicles';
import { useAuth } from '../context/AuthContext';
import { VehicleStatus, UserRoles } from '../utils/constants';
import PageHeader from '../components/PageHeader';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import FormField from '../components/FormField';
import Button from '../components/Button';
import './Vehicles.css';

const VEHICLE_TYPES = ['Truck', 'Van', 'Flatbed', 'Tanker', 'Refrigerated', 'Minibus', 'Other'];
const REGIONS = ['North', 'South', 'East', 'West', 'Central', 'Northeast', 'Northwest', 'Southeast', 'Southwest'];

const emptyForm = {
  registration_no: '',
  vehicle_name: '',
  model: '',
  vehicle_type: '',
  region: '',
  max_load_capacity: '',
  odometer: '',
  acquisition_cost: '',
};

const Vehicles = () => {
  const { hasRole } = useAuth();
  const isManager = hasRole([UserRoles.FLEET_MANAGER]);

  const [vehicles, setVehicles] = useState([]);
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
      const data = await getAllVehicles(filters);
      setVehicles(data);
    } catch {
      setError('Failed to load vehicles');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    load();
  }, [load]);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormError('');
    setShowModal(true);
  };

  const openEdit = (v) => {
    setEditing(v);
    setForm({
      registration_no: v.registration_no,
      vehicle_name: v.vehicle_name,
      model: v.model || '',
      vehicle_type: v.vehicle_type,
      region: v.region,
      max_load_capacity: v.max_load_capacity,
      odometer: v.odometer,
      acquisition_cost: v.acquisition_cost,
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
        max_load_capacity: parseFloat(form.max_load_capacity),
        odometer: parseFloat(form.odometer) || 0,
        acquisition_cost: parseFloat(form.acquisition_cost) || 0,
      };
      if (editing) {
        await updateVehicle(editing.id, payload);
      } else {
        await createVehicle(payload);
      }
      setShowModal(false);
      load();
    } catch (err) {
      setFormError(err.message || 'Failed to save vehicle');
    } finally {
      setSaving(false);
    }
  };

  const handleRetire = async (v) => {
    if (!window.confirm(`Retire vehicle ${v.registration_no}? This cannot be undone.`)) return;
    try {
      await deleteVehicle(v.id);
      load();
    } catch (err) {
      alert(err.message || 'Failed to retire vehicle');
    }
  };

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    ...Object.values(VehicleStatus).map((s) => ({ value: s, label: s })),
  ];

  const columns = [
    { header: 'Registration', accessor: 'registration_no', render: (r) => <strong>{r.registration_no}</strong> },
    { header: 'Name / Model', accessor: 'vehicle_name', render: (r) => (
      <span>{r.vehicle_name}<br /><span className="sub-text">{r.model}</span></span>
    )},
    { header: 'Type', accessor: 'vehicle_type' },
    { header: 'Region', accessor: 'region' },
    { header: 'Capacity (t)', accessor: 'max_load_capacity', render: (r) => parseFloat(r.max_load_capacity).toFixed(1) },
    { header: 'Odometer', accessor: 'odometer', render: (r) => `${parseFloat(r.odometer).toLocaleString()} km` },
    { header: 'Status', accessor: 'status', render: (r) => <StatusBadge status={r.status} /> },
    ...(isManager ? [{
      header: 'Actions',
      accessor: 'id',
      render: (r) => (
        <div className="action-btns">
          <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); openEdit(r); }}>Edit</Button>
          {r.status !== VehicleStatus.RETIRED && (
            <Button size="sm" variant="danger" onClick={(e) => { e.stopPropagation(); handleRetire(r); }}>Retire</Button>
          )}
        </div>
      ),
    }] : []),
  ];

  return (
    <div className="page-container">
      <PageHeader
        title="Vehicles"
        subtitle="Manage your fleet vehicles"
        actions={isManager && <Button onClick={openAdd}>+ Add Vehicle</Button>}
      />

      {/* Filters */}
      <div className="toolbar">
        <input
          className="search-input"
          placeholder="Search by registration, name or model..."
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
        data={vehicles}
        loading={loading}
        emptyMessage="No vehicles found"
      />

      {/* Add / Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? `Edit Vehicle — ${editing.registration_no}` : 'Add Vehicle'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="modal-form">
          {formError && <div className="form-banner-error">{formError}</div>}
          <div className="form-grid-2">
            <FormField label="Registration No." name="registration_no" value={form.registration_no} onChange={handleChange} required placeholder="e.g. ABC-1234" />
            <FormField label="Vehicle Name" name="vehicle_name" value={form.vehicle_name} onChange={handleChange} required placeholder="e.g. Scania R450" />
            <FormField label="Model" name="model" value={form.model} onChange={handleChange} placeholder="e.g. R450" />
            <FormField
              label="Vehicle Type"
              name="vehicle_type"
              type="select"
              value={form.vehicle_type}
              onChange={handleChange}
              required
              options={VEHICLE_TYPES.map((t) => ({ value: t, label: t }))}
            />
            <FormField
              label="Region"
              name="region"
              type="select"
              value={form.region}
              onChange={handleChange}
              required
              options={REGIONS.map((r) => ({ value: r, label: r }))}
            />
            <FormField label="Max Load Capacity (tonnes)" name="max_load_capacity" type="number" value={form.max_load_capacity} onChange={handleChange} required placeholder="e.g. 20" />
            <FormField label="Odometer (km)" name="odometer" type="number" value={form.odometer} onChange={handleChange} placeholder="e.g. 0" />
            <FormField label="Acquisition Cost ($)" name="acquisition_cost" type="number" value={form.acquisition_cost} onChange={handleChange} placeholder="e.g. 120000" />
          </div>
          <div className="modal-actions">
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>{editing ? 'Save Changes' : 'Add Vehicle'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Vehicles;
