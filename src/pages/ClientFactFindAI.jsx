import React from 'react';
import FactFindWelcome from './FactFindWelcome';

// Temporarily points to the same FactFindWelcome page as ClientFactFindForm.
// This will be differentiated into an AI-driven fact find experience later.
// skipLayout prevents FactFindLayout from rendering its own sidebar so the
// client sidebar provided by AppShell remains visible.
export default function ClientFactFindAI() {
  return <FactFindWelcome skipLayout />;
}
