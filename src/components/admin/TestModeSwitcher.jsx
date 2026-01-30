import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, Search, LogIn, Crown, Building2, UserCog, User as UserIcon } from 'lucide-react';
import { toast } from 'sonner';

export default function TestModeSwitcher() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    if (open) {
      loadUsers();
      loadCurrentUser();
    }
  }, [open]);

  const loadCurrentUser = async () => {
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);
    } catch (error) {
      console.error('Failed to load current user:', error);
    }
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      // Load all users
      const allUsers = await base44.entities.User.list();
      
      // Load clients to match with user emails
      const clients = await base44.entities.Client.list();
      const clientEmails = new Set(clients.map(c => c.email));
      
      // Load advisers
      const advisers = await base44.entities.Adviser.list();
      const adviserEmails = new Set(advisers.map(a => a.email));
      
      // Load advice groups
      const adviceGroups = await base44.entities.AdviceGroup.list();
      
      // Categorize users
      const categorized = allUsers.map(user => {
        let userType = user.role || 'user';
        let displayName = user.full_name || user.email;
        let subtitle = '';
        
        if (user.role === 'admin') {
          userType = 'admin';
          subtitle = 'Admin User';
        } else if (adviserEmails.has(user.email)) {
          userType = 'adviser';
          const adviser = advisers.find(a => a.email === user.email);
          subtitle = adviser?.company || 'Adviser';
        } else if (clientEmails.has(user.email)) {
          userType = 'client';
          subtitle = 'Client';
        }
        
        return {
          ...user,
          userType,
          displayName,
          subtitle
        };
      });

      setUsers(categorized);
    } catch (error) {
      console.error('Failed to load users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchUser = async (user) => {
    try {
      // Store the test user in localStorage
      localStorage.setItem('test_mode_user', JSON.stringify({
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        userType: user.userType
      }));
      
      toast.success(`Switched to ${user.displayName}`);
      
      // Reload the page to apply the test mode
      setTimeout(() => {
        window.location.reload();
      }, 500);
      
      setOpen(false);
    } catch (error) {
      toast.error('Failed to switch user');
    }
  };

  const handleExitTestMode = () => {
    localStorage.removeItem('test_mode_user');
    toast.success('Exited test mode');
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  // Check if currently in test mode
  const testModeUser = localStorage.getItem('test_mode_user');
  const isInTestMode = !!testModeUser;

  const getUserIcon = (userType) => {
    switch(userType) {
      case 'admin': return <Crown className="w-4 h-4 text-purple-600" />;
      case 'adviser': return <UserCog className="w-4 h-4 text-blue-600" />;
      case 'client': return <UserIcon className="w-4 h-4 text-green-600" />;
      default: return <UserIcon className="w-4 h-4 text-gray-600" />;
    }
  };

  const getUserBadgeColor = (userType) => {
    switch(userType) {
      case 'admin': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'adviser': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'client': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.displayName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isCurrentUser = (user) => currentUser?.email === user.email;

  return (
    <>
      {isInTestMode && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Users className="w-4 h-4" />
            Test Mode Active: {JSON.parse(testModeUser).full_name || JSON.parse(testModeUser).email}
          </div>
          <Button
            size="sm"
            variant="secondary"
            onClick={handleExitTestMode}
            className="h-7 text-xs"
          >
            Exit Test Mode
          </Button>
        </div>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button 
            variant={isInTestMode ? "default" : "outline"} 
            size="sm" 
            className={`gap-2 ${isInTestMode ? 'bg-orange-500 hover:bg-orange-600 text-white' : ''}`}
          >
            <Users className="w-4 h-4" />
            Test Mode
          </Button>
        </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
              <Users className="w-4 h-4 text-white" />
            </div>
            Test Mode - Switch User
          </DialogTitle>
          <DialogDescription>
            Quickly switch between different user types to test the application
          </DialogDescription>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* User List */}
        <div className="flex-1 overflow-y-auto border rounded-lg">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-gray-500">
              No users found
            </div>
          ) : (
            <div className="divide-y">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className={`p-4 hover:bg-gray-50 transition-colors ${isCurrentUser(user) ? 'bg-blue-50' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-600 font-semibold text-sm">
                        {user.displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="font-semibold text-gray-900">{user.displayName}</div>
                          {isCurrentUser(user) && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                              Current
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                        {user.subtitle && (
                          <div className="text-xs text-gray-400 mt-0.5">{user.subtitle}</div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className={`px-3 py-1 rounded-full border text-xs font-medium flex items-center gap-1.5 ${getUserBadgeColor(user.userType)}`}>
                        {getUserIcon(user.userType)}
                        {user.userType}
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleSwitchUser(user)}
                        disabled={isCurrentUser(user)}
                        variant={isCurrentUser(user) ? "outline" : "default"}
                        className="gap-1"
                      >
                        <LogIn className="w-3 h-3" />
                        {isCurrentUser(user) ? 'Active' : 'Switch'}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="pt-3 border-t">
          {isInTestMode && (
            <div className="mb-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-start gap-2 text-sm">
                <span className="text-orange-600">⚠️</span>
                <div>
                  <p className="font-medium text-orange-900 mb-1">Currently in Test Mode</p>
                  <p className="text-orange-700 text-xs">
                    You're viewing the app as: <strong>{JSON.parse(testModeUser).full_name || JSON.parse(testModeUser).email}</strong>
                  </p>
                </div>
              </div>
            </div>
          )}
          <div className="flex items-start gap-2 text-sm text-gray-600">
            <span className="text-blue-600">ℹ️</span>
            <p>
              <strong>Test Mode:</strong> Click "Switch" to impersonate any user and test the application from their perspective. 
              The app will reload with the selected user's session.
            </p>
          </div>
        </div>
      </DialogContent>
      </Dialog>
    </>
  );
}