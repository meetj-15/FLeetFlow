import React, { useState } from 'react';
import DataTable from '../components/DataTable';
import Button from '../components/Button';
import FormField from '../components/FormField';
import Modal from '../components/Modal';

const INITIAL_TRIPS = [
  { id: 'TRP-101', route: 'New York -> Boston', driver: 'Alex Johnson', status: 'Completed', distance: '215 mi', cargo: 'Electronics' },
  { id: 'TRP-102', route: 'Atlanta -> Miami', driver: 'Maria Garcia', status: 'In Transit', distance: '660 mi', cargo: 'Perishables' },
  { id: 'TRP-103', route: 'Chicago -> Detroit', driver: 'David Chen', status: 'Scheduled', distance: '280 mi', cargo: 'Auto Parts' },
  { id: 'TRP-104', route: 'Dallas -> Houston', driver: 'Sarah Smith', status: 'Cancelled', distance: '240 mi', cargo: 'General Freight' }
];

const Trips = () => {
  const [trips] = useState(INITIAL_TRIPS);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredTrips = trips.filter(
    (t) => t.route.toLowerCase().includes(searchTerm.toLowerCase()) ||
           t.driver.toLowerCase().includes(searchTerm.toLowerCase()) ||
           t.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    { header: 'Trip ID', accessor: 'id', sortable: true },
    { header: 'Route', accessor: 'route', sortable: true },
    { header: 'Driver', accessor: 'driver', sortable: true },
    { header: 'Distance', accessor: 'distance', sortable: true },
    { header: 'Cargo Type', accessor: 'cargo' },
    { header: 'Status', accessor: 'status', sortable: true }
  ];

  return (
    <div className="container" style={{ padding: 'var(--spacing-lg) 0' }}>
      <div className="flex justify-between items-center" style={{ marginBottom: 'var(--spacing-lg)' }}>
        <div>
          <h2>Trip Management</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Track, dispatch, and monitor fleet transit routes.</p>
        </div>
        <Button variant="primary" onClick={() => setIsModalOpen(true)}>+ Create New Trip</Button>
      </div>

      <div style={{ backgroundColor: 'var(--bg-primary)', padding: 'var(--spacing-md)', borderRadius: 'var(--radius-lg)', marginBottom: 'var(--spacing-md)' }}>
        <FormField
          placeholder="Search by Trip ID, Route, or Driver..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div style={{ backgroundColor: 'var(--bg-primary)', borderRadius: 'var(--radius-lg)', padding: 'var(--spacing-md)', boxShadow: 'var(--shadow-sm)' }}>
        <DataTable columns={columns} data={filteredTrips} emptyMessage="No trips found matching your search term." />
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Trip Manifest">
        <FormField label="Route Description" placeholder="e.g. Seattle -> Portland" required />
        <FormField label="Cargo Specification" placeholder="e.g. Refrigerated Medical Supplies" required />
        <div className="flex justify-between gap-2" style={{ marginTop: 'var(--spacing-lg)' }}>
          <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
          <Button variant="primary" onClick={() => setIsModalOpen(false)}>Create Manifest</Button>
        </div>
      </Modal>
    </div>
  );
};

export default Trips;