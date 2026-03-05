import React from 'react';
import FactFindWelcome from './FactFindWelcome';

// Wraps the existing FactFindWelcome page for the client fact find form route.
// Renders full-screen with FactFindLayout (no client sidebar).
export default function ClientFactFindForm() {
  return <FactFindWelcome />;
}
