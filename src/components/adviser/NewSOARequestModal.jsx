import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { createAdviceRecord } from '@/utils/adviceRecordHelpers';

export default function NewSOARequestModal({ isOpen, onClose, onSuccess, adviserEmail }) {
  const navigate = useNavigate();
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
    console.log('1. loadClients called');
    
    try {
      setClientsLoading(true);
      console.log('1.5. setClientsLoading set to true');
      
      // Get current user's email
      const currentUser = await base44.auth.me();
      console.log('2. currentUser:', currentUser.email);
      
      const clientData = await base44.entities.Client.filter({
        adviser_email: currentUser.email
      });
      
      console.log('3. myClients:', clientData.length, clientData);
      
      // Fetch FactFind status for each client
      const clientsWithFactFind = await Promise.all(
        clientData.map(async (client) => {
          let factFindStatus = 'No Fact Find';
          let factFindProgress = 0;
          
          if (client.fact_find_id) {
            try {
              const factFinds = await base44.entities.FactFind.filter({
                id: client.fact_find_id
              });
              if (factFinds && factFinds[0]) {
                const ff = factFinds[0];
                factFindProgress = ff.completion_percentage || 0;
                factFindStatus = `${factFindProgress}% complete`;
              }
            } catch (err) {
              console.error('Failed to load FactFind:', err);
            }
          }
          
          return {
            ...client,
            name: `${client.first_name || ''} ${client.last_name || ''}`.trim() || 'Unnamed Client',
            factFindStatus,
            factFindProgress
          };
        })
      );
      
      console.log('3.5. clientsWithFactFind:', clientsWithFactFind.length, clientsWithFactFind);
      setClients(clientsWithFactFind);
      console.log('4. setClients called with', clientsWithFactFind.length, 'clients');
    } catch (error) {
      console.error('ERROR in loadClients:', error);
    } finally {
      setClientsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedClient) {
      toast.error('Please select a client');
      return;
    }

    try {
     setLoading(true);
     const client = clients.find(c => c.id === selectedClient);
     console.log('Creating SOA request for client:', client?.name, 'fact_find_id:', client?.fact_find_id);

     const soaRequest = await base44.entities.SOARequest.create({
       client_id: selectedClient,
       fact_find_id: client?.fact_find_id || null,
       status: 'Submitted', // TODO: ensure backend StatusEnum matches these values
       completion_percentage: 0,
       sections_completed: [],
       scope_of_advice: {},
       products_entities: { products: [], entities: [] },
       transactions: { buy: [], sell: [], debts: [] },
       portfolio: { transactions: [] },
       strategy: { models: [], strategies: [] },
       assumptions: {},
       soa_details: {},
       review_status: { sections: {}, submitted: false }
     });

     console.log('SOA Request created, ID:', soaRequest.id);

     // Create an AdviceRecord for strategy recommendations
     const currentUser = await base44.auth.me();
     let factFindSnapshot = null;
     if (client?.fact_find_id) {
       try {
         const ffs = await base44.entities.FactFind.filter({ id: client.fact_find_id });
         if (ffs[0]) factFindSnapshot = ffs[0];
       } catch { /* skip */ }
     }
     createAdviceRecord({
       recordType: 'strategy_recommendations',
       title: 'Strategy recommendations',
       status: 'Pending',
       clientId: selectedClient,
       adviserId: currentUser.id,
       linkedEntities: {
         adviceRequestId: soaRequest.id,
         factFindId: client?.fact_find_id || null,
       },
       snapshots: { factFind: factFindSnapshot },
       createdBy: currentUser.email,
     });

     // Close modal
     onClose();

     // Navigate to the SOA Request
     navigate(createPageUrl('SOARequestDetails') + '?id=' + soaRequest.id);

    } catch (error) {
     console.error('Failed to create SOA request:', error);
     toast.error('Failed to create SOA request');
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
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'white',
        width: '90%',
        maxWidth: '400px',
        borderRadius: '12px',
        padding: '32px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        animation: 'fadeIn 0.3s ease-out'
      }}>
        <style>{`
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: scale(0.95);
            }
            to {
              opacity: 1;
              transform: scale(1);
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
          <select 
            value={selectedClient}
            onChange={(e) => setSelectedClient(e.target.value)}
            disabled={clientsLoading}
            style={{ 
              width: '100%', 
              padding: '10px 14px', 
              fontSize: '14px', 
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              backgroundColor: 'white',
              color: '#1e293b',
              cursor: clientsLoading ? 'not-allowed' : 'pointer',
              opacity: clientsLoading ? 0.5 : 1
            }}
          >
            <option value="">Choose a client...</option>
            {clients.map(client => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
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