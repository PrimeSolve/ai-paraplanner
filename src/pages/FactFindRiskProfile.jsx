import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '../utils';
import FactFindLayout from '../components/factfind/FactFindLayout';
import FactFindHeader from '../components/factfind/FactFindHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { ArrowRight, ArrowLeft, MessageSquare, RefreshCw, Info, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

const tabs = [
  { id: 'questionnaire', label: 'Risk profile questionnaire', icon: '📋' },
  { id: 'additional', label: 'Risk profile – Additional information', icon: '💬' }
];

const riskProfiles = [
  { value: 'cash', label: 'Cash', growth: 0, defensive: 100 },
  { value: 'conservative', label: 'Conservative', growth: 30, defensive: 70 },
  { value: 'moderately_conservative', label: 'Moderately Conservative', growth: 50, defensive: 50 },
  { value: 'balanced', label: 'Balanced', growth: 70, defensive: 30 },
  { value: 'growth', label: 'Growth', growth: 85, defensive: 15 },
  { value: 'high_growth', label: 'High Growth', growth: 98, defensive: 2 }
];

const questions = [
  {
    id: 'q1',
    text: 'Accessibility of your funds – desired liquidity',
    subtext: 'Based on your stated goals, how long can these funds remain invested before you will need access?',
    options: [
      { label: 'Less than one year', score: 1 },
      { label: '1 – 3 years', score: 2 },
      { label: '3 to 5 years', score: 3 },
      { label: 'More than 5 years', score: 4 }
    ]
  },
  {
    id: 'q2',
    text: 'Your desired rate of return',
    subtext: 'What annual rate of return do you expect your investments to achieve to meet your goals?',
    options: [
      { label: 'Less than 5%', score: 1 },
      { label: '5% – 10%', score: 2 },
      { label: 'More than 10%', score: 3 }
    ]
  },
  {
    id: 'q3',
    text: 'Your attitude to capital risk',
    subtext: 'Which statement best describes how you feel about potential losses on your investments?',
    options: [
      { label: 'The safety of my capital is most important. I am happy with lower returns to avoid significant losses.', score: 1 },
      { label: 'I prefer my capital to remain relatively stable, but it must also meet my income needs.', score: 2 },
      { label: 'I understand values may fluctuate and accept this as the price for potentially higher long-term returns.', score: 3 },
      { label: 'I am comfortable with a high degree of risk to pursue higher returns.', score: 4 }
    ]
  },
  {
    id: 'q4',
    text: 'Your concerns about inflation',
    subtext: 'How worried are you that inflation will erode the purchasing power of your savings and investments?',
    options: [
      { label: 'Not concerned', score: 1 },
      { label: 'Slightly concerned', score: 2 },
      { label: 'Moderately concerned', score: 3 },
      { label: 'Very concerned', score: 4 },
      { label: 'Highly concerned', score: 5 }
    ]
  },
  {
    id: 'q5',
    text: 'Your concerns about legislative risk',
    subtext: 'Would you rearrange your affairs to qualify for government benefits or tax advantages, knowing legislation may later change?',
    options: [
      { label: 'Not if there is any chance I would be worse off.', score: 1 },
      { label: 'I would consider it only if the chance of being worse off is small.', score: 2 },
      { label: 'If changes are being considered, I would rearrange things to safeguard my financial position.', score: 3 },
      { label: 'If I can be better off now, I would rearrange my affairs regardless of potential future changes.', score: 4 }
    ]
  },
  {
    id: 'q6',
    text: 'Your investment knowledge & experience',
    subtext: 'How familiar are you with investment markets and how different asset classes behave?',
    options: [
      { label: 'No experience at all.', score: 1 },
      { label: 'Not very familiar.', score: 2 },
      { label: 'I understand markets fluctuate and different sectors have different income, growth and tax characteristics. I value diversification.', score: 3 },
      { label: 'Experienced with all investment sectors and the factors that influence performance.', score: 4 }
    ]
  },
  {
    id: 'q7',
    text: 'Your concern about volatility',
    subtext: 'What is the maximum fall in portfolio value you would tolerate in any single 12-month period?',
    options: [
      { label: '0%', score: 1 },
      { label: '1% to 15%', score: 2 },
      { label: '16% to 20%', score: 3 },
      { label: 'More than 20%', score: 4 }
    ]
  },
  {
    id: 'q8',
    text: 'Your investment preferences – asset allocation',
    subtext: 'Which of the following best describes your preference for growth versus stability?',
    options: [
      { label: 'I would only select investments that have a low degree of risk.', score: 1 },
      { label: 'I prefer mostly low-risk investments but am willing to have a small higher-risk component to marginally improve returns. I accept a negative return roughly once every nine years.', score: 2 },
      { label: 'I prefer a balanced spread of investments and accept a negative return roughly once every seven years.', score: 3 },
      { label: 'I prefer a diversified portfolio with an emphasis on higher returns, keeping a small low-risk allocation. I accept a negative return roughly once every five years.', score: 4 },
      { label: 'I prefer higher-risk investments aiming for higher returns and accept a negative return roughly once every three years.', score: 5 }
    ]
  }
];

