import React from 'react';
import { CheckCircle2, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

const steps = [
  { number: 1, label: 'Personal Info' },
  { number: 2, label: 'Employment' },
  { number: 3, label: 'Financial Situation' },
  { number: 4, label: 'Goals & Objectives' },
  { number: 5, label: 'Insurance' },
  { number: 6, label: 'Review & Submit' }
];

export default function ProgressBar({ currentStep }) {
  return (
    <div className="w-full py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="relative">
          {/* Progress Line */}
          <div className="absolute top-5 left-0 w-full h-0.5 bg-slate-200">
            <div
              className="h-full bg-amber-500 transition-all duration-500"
              style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
            />
          </div>

          {/* Steps */}
          <div className="relative flex justify-between">
            {steps.map((step) => {
              const isCompleted = currentStep > step.number;
              const isCurrent = currentStep === step.number;
              
              return (
                <div key={step.number} className="flex flex-col items-center">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                      isCompleted && "bg-amber-500 border-amber-500",
                      isCurrent && "bg-white border-amber-500 ring-4 ring-amber-100",
                      !isCompleted && !isCurrent && "bg-white border-slate-300"
                    )}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 text-white" />
                    ) : (
                      <span
                        className={cn(
                          "text-sm font-semibold",
                          isCurrent && "text-amber-600",
                          !isCurrent && "text-slate-400"
                        )}
                      >
                        {step.number}
                      </span>
                    )}
                  </div>
                  <span
                    className={cn(
                      "mt-2 text-xs font-medium text-center hidden sm:block",
                      (isCurrent || isCompleted) && "text-slate-800",
                      !isCurrent && !isCompleted && "text-slate-400"
                    )}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}