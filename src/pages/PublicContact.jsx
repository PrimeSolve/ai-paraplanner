import React, { useState } from 'react';
import PublicLayout from '../components/public/PublicLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Mail, Phone, MapPin } from 'lucide-react';
import { toast } from 'sonner';

export default function PublicContact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    message: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    toast.success('Message sent! We\'ll get back to you soon.');
    setFormData({ name: '', email: '', company: '', message: '' });
  };

  return (
    <PublicLayout>
      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-50 to-slate-100 py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-5xl font-['Fraunces'] font-bold text-slate-800 mb-6">
            Get in Touch
          </h1>
          <p className="text-xl text-slate-600">
            Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
          </p>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 gap-12">
            {/* Contact Form */}
            <Card>
              <CardContent className="p-8">
                <h2 className="text-2xl font-['Fraunces'] font-bold text-slate-800 mb-6">
                  Send us a message
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label>Name</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="John Smith"
                      required
                    />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      placeholder="john@example.com"
                      required
                    />
                  </div>
                  <div>
                    <Label>Company</Label>
                    <Input
                      value={formData.company}
                      onChange={(e) => setFormData({...formData, company: e.target.value})}
                      placeholder="Your Company"
                    />
                  </div>
                  <div>
                    <Label>Message</Label>
                    <Textarea
                      value={formData.message}
                      onChange={(e) => setFormData({...formData, message: e.target.value})}
                      placeholder="How can we help?"
                      rows={5}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full bg-slate-800 hover:bg-slate-700">
                    Send Message
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Contact Info */}
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-['Fraunces'] font-bold text-slate-800 mb-6">
                  Contact Information
                </h2>
                <p className="text-slate-600 mb-8">
                  Reach out to us through any of these channels. We're here to help you transform your financial advice practice.
                </p>
              </div>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Mail className="w-6 h-6 text-teal-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800 mb-1">Email</h3>
                    <p className="text-slate-600">support@aiparaplanner.com.au</p>
                    <p className="text-sm text-slate-500 mt-1">We'll respond within 24 hours</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Phone className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800 mb-1">Phone</h3>
                    <p className="text-slate-600">1300 AI PARA (1300 247 272)</p>
                    <p className="text-sm text-slate-500 mt-1">Mon-Fri, 9am-5pm AEST</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800 mb-1">Office</h3>
                    <p className="text-slate-600">Level 15, 123 Pitt Street</p>
                    <p className="text-slate-600">Sydney NSW 2000</p>
                    <p className="text-slate-600">Australia</p>
                  </div>
                </div>
              </div>

              <Card className="bg-slate-50 border-slate-200">
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-2">Looking for support?</h3>
                  <p className="text-sm text-slate-600 mb-3">
                    If you're already a customer, please log in to access our support portal.
                  </p>
                  <Button variant="outline" className="w-full">
                    Access Support Portal
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}