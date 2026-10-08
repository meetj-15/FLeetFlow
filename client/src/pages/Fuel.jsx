import React, { useState, useEffect, useCallback } from 'react';
import { getAllFuelLogs, createFuelLog } from '../api/fuel';
import { getAllVehicles } from '../api/vehicles';
import { getAllTrips } from '../api/trips';
import { useAuth } from '../context/AuthContext';
import { UserRoles, TripStatus } from '../utils/constants';
import PageHeader from '../components/PageHeader';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import FormField from '../components/FormField';
import Button from '../components/Button';
import './Fuel.css';

const emptyForm = {
  vehicle_id: '',
  trip_id: '',
  liters: '',
  cost: '',
  fuel_date: new Date().toISOString().split('T')[0],
};

const Fuel = () => {
  const { hasRole } = useAuth();
  const canAdd = hasRole([UserRoles.FLEET_MANAGER, UserRoles.DRIVER]);

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [trips, setTrips] = useState([]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getAllFuelLogs();
      setLogs(data);
    } catch {
      setError('Failed to load fuel logs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const loadResources = async () => {
    try {
      const [vs, ts] = await Promise.all([
        getAllVehicles(),
        getAllTrips({ status: TripStatus.DISPATCHED }),
      ]);
      setVehicles(vs.filter((v) => v.status !== 'Retired'));
      setTrips(ts);
    } catch { /* non-fatal */ }
  };

  const openModal = () => {
    setForm(emptyForm);
    setFormError('');
    loadResources();
    setShowModal(true);
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      const payload = {
        vehicle_id: form.vehicle_id,
        trip_id: form.trip_id || undefined,
        liters: parseFloat(form.liters),
        cost: parseFloat(form.cost),
        fuel_date: form.fuel_date,
      };
      await createFuelLog(payload);
      setShowModal(false);
      load();
    } catch (err) {
      setFormError(err.message || 'Failed to save fuel log');
    } finally {
      setSaving(false);
    }
  };

  // Summary stats
  const totalLiters = logs.reduce((s, l) => s + parseFloat(l.liters), 0);
  const totalCost = logs.reduce((s, l) => s + parseFloat(l.cost), 0);

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
    {
      header: 'Trip',
      accessor: 'source',
      render: (r) => r.source ? `${r.source} → ${r.destination}` : '—',
    },
    {
      header: 'Litres',
      accessor: 'liters',
      render: (r) => `${parseFloat(r.liters).toFixed(2)} L`,
    },
    {
      header: 'Cost',
      accessor: 'cost',
      render: (r) => `$${parseFloat(r.cost).toFixed(2)}`,
    },
    {
      header: 'Cost/Litre',
      accessor: 'cpl',
      render: (r) => {
        const l = parseFloat(r.liters);
        const c = parseFloat(r.cost);
        return l > 0 ? `$${(c / l).toFixed(3)}` : '—';
      },
    },
    { header: 'Date', accessor: 'fuel_date', render: (r) => r.fuel_date?.split('T')[0] ?? '—' },
  ];

  return (
    <div className="page-container">
      <PageHeader
        title="Fuel"
        subtitle="Track fuel consumption and costs"
        actions={canAdd && <Button onClick={openModal}>+ Log Fuel</Button>}
      />

      {/* Summary cards */}
      <div className="fuel-summary">
        <div className="fuel-stat">
          <span className="fuel-stat-label">Total Entries</span>
          <span className="fuel-stat-value">{logs.length}</span>
        </div>
        <div className="fuel-stat">
          <span className="fuel-stat-label">Total Litres</span>
          <span className="fuel-stat-value">{totalLiters.toFixed(1)} L</span>
        </div>
        <div className="fuel-stat">
          <span className="fuel-stat-label">Total Cost</span>
          <span className="fuel-stat-value">${totalCost.toFixed(2)}</span>
        </div>
        <div className="fuel-stat">
          <span className="fuel-stat-label">Avg Cost/Litre</span>
          <span className="fuel-stat-value">
            {totalLiters > 0 ? `$${(totalCost / totalLiters).toFixed(3)}` : '—'}
          </span>
        </div>
      </div>

      {error && <div className="page-error">{error}</div>}

      <DataTable
        columns={columns}
        data={logs}
        loading={loading}
        emptyMessage="No fuel logs recorded yet"
      />

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Log Fuel Entry" size="md">
        <form onSubmit={handleSubmit} className="modal-form">
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
              label: `${v.registration_no} — ${v.vehicle_name}`,
            }))}
          />
          <FormField
            label="Trip (optional)"
            name="trip_id"
            type="select"
            value={form.trip_id}
            onChange={handleChange}
            options={[
              { value: '', label: 'No associated trip' },
              ...trips.map((t) => ({
                value: t.id,
                label: `${t.source} → ${t.destination} [${t.vehicle_registration}]`,
              })),
            ]}
          />
          <div className="form-grid-2">
            <FormField
              label="Litres"
              name="liters"
              type="number"
              value={form.liters}
              onChange={handleChange}
              required
              placeholder="e.g. 80.5"
              min="0.01"
              step="0.01"
            />
            <FormField
              label="Total Cost ($)"
              name="cost"
              type="number"
              value={form.cost}
              onChange={handleChange}
              required
              placeholder="e.g. 145.00"
              min="0"
              step="0.01"
            />
            <FormField
              label="Date"
              name="fuel_date"
              type="date"
              value={form.fuel_date}
              onChange={handleChange}
              required
            />
          </div>
          <div className="modal-actions">
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>Save Entry</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Fuel;
