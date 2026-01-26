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
  'Cash Management': { 
    growth: 0, 
    defensive: 100,
    details: {
      "Australian equities": 0.0,
      "International equities": 0.0,
      "Property & infrastructure": 0.0,
      "Alternatives": 0.0,
      "Australian fixed interest": 0.0,
      "International fixed interest": 0.0,
      "Cash": 100.0
    }
  },
  'Conservative': { 
    growth: 30, 
    defensive: 70,
    details: {
      "Australian equities": 13.0,
      "International equities": 13.0,
      "Property & infrastructure": 4.0,
      "Alternatives": 0.0,
      "Australian fixed interest": 35.0,
      "International fixed interest": 15.0,
      "Cash": 20.0
    }
  },
  'Moderately Conservative': { 
    growth: 50, 
    defensive: 50,
    details: {
      "Australian equities": 22.5,
      "International equities": 22.5,
      "Property & infrastructure": 5.0,
      "Alternatives": 0.0,
      "Australian fixed interest": 25.0,
      "International fixed interest": 10.0,
      "Cash": 15.0
    }
  },
  'Balanced': { 
    growth: 70, 
    defensive: 30,
    details: {
      "Australian equities": 31.5,
      "International equities": 31.5,
      "Property & infrastructure": 7.0,
      "Alternatives": 0.0,
      "Australian fixed interest": 14.0,
      "International fixed interest": 7.0,
      "Cash": 9.0
    }
  },
  'Growth': { 
    growth: 85, 
    defensive: 15,
    details: {
      "Australian equities": 39.0,
      "International equities": 39.0,
      "Property & infrastructure": 7.0,
      "Alternatives": 0.0,
      "Australian fixed interest": 7.5,
      "International fixed interest": 4.5,
      "Cash": 3.0
    }
  },
  'High Growth': { 
    growth: 98, 
    defensive: 2,
    details: {
      "Australian equities": 45.0,
      "International equities": 45.0,
      "Property & infrastructure": 8.0,
      "Alternatives": 0.0,
      "Australian fixed interest": 1.5,
      "International fixed interest": 0.5,
      "Cash": 0.0
    }
  }
};

const PROFILE_DEFINITIONS = [
  {
    name: 'Cash Management',
    growth: 0,
    defensive: 100,
    description: 'Suitable for investors with short-term goals or those who cannot tolerate any capital loss. This profile invests entirely in cash and cash equivalents.'
  },
  {
    name: 'Conservative',
    growth: 30,
    defensive: 70,
    description: 'Suitable for investors seeking stable returns with minimal volatility. A small allocation to growth assets provides some inflation protection while maintaining capital stability.'
  },
  {
    name: 'Moderately Conservative',
    growth: 50,
    defensive: 50,
    description: 'Balanced between growth and defensive assets. Suitable for investors who can tolerate moderate volatility in exchange for potentially higher long-term returns.'
  },
  {
    name: 'Balanced',
    growth: 70,
    defensive: 30,
    description: 'Emphasizes growth assets while maintaining a defensive component. Suitable for investors with medium to long-term horizons who can tolerate regular market fluctuations.'
  },
  {
    name: 'Growth',
    growth: 85,
    defensive: 15,
    description: 'Focuses on long-term capital growth through significant exposure to growth assets. Suitable for investors with long time horizons who can tolerate significant short-term volatility.'
  },
  {
    name: 'High Growth',
    growth: 98,
    defensive: 2,
    description: 'Maximum exposure to growth assets for long-term capital appreciation. Suitable for experienced investors with very long time horizons who can accept substantial short-term losses.'
  }
];

