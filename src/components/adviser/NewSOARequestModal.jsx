import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function NewSOARequestModal({ isOpen, onClose, onSuccess, adviserEmail }) {
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState('');
  const [loading, setLoading] = useState(false);
  const [clientsLoading, setClientsLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadClients();
    }
  }, [isOpen]);

  const loadClients = async () => {
    try {
      setClientsLoading(true);
      const data = await base44.entities.Client.filter({
        adviser_email: adviserEmail
      });
      setClients(data);
    } catch (error) {
      console.error('Failed to load clients:', error);
    } finally {
      setClientsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedClient) {
      alert('Please select a client');
      return;
    }

    try {
      setLoading(true);
      const client = clients.find(c => c.id === selectedClient);
      
      await base44.entities.SOARequest.create({
        client_name: `${client.first_name} ${client.last_name}`,
        client_email: client.email,
        fact_find_id: client.fact_find_id,
        status: 'draft',
        completion_percentage: 0,
        sections_completed: []
      });

      onSuccess();
      setSelectedClient('');
      onClose();
    } catch (error) {
      console.error('Failed to create SOA request:', error);
      alert('Failed to create SOA request');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'flex-end',
      zIndex: 1000
    }}>
      <div style={{
        background: 'white',
        width: '100%',
        borderRadius: '16px 16px 0 0',
        padding: '32px',
        boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.1)',
        animation: 'slideUp 0.3s ease-out'
      }}>
        <style>{`
          @keyframes slideUp {
            from {
              transform: translateY(100%);
              opacity: 0;
            }
            to {
              transform: translateY(0);
              opacity: 1;
            }
          }
        `}</style>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b' }}>New SOA Request</h2>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px' }}
          >
            <X style={{ width: '24px', height: '24px', color: '#64748b' }} />
          </button>
        </div>

        <div style={{ marginBottom: '32px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#1e293b', marginBottom: '12px' }}>
            Select Client
          </label>
          <Select value={selectedClient} onValueChange={setSelectedClient} disabled={clientsLoading}>
            <SelectTrigger style={{ height: '44px', padding: '10px 14px' }}>
              <SelectValue placeholder={clientsLoading ? 'Loading clients...' : 'Choose a client...'} />
            </SelectTrigger>
            <SelectContent>
              {clients.map(client => (
                <SelectItem key={client.id} value={client.id}>
                  {client.first_name} {client.last_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px' }}>
          <button
            onClick={onClose}
            style={{ padding: '10px 20px', background: 'white', border: '1px solid #e2e8f0', color: '#1e293b', fontSize: '14px', fontWeight: '600', cursor: 'pointer', borderRadius: '8px' }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !selectedClient}
            style={{ padding: '10px 24px', background: '#3b82f6', color: 'white', fontSize: '14px', fontWeight: '600', cursor: loading || !selectedClient ? 'not-allowed' : 'pointer', borderRadius: '8px', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', opacity: loading || !selectedClient ? 0.6 : 1 }}
          >
            {loading ? 'Creating...' : 'Continue'} {!loading && '→'}
          </button>
        </div>
      </div>
    </div>
  );
}