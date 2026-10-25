import React, { useState } from 'react';
import DataTable from '../components/DataTable';
import Button from '../components/Button';
import FormField from '../components/FormField';

const MOCK_VEHICLES = [
  { id: 'TRK-01', model: 'Volvo FH16', plate: '7XYZ89', mileage: '124,500 mi', health: 'Optimal' },
  { id: 'TRK-05', model: 'Freightliner Cascadia', plate: '3ABC12', mileage: '89,200 mi', health: 'Optimal' },
  { id: 'TRK-09', model: 'Kenworth T680', plate: '9LMN45', mileage: '210,000 mi', health: 'Service Due' },
  { id: 'TRK-12', model: 'Peterbilt 579', plate: '5DEF67', mileage: '45,100 mi', health: 'Optimal' }
];

const Vehicles = () => {
  const [vehicles] = useState(MOCK_VEHICLES);

  const columns = [
    { header: 'Vehicle ID', accessor: 'id', sortable: true },
    { header: 'Model & Make', accessor: 'model', sortable: true },
    { header: 'License Plate', accessor: 'plate' },
    { header: 'Odometer Mileage', accessor: 'mileage', sortable: true },
    { 
      header: 'Health Status', 
      accessor: 'health',
      render: (row) => (
        <span style={{
          padding: '0.25rem 0.5rem',
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.75rem',
          fontWeight: 600,
          backgroundColor: row.health === 'Optimal' ? 'var(--success-subtle)' : 'var(--warning-subtle)',
          color: row.health === 'Optimal' ? 'var(--success-color)' : 'var(--warning-color)'
        }}>
          {row.health}
        </span>
      )
    }
  ];

  return (
    <div className="container" style={{ padding: 'var(--spacing-lg) 0' }}>
      <div className="flex justify-between items-center" style={{ marginBottom: 'var(--spacing-lg)' }}>
        <div>
          <h2>Vehicle Fleet Inventory</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Monitor vehicle telemetry, status, and maintenance records.</p>
        </div>
        <Button variant="primary">+ Register Vehicle</Button>
      </div>

      <div style={{ backgroundColor: 'var(--bg-primary)', borderRadius: 'var(--radius-lg)', padding: 'var(--spacing-md)', boxShadow: 'var(--shadow-sm)' }}>
        <DataTable columns={columns} data={vehicles} />
      </div>
    </div>
  );
};

export default Vehicles;