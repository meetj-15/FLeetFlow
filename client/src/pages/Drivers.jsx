import React, { useState } from 'react';
import DataTable from '../components/DataTable';
import Button from '../components/Button';
import FormField from '../components/FormField';

const MOCK_DRIVERS = [
  { id: 'DRV-01', name: 'Alex Johnson', license: 'CDL-A 88219', phone: '(555) 234-5678', status: 'Active On-Duty', vehicle: 'Volvo FH16' },
  { id: 'DRV-02', name: 'Maria Garcia', license: 'CDL-A 99210', phone: '(555) 876-5432', status: 'Active On-Duty', vehicle: 'Freightliner' },
  { id: 'DRV-03', name: 'David Chen', license: 'CDL-B 10293', phone: '(555) 345-6789', status: 'Off-Duty', vehicle: 'Unassigned' },
  { id: 'DRV-04', name: 'Sarah Smith', license: 'CDL-A 44812', phone: '(555) 987-6543', status: 'On Leave', vehicle: 'Unassigned' }
];

const Drivers = () => {
  const [drivers] = useState(MOCK_DRIVERS);

  const columns = [
    { header: 'Driver ID', accessor: 'id', sortable: true },
    { header: 'Full Name', accessor: 'name', sortable: true },
    { header: 'License Number', accessor: 'license' },
    { header: 'Contact Phone', accessor: 'phone' },
    { header: 'Assigned Vehicle', accessor: 'vehicle' },
    { 
      header: 'Status', 
      accessor: 'status',
      render: (row) => (
        <span style={{
          padding: '0.25rem 0.5rem',
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.75rem',
          fontWeight: 600,
          backgroundColor: row.status.includes('Active') ? 'var(--success-subtle)' : 'var(--bg-tertiary)',
          color: row.status.includes('Active') ? 'var(--success-color)' : 'var(--text-secondary)'
        }}>
          {row.status}
        </span>
      )
    }
  ];

  return (
    <div className="container" style={{ padding: 'var(--spacing-lg) 0' }}>
      <div className="flex justify-between items-center" style={{ marginBottom: 'var(--spacing-lg)' }}>
        <div>
          <h2>Driver Directory</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Manage driver assignments, licenses, and duty statuses.</p>
        </div>
        <Button variant="primary">+ Add New Driver</Button>
      </div>

      <div style={{ backgroundColor: 'var(--bg-primary)', borderRadius: 'var(--radius-lg)', padding: 'var(--spacing-md)', boxShadow: 'var(--shadow-sm)' }}>
        <DataTable columns={columns} data={drivers} />
      </div>
    </div>
  );
};

export default Drivers;