import React from 'react';
import PublicLayout from '../components/public/PublicLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { base44 } from '@/api/base44Client';
import { Check } from 'lucide-react';

export default function PublicPricing() {
  const plans = [
    {
      name: 'Starter',
      price: '$149',
      period: 'per adviser/month',
      description: 'Perfect for individual advisers',
      features: [
        'Up to 50 clients',
        'Unlimited SOAs',
        'AI-powered prefill',
        'Client portal',
        'Email support',
        'Basic templates'
      ],
      cta: 'Start Free Trial',
      popular: false
    },
    {
      name: 'Professional',
      price: '$249',
      period: 'per adviser/month',
      description: 'For growing advice practices',
      features: [
        'Unlimited clients',
        'Unlimited SOAs',
        'AI-powered prefill',
        'Client portal',
        'Priority support',
        'Custom templates',
        'Risk profiles',
        'Model portfolios',
        'Analytics dashboard'
      ],
      cta: 'Start Free Trial',
      popular: true
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: 'contact us',
      description: 'For advice groups and dealers',
      features: [
        'Everything in Professional',
        'Multi-licensee support',
        'Group configuration',
        'Adviser oversight',
        'Dedicated support',
        'Custom integrations',
        'Training & onboarding',
        'SSO & advanced security'
      ],
      cta: 'Contact Sales',
      popular: false
    }
  ];

  return (
    <PublicLayout>
      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-50 to-slate-100 py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-5xl font-['Fraunces'] font-bold text-slate-800 mb-6">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-slate-600">
            Choose the plan that fits your practice. All plans include a 14-day free trial.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-3 gap-8">
            {plans.map((plan) => (
              <Card key={plan.name} className={plan.popular ? 'border-2 border-teal-500 shadow-xl' : ''}>
                {plan.popular && (
                  <div className="bg-teal-500 text-white text-center py-2 text-sm font-semibold rounded-t-xl">
                    Most Popular
                  </div>
                )}
                <CardHeader>
                  <CardTitle>
                    <div className="text-2xl font-['Fraunces'] font-bold mb-2">{plan.name}</div>
                    <div className="text-4xl font-['Fraunces'] font-bold text-slate-800 mb-2">
                      {plan.price}
                    </div>
                    <div className="text-sm text-slate-600">{plan.period}</div>
                    <div className="text-sm text-slate-600 mt-4">{plan.description}</div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Button 
                    className={`w-full mb-6 ${plan.popular ? 'bg-teal-600 hover:bg-teal-700' : 'bg-slate-800 hover:bg-slate-700'}`}
                    onClick={() => base44.auth.redirectToLogin()}
                  >
                    {plan.cta}
                  </Button>
                  <div className="space-y-3">
                    {plan.features.map((feature) => (
                      <div key={feature} className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-slate-700">{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-['Fraunces'] font-bold text-slate-800 mb-8 text-center">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-2">Is there a free trial?</h3>
                <p className="text-slate-600">
                  Yes! All plans include a 14-day free trial with full access to all features. No credit card required.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-2">Can I change plans later?</h3>
                <p className="text-slate-600">
                  Absolutely. You can upgrade or downgrade your plan at any time. Changes take effect on your next billing cycle.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-2">What payment methods do you accept?</h3>
                <p className="text-slate-600">
                  We accept all major credit cards and can arrange invoice billing for Enterprise customers.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-2">Is my data secure?</h3>
                <p className="text-slate-600">
                  Yes. We use bank-level encryption and comply with Australian data privacy regulations. Your data is stored in Australia.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}