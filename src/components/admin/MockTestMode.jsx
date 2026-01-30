import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Users, X, Search, Building2, UserCheck, User } from 'lucide-react';

export default function MockTestMode() {
  const [testUser, setTestUser] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('test_mode_entity');
    if (saved) {
      setTestUser(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    if (showDialog) {
      loadUsers();
    }
  }, [showDialog]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const [advisers, clients, adviceGroups] = await Promise.all([
        base44.entities.Adviser.list(),
        base44.entities.Client.list(),
        base44.entities.AdviceGroup.list()
      ]);

      const allEntities = [
        ...adviceGroups.map(ag => ({
          id: ag.id,
          type: 'advice_group',
          displayInfo: ag.name,
          email: ag.contact_email,
          entity: ag
        })),
        ...advisers.map(adv => ({
          id: adv.id,
          type: 'adviser',
          displayInfo: `${adv.first_name} ${adv.last_name}`,
          email: adv.email,
          entity: adv
        })),
        ...clients.map(client => ({
          id: client.id,
          type: 'client',
          displayInfo: `${client.first_name} ${client.last_name}`,
          email: client.email,
          entity: client
        }))
      ];

      setAllUsers(allEntities);
    } catch (error) {
      console.error('Failed to load entities:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectUser = (entity) => {
    localStorage.setItem('test_mode_entity', JSON.stringify({
      id: entity.id,
      type: entity.type,
      displayInfo: entity.displayInfo,
      email: entity.email,
      entity: entity.entity
    }));

    // Redirect based on entity type
    const redirectMap = {
      'advice_group': '/AdviceGroupDashboard',
      'adviser': '/AdviserDashboard',
      'client': '/ClientDashboard'
    };

    window.location.href = redirectMap[entity.type] || '/AdminDashboard';
  };

  const handleExitTestMode = () => {
    localStorage.removeItem('test_mode_entity');
    window.location.href = '/AdminDashboard';
  };

  const getEntityIcon = (type) => {
    switch(type) {
      case 'advice_group': return <Building2 className="w-4 h-4 text-blue-600" />;
      case 'adviser': return <UserCheck className="w-4 h-4 text-green-600" />;
      case 'client': return <User className="w-4 h-4 text-orange-600" />;
      default: return <User className="w-4 h-4 text-gray-600" />;
    }
  };

  const getBadgeColor = (type) => {
    switch(type) {
      case 'advice_group': return 'bg-blue-100 text-blue-700';
      case 'adviser': return 'bg-green-100 text-green-700';
      case 'client': return 'bg-orange-100 text-orange-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const filteredUsers = allUsers.filter(entity => 
    entity.displayInfo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entity.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entity.type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupedUsers = {
    advice_group: filteredUsers.filter(e => e.type === 'advice_group'),
    adviser: filteredUsers.filter(e => e.type === 'adviser'),
    client: filteredUsers.filter(e => e.type === 'client')
  };

  const isActive = !!testUser;

  return (
    <>
      {isActive && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Users className="w-4 h-4" />
            Testing as: {testUser.displayInfo} ({testUser.type})
          </div>
          <Button
            size="sm"
            variant="secondary"
            onClick={handleExitTestMode}
            className="h-7 text-xs gap-1"
          >
            <X className="w-3 h-3" />
            Exit Test Mode
          </Button>
        </div>
      )}
      
      <Button
        onClick={() => setShowDialog(true)}
        variant="outline"
        className="gap-2"
      >
        <Users className="w-4 h-4" />
        {isActive ? 'Switch User' : 'Test as User'}
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Select User to Test As</DialogTitle>
          </DialogHeader>

          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search by name, email, or role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-800"></div>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                No entities found matching "{searchTerm}"
              </div>
            ) : (
              <>
                {groupedUsers.advice_group.length > 0 && (
                  <div>
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-1">
                      Advice Groups
                    </div>
                    <div className="space-y-2">
                      {groupedUsers.advice_group.map((entity) => (
                        <div
                          key={entity.id}
                          onClick={() => handleSelectUser(entity)}
                          className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                              {getEntityIcon(entity.type)}
                            </div>
                            <div>
                              <div className="font-medium text-slate-800">{entity.displayInfo}</div>
                              <div className="text-sm text-slate-500">{entity.email}</div>
                            </div>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getBadgeColor(entity.type)}`}>
                            {entity.type.replace('_', ' ')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {groupedUsers.adviser.length > 0 && (
                  <div>
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-1">
                      Advisers
                    </div>
                    <div className="space-y-2">
                      {groupedUsers.adviser.map((entity) => (
                        <div
                          key={entity.id}
                          onClick={() => handleSelectUser(entity)}
                          className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                              {getEntityIcon(entity.type)}
                            </div>
                            <div>
                              <div className="font-medium text-slate-800">{entity.displayInfo}</div>
                              <div className="text-sm text-slate-500">{entity.email}</div>
                            </div>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getBadgeColor(entity.type)}`}>
                            {entity.type.replace('_', ' ')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {groupedUsers.client.length > 0 && (
                  <div>
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-1">
                      Clients
                    </div>
                    <div className="space-y-2">
                      {groupedUsers.client.map((entity) => (
                        <div
                          key={entity.id}
                          onClick={() => handleSelectUser(entity)}
                          className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                              {getEntityIcon(entity.type)}
                            </div>
                            <div>
                              <div className="font-medium text-slate-800">{entity.displayInfo}</div>
                              <div className="text-sm text-slate-500">{entity.email}</div>
                            </div>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getBadgeColor(entity.type)}`}>
                            {entity.type.replace('_', ' ')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}