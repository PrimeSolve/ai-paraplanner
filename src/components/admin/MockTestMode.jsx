import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from '@/components/ui/button';
import { Users, X } from 'lucide-react';

export default function MockTestMode() {
  const [mockRole, setMockRole] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem('mock_test_role');
    if (saved) {
      setMockRole(saved);
    }
  }, []);

  const handleRoleChange = (role) => {
    if (role === 'none') {
      localStorage.removeItem('mock_test_role');
      setMockRole(null);
    } else {
      localStorage.setItem('mock_test_role', role);
      setMockRole(role);
    }
    window.location.reload();
  };

  const isActive = !!mockRole;

  return (
    <>
      {isActive && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Users className="w-4 h-4" />
            Mock Test Mode: {mockRole === 'admin' ? 'Admin' : mockRole === 'advice_group' ? 'Advice Group' : mockRole === 'adviser' ? 'Adviser' : 'Client'}
          </div>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => handleRoleChange('none')}
            className="h-7 text-xs gap-1"
          >
            <X className="w-3 h-3" />
            Exit Mock Mode
          </Button>
        </div>
      )}
      
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-600 font-medium">Test as:</span>
        <Select value={mockRole || 'none'} onValueChange={handleRoleChange}>
          <SelectTrigger className="w-[180px] h-9">
            <SelectValue placeholder="Select role..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                Normal Mode
              </span>
            </SelectItem>
            <SelectItem value="admin">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                Admin
              </span>
            </SelectItem>
            <SelectItem value="advice_group">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                Advice Group
              </span>
            </SelectItem>
            <SelectItem value="adviser">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                Adviser
              </span>
            </SelectItem>
            <SelectItem value="client">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                Client
              </span>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </>
  );
}