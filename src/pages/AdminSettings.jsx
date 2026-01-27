import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import AdminLayout from '../components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { 
  Building2, 
  Target, 
  Users, 
  Bell, 
  UserPlus, 
  Settings2,
  Upload,
  Briefcase,
  Shield,
  TrendingUp,
  BarChart3,
  User,
  CreditCard,
  HelpCircle,
  LogOut,
  ChevronDown
} from 'lucide-react';

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState('business');
  const [logoPreview, setLogoPreview] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        console.error('Failed to load user:', error);
      }
    };
    loadUser();
  }, []);
  
  const [businessDetails, setBusinessDetails] = useState(() => {
    const saved = localStorage.getItem('businessDetails');
    return saved ? JSON.parse(saved) : {
      companyName: 'AI Paraplanner',
      abn: '12 345 678 901',
      businessEmail: 'hello@aiparaplanner.com.au',
      supportEmail: 'support@aiparaplanner.com.au',
      address: 'Level 10, 123 Collins Street\nMelbourne VIC 3000',
      role: 'admin'
    };
  });

  const [slaTargets, setSlaTargets] = useState([
    { id: 1, type: 'Comprehensive', icon: '📋', color: '#8b5cf6', target: 5, warning: 4 },
    { id: 2, type: 'Insurance', icon: '🛡️', color: '#3b82f6', target: 3, warning: 2 },
    { id: 3, type: 'Superannuation', icon: '💰', color: '#f59e0b', target: 4, warning: 3 },
    { id: 4, type: 'Investment', icon: '📈', color: '#10b981', target: 4, warning: 3 }
  ]);

  const [slaSettings, setSlaSettings] = useState({
    autoEscalate: true,
    includeWeekends: false
  });

  const [teamDefaults, setTeamDefaults] = useState({
    defaultCapacity: 5,
    assignmentMode: 'manual',
    workingDays: 'monday-friday',
    businessHoursStart: '09:00',
    businessHoursEnd: '17:30',
    allowSelfAssign: true
  });

  const [notifications, setNotifications] = useState({
    newSubmissions: true,
    dailyDigest: true,
    overdueAlerts: true,
    adviserRegistration: true,
    slackWebhook: 'https://hooks.slack.com/services/...'
  });

  const [adviserOnboarding, setAdviserOnboarding] = useState({
    requireApproval: true,
    sendWelcomeEmail: true,
    requireAFSL: true,
    defaultPricingPlan: 'starter',
    trialPeriod: 14
  });

  const [integrations, setIntegrations] = useState({
    sendgrid: { connected: true },
    stripe: { connected: true },
    googleDrive: { connected: false },
    slack: { connected: false }
  });

  const [apiKey, setApiKey] = useState('sk_live_51234567890abcdefghijklmnopqrstuvwxyz');
  const [showApiKey, setShowApiKey] = useState(false);

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const tabs = [
    { id: 'business', label: 'Business Details', icon: Building2 },
    { id: 'sla', label: 'SLA & Targets', icon: Target },
    { id: 'team', label: 'Team Defaults', icon: Users },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'adviser', label: 'Adviser Onboarding', icon: UserPlus },
    { id: 'integrations', label: 'Integrations', icon: Settings2 }
  ];

  return (
    <AdminLayout currentPage="AdminSettings">
      <div className="min-h-screen bg-[#f8fafc]">
        <div className="p-8">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-['Playfair_Display'] font-semibold text-[#0f172a] mb-1">
              Settings
            </h1>
            <p className="text-sm text-[#64748b]">Configure your AI Paraplanner workspace</p>
          </div>

          {/* Content */}
          <div className="flex gap-6">
            {/* Sidebar */}
            <div className="w-[220px] flex-shrink-0">
            <div className="bg-white rounded-2xl border border-[#e2e8f0] p-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      activeTab === tab.id
                        ? 'bg-[#eff6ff] text-[#1d4ed8]'
                        : 'text-[#64748b] hover:bg-[#f8fafc]'
                    }`}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span className="whitespace-nowrap">{tab.label}</span>
                  </button>
                );
              })}
            </div>
            </div>

            {/* Main Content */}
            <div className="flex-1">
            {/* Business Details */}
            {activeTab === 'business' && (
              <div className="bg-white rounded-2xl border border-[#e2e8f0] p-8">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-[#0f172a] mb-1">Business Details</h2>
                  <p className="text-sm text-[#64748b]">Your company information displayed to advisers</p>
                </div>

                <div className="space-y-6">
                  {/* Company Logo */}
                  <div>
                    <Label className="text-sm font-medium text-[#0f172a] mb-3 block">Company Logo</Label>
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-[#1d4ed8] to-[#3b82f6] rounded-xl flex items-center justify-center text-white font-bold text-xl">
                        {logoPreview ? (
                          <img src={logoPreview} alt="Logo" className="w-full h-full object-cover rounded-xl" />
                        ) : (
                          'AI'
                        )}
                      </div>
                      <div className="flex gap-3">
                        <label>
                          <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                          <Button type="button" className="bg-[#3b82f6] hover:bg-[#2563eb] text-white cursor-pointer">
                            <Upload className="w-4 h-4 mr-2" />
                            Upload New Logo
                          </Button>
                        </label>
                        {logoPreview && (
                          <Button 
                            variant="outline" 
                            onClick={() => setLogoPreview(null)}
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-[#64748b] mt-2">PNG or SVG, max 2MB</p>
                  </div>

                  {/* Company Name, ABN & Role */}
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-[#0f172a] mb-2 block">Company Name</Label>
                      <Input
                        value={businessDetails.companyName}
                        onChange={(e) => setBusinessDetails({...businessDetails, companyName: e.target.value})}
                        className="border-[#e2e8f0]"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-[#0f172a] mb-2 block">ABN</Label>
                      <Input
                        value={businessDetails.abn}
                        onChange={(e) => setBusinessDetails({...businessDetails, abn: e.target.value})}
                        className="border-[#e2e8f0]"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-[#0f172a] mb-2 block">Role</Label>
                      <Select
                        value={businessDetails.role}
                        onValueChange={(value) => setBusinessDetails({...businessDetails, role: value})}
                      >
                        <SelectTrigger className="border-[#e2e8f0]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="advice_group">Advice Group</SelectItem>
                          <SelectItem value="adviser">Adviser</SelectItem>
                          <SelectItem value="client">Client</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Emails */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-[#0f172a] mb-2 block">Business Contact Email</Label>
                      <Input
                        type="email"
                        value={businessDetails.businessEmail}
                        onChange={(e) => setBusinessDetails({...businessDetails, businessEmail: e.target.value})}
                        className="border-[#e2e8f0]"
                      />
                      <p className="text-xs text-[#64748b] mt-1">Used for invoicing and business enquiries</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-[#0f172a] mb-2 block">Support Email</Label>
                      <Input
                        type="email"
                        value={businessDetails.supportEmail}
                        onChange={(e) => setBusinessDetails({...businessDetails, supportEmail: e.target.value})}
                        className="border-[#e2e8f0]"
                      />
                      <p className="text-xs text-[#64748b] mt-1">Displayed to advisers for support requests</p>
                    </div>
                  </div>

                  {/* Address */}
                  <div>
                    <Label className="text-sm font-medium text-[#0f172a] mb-2 block">Business Address</Label>
                    <Textarea
                      value={businessDetails.address}
                      onChange={(e) => setBusinessDetails({...businessDetails, address: e.target.value})}
                      className="border-[#e2e8f0] min-h-[100px]"
                    />
                  </div>

                  <div className="pt-4 border-t border-[#e2e8f0]">
                    <Button 
                      className="bg-[#0f172a] hover:bg-[#1e293b] text-white"
                      onClick={() => {
                        localStorage.setItem('businessDetails', JSON.stringify(businessDetails));
                        window.dispatchEvent(new Event('businessDetailsUpdated'));
                        toast.success('Business details saved successfully');
                      }}
                    >
                      Save Changes
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* SLA & Targets */}
            {activeTab === 'sla' && (
              <div className="bg-white rounded-2xl border border-[#e2e8f0] p-8">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-[#0f172a] mb-1">SLA & Turnaround Targets</h2>
                  <p className="text-sm text-[#64748b]">Configure target completion times by advice type</p>
                </div>

                <div className="space-y-6">
                  {/* Targets Table */}
                  <div>
                    <div className="grid grid-cols-[1fr,120px,120px] gap-4 mb-3 px-4">
                      <div className="text-xs font-semibold text-[#64748b] uppercase tracking-wider">Advice Type</div>
                      <div className="text-xs font-semibold text-[#64748b] uppercase tracking-wider">Target (Days)</div>
                      <div className="text-xs font-semibold text-[#64748b] uppercase tracking-wider">Warning At</div>
                    </div>
                    <div className="space-y-2">
                      {slaTargets.map((item) => (
                        <div key={item.id} className="grid grid-cols-[1fr,120px,120px] gap-4 items-center bg-[#f8fafc] rounded-xl p-4">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                              style={{ backgroundColor: `${item.color}20` }}
                            >
                              {item.icon}
                            </div>
                            <span className="font-medium text-[#0f172a]">{item.type}</span>
                          </div>
                          <Input
                            type="number"
                            value={item.target}
                            onChange={(e) => {
                              const updated = slaTargets.map(t => 
                                t.id === item.id ? {...t, target: parseInt(e.target.value)} : t
                              );
                              setSlaTargets(updated);
                            }}
                            className="border-[#e2e8f0] text-center"
                          />
                          <Input
                            type="number"
                            value={item.warning}
                            onChange={(e) => {
                              const updated = slaTargets.map(t => 
                                t.id === item.id ? {...t, warning: parseInt(e.target.value)} : t
                              );
                              setSlaTargets(updated);
                            }}
                            className="border-[#e2e8f0] text-center"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Settings */}
                  <div className="space-y-4 pt-4 border-t border-[#e2e8f0]">
                    <div className="flex items-center justify-between p-4 bg-[#f8fafc] rounded-xl">
                      <div>
                        <div className="font-medium text-[#0f172a] mb-1">Auto-escalate overdue SOAs</div>
                        <div className="text-sm text-[#64748b]">Automatically flag SOAs as high priority when they exceed the target</div>
                      </div>
                      <Switch
                        checked={slaSettings.autoEscalate}
                        onCheckedChange={(checked) => setSlaSettings({...slaSettings, autoEscalate: checked})}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-[#f8fafc] rounded-xl">
                      <div>
                        <div className="font-medium text-[#0f172a] mb-1">Include weekends in turnaround calculation</div>
                        <div className="text-sm text-[#64748b]">Count Saturday and Sunday as working days</div>
                      </div>
                      <Switch
                        checked={slaSettings.includeWeekends}
                        onCheckedChange={(checked) => setSlaSettings({...slaSettings, includeWeekends: checked})}
                      />
                    </div>
                  </div>

                  <div className="pt-4">
                    <Button className="bg-[#0f172a] hover:bg-[#1e293b] text-white">
                      Save Changes
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Team Defaults */}
            {activeTab === 'team' && (
              <div className="bg-white rounded-2xl border border-[#e2e8f0] p-8">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-[#0f172a] mb-1">Team Defaults</h2>
                  <p className="text-sm text-[#64748b]">Configure default settings for team members and assignments</p>
                </div>

                <div className="space-y-6">
                  {/* Capacity & Assignment */}
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <Label className="text-sm font-medium text-[#0f172a] mb-2 block">Default Capacity for New Team Members</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={teamDefaults.defaultCapacity}
                          onChange={(e) => setTeamDefaults({...teamDefaults, defaultCapacity: parseInt(e.target.value)})}
                          className="border-[#e2e8f0] w-24"
                        />
                        <span className="text-sm text-[#64748b]">SOAs</span>
                      </div>
                      <p className="text-xs text-[#64748b] mt-2">Maximum concurrent SOAs a new team member can handle</p>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-[#0f172a] mb-2 block">Assignment Mode</Label>
                      <Select
                        value={teamDefaults.assignmentMode}
                        onValueChange={(value) => setTeamDefaults({...teamDefaults, assignmentMode: value})}
                      >
                        <SelectTrigger className="border-[#e2e8f0]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="manual">Manual Assignment</SelectItem>
                          <SelectItem value="auto">Auto Assignment</SelectItem>
                          <SelectItem value="round-robin">Round Robin</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-[#64748b] mt-2">How new SOA requests are assigned to team members</p>
                    </div>
                  </div>

                  {/* Working Days & Hours */}
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <Label className="text-sm font-medium text-[#0f172a] mb-2 block">Working Days</Label>
                      <Select
                        value={teamDefaults.workingDays}
                        onValueChange={(value) => setTeamDefaults({...teamDefaults, workingDays: value})}
                      >
                        <SelectTrigger className="border-[#e2e8f0]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monday-friday">Monday - Friday</SelectItem>
                          <SelectItem value="monday-saturday">Monday - Saturday</SelectItem>
                          <SelectItem value="all-week">All Week</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-[#0f172a] mb-2 block">Business Hours</Label>
                      <div className="flex items-center gap-3">
                        <Input
                          type="time"
                          value={teamDefaults.businessHoursStart}
                          onChange={(e) => setTeamDefaults({...teamDefaults, businessHoursStart: e.target.value})}
                          className="border-[#e2e8f0]"
                        />
                        <span className="text-[#64748b]">to</span>
                        <Input
                          type="time"
                          value={teamDefaults.businessHoursEnd}
                          onChange={(e) => setTeamDefaults({...teamDefaults, businessHoursEnd: e.target.value})}
                          className="border-[#e2e8f0]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Self-Assign */}
                  <div className="flex items-center justify-between p-4 bg-[#f8fafc] rounded-xl">
                    <div>
                      <div className="font-medium text-[#0f172a] mb-1">Allow team members to self-assign</div>
                      <div className="text-sm text-[#64748b]">Team members can pick up unassigned SOAs themselves</div>
                    </div>
                    <Switch
                      checked={teamDefaults.allowSelfAssign}
                      onCheckedChange={(checked) => setTeamDefaults({...teamDefaults, allowSelfAssign: checked})}
                    />
                  </div>

                  <div className="pt-4 border-t border-[#e2e8f0]">
                    <Button className="bg-[#0f172a] hover:bg-[#1e293b] text-white">
                      Save Changes
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications */}
            {activeTab === 'notifications' && (
              <div className="bg-white rounded-2xl border border-[#e2e8f0] p-8">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-[#0f172a] mb-1">Notifications</h2>
                  <p className="text-sm text-[#64748b]">Configure how you receive alerts and updates</p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-[#f8fafc] rounded-xl">
                    <div>
                      <div className="font-medium text-[#0f172a] mb-1">Email alerts for new submissions</div>
                      <div className="text-sm text-[#64748b]">Receive an email when a new SOA request is submitted</div>
                    </div>
                    <Switch
                      checked={notifications.newSubmissions}
                      onCheckedChange={(checked) => setNotifications({...notifications, newSubmissions: checked})}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-[#f8fafc] rounded-xl">
                    <div>
                      <div className="font-medium text-[#0f172a] mb-1">Daily digest email</div>
                      <div className="text-sm text-[#64748b]">Receive a daily summary of queue status and completed work</div>
                    </div>
                    <Switch
                      checked={notifications.dailyDigest}
                      onCheckedChange={(checked) => setNotifications({...notifications, dailyDigest: checked})}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-[#f8fafc] rounded-xl">
                    <div>
                      <div className="font-medium text-[#0f172a] mb-1">Overdue SOA alerts</div>
                      <div className="text-sm text-[#64748b]">Get notified when an SOA exceeds its target turnaround</div>
                    </div>
                    <Switch
                      checked={notifications.overdueAlerts}
                      onCheckedChange={(checked) => setNotifications({...notifications, overdueAlerts: checked})}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-[#f8fafc] rounded-xl">
                    <div>
                      <div className="font-medium text-[#0f172a] mb-1">New adviser registration alerts</div>
                      <div className="text-sm text-[#64748b]">Get notified when a new adviser signs up</div>
                    </div>
                    <Switch
                      checked={notifications.adviserRegistration}
                      onCheckedChange={(checked) => setNotifications({...notifications, adviserRegistration: checked})}
                    />
                  </div>

                  <div className="pt-4 border-t border-[#e2e8f0]">
                    <Label className="text-sm font-medium text-[#0f172a] mb-2 block">Slack Webhook URL (optional)</Label>
                    <Input
                      type="url"
                      value={notifications.slackWebhook}
                      onChange={(e) => setNotifications({...notifications, slackWebhook: e.target.value})}
                      placeholder="https://hooks.slack.com/services/..."
                      className="border-[#e2e8f0]"
                    />
                    <p className="text-xs text-[#64748b] mt-2">Send notifications to a Slack channel</p>
                  </div>

                  <div className="pt-4">
                    <Button className="bg-[#0f172a] hover:bg-[#1e293b] text-white">
                      Save Changes
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Adviser Onboarding */}
            {activeTab === 'adviser' && (
              <div className="bg-white rounded-2xl border border-[#e2e8f0] p-8">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-[#0f172a] mb-1">Adviser Onboarding</h2>
                  <p className="text-sm text-[#64748b]">Configure how new advisers are onboarded to the platform</p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-[#f8fafc] rounded-xl">
                    <div>
                      <div className="font-medium text-[#0f172a] mb-1">Require admin approval for new advisers</div>
                      <div className="text-sm text-[#64748b]">New adviser accounts must be approved before they can submit SOA requests</div>
                    </div>
                    <Switch
                      checked={adviserOnboarding.requireApproval}
                      onCheckedChange={(checked) => setAdviserOnboarding({...adviserOnboarding, requireApproval: checked})}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-[#f8fafc] rounded-xl">
                    <div>
                      <div className="font-medium text-[#0f172a] mb-1">Send welcome email</div>
                      <div className="text-sm text-[#64748b]">Automatically send a welcome email when an adviser account is approved</div>
                    </div>
                    <Switch
                      checked={adviserOnboarding.sendWelcomeEmail}
                      onCheckedChange={(checked) => setAdviserOnboarding({...adviserOnboarding, sendWelcomeEmail: checked})}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-[#f8fafc] rounded-xl">
                    <div>
                      <div className="font-medium text-[#0f172a] mb-1">Require AFSL verification</div>
                      <div className="text-sm text-[#64748b]">Advisers must provide valid AFSL details during registration</div>
                    </div>
                    <Switch
                      checked={adviserOnboarding.requireAFSL}
                      onCheckedChange={(checked) => setAdviserOnboarding({...adviserOnboarding, requireAFSL: checked})}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-6 pt-4">
                    <div>
                      <Label className="text-sm font-medium text-[#0f172a] mb-2 block">Default Pricing Plan</Label>
                      <Select
                        value={adviserOnboarding.defaultPricingPlan}
                        onValueChange={(value) => setAdviserOnboarding({...adviserOnboarding, defaultPricingPlan: value})}
                      >
                        <SelectTrigger className="border-[#e2e8f0]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="starter">Starter (5 SOAs/month)</SelectItem>
                          <SelectItem value="professional">Professional (15 SOAs/month)</SelectItem>
                          <SelectItem value="enterprise">Enterprise (Unlimited)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-[#0f172a] mb-2 block">Trial Period</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={adviserOnboarding.trialPeriod}
                          onChange={(e) => setAdviserOnboarding({...adviserOnboarding, trialPeriod: parseInt(e.target.value)})}
                          className="border-[#e2e8f0] w-24"
                        />
                        <span className="text-sm text-[#64748b]">days</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-[#e2e8f0]">
                    <Button className="bg-[#0f172a] hover:bg-[#1e293b] text-white">
                      Save Changes
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Integrations */}
            {activeTab === 'integrations' && (
              <div className="bg-white rounded-2xl border border-[#e2e8f0] p-8">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-[#0f172a] mb-1">Integrations</h2>
                  <p className="text-sm text-[#64748b]">Connect external services and manage API access</p>
                </div>

                <div className="space-y-8">
                  {/* Connected Services */}
                  <div>
                    <div className="text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-4">Connected Services</div>
                    <div className="space-y-3">
                      {/* SendGrid */}
                      <div className="flex items-center justify-between p-4 border border-[#e2e8f0] rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-[#eff6ff] rounded-lg flex items-center justify-center">
                            <div className="w-6 h-6 bg-[#3b82f6] rounded-md"></div>
                          </div>
                          <div>
                            <div className="font-medium text-[#0f172a]">SendGrid</div>
                            <div className="text-sm text-[#10b981]">✓ Connected</div>
                          </div>
                        </div>
                        <Button variant="outline" className="border-[#e2e8f0]">
                          Configure
                        </Button>
                      </div>

                      {/* Stripe */}
                      <div className="flex items-center justify-between p-4 border border-[#e2e8f0] rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-[#eff6ff] rounded-lg flex items-center justify-center">
                            <div className="w-6 h-6 bg-[#635bff] rounded-md"></div>
                          </div>
                          <div>
                            <div className="font-medium text-[#0f172a]">Stripe</div>
                            <div className="text-sm text-[#10b981]">✓ Connected</div>
                          </div>
                        </div>
                        <Button variant="outline" className="border-[#e2e8f0]">
                          Configure
                        </Button>
                      </div>

                      {/* Google Drive */}
                      <div className="flex items-center justify-between p-4 border border-[#e2e8f0] rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-[#fef3c7] rounded-lg flex items-center justify-center">
                            <div className="w-6 h-6 bg-[#f59e0b] rounded-md"></div>
                          </div>
                          <div>
                            <div className="font-medium text-[#0f172a]">Google Drive</div>
                            <div className="text-sm text-[#64748b]">Not connected</div>
                          </div>
                        </div>
                        <Button className="bg-[#3b82f6] hover:bg-[#2563eb] text-white">
                          Connect
                        </Button>
                      </div>

                      {/* Slack */}
                      <div className="flex items-center justify-between p-4 border border-[#e2e8f0] rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-[#fce7f3] rounded-lg flex items-center justify-center">
                            <div className="w-6 h-6 bg-[#ec4899] rounded-md"></div>
                          </div>
                          <div>
                            <div className="font-medium text-[#0f172a]">Slack</div>
                            <div className="text-sm text-[#64748b]">Not connected</div>
                          </div>
                        </div>
                        <Button className="bg-[#3b82f6] hover:bg-[#2563eb] text-white">
                          Connect
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* API Access */}
                  <div className="pt-6 border-t border-[#e2e8f0]">
                    <div className="text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-4">API Access</div>
                    <div>
                      <Label className="text-sm font-medium text-[#0f172a] mb-2 block">API Key</Label>
                      <div className="flex items-center gap-3 mb-2">
                        <Input
                          type={showApiKey ? "text" : "password"}
                          value={apiKey}
                          readOnly
                          className="border-[#e2e8f0] font-mono text-sm flex-1"
                        />
                        <Button 
                          variant="outline" 
                          onClick={() => setShowApiKey(!showApiKey)}
                          className="border-[#e2e8f0]"
                        >
                          {showApiKey ? 'Hide' : 'Show'}
                        </Button>
                        <Button 
                          variant="outline"
                          onClick={() => {
                            navigator.clipboard.writeText(apiKey);
                          }}
                          className="border-[#e2e8f0]"
                        >
                          Copy
                        </Button>
                      </div>
                      <p className="text-xs text-[#64748b] mb-4">Use this key to access the AI Paraplanner API</p>
                      <Button variant="destructive" className="bg-[#ef4444] hover:bg-[#dc2626]">
                        Regenerate API Key
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}