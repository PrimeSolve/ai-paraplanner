import React, { useState, useRef, useEffect } from 'react';
import {
  // Document & structure
  FileText, ScrollText, ClipboardList, BookOpen, FileCheck, FilePen,
  // People & relationships
  User, Users, UserCheck, Baby, Heart, HeartHandshake,
  // Finance & money
  DollarSign, TrendingUp, TrendingDown, PiggyBank, Wallet, BarChart2,
  CreditCard, Banknote, Calculator, Percent,
  // Protection & insurance
  Shield, ShieldCheck, ShieldAlert, Umbrella, Lock,
  // Property & assets
  Home, Building2, Car, Briefcase, Landmark,
  // Planning & strategy
  Target, Compass, Map, Lightbulb, CheckCircle, ListChecks,
  // Legal & compliance
  Scale, Gavel, FileWarning, AlertCircle, Info,
  // Retirement & super
  Sunset, Clock, CalendarDays, Hourglass,
} from 'lucide-react';

const ICON_MAP = {
  FileText, ScrollText, ClipboardList, BookOpen, FileCheck, FilePen,
  User, Users, UserCheck, Baby, Heart, HeartHandshake,
  DollarSign, TrendingUp, TrendingDown, PiggyBank, Wallet, BarChart2,
  CreditCard, Banknote, Calculator, Percent,
  Shield, ShieldCheck, ShieldAlert, Umbrella, Lock,
  Home, Building2, Car, Briefcase, Landmark,
  Target, Compass, Map, Lightbulb, CheckCircle, ListChecks,
  Scale, Gavel, FileWarning, AlertCircle, Info,
  Sunset, Clock, CalendarDays, Hourglass,
};

const ICON_NAMES = Object.keys(ICON_MAP);

export { ICON_MAP };

export function getIconComponent(name) {
  return ICON_MAP[name] || null;
}

export default function IconPicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const SelectedIcon = value ? ICON_MAP[value] : FileText;

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
      >
        <span className="w-6 h-6 rounded-md bg-indigo-50 border border-indigo-200 flex items-center justify-center">
          {SelectedIcon && <SelectedIcon className="w-3.5 h-3.5 text-indigo-600" />}
        </span>
        Change icon
      </button>

      {open && (
        <div className="absolute z-50 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg p-2 w-[264px]">
          <div className="grid grid-cols-6 gap-1">
            {ICON_NAMES.map((name) => {
              const Icon = ICON_MAP[name];
              const isSelected = value === name;
              return (
                <button
                  key={name}
                  type="button"
                  title={name}
                  onClick={() => {
                    onChange(name);
                    setOpen(false);
                  }}
                  className={`w-10 h-10 rounded-md flex items-center justify-center transition-colors ${
                    isSelected
                      ? 'bg-indigo-100 border-2 border-indigo-500'
                      : 'hover:bg-slate-100 border border-transparent'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isSelected ? 'text-indigo-600' : 'text-slate-600'}`} />
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
