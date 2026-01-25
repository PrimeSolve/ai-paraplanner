import React from 'react';
import PublicLayout from '../components/public/PublicLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Target, Users, Zap } from 'lucide-react';

export default function PublicAbout() {
  return (
    <PublicLayout>
      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-50 to-slate-100 py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-5xl font-['Fraunces'] font-bold text-slate-800 mb-6">
            About AI Paraplanner
          </h1>
          <p className="text-xl text-slate-600">
            We're on a mission to empower financial advisers with AI technology, making quality advice more accessible and efficient.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-2 gap-16 items-center mb-20">
            <div>
              <h2 className="text-3xl font-['Fraunces'] font-bold text-slate-800 mb-4">
                Our Mission
              </h2>
              <p className="text-lg text-slate-600 mb-4">
                Financial advice should be thorough, compliant, and accessible. Yet advisers spend countless hours on administrative tasks, reducing time for what matters most: their clients.
              </p>
              <p className="text-lg text-slate-600">
                AI Paraplanner leverages cutting-edge AI to automate the heavy lifting, giving advisers more time to focus on delivering exceptional, personalized financial advice.
              </p>
            </div>
            <div className="bg-slate-50 rounded-2xl p-12">
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Zap className="w-6 h-6 text-teal-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800">Efficiency</h4>
                    <p className="text-sm text-slate-600">Cut SOA prep time by 60%</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Users className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800">Client Focus</h4>
                    <p className="text-sm text-slate-600">More time for relationships</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Target className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800">Compliance</h4>
                    <p className="text-sm text-slate-600">Built-in quality checks</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Values */}
          <div className="text-center mb-12">
            <h2 className="text-3xl font-['Fraunces'] font-bold text-slate-800 mb-4">
              Our Values
            </h2>
          </div>
          <div className="grid grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-2">Innovation</h3>
                <p className="text-slate-600">
                  Continuously improving with the latest AI technology to serve advisers better
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-2">Quality</h3>
                <p className="text-slate-600">
                  Uncompromising standards in compliance, security, and advice documentation
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-2">Partnership</h3>
                <p className="text-slate-600">
                  Working alongside advisers to understand and meet their evolving needs
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-['Fraunces'] font-bold text-teal-600 mb-2">500+</div>
              <div className="text-slate-600">Advisers</div>
            </div>
            <div>
              <div className="text-4xl font-['Fraunces'] font-bold text-purple-600 mb-2">50+</div>
              <div className="text-slate-600">Advice Groups</div>
            </div>
            <div>
              <div className="text-4xl font-['Fraunces'] font-bold text-blue-600 mb-2">10K+</div>
              <div className="text-slate-600">SOAs Created</div>
            </div>
            <div>
              <div className="text-4xl font-['Fraunces'] font-bold text-amber-600 mb-2">60%</div>
              <div className="text-slate-600">Time Saved</div>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}