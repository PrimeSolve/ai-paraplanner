import React from 'react';
import FactFindWelcome from './FactFindWelcome';

// Wraps the existing FactFindWelcome page for the client fact find form route.
// skipLayout prevents FactFindLayout from rendering its own sidebar so the
// client sidebar provided by AppShell remains visible.
export default function ClientFactFindForm() {
  return <FactFindWelcome skipLayout />;
}
