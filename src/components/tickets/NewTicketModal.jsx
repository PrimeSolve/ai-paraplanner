import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { toast } from 'sonner';

const ticketCategories = [
  { id: 'SOA Document Issue', label: 'SOA Document Issue', icon: '📄' },
  { id: 'Data Query', label: 'Data Query', icon: '📊' },
  { id: 'Platform Support', label: 'Platform Support', icon: '🔧' },
  { id: 'Client Query', label: 'Client Query', icon: '👤' },
  { id: 'General Enquiry', label: 'General Enquiry', icon: '💬' },
  { id: 'Technical Issue', label: 'Technical Issue', icon: '⚙️' },
];

const priorityLevels = [
  { id: 'Low', label: 'Low', description: 'No immediate impact' },
  { id: 'Medium', label: 'Medium', description: 'Affects workflow' },
  { id: 'High', label: 'High', description: 'Client impacted' },
  { id: 'Urgent', label: 'Urgent', description: 'Critical blocker' },
];

export default function NewTicketModal({ onClose }) {
  const [user, setUser] = useState(null);
  const [adviser, setAdviser] = useState(null);
  const [adviceGroup, setAdviceGroup] = useState(null);
  const [clients, setClients] = useState([]);
  
  const [category, setCategory] = useState(null);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [clientId, setClientId] = useState('');

  const queryClient = useQueryClient();

  useEffect(() => {
    const loadData = async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      // Get adviser record
      const adviserRecords = await base44.entities.Adviser.filter({ user_id: currentUser.id });
      if (adviserRecords.length > 0) {
        setAdviser(adviserRecords[0]);
        
        // Get advice group
        const groups = await base44.entities.AdviceGroup.filter({ id: adviserRecords[0].advice_group_id });
        if (groups.length > 0) {
          setAdviceGroup(groups[0]);
        }

        // Get clients
        const clientList = await base44.entities.Client.filter({ adviser_email: currentUser.email });
        setClients(clientList);
      }
    };
    loadData();
  }, []);

  const createTicketMutation = useMutation({
    mutationFn: (ticketData) => base44.entities.Ticket.create(ticketData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      toast.success('Ticket created successfully');
      onClose();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create ticket');
    },
  });

  const handleSubmit = async () => {
    if (!category || !subject || !description) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Generate ticket number
    const ticketNumber = `TKT-${Date.now().toString().slice(-6)}`;

    // Get selected client if any
    const selectedClient = clients.find(c => c.id === clientId);
    
    // Get user associated with client
    let clientUser = null;
    if (selectedClient?.user_id) {
      const users = await base44.entities.User.filter({ id: selectedClient.user_id });
      if (users.length > 0) {
        clientUser = users[0];
      }
    }

    const ticketData = {
      ticket_number: ticketNumber,
      subject,
      description,
      category,
      status: 'Open',
      priority,
      adviser_email: user.email,
      adviser_name: user.full_name,
      advice_group_id: adviceGroup?.id,
      advice_group_name: adviceGroup?.name,
      client_id: clientId || null,
      client_name: clientUser?.full_name || null,
      comments: [],
      attachments: [],
    };

    createTicketMutation.mutate(ticketData);
  };

  if (!user || !adviser) {
    return null;
  }

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
      <div style={{ backgroundColor: 'white', borderRadius: '16px', maxWidth: '720px', width: '100%', maxHeight: '90vh', overflow: 'auto', padding: '32px', position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '20px', right: '20px', padding: '8px', border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b' }}>
          <X className="w-5 h-5" />
        </button>

        <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#0f172a', marginBottom: '24px', margin: '0 0 24px 0' }}>
          Create New Support Ticket
        </h2>

        {/* Category Selection */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#64748b', marginBottom: '10px', textTransform: 'uppercase' }}>
            What type of issue is this? *
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
            {ticketCategories.map(cat => (
              <div key={cat.id} onClick={() => setCategory(cat.id)} style={{ padding: '16px', borderRadius: '12px', border: `2px solid ${category === cat.id ? '#7C3AED' : '#e2e8f0'}`, backgroundColor: category === cat.id ? '#EDE9FE' : 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', transition: 'all 0.15s ease' }}>
                <span style={{ fontSize: '24px' }}>{cat.icon}</span>
                <span style={{ fontSize: '14px', fontWeight: '500', color: '#0f172a' }}>{cat.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Client Selection */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#64748b', marginBottom: '10px', textTransform: 'uppercase' }}>
            Related Client (optional)
          </label>
          <select value={clientId} onChange={e => setClientId(e.target.value)} style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: 'white', fontSize: '15px', color: '#0f172a', cursor: 'pointer' }}>
            <option value="">None</option>
            {clients.map(client => (
              <option key={client.id} value={client.id}>{client.user_id}</option>
            ))}
          </select>
        </div>

        {/* Subject */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#64748b', marginBottom: '10px', textTransform: 'uppercase' }}>
            Subject *
          </label>
          <input type="text" value={subject} onChange={e => setSubject(e.target.value)} placeholder="Brief description of the issue..." style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: 'white', fontSize: '15px', color: '#0f172a', boxSizing: 'border-box' }} />
        </div>

        {/* Description */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#64748b', marginBottom: '10px', textTransform: 'uppercase' }}>
            Description *
          </label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Provide details about the issue..." style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: 'white', fontSize: '15px', color: '#0f172a', minHeight: '120px', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }} />
        </div>

        {/* Priority */}
        <div style={{ marginBottom: '32px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#64748b', marginBottom: '10px', textTransform: 'uppercase' }}>
            Priority
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
            {priorityLevels.map(p => (
              <div key={p.id} onClick={() => setPriority(p.id)} style={{ padding: '12px', borderRadius: '8px', border: `2px solid ${priority === p.id ? '#7C3AED' : '#e2e8f0'}`, backgroundColor: priority === p.id ? '#EDE9FE' : 'white', cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s ease' }}>
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a', marginBottom: '4px' }}>{p.label}</div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>{p.description}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={handleSubmit} disabled={createTicketMutation.isPending} style={{ padding: '12px 24px', borderRadius: '8px', border: 'none', background: '#7C3AED', color: 'white', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
            {createTicketMutation.isPending ? 'Creating...' : 'Submit Ticket'}
          </button>
          <button onClick={onClose} style={{ padding: '12px 24px', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', color: '#64748b', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}