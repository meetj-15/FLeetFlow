import React, { useState, useEffect } from 'react';
import KpiCard from '../components/KpiCard';
import DataTable from '../components/DataTable';
import Button from '../components/Button';
import Modal from '../components/Modal';
import FormField from '../components/FormField';

const MOCK_KPIS = [
  { id: 1, title: 'Total Active Fleet', value: '42', trend: { type: 'up', value: '12% this month' }, color: 'primary' },
  { id: 2, title: 'Trips in Transit', value: '18', trend: { type: 'up', value: '4 active now' }, color: 'info' },
  { id: 3, title: 'Fuel Efficiency', value: '8.4 km/L', trend: { type: 'down', value: '2.1% vs target' }, color: 'warning' },
  { id: 4, title: 'Maintenance Pending', value: '3 Vehicles', trend: { type: 'down', value: '1 urgent' }, color: 'danger' }
];

const MOCK_RECENT_TRIPS = [
  { id: 'TRP-9021', vehicle: 'Volvo FH16 (TRK-01)', driver: 'Alex Johnson', destination: 'Chicago Hub', status: 'In Transit' },
  { id: 'TRP-9022', vehicle: 'Freightliner Cascadia (TRK-05)', driver: 'Maria Garcia', destination: 'Dallas Terminal', status: 'Completed' },
  { id: 'TRP-9023', vehicle: 'Kenworth T680 (TRK-09)', driver: 'David Chen', destination: 'Seattle Port', status: 'Delayed' },
  { id: 'TRP-9024', vehicle: 'Peterbilt 579 (TRK-12)', driver: 'Sarah Smith', destination: 'Denver Depot', status: 'Scheduled' }
];

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTrip, setNewTrip] = useState({ destination: '', vehicle: '', driver: '' });

  useEffect(() => {
    // Simulate initial data loading to display system status feedback
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const columns = [
    { header: 'Trip ID', accessor: 'id', sortable: true },
    { header: 'Vehicle', accessor: 'vehicle', sortable: true },
    { header: 'Driver', accessor: 'driver', sortable: true },
    { header: 'Destination', accessor: 'destination', sortable: true },
    { 
      header: 'Status', 
      accessor: 'status',
      render: (row) => {
        const badgeColors = {
          'In Transit': 'var(--info-subtle)',
          'Completed': 'var(--success-subtle)',
          'Delayed': 'var(--danger-subtle)',
          'Scheduled': 'var(--warning-subtle)'
        };
        const textColors = {
          'In Transit': 'var(--info-color)',
          'Completed': 'var(--success-color)',
          'Delayed': 'var(--danger-color)',
          'Scheduled': 'var(--warning-color)'
        };
        return (
          <span style={{
            padding: '0.25rem 0.625rem',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.75rem',
            fontWeight: 600,
            backgroundColor: badgeColors[row.status] || 'var(--bg-tertiary)',
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
          <h2>Fleet Operation Dashboard</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Real-time tracking and metrics overview
          </p>
        </div>
        <Button variant="primary" onClick={() => setIsModalOpen(true)}>
          + Schedule New Trip
        </Button>
      </div>

      {/* KPI Section */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: 'var(--spacing-md)',
        marginBottom: 'var(--spacing-xl)'
      }}>
        {MOCK_KPIS.map((kpi) => (
          <KpiCard
            key={kpi.id}
            title={kpi.title}
            value={loading ? '...' : kpi.value}
            trend={kpi.trend}
            color={kpi.color}
          />
        ))}
      </div>

      {/* Recent Activity Table */}
      <div style={{
        backgroundColor: 'var(--bg-primary)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--spacing-lg)',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <h3 style={{ marginBottom: 'var(--spacing-md)' }}>Active & Recent Dispatch Trips</h3>
        <DataTable
          columns={columns}
          data={MOCK_RECENT_TRIPS}
          loading={loading}
          onRowClick={(row) => alert(`Selected Trip: ${row.id}`)}
        />
      </div>

      {/* Quick Schedule Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Schedule Dispatch Trip"
      >
        <form onSubmit={(e) => { e.preventDefault(); setIsModalOpen(false); }}>
          <FormField
            label="Destination Terminal"
            name="destination"
            value={newTrip.destination}
            onChange={(e) => setNewTrip({ ...newTrip, destination: e.target.value })}
            placeholder="e.g. Chicago Logistics Center"
            required
          />
          <FormField
            label="Assign Vehicle"
            type="select"
            name="vehicle"
            value={newTrip.vehicle}
            onChange={(e) => setNewTrip({ ...newTrip, vehicle: e.target.value })}
            options={[
              { value: 'trk-01', label: 'Volvo FH16 (TRK-01)' },
              { value: 'trk-05', label: 'Freightliner Cascadia (TRK-05)' }
            ]}
            required
          />
          <div className="flex justify-between gap-2" style={{ marginTop: 'var(--spacing-lg)' }}>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Confirm & Dispatch</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Dashboard;