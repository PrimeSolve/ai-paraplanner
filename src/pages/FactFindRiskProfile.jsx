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
import { ArrowRight, ArrowLeft, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

const tabs = [
  { id: 'questionnaire', label: 'Risk profile questionnaire', icon: '📋' },
  { id: 'info', label: 'Risk profile – Additional information', icon: '💬' }
];

const PROFILE_VALUES = [
  { value: '2301', label: 'Cash' },
  { value: '2382', label: 'Conservative' },
  { value: '2383', label: 'Moderately Conservative' },
  { value: '2384', label: 'Balanced' },
  { value: '2385', label: 'Growth' },
  { value: '2386', label: 'High Growth' }
];

const PROFILE_DISPLAY = {
  '2301': 'Cash Management',
  '2382': 'Conservative',
  '2383': 'Moderately Conservative',
  '2384': 'Balanced',
  '2385': 'Growth',
  '2386': 'High Growth'
};

const ASSET_ALLOCATIONS = {
  'Cash Management': { growth: 0, defensive: 100 },
  'Conservative': { growth: 30, defensive: 70 },
  'Moderately Conservative': { growth: 50, defensive: 50 },
  'Balanced': { growth: 70, defensive: 30 },
  'Growth': { growth: 85, defensive: 15 },
  'High Growth': { growth: 98, defensive: 2 }
};

const questions = [
  {
    id: 'q1',
    text: 'Accessibility of your funds – desired liquidity',
    subtext: 'Based on your stated goals, how long can these funds remain invested before you will need access?',
    options: [
      { label: 'Less than one year', value: '1' },
      { label: '1 – 3 years', value: '2' },
      { label: '3 to 5 years', value: '3' },
      { label: 'More than 5 years', value: '4' }
    ]
  },
  {
    id: 'q2',
    text: 'Your desired rate of return',
    subtext: 'What annual rate of return do you expect your investments to achieve to meet your goals?',
    options: [
      { label: 'Less than 5%', value: '1' },
      { label: '5% – 10%', value: '2' },
      { label: 'More than 10%', value: '3' }
    ]
  },
  {
    id: 'q3',
    text: 'Your attitude to capital risk',
    subtext: 'Which statement best describes how you feel about potential losses on your investments?',
    options: [
      { label: 'The safety of my capital is most important. I am happy with lower returns to avoid significant losses.', value: '1' },
      { label: 'I prefer my capital to remain relatively stable, but it must also meet my income needs.', value: '2' },
      { label: 'I understand values may fluctuate and accept this as the price for potentially higher long-term returns.', value: '3' },
      { label: 'I am comfortable with a high degree of risk to pursue higher returns.', value: '4' }
    ]
  },
  {
    id: 'q4',
    text: 'Your concerns about inflation',
    subtext: 'How worried are you that inflation will erode the purchasing power of your savings and investments?',
    options: [
      { label: 'Not concerned', value: '1' },
      { label: 'Slightly concerned', value: '2' },
      { label: 'Moderately concerned', value: '3' },
      { label: 'Very concerned', value: '4' },
      { label: 'Highly concerned', value: '5' }
    ]
  },
  {
    id: 'q5',
    text: 'Your concerns about legislative risk',
    subtext: 'Would you rearrange your affairs to qualify for government benefits or tax advantages, knowing legislation may later change?',
    options: [
      { label: 'Not if there is any chance I would be worse off.', value: '1' },
      { label: 'I would consider it only if the chance of being worse off is small.', value: '2' },
      { label: 'If changes are being considered, I would rearrange things to safeguard my financial position.', value: '3' },
      { label: 'If I can be better off now, I would rearrange my affairs regardless of potential future changes.', value: '4' }
    ]
  },
  {
    id: 'q6',
    text: 'Your investment knowledge & experience',
    subtext: 'How familiar are you with investment markets and how different asset classes behave?',
    options: [
      { label: 'No experience at all.', value: '1' },
      { label: 'Not very familiar.', value: '2' },
      { label: 'I understand markets fluctuate and different sectors have different income, growth and tax characteristics. I value diversification.', value: '3' },
      { label: 'Experienced with all investment sectors and the factors that influence performance.', value: '4' }
    ]
  },
  {
    id: 'q7',
    text: 'Your concern about volatility',
    subtext: 'What is the maximum fall in portfolio value you would tolerate in any single 12-month period?',
    options: [
      { label: '0%', value: '1' },
      { label: '1% to 15%', value: '2' },
      { label: '16% to 20%', value: '3' },
      { label: 'More than 20%', value: '4' }
    ]
  },
  {
    id: 'q8',
    text: 'Your investment preferences – asset allocation',
    subtext: 'Which of the following best describes your preference for growth versus stability?',
    options: [
      { label: 'I would only select investments that have a low degree of risk.', value: '2' },
      { label: 'I prefer mostly low-risk investments but am willing to have a small higher-risk component to marginally improve returns. I accept a negative return roughly once every nine years.', value: '4' },
      { label: 'I prefer a balanced spread of investments and accept a negative return roughly once every seven years.', value: '6' },
      { label: 'I prefer a diversified portfolio with an emphasis on higher returns, keeping a small low-risk allocation. I accept a negative return roughly once every five years.', value: '8' },
      { label: 'I prefer higher-risk investments aiming for higher returns and accept a negative return roughly once every three years.', value: '10' }
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
  const [mode, setMode] = useState('');
  const [specifiedProfile, setSpecifiedProfile] = useState('');
  const [adjustRisk, setAdjustRisk] = useState('no');

  const [clientData, setClientData] = useState({
    answers: {},
    score: 0,
    profile: '',
    adviserComments: '',
    clientComments: '',
    adjustedProfile: '',
    adjustmentReason: ''
  });

  const [partnerData, setPartnerData] = useState({
    answers: {},
    score: 0,
    profile: '',
    adviserComments: '',
    clientComments: '',
    adjustedProfile: '',
    adjustmentReason: ''
  });

  const [otherInfo, setOtherInfo] = useState({
    esg: '',
    restrictions: '',
    experience: '',
    notes: ''
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
            if (finds[0].riskProfile) {
              const data = finds[0].riskProfile;
              if (data.mode) setMode(data.mode);
              if (data.specifiedProfile) setSpecifiedProfile(data.specifiedProfile);
              if (data.adjustRisk) setAdjustRisk(data.adjustRisk);
              if (data.client) setClientData(data.client);
              if (data.partner) setPartnerData(data.partner);
              if (data.otherInfo) setOtherInfo(data.otherInfo);
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

  const currentData = activeOwner === 'client' ? clientData : partnerData;
  const setCurrentData = activeOwner === 'client' ? setClientData : setPartnerData;

  const calculateRiskScore = () => {
    const answers = currentData.answers;
    let totalScore = 0;
    let answeredCount = 0;

    questions.forEach(q => {
      const answer = answers[q.id];
      if (answer) {
        totalScore += parseInt(answer);
        answeredCount++;
      }
    });

    if (answeredCount === 0) return;

    let profile = '';
    if (totalScore <= 15) profile = 'Cash Management';
    else if (totalScore <= 20) profile = 'Conservative';
    else if (totalScore <= 25) profile = 'Moderately Conservative';
    else if (totalScore <= 30) profile = 'Balanced';
    else if (totalScore <= 35) profile = 'Growth';
    else profile = 'High Growth';

    setCurrentData({ ...currentData, score: totalScore, profile });
  };

  const resetQuiz = () => {
    setCurrentData({
      ...currentData,
      answers: {},
      score: 0,
      profile: ''
    });
  };

  const handleNext = async () => {
    setSaving(true);
    try {
      const sectionsCompleted = factFind.sections_completed || [];
      if (!sectionsCompleted.includes('risk_profile')) {
        sectionsCompleted.push('risk_profile');
      }

      await base44.entities.FactFind.update(factFind.id, {
        riskProfile: {
          currentPerson: activeOwner,
          currentTab: activeTab,
          mode,
          specifiedProfile,
          adjustRisk,
          client: clientData,
          partner: partnerData,
          otherInfo,
          completionPct: 0
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

  const selectedProfileAllocation = mode === 'specify' 
    ? ASSET_ALLOCATIONS[PROFILE_DISPLAY[specifiedProfile]]
    : ASSET_ALLOCATIONS[currentData.profile];

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

      <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
        <div className="w-full space-y-4">
          {activeTab === 'questionnaire' ? (
            <>
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
                        <Label className="text-slate-700 font-semibold text-sm mb-2 block">Select risk profile</Label>
                        <Select
                          value={specifiedProfile}
                          onValueChange={setSpecifiedProfile}
                        >
                          <SelectTrigger className="border-slate-300">
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                          <SelectContent>
                            {PROFILE_VALUES.map(profile => (
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
                      onClick={resetQuiz}
                      className="border-slate-300"
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Refresh Quiz
                    </Button>
                  </div>

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
                          {question.options.map((option) => (
                            <button
                              key={option.value}
                              onClick={() => setCurrentData({
                                ...currentData,
                                answers: { ...currentData.answers, [question.id]: option.value }
                              })}
                              className={cn(
                                "w-full text-left px-4 py-3 rounded-lg border-2 transition-all text-sm",
                                currentData.answers[question.id] === option.value
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

                  <Card className="border-slate-200 shadow-sm">
                    <CardContent className="p-6 text-center">
                      <Button
                        onClick={calculateRiskScore}
                        className="bg-green-600 hover:bg-green-700 text-white"
                        size="lg"
                      >
                        Calculate risk profile ({activeOwner})
                      </Button>
                    </CardContent>
                  </Card>
                </>
              )}

              {((mode === 'calculate' && currentData.profile) || (mode === 'specify' && specifiedProfile)) && (
                <Card className="border-slate-200 shadow-sm">
                  <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-6 py-3">
                    <h4 className="font-bold text-white">Risk Profile Result</h4>
                  </div>
                  <CardContent className="p-6 space-y-4">
                    {mode === 'calculate' && (
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                          <div className="text-xs text-slate-500 mb-1">Risk Score</div>
                          <div className="text-3xl font-bold text-blue-600">{currentData.score}</div>
                        </div>
                        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                          <div className="text-xs text-slate-500 mb-1">Profile</div>
                          <div className="text-2xl font-bold text-slate-800">
                            {currentData.profile}
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedProfileAllocation && (
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
                        <h5 className="font-bold text-slate-800 text-lg mb-2">
                          {mode === 'specify' ? PROFILE_DISPLAY[specifiedProfile] : currentData.profile}
                        </h5>
                        <div className="text-sm text-slate-600 mb-3">
                          Growth {selectedProfileAllocation.growth}% / Defensive {selectedProfileAllocation.defensive}%
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-green-500 to-emerald-600 h-full transition-all"
                            style={{ width: `${selectedProfileAllocation.growth}%` }}
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
              <Card className="border-slate-200 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActiveOwner('client')}
                      className={cn(
                        "px-4 py-2 rounded-full text-sm font-bold transition-all",
                        activeOwner === 'client'
                          ? "bg-blue-600 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      )}
                    >
                      Client
                    </button>
                    <button
                      onClick={() => setActiveOwner('partner')}
                      className={cn(
                        "px-4 py-2 rounded-full text-sm font-bold transition-all",
                        activeOwner === 'partner'
                          ? "bg-blue-600 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      )}
                    >
                      Partner
                    </button>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200 shadow-sm">
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3 rounded-t-lg">
                  <h4 className="font-bold text-white">Comments & calculated profile - {activeOwner}</h4>
                </div>
                <CardContent className="p-6 space-y-4">
                  <div className="space-y-2">
                    <Label className="text-slate-700 font-semibold text-sm">Adviser comments</Label>
                    <Textarea
                      value={currentData.adviserComments}
                      onChange={(e) => setCurrentData({ ...currentData, adviserComments: e.target.value })}
                      placeholder="Enter adviser comments"
                      className="border-slate-300 min-h-[100px]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-700 font-semibold text-sm">Client comments</Label>
                    <Textarea
                      value={currentData.clientComments}
                      onChange={(e) => setCurrentData({ ...currentData, clientComments: e.target.value })}
                      placeholder="Enter client comments"
                      className="border-slate-300 min-h-[100px]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-700 font-semibold text-sm">Adjust risk profile?</Label>
                    <Select
                      value={adjustRisk}
                      onValueChange={setAdjustRisk}
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

                  {adjustRisk === 'yes' && (
                    <>
                      <div className="space-y-2">
                        <Label className="text-slate-700 font-semibold text-sm">Select adjusted risk profile</Label>
                        <Select
                          value={currentData.adjustedProfile}
                          onValueChange={(value) => setCurrentData({ ...currentData, adjustedProfile: value })}
                        >
                          <SelectTrigger className="border-slate-300">
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                          <SelectContent>
                            {PROFILE_VALUES.map(profile => (
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
                          value={currentData.adjustmentReason}
                          onChange={(e) => setCurrentData({ ...currentData, adjustmentReason: e.target.value })}
                          placeholder="Explain why the risk profile is being adjusted"
                          className="border-slate-300 min-h-[100px]"
                        />
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card className="border-slate-200 shadow-sm">
                <div className="bg-gradient-to-r from-slate-600 to-slate-700 px-6 py-3 rounded-t-lg">
                  <h4 className="font-bold text-white">Other Information</h4>
                </div>
                <CardContent className="p-6 space-y-4">
                  <div className="space-y-2">
                    <Label className="text-slate-700 font-semibold text-sm">ESG preferences</Label>
                    <Textarea
                      value={otherInfo.esg}
                      onChange={(e) => setOtherInfo({ ...otherInfo, esg: e.target.value })}
                      placeholder="Environmental, Social, Governance considerations"
                      className="border-slate-300"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-700 font-semibold text-sm">Investment restrictions</Label>
                    <Textarea
                      value={otherInfo.restrictions}
                      onChange={(e) => setOtherInfo({ ...otherInfo, restrictions: e.target.value })}
                      placeholder="Any restrictions on investments"
                      className="border-slate-300"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-700 font-semibold text-sm">Prior investment experience</Label>
                    <Textarea
                      value={otherInfo.experience}
                      onChange={(e) => setOtherInfo({ ...otherInfo, experience: e.target.value })}
                      placeholder="Details of past investment experience"
                      className="border-slate-300"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-700 font-semibold text-sm">Additional notes</Label>
                    <Textarea
                      value={otherInfo.notes}
                      onChange={(e) => setOtherInfo({ ...otherInfo, notes: e.target.value })}
                      placeholder="Any other relevant information"
                      className="border-slate-300"
                    />
                  </div>
                </CardContent>
              </Card>
            </>
          )}

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