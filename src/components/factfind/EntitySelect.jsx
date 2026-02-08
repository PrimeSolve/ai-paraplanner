import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import EntityDot from './EntityDot';

export default function EntitySelect({ value, onChange, entities, placeholder = "Select…" }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  
  const selectedEntity = entities.find(e => e.id === value);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white flex items-center justify-between"
      >
        <span className="flex items-center gap-2">
          {selectedEntity ? (
            <>
              <EntityDot color={selectedEntity.color} />
              {selectedEntity.label}
            </>
          ) : (
            <span className="text-slate-500">{placeholder}</span>
          )}
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 border border-slate-300 rounded-md bg-white shadow-lg z-50">
          {entities.length === 0 ? (
            <div className="px-3 py-2 text-sm text-slate-500">No entities available</div>
          ) : (
            <div className="max-h-60 overflow-y-auto">
              {entities.map(entity => (
                <button
                  key={entity.id}
                  onClick={() => {
                    onChange(entity.id);
                    setOpen(false);
                  }}
                  className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 border-b border-slate-100 last:border-b-0 transition-colors ${
                    entity.id === value ? 'bg-slate-100' : 'hover:bg-slate-100'
                  }`}
                >
                  <EntityDot color={entity.color} />
                  <span className="flex-1">
                    <span className="font-medium">{entity.label}</span>
                  </span>
                  <span className="text-xs text-slate-500">{entity.type}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}