const HISTORICAL_RETURNS = {
  'Cash Management': {
    annualReturn: 3.3,
    realReturn: 1.9,
    worstYear: 0.0,
    bestYear: 7.8,
    negativeChance: "0",
    negativeProbability: 0.0
  },
  'Conservative': {
    annualReturn: 5.8,
    realReturn: 3.4,
    worstYear: -4.2,
    bestYear: 18.5,
    negativeChance: "1 in 9",
    negativeProbability: 11.1
  },
  'Moderately Conservative': {
    annualReturn: 7.2,
    realReturn: 4.8,
    worstYear: -8.6,
    bestYear: 25.3,
    negativeChance: "1 in 7",
    negativeProbability: 14.3
  },
  'Balanced': {
    annualReturn: 8.5,
    realReturn: 6.1,
    worstYear: -13.1,
    bestYear: 32.8,
    negativeChance: "1 in 5",
    negativeProbability: 20.0
  },
  'Growth': {
    annualReturn: 9.3,
    realReturn: 6.9,
    worstYear: -16.8,
    bestYear: 38.2,
    negativeChance: "1 in 4",
    negativeProbability: 25.0
  },
  'High Growth': {
    annualReturn: 9.8,
    realReturn: 7.4,
    worstYear: -19.4,
    bestYear: 42.1,
    negativeChance: "1 in 3",
    negativeProbability: 33.3
  }
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
  const [adjustRisk, setAdjustRisk] = useState('no');

  const [clientData, setClientData] = useState({
    answers: {},
    score: 0,
    profile: '',
    specifiedProfile: '',
    adviserComments: '',
    clientComments: '',
    adjustedProfile: '',
    adjustmentReason: ''
  });

  const [partnerData, setPartnerData] = useState({
    answers: {},
    score: 0,
    profile: '',
    specifiedProfile: '',
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
    ? ASSET_ALLOCATIONS[PROFILE_DISPLAY[currentData.specifiedProfile]]
    : ASSET_ALLOCATIONS[currentData.profile];

  const selectedProfileName = mode === 'specify'
    ? PROFILE_DISPLAY[currentData.specifiedProfile]
    : currentData.profile;

  const selectedHistoricalReturns = selectedProfileName ? HISTORICAL_RETURNS[selectedProfileName] : null;

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

                </CardContent>
              </Card>

              {(mode === 'calculate' || mode === 'specify') && (
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
                    {mode === 'calculate' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={resetQuiz}
                        className="border-slate-300"
                      >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Refresh Quiz
                      </Button>
                    )}
                  </div>

                  {mode === 'specify' && (
                    <Card className="border-slate-200 shadow-sm">
                      <CardContent className="p-6">
                        <Label className="text-slate-700 font-semibold text-sm mb-2 block">Select risk profile for {activeOwner}</Label>
                        <Select
                          value={currentData.specifiedProfile}
                          onValueChange={(value) => setCurrentData({ ...currentData, specifiedProfile: value })}
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
                      </CardContent>
                    </Card>
                  )}
                </>
              )}

              {mode === 'calculate' && (
                <>
                  <div className="bg-slate-100 border border-slate-200 rounded-lg px-4 py-3">
                    <span className="font-bold text-slate-800 text-sm">Complete questionnaire for {activeOwner}</span>
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

              {((mode === 'calculate' && currentData.profile) || (mode === 'specify' && currentData.specifiedProfile)) && (
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

                    {/* Profile Pills */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {PROFILE_DEFINITIONS.map(prof => (
                        <div
                          key={prof.name}
                          className={cn(
                            "px-4 py-2 rounded-full text-sm font-bold border-2 transition-all",
                            selectedProfileName === prof.name
                              ? "bg-blue-600 text-white border-blue-600"
                              : "bg-slate-100 text-slate-600 border-slate-200"
                          )}
                        >
                          {prof.name}
                        </div>
                      ))}
                    </div>

                    {selectedProfileAllocation && (
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
                        <h5 className="font-bold text-slate-800 text-lg mb-2">
                          {selectedProfileName}
                        </h5>
                        <div className="text-sm text-slate-600 mb-3">
                          Growth {selectedProfileAllocation.growth}% / Defensive {selectedProfileAllocation.defensive}%
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden mb-4">
                          <div
                            className="bg-gradient-to-r from-green-500 to-emerald-600 h-full transition-all"
                            style={{ width: `${selectedProfileAllocation.growth}%` }}
                          />
                        </div>

                        {/* Asset Allocation Details */}
                        <div className="bg-white rounded-lg p-4 border border-slate-200">
                          <h6 className="font-bold text-slate-800 mb-3">Asset Allocation</h6>
                          <div className="space-y-2">
                            {Object.entries(selectedProfileAllocation.details).map(([asset, percentage]) => (
                              <div key={asset} className="flex justify-between items-center">
                                <span className="text-sm text-slate-700">{asset}</span>
                                <div className="flex items-center gap-3 flex-1 ml-4">
                                  <div className="flex-1 bg-slate-200 rounded-full h-2">
                                    <div
                                      className="bg-blue-600 h-2 rounded-full"
                                      style={{ width: `${percentage}%` }}
                                    />
                                  </div>
                                  <span className="text-sm font-bold text-slate-800 w-12 text-right">{percentage}%</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Historical Returns */}
                    {selectedHistoricalReturns && (
                      <div className="bg-slate-50 rounded-lg p-6 border border-slate-200">
                        <h6 className="font-bold text-slate-800 mb-4">Historical Returns - {selectedProfileName}</h6>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          <div className="bg-white rounded-lg p-3 border border-slate-200">
                            <div className="text-xs text-slate-500 mb-1">Annual Return</div>
                            <div className="text-lg font-bold text-green-600">{selectedHistoricalReturns.annualReturn}%</div>
                          </div>
                          <div className="bg-white rounded-lg p-3 border border-slate-200">
                            <div className="text-xs text-slate-500 mb-1">Real Return</div>
                            <div className="text-lg font-bold text-blue-600">{selectedHistoricalReturns.realReturn}%</div>
                          </div>
                          <div className="bg-white rounded-lg p-3 border border-slate-200">
                            <div className="text-xs text-slate-500 mb-1">Worst Year</div>
                            <div className="text-lg font-bold text-red-600">{selectedHistoricalReturns.worstYear}%</div>
                          </div>
                          <div className="bg-white rounded-lg p-3 border border-slate-200">
                            <div className="text-xs text-slate-500 mb-1">Best Year</div>
                            <div className="text-lg font-bold text-green-600">{selectedHistoricalReturns.bestYear}%</div>
                          </div>
                          <div className="bg-white rounded-lg p-3 border border-slate-200">
                            <div className="text-xs text-slate-500 mb-1">Negative Chance</div>
                            <div className="text-lg font-bold text-orange-600">{selectedHistoricalReturns.negativeChance}</div>
                          </div>
                          <div className="bg-white rounded-lg p-3 border border-slate-200">
                            <div className="text-xs text-slate-500 mb-1">Negative Probability</div>
                            <div className="text-lg font-bold text-orange-600">{selectedHistoricalReturns.negativeProbability}%</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Comments Section - After Results */}
              {((mode === 'calculate' && currentData.profile) || (mode === 'specify' && currentData.specifiedProfile)) && (
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
              )}
            </>
          ) : (
            <>
              {/* Risk Profile Definitions */}
              <div className="grid md:grid-cols-2 gap-4">
                {PROFILE_DEFINITIONS.map((profile) => (
                  <Card key={profile.name} className="border-slate-200 shadow-sm">
                    <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-4 py-2 rounded-t-lg">
                      <h5 className="font-bold text-white text-sm">{profile.name}</h5>
                    </div>
                    <CardContent className="p-4 space-y-3">
                      <div className="text-xs text-slate-600 mb-2">
                        Growth {profile.growth}% / Defensive {profile.defensive}%
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-green-500 to-emerald-600 h-full"
                          style={{ width: `${profile.growth}%` }}
                        />
                      </div>
                      <p className="text-sm text-slate-700 leading-relaxed">{profile.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Portfolio Historical Returns */}
              <Card className="border-slate-200 shadow-sm">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 rounded-t-lg">
                  <h4 className="font-bold text-white">Portfolio Historical Returns</h4>
                </div>
                <CardContent className="p-6">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b-2 border-slate-300">
                          <th className="text-left py-3 px-2 font-bold text-slate-800">Profile</th>
                          <th className="text-right py-3 px-2 font-bold text-slate-800">Annual Return</th>
                          <th className="text-right py-3 px-2 font-bold text-slate-800">Real Return</th>
                          <th className="text-right py-3 px-2 font-bold text-slate-800">Worst Year</th>
                          <th className="text-right py-3 px-2 font-bold text-slate-800">Best Year</th>
                          <th className="text-right py-3 px-2 font-bold text-slate-800">Negative Chance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(HISTORICAL_RETURNS).map(([profileName, returns]) => (
                          <tr key={profileName} className="border-b border-slate-200">
                            <td className="py-3 px-2 font-semibold text-slate-700">{profileName}</td>
                            <td className="text-right py-3 px-2 text-green-600 font-semibold">{returns.annualReturn}%</td>
                            <td className="text-right py-3 px-2 text-blue-600">{returns.realReturn}%</td>
                            <td className="text-right py-3 px-2 text-red-600">{returns.worstYear}%</td>
                            <td className="text-right py-3 px-2 text-green-600">{returns.bestYear}%</td>
                            <td className="text-right py-3 px-2 text-orange-600">{returns.negativeChance}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Asset Classes Historical Returns */}
              <Card className="border-slate-200 shadow-sm">
                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-3 rounded-t-lg">
                  <h4 className="font-bold text-white">Asset Classes Historical Returns</h4>
                </div>
                <CardContent className="p-6">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b-2 border-slate-300">
                          <th className="text-left py-3 px-2 font-bold text-slate-800">Asset Class</th>
                          <th className="text-right py-3 px-2 font-bold text-slate-800">20 Year Avg</th>
                          <th className="text-right py-3 px-2 font-bold text-slate-800">10 Year Avg</th>
                          <th className="text-right py-3 px-2 font-bold text-slate-800">5 Year Avg</th>
                          <th className="text-right py-3 px-2 font-bold text-slate-800">Worst Year</th>
                          <th className="text-right py-3 px-2 font-bold text-slate-800">Best Year</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-slate-200">
                          <td className="py-3 px-2 font-semibold text-slate-700">Australian Shares</td>
                          <td className="text-right py-3 px-2 text-slate-700">9.2%</td>
                          <td className="text-right py-3 px-2 text-slate-700">8.5%</td>
                          <td className="text-right py-3 px-2 text-slate-700">7.8%</td>
                          <td className="text-right py-3 px-2 text-red-600">-22.1%</td>
                          <td className="text-right py-3 px-2 text-green-600">44.5%</td>
                        </tr>
                        <tr className="border-b border-slate-200">
                          <td className="py-3 px-2 font-semibold text-slate-700">Global Shares</td>
                          <td className="text-right py-3 px-2 text-slate-700">10.1%</td>
                          <td className="text-right py-3 px-2 text-slate-700">11.2%</td>
                          <td className="text-right py-3 px-2 text-slate-700">9.8%</td>
                          <td className="text-right py-3 px-2 text-red-600">-18.3%</td>
                          <td className="text-right py-3 px-2 text-green-600">38.2%</td>
                        </tr>
                        <tr className="border-b border-slate-200">
                          <td className="py-3 px-2 font-semibold text-slate-700">Direct Property</td>
                          <td className="text-right py-3 px-2 text-slate-700">8.4%</td>
                          <td className="text-right py-3 px-2 text-slate-700">7.2%</td>
                          <td className="text-right py-3 px-2 text-slate-700">6.5%</td>
                          <td className="text-right py-3 px-2 text-red-600">-5.2%</td>
                          <td className="text-right py-3 px-2 text-green-600">24.8%</td>
                        </tr>
                        <tr className="border-b border-slate-200">
                          <td className="py-3 px-2 font-semibold text-slate-700">Global REITs</td>
                          <td className="text-right py-3 px-2 text-slate-700">7.8%</td>
                          <td className="text-right py-3 px-2 text-slate-700">6.9%</td>
                          <td className="text-right py-3 px-2 text-slate-700">5.2%</td>
                          <td className="text-right py-3 px-2 text-red-600">-37.8%</td>
                          <td className="text-right py-3 px-2 text-green-600">35.6%</td>
                        </tr>
                        <tr className="border-b border-slate-200">
                          <td className="py-3 px-2 font-semibold text-slate-700">Listed Infrastructure</td>
                          <td className="text-right py-3 px-2 text-slate-700">9.5%</td>
                          <td className="text-right py-3 px-2 text-slate-700">8.8%</td>
                          <td className="text-right py-3 px-2 text-slate-700">7.1%</td>
                          <td className="text-right py-3 px-2 text-red-600">-25.4%</td>
                          <td className="text-right py-3 px-2 text-green-600">42.3%</td>
                        </tr>
                        <tr className="border-b border-slate-200">
                          <td className="py-3 px-2 font-semibold text-slate-700">Growth Alternatives</td>
                          <td className="text-right py-3 px-2 text-slate-700">6.8%</td>
                          <td className="text-right py-3 px-2 text-slate-700">6.2%</td>
                          <td className="text-right py-3 px-2 text-slate-700">5.5%</td>
                          <td className="text-right py-3 px-2 text-red-600">-8.5%</td>
                          <td className="text-right py-3 px-2 text-green-600">18.9%</td>
                        </tr>
                        <tr className="border-b border-slate-200">
                          <td className="py-3 px-2 font-semibold text-slate-700">Fixed Interest</td>
                          <td className="text-right py-3 px-2 text-slate-700">4.5%</td>
                          <td className="text-right py-3 px-2 text-slate-700">3.8%</td>
                          <td className="text-right py-3 px-2 text-slate-700">2.9%</td>
                          <td className="text-right py-3 px-2 text-red-600">-2.8%</td>
                          <td className="text-right py-3 px-2 text-green-600">12.4%</td>
                        </tr>
                        <tr className="border-b border-slate-200">
                          <td className="py-3 px-2 font-semibold text-slate-700">Cash</td>
                          <td className="text-right py-3 px-2 text-slate-700">3.3%</td>
                          <td className="text-right py-3 px-2 text-slate-700">2.1%</td>
                          <td className="text-right py-3 px-2 text-slate-700">1.8%</td>
                          <td className="text-right py-3 px-2 text-red-600">0.0%</td>
                          <td className="text-right py-3 px-2 text-green-600">7.8%</td>
                        </tr>
                        <tr className="border-b border-slate-200">
                          <td className="py-3 px-2 font-semibold text-slate-700">CPI</td>
                          <td className="text-right py-3 px-2 text-slate-700">2.4%</td>
                          <td className="text-right py-3 px-2 text-slate-700">2.2%</td>
                          <td className="text-right py-3 px-2 text-slate-700">2.8%</td>
                          <td className="text-right py-3 px-2 text-red-600">-0.3%</td>
                          <td className="text-right py-3 px-2 text-green-600">6.1%</td>
                        </tr>
                      </tbody>
                    </table>
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