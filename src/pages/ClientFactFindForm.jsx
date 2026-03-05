import React from 'react';
import ClientLayout from '../components/client/ClientLayout';
import FactFindWelcome from './FactFindWelcome';

// Wraps the existing FactFindWelcome page for the client fact find form route.
// ClientLayout currentPage is set so the sidebar highlights correctly.
export default function ClientFactFindForm() {
  return <FactFindWelcome />;
}
