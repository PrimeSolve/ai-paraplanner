import React from 'react';
import FactFindWelcome from './FactFindWelcome';

// Temporarily points to the same FactFindWelcome page as ClientFactFindForm.
// This will be differentiated into an AI-driven fact find experience later.
// Renders full-screen with FactFindLayout (no client sidebar).
export default function ClientFactFindAI() {
  return <FactFindWelcome />;
}
