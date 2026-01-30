import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Users, Database, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminTestSetup() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [invitesSent, setInvitesSent] = useState(false);

  const testUsers = [
    { email: 'admin@test.com', role: 'admin', name: 'Test Admin' },
    { email: 'advicegroup@test.com', role: 'user', name: 'Test Advice Group' },
    { email: 'adviser@test.com', role: 'user', name: 'Test Adviser' },
    { email: 'client@test.com', role: 'user', name: 'Test Client' }
  ];

  const handleInviteUsers = async () => {
    setLoading(true);
    const results = [];
    
    for (const user of testUsers) {
      try {
        await base44.users.inviteUser(user.email, user.role);
        results.push({ ...user, success: true });
        toast.success(`Invited ${user.email}`);
      } catch (error) {
        results.push({ ...user, success: false, error: error.message });
        toast.error(`Failed to invite ${user.email}`);
      }
    }
    
    setInvitesSent(true);
    setLoading(false);
  };

  const handleCreateTestData = async () => {
    setLoading(true);
    setStatus('Creating test data...');

    try {
      // Get all users to find the test users
      const allUsers = await base44.entities.User.list();
      const adminUser = allUsers.find(u => u.email === 'admin@test.com');
      const agUser = allUsers.find(u => u.email === 'advicegroup@test.com');
      const adviserUser = allUsers.find(u => u.email === 'adviser@test.com');
      const clientUser = allUsers.find(u => u.email === 'client@test.com');

      if (!adminUser || !agUser || !adviserUser || !clientUser) {
        toast.error('Please ensure all test users have accepted their invites first');
        setLoading(false);
        return;
      }

      // Create Advice Groups
      setStatus('Creating advice groups...');
      const [ag1, ag2] = await Promise.all([
        base44.entities.AdviceGroup.create({
          user_id: agUser.id,
          name: 'PrimeSolve Financial',
          slug: 'primesolve',
          contact_email: 'info@primesolve.com.au',
          status: 'active'
        }, 'dev'),
        base44.entities.AdviceGroup.create({
          name: 'Wealth Partners Group',
          slug: 'wealth-partners',
          contact_email: 'info@wealthpartners.com.au',
          status: 'active'
        }, 'dev')
      ]);

      // Create Advisers
      setStatus('Creating advisers...');
      const [adv1, adv2, adv3] = await Promise.all([
        base44.entities.Adviser.create({
          user_id: adviserUser.id,
          advice_group_id: ag1.id,
          first_name: 'Sarah',
          last_name: 'Johnson',
          email: 'adviser@test.com',
          company: 'PrimeSolve Financial',
          status: 'active'
        }, 'dev'),
        base44.entities.Adviser.create({
          advice_group_id: ag1.id,
          first_name: 'Michael',
          last_name: 'Wong',
          email: 'michael.wong@primesolve.com.au',
          company: 'PrimeSolve Financial',
          status: 'active'
        }, 'dev'),
        base44.entities.Adviser.create({
          advice_group_id: ag2.id,
          first_name: 'Emma',
          last_name: 'Davis',
          email: 'emma.davis@wealthpartners.com.au',
          company: 'Wealth Partners Group',
          status: 'active'
        }, 'dev')
      ]);

      // Create Clients
      setStatus('Creating clients...');
      await base44.entities.Client.bulkCreate([
        {
          user_id: clientUser.id,
          adviser_email: 'adviser@test.com',
          advice_group_id: ag1.id,
          first_name: 'John',
          last_name: 'Smith',
          email: 'client@test.com',
          user_email: 'client@test.com',
          status: 'active',
          fact_find: 'in_progress'
        },
        {
          adviser_email: 'adviser@test.com',
          advice_group_id: ag1.id,
          first_name: 'Mary',
          last_name: 'Johnson',
          email: 'mary.johnson@example.com',
          user_email: 'mary.johnson@example.com',
          status: 'active',
          fact_find: 'complete'
        },
        {
          adviser_email: 'michael.wong@primesolve.com.au',
          advice_group_id: ag1.id,
          first_name: 'Robert',
          last_name: 'Chen',
          email: 'robert.chen@example.com',
          user_email: 'robert.chen@example.com',
          status: 'active',
          fact_find: 'sent'
        },
        {
          adviser_email: 'michael.wong@primesolve.com.au',
          advice_group_id: ag1.id,
          first_name: 'Lisa',
          last_name: 'Williams',
          email: 'lisa.williams@example.com',
          user_email: 'lisa.williams@example.com',
          status: 'prospect',
          fact_find: 'not_started'
        },
        {
          adviser_email: 'emma.davis@wealthpartners.com.au',
          advice_group_id: ag2.id,
          first_name: 'David',
          last_name: 'Brown',
          email: 'david.brown@example.com',
          user_email: 'david.brown@example.com',
          status: 'active',
          fact_find: 'complete'
        }
      ], 'dev');

      setStatus('✅ Test data created successfully!');
      toast.success('Test data created successfully!');
    } catch (error) {
      console.error('Error creating test data:', error);
      setStatus(`❌ Error: ${error.message}`);
      toast.error('Failed to create test data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Test Environment Setup</h1>
        <p className="text-slate-600">Initialize test users and sample data for testing different roles</p>
      </div>

      {/* Step 1: Invite Users */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-slate-800 mb-2">Step 1: Invite Test Users</h2>
            <p className="text-slate-600 mb-4">
              Send invitation emails to the following test accounts. Each will receive an email to set up their account.
            </p>
            
            <div className="space-y-3 mb-4">
              {testUsers.map((user) => (
                <div key={user.email} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <div className="font-medium text-slate-800">{user.name}</div>
                    <div className="text-sm text-slate-600">{user.email}</div>
                  </div>
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-purple-100 text-purple-700">
                    {user.role}
                  </span>
                </div>
              ))}
            </div>

            <Button 
              onClick={handleInviteUsers} 
              disabled={loading || invitesSent}
              className="gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending Invites...
                </>
              ) : invitesSent ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Invites Sent
                </>
              ) : (
                <>
                  <Users className="w-4 h-4" />
                  Send Invitations
                </>
              )}
            </Button>

            {invitesSent && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                <strong>⚠️ Important:</strong> Each user must check their email and complete registration before proceeding to Step 2.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Step 2: Create Test Data */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
            <Database className="w-5 h-5 text-green-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-slate-800 mb-2">Step 2: Create Test Data</h2>
            <p className="text-slate-600 mb-4">
              Once all users have accepted their invites, create sample data:
            </p>

            <ul className="list-disc list-inside text-slate-600 mb-4 space-y-1">
              <li>2 Advice Groups (PrimeSolve Financial linked to advicegroup@test.com)</li>
              <li>3 Advisers (1 linked to adviser@test.com)</li>
              <li>5 Clients (1 linked to client@test.com)</li>
            </ul>

            <Button 
              onClick={handleCreateTestData} 
              disabled={loading || !invitesSent}
              className="gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {status || 'Creating...'}
                </>
              ) : (
                <>
                  <Database className="w-4 h-4" />
                  Create Test Data
                </>
              )}
            </Button>

            {status && !loading && (
              <div className={`mt-4 p-3 rounded-lg text-sm ${
                status.includes('✅') 
                  ? 'bg-green-50 border border-green-200 text-green-800' 
                  : 'bg-red-50 border border-red-200 text-red-800'
              }`}>
                {status}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">Testing Instructions</h3>
        <ol className="list-decimal list-inside text-sm text-blue-800 space-y-1">
          <li>Complete both steps above to set up test environment</li>
          <li>Use Test Mode switcher on Admin Dashboard to switch between users</li>
          <li>Each user will see only their permitted data:
            <ul className="list-disc list-inside ml-6 mt-1">
              <li><strong>admin@test.com</strong>: Sees all advice groups, advisers, and clients</li>
              <li><strong>advicegroup@test.com</strong>: Sees only PrimeSolve Financial's advisers and clients</li>
              <li><strong>adviser@test.com</strong>: Sees only their assigned clients</li>
              <li><strong>client@test.com</strong>: Sees only their own dashboard and data</li>
            </ul>
          </li>
        </ol>
      </div>
    </div>
  );
}