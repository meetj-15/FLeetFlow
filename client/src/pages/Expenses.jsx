import React, { useState, useEffect, useCallback } from 'react';
import { getAllExpenses, createExpense } from '../api/expenses';
import { getAllVehicles } from '../api/vehicles';
import { getAllTrips } from '../api/trips';
import { useAuth } from '../context/AuthContext';
import { ExpenseCategory, UserRoles } from '../utils/constants';
import PageHeader from '../components/PageHeader';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import FormField from '../components/FormField';
import Button from '../components/Button';
import './Expenses.css';

const emptyForm = {
  vehicle_id: '',
  trip_id: '',
  category: '',
  amount: '',
  description: '',
  expense_date: new Date().toISOString().split('T')[0],
};

const CATEGORY_COLORS = {
  Fuel: 'info',
  Maintenance: 'warning',
  Tolls: 'secondary',
  Parking: 'secondary',
  Insurance: 'primary',
  Other: 'secondary',
};

const Expenses = () => {
  const { hasRole } = useAuth();
  const canAdd = hasRole([UserRoles.FLEET_MANAGER, UserRoles.FINANCIAL_ANALYST]);

  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState({ total_expenses: 0, count: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

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
      const filters = {};
      if (categoryFilter) filters.category = categoryFilter;
      if (startDate) filters.start_date = startDate;
      if (endDate) filters.end_date = endDate;
      const data = await getAllExpenses(filters);
      setExpenses(data.expenses || []);
      setSummary(data.summary || { total_expenses: 0, count: 0 });
    } catch {
      setError('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, startDate, endDate]);

  useEffect(() => { load(); }, [load]);

  const loadResources = async () => {
    try {
      const [vs, ts] = await Promise.all([getAllVehicles(), getAllTrips()]);
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
        vehicle_id: form.vehicle_id || undefined,
        trip_id: form.trip_id || undefined,
        category: form.category,
        amount: parseFloat(form.amount),
        description: form.description || undefined,
        expense_date: form.expense_date,
      };
      await createExpense(payload);
      setShowModal(false);
      load();
    } catch (err) {
      setFormError(err.message || 'Failed to save expense');
    } finally {
      setSaving(false);
    }
  };

  // Category breakdown from loaded data
  const categoryBreakdown = Object.values(ExpenseCategory).map((cat) => {
    const total = expenses
      .filter((e) => e.category === cat)
      .reduce((s, e) => s + parseFloat(e.amount), 0);
    return { category: cat, total };
  }).filter((c) => c.total > 0);

  const categoryOptions = [
    { value: '', label: 'All Categories' },
    ...Object.values(ExpenseCategory).map((c) => ({ value: c, label: c })),
  ];

  const columns = [
    {
      header: 'Date',
      accessor: 'expense_date',
      render: (r) => r.expense_date?.split('T')[0] ?? '—',
    },
    {
      header: 'Category',
      accessor: 'category',
      render: (r) => (
        <span className={`cat-badge cat-${CATEGORY_COLORS[r.category] || 'secondary'}`}>
          {r.category}
        </span>
      ),
    },
    {
      header: 'Amount',
      accessor: 'amount',
      render: (r) => <strong>${parseFloat(r.amount).toFixed(2)}</strong>,
    },
    {
      header: 'Vehicle',
      accessor: 'vehicle_registration',
      render: (r) => r.vehicle_registration
        ? `${r.vehicle_registration} — ${r.vehicle_name}`
        : '—',
    },
    {
      header: 'Trip',
      accessor: 'source',
      render: (r) => r.source ? `${r.source} → ${r.destination}` : '—',
    },
    {
      header: 'Description',
      accessor: 'description',
      render: (r) => <span className="desc-cell">{r.description || '—'}</span>,
    },
  ];

  return (
    <div className="page-container">
      <PageHeader
        title="Expenses"
        subtitle="Monitor and record operational costs"
        actions={canAdd && <Button onClick={openModal}>+ Add Expense</Button>}
      />

      {/* Summary bar */}
      <div className="expense-summary">
        <div className="exp-stat">
          <span className="exp-stat-label">Total Expenses</span>
          <span className="exp-stat-value">${parseFloat(summary.total_expenses).toFixed(2)}</span>
        </div>
        <div className="exp-stat">
          <span className="exp-stat-label">Records</span>
          <span className="exp-stat-value">{summary.count}</span>
        </div>
        {categoryBreakdown.map((c) => (
          <div key={c.category} className="exp-stat">
            <span className="exp-stat-label">{c.category}</span>
            <span className="exp-stat-value">${c.total.toFixed(2)}</span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="toolbar">
        <select
          className="filter-select"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          {categoryOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <input
          className="search-input"
          type="date"
          title="From date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          style={{ width: 160 }}
        />
        <span className="date-sep">→</span>
        <input
          className="search-input"
          type="date"
          title="To date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          style={{ width: 160 }}
        />
        {(startDate || endDate || categoryFilter) && (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => { setCategoryFilter(''); setStartDate(''); setEndDate(''); }}
          >
            Clear
          </Button>
        )}
      </div>

      {error && <div className="page-error">{error}</div>}

      <DataTable
        columns={columns}
        data={expenses}
        loading={loading}
        emptyMessage="No expenses recorded yet"
      />

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Expense" size="md">
        <form onSubmit={handleSubmit} className="modal-form">
          {formError && <div className="form-banner-error">{formError}</div>}
          <div className="form-grid-2">
            <FormField
              label="Category"
              name="category"
              type="select"
              value={form.category}
              onChange={handleChange}
              required
              options={Object.values(ExpenseCategory).map((c) => ({ value: c, label: c }))}
            />
            <FormField
              label="Amount ($)"
              name="amount"
              type="number"
              value={form.amount}
              onChange={handleChange}
              required
              placeholder="e.g. 250.00"
              min="0"
              step="0.01"
            />
            <FormField
              label="Vehicle (optional)"
              name="vehicle_id"
              type="select"
              value={form.vehicle_id}
              onChange={handleChange}
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
                  label: `${t.source} → ${t.destination} [${t.status}]`,
                })),
              ]}
            />
            <FormField
              label="Expense Date"
              name="expense_date"
              type="date"
              value={form.expense_date}
              onChange={handleChange}
              required
            />
          </div>
          <FormField
            label="Description"
            name="description"
            type="textarea"
            value={form.description}
            onChange={handleChange}
            placeholder="Optional details about this expense..."
            rows={2}
          />
          <div className="modal-actions">
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>Save Expense</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Expenses;
