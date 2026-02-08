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
      alert('Please select a client');
      return;
    }

    try {
     setLoading(true);
     const client = clients.find(c => c.id === selectedClient);

     const soaRequest = await base44.entities.SOARequest.create({
       client_id: client.id,
       fact_find_id: client.fact_find_id || null,
       status: 'draft',
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

     onSuccess(soaRequest.id);
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

        <button 
         onClick={async () => {
           try {
             const currentUser = await base44.auth.me();
             alert('Step 1 - Current user email: ' + currentUser.email);

             const allClients = await base44.entities.Client.list();
             alert('Step 2 - Total clients in database: ' + allClients.length + '\n' + 
                   JSON.stringify(allClients.map(c => ({ 
                     name: c.first_name + ' ' + c.last_name, 
                     adviser_email: c.adviser_email 
                   })), null, 2));

             const myClients = await base44.entities.Client.filter({ 
               adviser_email: currentUser.email 
             });
             alert('Step 3 - My clients: ' + myClients.length + '\n' + 
                   JSON.stringify(myClients.map(c => c.first_name + ' ' + c.last_name), null, 2));

           } catch (err) {
             alert('ERROR: ' + err.message);
           }
         }}
         style={{ background: '#dc2626', color: 'white', padding: '10px 14px', marginBottom: '24px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}
        >
         DEBUG CLIENT LOADING
        </button>

        <div style={{ background: '#fef08a', padding: '10px', fontSize: '12px', marginBottom: '10px', borderRadius: '4px', border: '1px solid #fcd34d' }}>
          <strong>DEBUG STATE:</strong> clients.length = {clients?.length || 0} | clients = {JSON.stringify(clients?.map(c => c.name) || [])}
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
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ fontWeight: '600' }}>
                      {client.name}
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                      Fact Find: {client.factFindStatus}
                    </div>
                  </div>
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