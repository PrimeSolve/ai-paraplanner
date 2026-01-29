import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';

export default function PublicLayout({ children }) {
  return (
    <div className="min-h-screen bg-white">
      {/* Main Content */}
      <main>
        {children}
      </main>
    </div>
  );
}