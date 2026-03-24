import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { Sparkles } from 'lucide-react';
import NavigationItem from './NavigationItem';

export default function SidebarLayout({
  homePath,
  logoContent,
  title,
  subtitle,
  navSections,
  helpPath,
  currentPage,
  accentColor = 'white',
  helpText = 'Ask for help',
}) {
  return (
    <div className="w-[260px] bg-[#0f172a] fixed top-0 left-0 bottom-0 flex flex-col z-50">
      {/* Logo Header */}
      <div className="h-16 px-6 flex items-center border-b border-white/[0.08]">
        <Link to={createPageUrl(homePath)} className="flex items-center gap-3 text-white no-underline">
          {logoContent}
          <div>
            <div className="text-white text-sm font-bold">{title}</div>
            <div className="text-[#94a3b8] text-xs font-medium uppercase tracking-wide">
              {subtitle}
            </div>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 px-4 overflow-y-auto">
        {navSections.map((section, idx) => (
          <div
            key={idx}
            className={`mb-7 ${section.border ? 'border-t border-white/[0.08] pt-6' : ''}`}
          >
            {section.label && (
              <div className="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-[#64748b]">
                {section.label}
              </div>
            )}
            {section.items.map((item) => (
              <NavigationItem
                key={item.path}
                item={item}
                isActive={currentPage === item.path}
                accentColor={accentColor}
              />
            ))}
          </div>
        ))}
      </nav>

      {/* AI Assistant Button */}
      {helpPath && (
        <div className="p-4">
          <Link to={createPageUrl(helpPath)} className="no-underline">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] hover:from-[#4f46e5] hover:to-[#7c3aed] cursor-pointer transition-all shadow-lg shadow-purple-900/30">
              <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white font-semibold text-sm">AI Assistant</div>
                <div className="text-white/80 text-xs">{helpText}</div>
              </div>
              <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">?</span>
              </div>
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}
