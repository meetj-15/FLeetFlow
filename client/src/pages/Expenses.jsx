import React, { useState } from 'react';
import DataTable from '../components/DataTable';
import Button from '../components/Button';
import FormField from '../components/FormField';
import Modal from '../components/Modal';
import KpiCard from '../components/KpiCard';

const MOCK_EXPENSES = [
  { id: 'EXP-401', category: 'Toll Fees', amount: '$45.00', trip: 'TRP-101 (NY -> Bos)', status: 'Approved', merchant: 'E-ZPass NY', date: '2026-10-24' },
  { id: 'EXP-402', category: 'Driver Lodging', amount: '$120.00', trip: 'TRP-102 (Atl -> Mia)', status: 'Pending Approval', merchant: 'Motel 6 Miami', date: '2026-10-23' },
  { id: 'EXP-403', category: 'Emergency Tire Repair', amount: '$350.00', trip: 'TRP-103 (Chi -> Det)', status: 'Approved', merchant: 'Goodyear Fleet Service', date: '2026-10-22' },
  { id: 'EXP-404', category: 'Permits & Clearance', amount: '$85.00', trip: 'TRP-104 (Dal -> Hou)', status: 'Rejected', merchant: 'Texas DOT', date: '2026-10-20' }
];

const Expenses = () => {
  const [expenses] = useState(MOCK_EXPENSES);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredExpenses = expenses.filter(
    (e) => e.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
           e.merchant.toLowerCase().includes(searchTerm.toLowerCase()) ||
           e.trip.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    { header: 'Expense ID', accessor: 'id', sortable: true },
    { header: 'Category', accessor: 'category', sortable: true },
    { header: 'Amount', accessor: 'amount', sortable: true },
    { header: 'Associated Trip', accessor: 'trip' },
    { header: 'Merchant / Vendor', accessor: 'merchant' },
    { header: 'Date', accessor: 'date', sortable: true },
    { 
      header: 'Approval Status', 
      accessor: 'status',
      render: (row) => {
        const bgColors = {
          'Approved': 'var(--success-subtle)',
          'Pending Approval': 'var(--warning-subtle)',
          'Rejected': 'var(--danger-subtle)'
        };
        const textColors = {
          'Approved': 'var(--success-color)',
          'Pending Approval': 'var(--warning-color)',
          'Rejected': 'var(--danger-color)'
        };
        return (
          <span style={{
            padding: '0.25rem 0.625rem',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.75rem',
            fontWeight: 600,
            backgroundColor: bgColors[row.status] || 'var(--bg-tertiary)',
            color: textColors[row.status] || 'var(--text-secondary)'
          }}>
            {row.status}
          </span>
        );
      }
    }
  ];

  return (
    <div className="container" style={{ padding: 'var(--spacing-lg) 0' }}>
      <div className="flex justify-between items-center" style={{ marginBottom: 'var(--spacing-lg)' }}>
        <div>
          <h2>Operational Expenses</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Review, audit, and log trip-related fleet expenditures.</p>
        </div>
        <Button variant="primary" onClick={() => setIsModalOpen(true)}>+ File New Expense</Button>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: 'var(--spacing-md)',
        marginBottom: 'var(--spacing-lg)'
      }}>
        <KpiCard title="Total Approved Expenses" value="$600.00" trend={{ type: 'down', value: '12% vs budget' }} color="primary" />
        <KpiCard title="Pending Approvals" value="$120.00" trend={{ type: 'up', value: '1 claim pending' }} color="warning" />
      </div>

      <div style={{ backgroundColor: 'var(--bg-primary)', padding: 'var(--spacing-md)', borderRadius: 'var(--radius-lg)', marginBottom: 'var(--spacing-md)' }}>
        <FormField
          placeholder="Search by expense category, merchant, or trip..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div style={{ backgroundColor: 'var(--bg-primary)', borderRadius: 'var(--radius-lg)', padding: 'var(--spacing-md)', boxShadow: 'var(--shadow-sm)' }}>
        <DataTable columns={columns} data={filteredExpenses} emptyMessage="No expense claims found." />
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Submit Expense Claim">
        <form onSubmit={(e) => { e.preventDefault(); setIsModalOpen(false); }}>
          <FormField label="Category" type="select" options={[
            { value: 'tolls', label: 'Toll Fees' },
            { value: 'lodging', label: 'Driver Lodging' },
            { value: 'repair', label: 'Emergency Repair' },
            { value: 'permits', label: 'Permits & Fees' }
          ]} required />
          <FormField label="Claim Amount ($)" type="number" placeholder="e.g. 75.00" required />
          <FormField label="Vendor / Merchant" placeholder="e.g. E-ZPass" required />
          <div className="flex justify-between gap-2" style={{ marginTop: 'var(--spacing-lg)' }}>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Submit Claim</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Expenses;