export default function FactFindRiskProfile() {
  const navigate = useNavigate();
  const [factFind, setFactFind] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('questionnaire');
  const [activeOwner, setActiveOwner] = useState('client');
  const [mode, setMode] = useState('calculate');

  const [answers, setAnswers] = useState({
    client: {},
    partner: {}
  });

  const [calculatedScore, setCalculatedScore] = useState({
    client: 0,
    partner: 0
  });

  const [calculatedProfile, setCalculatedProfile] = useState({
    client: '',
    partner: ''
  });

  const [manualProfile, setManualProfile] = useState({
    client: '',
    partner: ''
  });

  const [additionalInfo, setAdditionalInfo] = useState({
    adviser_comments: '',
    client_comments: '',
    adjust_risk_profile: 'no',
    adjusted_profile: '',
    adjustment_reason: ''
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const id = params.get('id');

        if (id) {
          const finds = await base44.entities.FactFind.filter({ id });
          if (finds[0]) {
            setFactFind(finds[0]);
            if (finds[0].risk_profile) {
              const data = finds[0].risk_profile;
              if (data.answers) setAnswers(data.answers);
              if (data.calculated_score) setCalculatedScore(data.calculated_score);
              if (data.calculated_profile) setCalculatedProfile(data.calculated_profile);
              if (data.manual_profile) setManualProfile(data.manual_profile);
              if (data.additional_info) setAdditionalInfo(data.additional_info);
              if (data.mode) setMode(data.mode);
            }
          }
        }
      } catch (error) {
        console.error('Error loading fact find:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const calculateRiskScore = (owner) => {
    const ownerAnswers = answers[owner];
    let totalScore = 0;
    let answeredCount = 0;

    questions.forEach(q => {
      const answer = ownerAnswers[q.id];
      if (answer !== undefined) {
        const option = q.options[answer];
        if (option) {
          totalScore += option.score;
          answeredCount++;
        }
      }
    });

    if (answeredCount === 0) return 0;
    
    const avgScore = totalScore / answeredCount;
    
    let profile = '';
    if (avgScore <= 1.5) profile = 'cash';
    else if (avgScore <= 2.0) profile = 'conservative';
    else if (avgScore <= 2.5) profile = 'moderately_conservative';
    else if (avgScore <= 3.0) profile = 'balanced';
    else if (avgScore <= 3.5) profile = 'growth';
    else profile = 'high_growth';

    setCalculatedScore({ ...calculatedScore, [owner]: Math.round(avgScore * 10) });
    setCalculatedProfile({ ...calculatedProfile, [owner]: profile });
  };

  const resetQuiz = (owner) => {
    setAnswers({ ...answers, [owner]: {} });
    setCalculatedScore({ ...calculatedScore, [owner]: 0 });
    setCalculatedProfile({ ...calculatedProfile, [owner]: '' });
  };

  const handleNext = async () => {
    setSaving(true);
    try {
      const sectionsCompleted = factFind.sections_completed || [];
      if (!sectionsCompleted.includes('risk_profile')) {
        sectionsCompleted.push('risk_profile');
      }

      await base44.entities.FactFind.update(factFind.id, {
        risk_profile: {
          mode,
          answers,
          calculated_score: calculatedScore,
          calculated_profile: calculatedProfile,
          manual_profile: manualProfile,
          additional_info: additionalInfo
        },
        current_section: 'review',
        sections_completed: sectionsCompleted,
        completion_percentage: Math.round((sectionsCompleted.length / 14) * 100)
      });

      navigate(createPageUrl('FactFindReview') + `?id=${factFind.id}`);
    } catch (error) {
      toast.error('Failed to save data');
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    navigate(createPageUrl('FactFindAdviceReason') + `?id=${factFind?.id || ''}`);
  };

  if (loading) {
    return (
      <FactFindLayout currentSection="risk_profile" factFind={factFind}>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </FactFindLayout>
    );
  }

  const selectedProfile = mode === 'calculate' 
    ? riskProfiles.find(p => p.value === calculatedProfile[activeOwner])
    : riskProfiles.find(p => p.value === manualProfile[activeOwner]);

  return (
    <FactFindLayout currentSection="risk_profile" factFind={factFind}>
      <FactFindHeader
        title="Risk Profile"
        description="Your attitude to investing and additional information."
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        factFind={factFind}
      />

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
        <div className="w-full space-y-4">
          {activeTab === 'questionnaire' ? (
            <>
              {/* Info Card */}
              <Card className="border-slate-200 shadow-sm bg-gradient-to-r from-blue-50 to-indigo-50">
                <CardContent className="p-6">
                  <div className="flex gap-3">
                    <div className="text-3xl">🔑</div>
                    <div>
                      <h4 className="font-bold text-slate-800 mb-2">Risk Profiler – Your attitude to investing</h4>
                      <p className="text-sm text-slate-600 leading-relaxed">
                        This questionnaire helps estimate tolerance to risk and align it with a suitable investment profile. 
                        It should be read alongside your broader goals, cashflow needs and overall financial position.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Mode Selection */}
              <Card className="border-slate-200 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <Label className="font-bold text-slate-800">Risk profile</Label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setMode('calculate')}
                        className={cn(
                          "px-4 py-2 rounded-lg text-sm font-bold border transition-all",
                          mode === 'calculate'
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50"
                        )}
                      >
                        Calculate
                      </button>
                      <button
                        onClick={() => setMode('specify')}
                        className={cn(
                          "px-4 py-2 rounded-lg text-sm font-bold border transition-all",
                          mode === 'specify'
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50"
                        )}
                      >
                        Specify risk profile
                      </button>
                    </div>
                  </div>

                  {mode === 'specify' && (
                    <div className="mt-4 space-y-3">
                      <div>
                        <Label className="text-slate-700 font-semibold text-sm mb-2 block">Applies to:</Label>
                        <div className="flex gap-2">
                          {['client', 'partner'].map(owner => (
                            <button
                              key={owner}
                              onClick={() => setActiveOwner(owner)}
                              className={cn(
                                "px-3 py-1.5 rounded-full text-xs font-bold border transition-all capitalize",
                                activeOwner === owner
                                  ? "bg-blue-600 text-white border-blue-600"
                                  : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50"
                              )}
                            >
                              {owner}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <Label className="text-slate-700 font-semibold text-sm mb-2 block">Select risk profile</Label>
                        <Select
                          value={manualProfile[activeOwner]}
                          onValueChange={(value) => setManualProfile({ ...manualProfile, [activeOwner]: value })}
                        >
                          <SelectTrigger className="border-slate-300">
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                          <SelectContent>
                            {riskProfiles.map(profile => (
                              <SelectItem key={profile.value} value={profile.value}>
                                {profile.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {mode === 'calculate' && (
                <>
                  {/* Owner Selection */}
                  <div className="flex items-center justify-between bg-slate-100 border border-slate-200 rounded-lg px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-slate-800 text-sm">Applies to:</span>
                      <div className="flex gap-2">
                        {['client', 'partner'].map(owner => (
                          <button
                            key={owner}
                            onClick={() => setActiveOwner(owner)}
                            className={cn(
                              "px-3 py-1.5 rounded-full text-xs font-bold border transition-all capitalize",
                              activeOwner === owner
                                ? "bg-blue-600 text-white border-blue-600"
                                : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50"
                            )}
                          >
                            {owner}
                          </button>
                        ))}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => resetQuiz(activeOwner)}
                      className="border-slate-300"
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Refresh Quiz
                    </Button>
                  </div>

                  {/* Questions */}
                  {questions.map((question, qIndex) => (
                    <Card key={question.id} className="border-slate-200 shadow-sm">
                      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-3 rounded-t-lg">
                        <h4 className="font-bold text-white">Q{qIndex + 1}</h4>
                      </div>
                      <CardContent className="p-6 space-y-3">
                        <div>
                          <h5 className="font-bold text-slate-800 mb-1">{question.text}</h5>
                          <p className="text-sm text-slate-600">{question.subtext}</p>
                        </div>
                        <div className="space-y-2">
                          {question.options.map((option, optIndex) => (
                            <button
                              key={optIndex}
                              onClick={() => setAnswers({
                                ...answers,
                                [activeOwner]: { ...answers[activeOwner], [question.id]: optIndex }
                              })}
                              className={cn(
                                "w-full text-left px-4 py-3 rounded-lg border-2 transition-all text-sm",
                                answers[activeOwner]?.[question.id] === optIndex
                                  ? "bg-blue-50 border-blue-600 font-semibold"
                                  : "bg-white border-slate-200 hover:border-slate-300"
                              )}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {/* Calculate Button */}
                  <Card className="border-slate-200 shadow-sm">
                    <CardContent className="p-6 text-center">
                      <Button
                        onClick={() => calculateRiskScore(activeOwner)}
                        className="bg-green-600 hover:bg-green-700 text-white"
                        size="lg"
                      >
                        Calculate risk profile ({activeOwner})
                      </Button>
                    </CardContent>
                  </Card>
                </>
              )}

              {/* Results */}
              {((mode === 'calculate' && calculatedProfile[activeOwner]) || (mode === 'specify' && manualProfile[activeOwner])) && (
                <Card className="border-slate-200 shadow-sm">
                  <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-6 py-3">
                    <h4 className="font-bold text-white">Risk Profile Result</h4>
                  </div>
                  <CardContent className="p-6 space-y-4">
                    {mode === 'calculate' && (
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                          <div className="text-xs text-slate-500 mb-1">Risk Score</div>
                          <div className="text-3xl font-bold text-blue-600">{calculatedScore[activeOwner]}</div>
                        </div>
                        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                          <div className="text-xs text-slate-500 mb-1">Profile</div>
                          <div className="text-2xl font-bold text-slate-800 capitalize">
                            {calculatedProfile[activeOwner]?.replace('_', ' ')}
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedProfile && (
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
                        <h5 className="font-bold text-slate-800 text-lg mb-2">{selectedProfile.label}</h5>
                        <div className="text-sm text-slate-600 mb-3">
                          Growth {selectedProfile.growth}% / Defensive {selectedProfile.defensive}%
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-green-500 to-emerald-600 h-full transition-all"
                            style={{ width: `${selectedProfile.growth}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <>
              {/* Additional Information */}
              <Card className="border-slate-200 shadow-sm">
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3 rounded-t-lg">
                  <h4 className="font-bold text-white">Comments & calculated profile</h4>
                </div>
                <CardContent className="p-6 space-y-4">
                  <div className="space-y-2">
                    <Label className="text-slate-700 font-semibold text-sm">Adviser comments</Label>
                    <Textarea
                      value={additionalInfo.adviser_comments}
                      onChange={(e) => setAdditionalInfo({ ...additionalInfo, adviser_comments: e.target.value })}
                      placeholder="Enter adviser comments"
                      className="border-slate-300 min-h-[100px]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-700 font-semibold text-sm">Client comments</Label>
                    <Textarea
                      value={additionalInfo.client_comments}
                      onChange={(e) => setAdditionalInfo({ ...additionalInfo, client_comments: e.target.value })}
                      placeholder="Enter client comments"
                      className="border-slate-300 min-h-[100px]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-700 font-semibold text-sm">Adjust risk profile?</Label>
                    <Select
                      value={additionalInfo.adjust_risk_profile}
                      onValueChange={(value) => setAdditionalInfo({ ...additionalInfo, adjust_risk_profile: value })}
                    >
                      <SelectTrigger className="border-slate-300">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {additionalInfo.adjust_risk_profile === 'yes' && (
                    <>
                      <div className="space-y-2">
                        <Label className="text-slate-700 font-semibold text-sm">Select adjusted risk profile</Label>
                        <Select
                          value={additionalInfo.adjusted_profile}
                          onValueChange={(value) => setAdditionalInfo({ ...additionalInfo, adjusted_profile: value })}
                        >
                          <SelectTrigger className="border-slate-300">
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                          <SelectContent>
                            {riskProfiles.map(profile => (
                              <SelectItem key={profile.value} value={profile.value}>
                                {profile.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-slate-700 font-semibold text-sm">Reason for adjustment</Label>
                        <Textarea
                          value={additionalInfo.adjustment_reason}
                          onChange={(e) => setAdditionalInfo({ ...additionalInfo, adjustment_reason: e.target.value })}
                          placeholder="Explain why the risk profile is being adjusted"
                          className="border-slate-300 min-h-[100px]"
                        />
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {/* Navigation */}
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <Button
                  onClick={handleBack}
                  variant="outline"
                  disabled={saving}
                  className="border-slate-300 text-slate-700 hover:bg-slate-50"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>

                <Button
                  onClick={handleNext}
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/30"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </FactFindLayout>
  );
}