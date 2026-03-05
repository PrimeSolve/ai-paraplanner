import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';

export default function NavigationItem({ item, isActive, accentColor = 'white' }) {
  const Icon = item.icon;

  return (
    <Link
      to={createPageUrl(item.path)}
      className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium no-underline transition-all mb-1 relative ${
        isActive
          ? 'bg-white/10 text-white'
          : 'text-[#94a3b8] hover:bg-white/[0.05] hover:text-white'
      }`}
    >
      {isActive && (
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-md"
          style={{ backgroundColor: accentColor }}
        />
      )}
      <Icon className="w-5 h-5" />
      <span>{item.label}</span>
      {item.badge && (
        <span className="ml-auto bg-[#f97316] text-white text-[11px] font-bold px-2 py-0.5 rounded-xl">
          {item.badge}
        </span>
      )}
    </Link>
  );
}
