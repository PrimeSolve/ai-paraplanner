import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Save } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function FormWrapper({
  title,
  description,
  children,
  onNext,
  onBack,
  onSave,
  isFirstStep,
  isLastStep,
  isLoading,
  className
}) {
  return (
    <div className={cn("max-w-3xl mx-auto px-4 py-8", className)}>
      <Card className="border-slate-200 shadow-lg">
        <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
          <CardTitle className="text-2xl text-slate-800">{title}</CardTitle>
          {description && (
            <CardDescription className="text-slate-600 mt-2">
              {description}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="p-6 sm:p-8">
          {children}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-200">
            <div>
              {!isFirstStep && (
                <Button
                  variant="outline"
                  onClick={onBack}
                  disabled={isLoading}
                  className="border-slate-300 text-slate-700 hover:bg-slate-50"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              )}
            </div>
            
            <div className="flex gap-3">
              {onSave && (
                <Button
                  variant="outline"
                  onClick={onSave}
                  disabled={isLoading}
                  className="border-amber-300 text-amber-700 hover:bg-amber-50"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Progress
                </Button>
              )}
              
              <Button
                onClick={onNext}
                disabled={isLoading}
                className="bg-slate-800 hover:bg-slate-700 text-white"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    {isLastStep ? 'Submit' : 'Next'}
                    {!isLastStep && <ArrowRight className="w-4 h-4 ml-2" />}
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}