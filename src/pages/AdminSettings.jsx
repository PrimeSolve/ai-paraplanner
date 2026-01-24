import React, { useState } from 'react';
import AdminLayout from '../components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Settings, Mail, Bell, Shield, Database } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminSettings() {
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    systemName: 'AI Paraplanner',
    supportEmail: 'support@aiparaplanner.com',
    maxSOAsPerAdviser: 50,
    autoAssignSOAs: true,
    emailNotifications: true,
    slackIntegration: false
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save settings logic here
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Settings saved successfully');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const settingsSections = [
    {
      icon: Settings,
      title: 'General',
      items: [
        {
          label: 'System Name',
          description: 'Display name for the application',
          type: 'input',
          value: settings.systemName,
          onChange: (val) => setSettings({...settings, systemName: val})
        },
        {
          label: 'Support Email',
          description: 'Email address for support inquiries',
          type: 'input',
          value: settings.supportEmail,
          onChange: (val) => setSettings({...settings, supportEmail: val})
        }
      ]
    },
    {
      icon: Bell,
      title: 'Notifications',
      items: [
        {
          label: 'Email Notifications',
          description: 'Send email alerts for important events',
          type: 'switch',
          value: settings.emailNotifications,
          onChange: (val) => setSettings({...settings, emailNotifications: val})
        },
        {
          label: 'Slack Integration',
          description: 'Post updates to Slack channels',
          type: 'switch',
          value: settings.slackIntegration,
          onChange: (val) => setSettings({...settings, slackIntegration: val})
        }
      ]
    },
    {
      icon: Shield,
      title: 'SOA Processing',
      items: [
        {
          label: 'Max SOAs per Adviser',
          description: 'Maximum active SOAs an adviser can have',
          type: 'input',
          inputType: 'number',
          value: settings.maxSOAsPerAdviser,
          onChange: (val) => setSettings({...settings, maxSOAsPerAdviser: val})
        },
        {
          label: 'Auto-assign SOAs',
          description: 'Automatically assign SOAs to available team members',
          type: 'switch',
          value: settings.autoAssignSOAs,
          onChange: (val) => setSettings({...settings, autoAssignSOAs: val})
        }
      ]
    }
  ];

  return (
    <AdminLayout currentPage="AdminSettings">
      <div className="bg-white border-b border-slate-200 px-8 py-6 sticky top-0 z-10">
        <h1 className="text-2xl font-['Fraunces'] font-medium text-slate-800">System Settings</h1>
        <p className="text-sm text-slate-600 mt-1">Configure system-wide settings</p>
      </div>

      <div className="p-8 max-w-4xl">
        <div className="space-y-6">
          {settingsSections.map((section, idx) => {
            const Icon = section.icon;
            return (
              <Card key={idx}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon className="w-5 h-5" />
                    {section.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {section.items.map((item, itemIdx) => (
                    <div key={itemIdx} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
                      <div className="flex-1">
                        <Label className="font-semibold">{item.label}</Label>
                        <p className="text-sm text-slate-600 mt-1">{item.description}</p>
                      </div>
                      <div className="w-64">
                        {item.type === 'input' && (
                          <Input
                            type={item.inputType || 'text'}
                            value={item.value}
                            onChange={(e) => item.onChange(e.target.value)}
                          />
                        )}
                        {item.type === 'switch' && (
                          <Switch
                            checked={item.value}
                            onCheckedChange={item.onChange}
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline">Reset to Defaults</Button>
          <Button onClick={handleSave} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700">
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
}