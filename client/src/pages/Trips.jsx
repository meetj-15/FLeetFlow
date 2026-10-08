import React, { useState, useEffect, useCallback } from 'react';
import {
  getAllTrips, createTrip, dispatchTrip, completeTrip, cancelTrip,
} from '../api/trips';
import { getAllVehicles } from '../api/vehicles';
import { getAvailableDrivers } from '../api/drivers';
import { useAuth } from '../context/AuthContext';
import { TripStatus, UserRoles } from '../utils/constants';
import PageHeader from '../components/PageHeader';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import FormField from '../components/FormField';
import Button from '../components/Button';
import './Trips.css';

const emptyForm = {
  vehicle_id: '',
  driver_id: '',
  source: '',
  destination: '',
  cargo_weight: '',
  planned_distance: '',
  revenue: '',
  scheduled_date: '',
};

const emptyCompleteForm = { actual_distance: '', end_odometer: '' };

const fmt = (n) => (n !== undefined && n !== null ? parseFloat(n).toLocaleString() : '—');

const Trips = () => {
  const { hasRole } = useAuth();
  const canCreate   = hasRole([UserRoles.FLEET_MANAGER, UserRoles.DRIVER]);
  const canDispatch = hasRole([UserRoles.FLEET_MANAGER, UserRoles.DRIVER]);
  const canComplete = hasRole([UserRoles.FLEET_MANAGER, UserRoles.DRIVER]);
  const canCancel   = hasRole([UserRoles.FLEET_MANAGER, UserRoles.DRIVER]);

  const [trips, setTrips]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [pageError, setPageError]   = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  /* ── Create modal ── */
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm]             = useState(emptyForm);
  const [formError, setFormError]   = useState('');
  const [saving, setSaving]         = useState(false);
  const [availableVehicles, setAvailableVehicles] = useState([]);
  const [availableDrivers, setAvailableDrivers]   = useState([]);

  /* ── Complete modal ── */
  const [showComplete, setShowComplete]     = useState(false);
  const [completingTrip, setCompletingTrip] = useState(null);
  const [completeForm, setCompleteForm]     = useState(emptyCompleteForm);
  const [completeError, setCompleteError]   = useState('');
  const [completing, setCompleting]         = useState(false);

  /* ── Confirm modal (dispatch / cancel) ── */
  const [confirm, setConfirm] = useState(null); // { action, trip }
  const [actionError, setActionError] = useState('');
  const [actionBusy, setActionBusy]   = useState(false);

  /* ── Detail modal ── */
  const [showDetail, setShowDetail]     = useState(false);
  const [selectedTrip, setSelectedTrip] = useState(null);

  /* ────────────────────────────────── load ── */
  const load = useCallback(async () => {
    try {
      setLoading(true);
      setPageError('');
      const filters = {};
      if (statusFilter) filters.status = statusFilter;
      const data = await getAllTrips(filters);
      setTrips(data);
    } catch {
      setPageError('Failed to load trips');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  /* ────────────────────────────── resources ── */
  const loadResources = async () => {
    try {
      const [vs, ds] = await Promise.all([
        getAllVehicles({ status: 'Available' }),
        getAvailableDrivers(),
      ]);
      setAvailableVehicles(vs);
      setAvailableDrivers(ds);
    } catch { /* non-fatal */ }
  };

  /* ──────────────────────────────── CREATE ── */
  const openCreate = () => {
    setForm(emptyForm);
    setFormError('');
    loadResources();
    setShowCreate(true);
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      await createTrip({
        ...form,
        cargo_weight:     parseFloat(form.cargo_weight),
        planned_distance: parseFloat(form.planned_distance),
        revenue:          parseFloat(form.revenue) || 0,
        scheduled_date:   form.scheduled_date || undefined,
      });
      setShowCreate(false);
      load();
    } catch (err) {
      setFormError(err.message || 'Failed to create trip');
    } finally {
      setSaving(false);
    }
  };

  /* ─────────────────────────── DISPATCH / CANCEL (confirm modal) ── */
  const openDispatch = (trip) => {
    setConfirm({ action: 'dispatch', trip });
    setActionError('');
  };

  const openCancel = (trip) => {
    setConfirm({ action: 'cancel', trip });
    setActionError('');
  };

  const handleConfirmAction = async () => {
    if (!confirm) return;
    setActionBusy(true);
    setActionError('');
    try {
      if (confirm.action === 'dispatch') {
        await dispatchTrip(confirm.trip.id);
      } else {
        await cancelTrip(confirm.trip.id);
      }
      setConfirm(null);
      load();
    } catch (err) {
      setActionError(err.message || `Failed to ${confirm.action} trip`);
    } finally {
      setActionBusy(false);
    }
  };

  /* ──────────────────────────────── COMPLETE ── */
  const openComplete = (trip) => {
    setCompletingTrip(trip);
    setCompleteForm(emptyCompleteForm);
    setCompleteError('');
    setShowComplete(true);
  };

  const handleComplete = async (e) => {
    e.preventDefault();
    setCompleting(true);
    setCompleteError('');
    try {
      await completeTrip(completingTrip.id, {
        actual_distance: parseFloat(completeForm.actual_distance),
        end_odometer:    parseFloat(completeForm.end_odometer),
      });
      setShowComplete(false);
      load();
    } catch (err) {
      setCompleteError(err.message || 'Failed to complete trip');
    } finally {
      setCompleting(false);
    }
  };

  /* ─────────────────────────────── DETAIL ── */
  const openDetail = (trip) => { setSelectedTrip(trip); setShowDetail(true); };

  /* ──────────────────────────────── TABLE ── */
  const statusOptions = [
    { value: '', label: 'All Statuses' },
    ...Object.values(TripStatus).map((s) => ({ value: s, label: s })),
  ];

  const columns = [
    {
      header: 'Route',
      accessor: 'source',
      render: (r) => <span><strong>{r.source}</strong> → <strong>{r.destination}</strong></span>,
    },
    {
      header: 'Vehicle',
      accessor: 'vehicle_registration',
      render: (r) => (
        <span>{r.vehicle_registration || '—'}<br /><span className="sub-text">{r.vehicle_name}</span></span>
      ),
    },
    {
      header: 'Driver',
      accessor: 'driver_name',
      render: (r) => r.driver_name || r.driver_license || '—',
    },
    {
      header: 'Cargo',
      accessor: 'cargo_weight',
      render: (r) => `${parseFloat(r.cargo_weight).toFixed(1)} t`,
    },
    {
      header: 'Revenue',
      accessor: 'revenue',
      render: (r) => `$${parseFloat(r.revenue).toFixed(2)}`,
    },
    { header: 'Status', accessor: 'status', render: (r) => <StatusBadge status={r.status} /> },
    {
      header: 'Actions',
      accessor: 'id',
      render: (r) => (
        <div className="action-btns">
          <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); openDetail(r); }}>
            View
          </Button>
          {canDispatch && r.status === TripStatus.DRAFT && (
            <Button size="sm" variant="primary" onClick={(e) => { e.stopPropagation(); openDispatch(r); }}>
              Dispatch
            </Button>
          )}
          {canComplete && r.status === TripStatus.DISPATCHED && (
            <Button size="sm" variant="success" onClick={(e) => { e.stopPropagation(); openComplete(r); }}>
              Complete
            </Button>
          )}
          {canCancel && (r.status === TripStatus.DRAFT || r.status === TripStatus.DISPATCHED) && (
            <Button size="sm" variant="danger" onClick={(e) => { e.stopPropagation(); openCancel(r); }}>
              Cancel
            </Button>
          )}
        </div>
      ),
    },
  ];

  /* ──────────────────────────────── RENDER ── */
  return (
    <div className="page-container">
      <PageHeader
        title="Trips"
        subtitle="Plan, dispatch and track fleet trips"
        actions={canCreate && <Button onClick={openCreate}>+ New Trip</Button>}
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

      {pageError && <div className="page-error">{pageError}</div>}

      <DataTable
        columns={columns}
        data={trips}
        loading={loading}
        emptyMessage="No trips found"
      />

      {/* ── Create Trip Modal ── */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="New Trip" size="lg">
        <form onSubmit={handleCreate} className="modal-form">
          {formError && <div className="form-banner-error">{formError}</div>}
          <div className="form-grid-2">
            <FormField
              label="Vehicle"
              name="vehicle_id"
              type="select"
              value={form.vehicle_id}
              onChange={handleChange}
              required
              options={availableVehicles.map((v) => ({
                value: v.id,
                label: `${v.registration_no} — ${v.vehicle_name} (max ${v.max_load_capacity} t)`,
              }))}
            />
            <FormField
              label="Driver"
              name="driver_id"
              type="select"
              value={form.driver_id}
              onChange={handleChange}
              required
              options={availableDrivers.map((d) => ({
                value: d.id,
                label: `${d.user_name || d.license_no} (${d.license_category}) — safety ${d.safety_score}`,
              }))}
            />
            <FormField label="Source" name="source" value={form.source} onChange={handleChange} required placeholder="Departure city/location" />
            <FormField label="Destination" name="destination" value={form.destination} onChange={handleChange} required placeholder="Arrival city/location" />
            <FormField
              label="Cargo Weight (tonnes)"
              name="cargo_weight"
              type="number"
              value={form.cargo_weight}
              onChange={handleChange}
              required
              placeholder="e.g. 12.5"
              min="0.01"
              step="0.01"
            />
            <FormField
              label="Planned Distance (km)"
              name="planned_distance"
              type="number"
              value={form.planned_distance}
              onChange={handleChange}
              required
              placeholder="e.g. 450"
              min="0.1"
              step="0.1"
            />
            <FormField
              label="Revenue ($)"
              name="revenue"
              type="number"
              value={form.revenue}
              onChange={handleChange}
              placeholder="e.g. 3500"
              min="0"
              step="0.01"
            />
            <FormField label="Scheduled Date" name="scheduled_date" type="datetime-local" value={form.scheduled_date} onChange={handleChange} />
          </div>
          <div className="modal-actions">
            <Button type="button" variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>Create Trip</Button>
          </div>
        </form>
      </Modal>

      {/* ── Dispatch / Cancel Confirm Modal ── */}
      <Modal
        isOpen={!!confirm}
        onClose={() => { if (!actionBusy) setConfirm(null); }}
        title={confirm?.action === 'dispatch' ? 'Confirm Dispatch' : 'Confirm Cancellation'}
        size="sm"
      >
        {confirm && (
          <div className="modal-form">
            <p className="confirm-msg">
              {confirm.action === 'dispatch'
                ? <>Dispatch trip <strong>{confirm.trip.source} → {confirm.trip.destination}</strong>?
                    <br /><span className="sub-text">Vehicle and driver will be marked as On Trip.</span></>
                : <>Cancel trip <strong>{confirm.trip.source} → {confirm.trip.destination}</strong>?
                    {confirm.trip.status === TripStatus.DISPATCHED &&
                      <><br /><span className="sub-text warn-text">Vehicle and driver will be released back to Available.</span></>
                    }</>
              }
            </p>
            {actionError && <div className="form-banner-error">{actionError}</div>}
            <div className="modal-actions">
              <Button type="button" variant="secondary" disabled={actionBusy} onClick={() => setConfirm(null)}>
                Go Back
              </Button>
              <Button
                variant={confirm.action === 'dispatch' ? 'primary' : 'danger'}
                loading={actionBusy}
                onClick={handleConfirmAction}
              >
                {confirm.action === 'dispatch' ? 'Dispatch' : 'Cancel Trip'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Complete Trip Modal ── */}
      <Modal isOpen={showComplete} onClose={() => setShowComplete(false)} title="Complete Trip" size="sm">
        {completingTrip && (
          <form onSubmit={handleComplete} className="modal-form">
            <p className="confirm-msg">
              <strong>{completingTrip.source} → {completingTrip.destination}</strong>
              <br /><span className="sub-text">Vehicle and driver will return to Available.</span>
            </p>
            {completeError && <div className="form-banner-error">{completeError}</div>}
            <FormField
              label="Actual Distance (km)"
              name="actual_distance"
              type="number"
              value={completeForm.actual_distance}
              onChange={(e) => setCompleteForm({ ...completeForm, actual_distance: e.target.value })}
              required
              placeholder="e.g. 462"
            />
            <FormField
              label="End Odometer (km)"
              name="end_odometer"
              type="number"
              value={completeForm.end_odometer}
              onChange={(e) => setCompleteForm({ ...completeForm, end_odometer: e.target.value })}
              required
              placeholder="e.g. 84620"
            />
            <div className="modal-actions">
              <Button type="button" variant="secondary" onClick={() => setShowComplete(false)}>Cancel</Button>
              <Button type="submit" variant="success" loading={completing}>Mark Complete</Button>
            </div>
          </form>
        )}
      </Modal>

      {/* ── Trip Detail Modal ── */}
      <Modal isOpen={showDetail} onClose={() => setShowDetail(false)} title="Trip Details" size="md">
        {selectedTrip && (
          <div className="trip-detail">
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">Route</span>
                <span className="detail-value">{selectedTrip.source} → {selectedTrip.destination}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Status</span>
                <span className="detail-value"><StatusBadge status={selectedTrip.status} /></span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Vehicle</span>
                <span className="detail-value">{selectedTrip.vehicle_registration} — {selectedTrip.vehicle_name}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Driver</span>
                <span className="detail-value">{selectedTrip.driver_name || selectedTrip.driver_license || '—'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Cargo Weight</span>
                <span className="detail-value">{fmt(selectedTrip.cargo_weight)} t</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Planned Distance</span>
                <span className="detail-value">{fmt(selectedTrip.planned_distance)} km</span>
              </div>
              {selectedTrip.actual_distance && (
                <div className="detail-item">
                  <span className="detail-label">Actual Distance</span>
                  <span className="detail-value">{fmt(selectedTrip.actual_distance)} km</span>
                </div>
              )}
              <div className="detail-item">
                <span className="detail-label">Revenue</span>
                <span className="detail-value revenue">${parseFloat(selectedTrip.revenue).toFixed(2)}</span>
              </div>
              {selectedTrip.dispatch_time && (
                <div className="detail-item">
                  <span className="detail-label">Dispatched</span>
                  <span className="detail-value">{new Date(selectedTrip.dispatch_time).toLocaleString()}</span>
                </div>
              )}
              {selectedTrip.completed_time && (
                <div className="detail-item">
                  <span className="detail-label">Completed</span>
                  <span className="detail-value">{new Date(selectedTrip.completed_time).toLocaleString()}</span>
                </div>
              )}
              {selectedTrip.start_odometer && (
                <div className="detail-item">
                  <span className="detail-label">Start Odometer</span>
                  <span className="detail-value">{fmt(selectedTrip.start_odometer)} km</span>
                </div>
              )}
              {selectedTrip.end_odometer && (
                <div className="detail-item">
                  <span className="detail-label">End Odometer</span>
                  <span className="detail-value">{fmt(selectedTrip.end_odometer)} km</span>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Trips;
