import React, { useState } from 'react';
import DataTable from '../components/DataTable';
import Button from '../components/Button';
import FormField from '../components/FormField';
import Modal from '../components/Modal';
import KpiCard from '../components/KpiCard';

const MOCK_MAINTENANCE = [
  { id: 'MNT-301', vehicle: 'Kenworth T680 (TRK-09)', service: 'Brake Pad Replacement & Inspection', priority: 'High', status: 'In Progress', cost: '$650.00', scheduledDate: '2026-10-25' },
  { id: 'MNT-302', vehicle: 'Volvo FH16 (TRK-01)', service: 'Routine Oil & Filter Change', priority: 'Medium', status: 'Scheduled', cost: '$220.00', scheduledDate: '2026-10-28' },
  { id: 'MNT-303', vehicle: 'Freightliner (TRK-05)', service: 'Transmission Fluid Flush', priority: 'Low', status: 'Completed', cost: '$410.00', scheduledDate: '2026-10-18' },
  { id: 'MNT-304', vehicle: 'Peterbilt 579 (TRK-12)', service: 'Tire Alignment & Pressure Check', priority: 'High', status: 'Scheduled', cost: '$180.00', scheduledDate: '2026-10-29' }
];

const Maintenance = () => {
  const [records] = useState(MOCK_MAINTENANCE);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredRecords = records.filter(
    (m) => m.vehicle.toLowerCase().includes(searchTerm.toLowerCase()) ||
           m.service.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    { header: 'Work Order ID', accessor: 'id', sortable: true },
    { header: 'Vehicle', accessor: 'vehicle', sortable: true },
    { header: 'Service Description', accessor: 'service' },
    { 
      header: 'Priority', 
      accessor: 'priority',
      render: (row) => {
        const priorityColors = {
          'High': 'var(--danger-color)',
          'Medium': 'var(--warning-color)',
          'Low': 'var(--info-color)'
        };
        return (
          <span style={{ fontWeight: 600, color: priorityColors[row.priority] || 'var(--text-primary)' }}>
            ● {row.priority}
          </span>
        );
      }
    },
    { header: 'Scheduled Date', accessor: 'scheduledDate', sortable: true },
    { header: 'Est. Cost', accessor: 'cost' },
    { 
      header: 'Status', 
      accessor: 'status',
      render: (row) => {
        const bgColors = {
          'In Progress': 'var(--warning-subtle)',
          'Scheduled': 'var(--info-subtle)',
          'Completed': 'var(--success-subtle)'
        };
        const textColors = {
          'In Progress': 'var(--warning-color)',
          'Scheduled': 'var(--info-color)',
          'Completed': 'var(--success-color)'
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
          <h2>Fleet Maintenance & Servicing</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Schedule preventive maintenance, track work orders, and manage repair logs.</p>
        </div>
        <Button variant="primary" onClick={() => setIsModalOpen(true)}>+ Schedule Work Order</Button>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: 'var(--spacing-md)',
        marginBottom: 'var(--spacing-lg)'
      }}>
        <KpiCard title="Active Work Orders" value="2 Vehicles" trend={{ type: 'down', value: '1 high priority' }} color="warning" />
        <KpiCard title="Completed (MTD)" value="12 Services" trend={{ type: 'up', value: '100% on-schedule' }} color="primary" />
        <KpiCard title="Maintenance Budget Used" value="$1,460.00" trend={{ type: 'down', value: '$540 under budget' }} color="info" />
      </div>

      <div style={{ backgroundColor: 'var(--bg-primary)', padding: 'var(--spacing-md)', borderRadius: 'var(--radius-lg)', marginBottom: 'var(--spacing-md)' }}>
        <FormField
          placeholder="Filter by vehicle or service description..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div style={{ backgroundColor: 'var(--bg-primary)', borderRadius: 'var(--radius-lg)', padding: 'var(--spacing-md)', boxShadow: 'var(--shadow-sm)' }}>
        <DataTable columns={columns} data={filteredRecords} emptyMessage="No maintenance work orders found." />
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Schedule Maintenance Service">
        <form onSubmit={(e) => { e.preventDefault(); setIsModalOpen(false); }}>
          <FormField label="Target Vehicle" placeholder="e.g. Kenworth T680 (TRK-09)" required />
          <FormField label="Service Description" type="textarea" placeholder="Describe inspection or repair tasks..." required />
          <FormField label="Priority Level" type="select" options={[
            { value: 'low', label: 'Low (Preventive Routine)' },
            { value: 'medium', label: 'Medium (Scheduled Service)' },
            { value: 'high', label: 'High (Urgent Repair Required)' }
          ]} required />
          <FormField label="Estimated Cost ($)" type="number" placeholder="e.g. 350.00" required />
          <div className="flex justify-between gap-2" style={{ marginTop: 'var(--spacing-lg)' }}>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Schedule Work Order</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Maintenance;