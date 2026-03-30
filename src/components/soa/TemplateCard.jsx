import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Lock,
  Pencil,
  ScrollText,
  Copy,
  Trash2,
  Eye,
  ArrowRight,
  Star,
  Share2,
  Settings2,
} from 'lucide-react';
import { getIconComponent } from '@/components/IconPicker';
import { countConfigured } from '@/utils/soaTemplateDefaults';

/**
 * TemplateCard — displays a single SOA template in the library grid.
 *
 * Props:
 *   template        — the template object ({ id, name, description, ownerType, sections, ... })
 *   onEdit          — called when Edit is clicked (owned templates)
 *   onView          — called when View is clicked (default/read-only templates)
 *   onUse           — called when "Use as base" / "Set as Default" is clicked
 *   onDuplicate     — called when Duplicate is clicked
 *   onDelete        — called when Delete is clicked
 *   isDefault       — true if this is the PrimeSolve Admin default template
 *   isActive        — true if this template is the currently selected/active template
 *   level           — 'admin' | 'advice_group' | 'adviser'
 */
export default function TemplateCard({
  template,
  onEdit,
  onView,
  onUse,
  onDuplicate,
  onDelete,
  onShare,
  onStylingSettings,
  isDefault = false,
  isActive = false,
  level = 'advice_group',
}) {
  const sections = (() => {
    const raw = template.sections || template.template_data;
    if (!raw) return [];
    try {
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      // Handle wrapped format { sections: [...] }
      const unwrapped = parsed?.sections || parsed;
      return Array.isArray(unwrapped) ? unwrapped : [];
    } catch {
      return [];
    }
  })();

  const { configured, total } = countConfigured(sections);
  const allConfigured = total > 0 && configured === total;

  const isShared = template.isShared || template.is_shared || false;

  const ot = template.ownerType ?? template.owner_type;

  const ownerBadge = (() => {
    if (level === 'admin') return 'System Template';
    if (isDefault) return 'PrimeSolve Default';
    if (ot === 1) return 'Advice Group';
    if (ot === 2) return 'Adviser';
    return 'Custom';
  })();

  const ownerBadgeColor = (() => {
    if (isDefault) return 'bg-indigo-100 text-indigo-700';
    if (ot === 1) return 'bg-purple-100 text-purple-700';
    if (ot === 2) return 'bg-teal-100 text-teal-700';
    return 'bg-slate-100 text-slate-700';
  })();

  return (
    <div className={`relative bg-white border rounded-xl p-5 transition-all hover:shadow-md ${
      isActive ? 'border-green-400 ring-2 ring-green-100' : 'border-slate-200'
    }`}>
      {/* Top row: icon + active badge */}
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
          isDefault ? 'bg-indigo-100' : 'bg-slate-100'
        }`}>
          {isDefault ? (
            <Lock className="w-5 h-5 text-indigo-600" />
          ) : (() => {
            const TemplateIcon = getIconComponent(template.icon) || ScrollText;
            return <TemplateIcon className="w-5 h-5 text-slate-500" />;
          })()}
        </div>
        {isActive && (
          <Badge className="bg-green-100 text-green-700 border-green-200 text-xs font-semibold">
            <Star className="w-3 h-3 mr-1" />
            Active
          </Badge>
        )}
      </div>

      {/* Template name */}
      <h3 className="font-semibold text-slate-900 mb-1 truncate">
        {template.name || 'Untitled Template'}
      </h3>

      {/* Shared badge */}
      {isShared && (
        <span className="inline-block text-[11px] font-medium px-2 py-0.5 rounded-full mb-1 bg-green-100 text-green-700">
          Shared
        </span>
      )}

      {/* Owner badge */}
      <span className={`inline-block text-[11px] font-medium px-2 py-0.5 rounded-full mb-3 ${ownerBadgeColor}`}>
        {ownerBadge}
      </span>

      {/* Section counts */}
      <div className="flex items-center gap-4 text-sm mb-4">
        <span className="text-slate-600">
          <span className="font-semibold text-slate-800">{total}</span> sections
        </span>
        <span className={allConfigured ? 'text-green-600' : 'text-amber-600'}>
          <span className="font-semibold">{configured}</span> configured
        </span>
      </div>

      {/* Description */}
      {template.description && (
        <p className="text-xs text-slate-500 mb-4 line-clamp-2">
          {template.description}
        </p>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        {isDefault && level !== 'admin' ? (
          <>
            <Button size="sm" variant="outline" onClick={() => onView?.(template)}>
              <Eye className="w-3.5 h-3.5 mr-1" />
              View
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-indigo-200 text-indigo-600 hover:bg-indigo-50"
              onClick={() => onDuplicate?.(template)}
            >
              <ArrowRight className="w-3.5 h-3.5 mr-1" />
              Use as base
            </Button>
          </>
        ) : isDefault && level === 'admin' ? (
          <>
            <Button size="sm" variant="outline" onClick={() => onEdit?.(template)}>
              <Pencil className="w-3.5 h-3.5 mr-1" />
              Edit
            </Button>
            {onShare && (
              <Button
                size="sm"
                variant="ghost"
                className={isShared ? 'text-green-600 hover:text-green-700 hover:bg-green-50' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}
                title={isShared ? 'Shared with all Advice Groups — click to unshare' : 'Click to share with all Advice Groups'}
                onClick={() => onShare(template)}
              >
                <Share2 className="w-3.5 h-3.5" fill={isShared ? 'currentColor' : 'none'} />
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={() => onDuplicate?.(template)}>
              <Copy className="w-3.5 h-3.5" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-red-500 hover:text-red-700 hover:bg-red-50"
              onClick={() => onDelete?.(template)}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </>
        ) : (
          <>
            <Button size="sm" variant="outline" onClick={() => onEdit?.(template)}>
              <Pencil className="w-3.5 h-3.5 mr-1" />
              Edit
            </Button>
            {!isActive && onUse && (
              <Button
                size="sm"
                variant="outline"
                className="border-green-200 text-green-600 hover:bg-green-50"
                onClick={() => onUse(template)}
              >
                <Star className="w-3.5 h-3.5 mr-1" />
                Set as Default
              </Button>
            )}
            {onShare && (
              <Button
                size="sm"
                variant="ghost"
                className={isShared ? 'text-green-600 hover:text-green-700 hover:bg-green-50' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}
                title={isShared ? 'Shared with all Advice Groups — click to unshare' : 'Click to share with all Advice Groups'}
                onClick={() => onShare(template)}
              >
                <Share2 className="w-3.5 h-3.5" fill={isShared ? 'currentColor' : 'none'} />
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={() => onDuplicate?.(template)}>
              <Copy className="w-3.5 h-3.5" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-red-500 hover:text-red-700 hover:bg-red-50"
              onClick={() => onDelete?.(template)}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </>
        )}

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Settings cog */}
        <Button
          size="sm"
          variant="ghost"
          className="border border-indigo-300 bg-indigo-50 hover:bg-indigo-100 text-indigo-600"
          onClick={() => onStylingSettings?.(template)}
          title="Global styling settings"
        >
          <Settings2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}
