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
    const saved = localStorage.getItem('test_mode_user');
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
      const [users, advisers, clients, adviceGroups] = await Promise.all([
        base44.entities.User.list(),
        base44.entities.Adviser.list(),
        base44.entities.Client.list(),
        base44.entities.AdviceGroup.list()
      ]);

      const enrichedUsers = users.map(user => {
        const adviser = advisers.find(a => a.user_id === user.id);
        const client = clients.find(c => c.user_id === user.id);
        const adviceGroup = adviceGroups.find(g => g.user_id === user.id);

        let userType = user.role === 'admin' ? 'admin' : 'user';
        let displayInfo = user.full_name || user.email;

        if (adviser) {
          userType = 'adviser';
          displayInfo = `${adviser.first_name} ${adviser.last_name}`;
        } else if (client) {
          userType = 'client';
          displayInfo = `${client.first_name} ${client.last_name}`;
        } else if (adviceGroup) {
          userType = 'advice_group';
          displayInfo = adviceGroup.name;
        }

        return {
          ...user,
          userType,
          displayInfo,
          linkedEntity: adviser || client || adviceGroup
        };
      });

      setAllUsers(enrichedUsers);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectUser = (user) => {
    localStorage.setItem('test_mode_user', JSON.stringify({
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      userType: user.userType,
      linkedEntity: user.linkedEntity
    }));

    // Redirect based on user type
    const redirectMap = {
      'admin': '/AdminDashboard',
      'advice_group': '/AdviceGroupDashboard',
      'adviser': '/AdviserDashboard',
      'client': '/ClientDashboard'
    };

    window.location.href = redirectMap[user.userType] || '/AdminDashboard';
  };

  const handleExitTestMode = () => {
    localStorage.removeItem('test_mode_user');
    window.location.href = '/AdminDashboard';
  };

  const getUserIcon = (userType) => {
    switch(userType) {
      case 'admin': return <Users className="w-4 h-4 text-purple-600" />;
      case 'advice_group': return <Building2 className="w-4 h-4 text-blue-600" />;
      case 'adviser': return <UserCheck className="w-4 h-4 text-green-600" />;
      case 'client': return <User className="w-4 h-4 text-orange-600" />;
      default: return <User className="w-4 h-4 text-gray-600" />;
    }
  };

  const getBadgeColor = (userType) => {
    switch(userType) {
      case 'admin': return 'bg-purple-100 text-purple-700';
      case 'advice_group': return 'bg-blue-100 text-blue-700';
      case 'adviser': return 'bg-green-100 text-green-700';
      case 'client': return 'bg-orange-100 text-orange-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const filteredUsers = allUsers.filter(user => 
    user.displayInfo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.userType?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isActive = !!testUser;

  return (
    <>
      {isActive && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Users className="w-4 h-4" />
            Testing as: {testUser.displayInfo || testUser.full_name || testUser.email} ({testUser.userType})
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

          <div className="flex-1 overflow-y-auto space-y-2">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-800"></div>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                No users found matching "{searchTerm}"
              </div>
            ) : (
              filteredUsers.map((user) => (
                <div
                  key={user.id}
                  onClick={() => handleSelectUser(user)}
                  className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                      {getUserIcon(user.userType)}
                    </div>
                    <div>
                      <div className="font-medium text-slate-800">{user.displayInfo}</div>
                      <div className="text-sm text-slate-500">{user.email}</div>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getBadgeColor(user.userType)}`}>
                    {user.userType.replace('_', ' ')}
                  </span>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}