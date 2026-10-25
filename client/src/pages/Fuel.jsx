import React, { useState } from 'react';
import DataTable from '../components/DataTable';
import Button from '../components/Button';
import FormField from '../components/FormField';
import Modal from '../components/Modal';
import KpiCard from '../components/KpiCard';

const MOCK_FUEL_LOGS = [
  { id: 'FL-801', vehicle: 'Volvo FH16 (TRK-01)', driver: 'Alex Johnson', liters: '320 L', cost: '$480.00', station: 'Shell Express - Interstate 90', date: '2026-10-24' },
  { id: 'FL-802', vehicle: 'Freightliner (TRK-05)', driver: 'Maria Garcia', liters: '280 L', cost: '$420.00', station: 'BP Truck Stop - Route 66', date: '2026-10-23' },
  { id: 'FL-803', vehicle: 'Kenworth T680 (TRK-09)', driver: 'David Chen', liters: '410 L', cost: '$615.00', station: 'Love\'s Travel Stop #412', date: '2026-10-22' },
  { id: 'FL-804', vehicle: 'Peterbilt 579 (TRK-12)', driver: 'Sarah Smith', liters: '190 L', cost: '$285.00', station: 'Pilot Flying J #88', date: '2026-10-21' }
];

const Fuel = () => {
  const [logs] = useState(MOCK_FUEL_LOGS);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newLog, setNewLog] = useState({ vehicle: '', liters: '', cost: '', station: '' });

  const filteredLogs = logs.filter(
    (l) => l.vehicle.toLowerCase().includes(searchTerm.toLowerCase()) ||
           l.driver.toLowerCase().includes(searchTerm.toLowerCase()) ||
           l.station.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    { header: 'Log ID', accessor: 'id', sortable: true },
    { header: 'Vehicle', accessor: 'vehicle', sortable: true },
    { header: 'Driver', accessor: 'driver', sortable: true },
    { header: 'Fuel Amount', accessor: 'liters', sortable: true },
    { header: 'Total Cost', accessor: 'cost', sortable: true },
    { header: 'Fuel Station', accessor: 'station' },
    { header: 'Date', accessor: 'date', sortable: true }
  ];

  return (
    <div className="container" style={{ padding: 'var(--spacing-lg) 0' }}>
      <div className="flex justify-between items-center" style={{ marginBottom: 'var(--spacing-lg)' }}>
        <div>
          <h2>Fuel Consumption & Refueling</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Track fuel expenses, efficiency, and station logs across the fleet.</p>
        </div>
        <Button variant="primary" onClick={() => setIsModalOpen(true)}>+ Log Fuel Entry</Button>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: 'var(--spacing-md)',
        marginBottom: 'var(--spacing-lg)'
      }}>
        <KpiCard title="Total Fuel Spent (MTD)" value="$1,800.00" trend={{ type: 'down', value: '4.2% vs last month' }} color="primary" />
        <KpiCard title="Total Volume Refueled" value="1,200 L" trend={{ type: 'up', value: '180 L this week' }} color="info" />
        <KpiCard title="Avg Cost / Liter" value="$1.50" trend={{ type: 'up', value: '$0.02 fluctuation' }} color="warning" />
      </div>

      <div style={{ backgroundColor: 'var(--bg-primary)', padding: 'var(--spacing-md)', borderRadius: 'var(--radius-lg)', marginBottom: 'var(--spacing-md)' }}>
        <FormField
          placeholder="Filter logs by vehicle, driver, or station..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div style={{ backgroundColor: 'var(--bg-primary)', borderRadius: 'var(--radius-lg)', padding: 'var(--spacing-md)', boxShadow: 'var(--shadow-sm)' }}>
        <DataTable columns={columns} data={filteredLogs} emptyMessage="No fuel logs matching your search." />
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Fuel Receipt Log">
        <form onSubmit={(e) => { e.preventDefault(); setIsModalOpen(false); }}>
          <FormField label="Assigned Vehicle" placeholder="e.g. Volvo FH16 (TRK-01)" required value={newLog.vehicle} onChange={(e) => setNewLog({ ...newLog, vehicle: e.target.value })} />
          <FormField label="Fuel Volume (Liters)" type="number" placeholder="e.g. 300" required value={newLog.liters} onChange={(e) => setNewLog({ ...newLog, liters: e.target.value })} />
          <FormField label="Total Cost ($)" type="number" placeholder="e.g. 450.00" required value={newLog.cost} onChange={(e) => setNewLog({ ...newLog, cost: e.target.value })} />
          <FormField label="Fuel Station Name" placeholder="e.g. Shell Interstate Exit 12" required value={newLog.station} onChange={(e) => setNewLog({ ...newLog, station: e.target.value })} />
          <div className="flex justify-between gap-2" style={{ marginTop: 'var(--spacing-lg)' }}>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Save Fuel Record</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Fuel;