import React, { createContext, useState, useContext } from 'react';

const RoleContext = createContext();

export function RoleProvider({ children }) {
  const [user, setUser] = useState(null); // Current logged-in user
  const [admin, setAdmin] = useState(null); // Admin entity if user is admin
  const [adviser, setAdviser] = useState(null); // Adviser entity if user is adviser
  const [client, setClient] = useState(null); // Client entity if user is client

  const loadUserData = (userData) => {
    setUser(userData);
    // Load related entity data based on user's role and IDs
    if (userData.role === 'admin' && userData.admin_id) {
      // Load admin data
      setAdmin({ id: userData.admin_id });
    } else if (userData.role === 'user' && userData.adviser_id) {
      // Load adviser data
      setAdviser({ id: userData.adviser_id });
    } else if (userData.role === 'user' && userData.client_id) {
      // Load client data
      setClient({ id: userData.client_id });
    }
  };

  const clearUserData = () => {
    setUser(null);
    setAdmin(null);
    setAdviser(null);
    setClient(null);
  };

  return (
    <RoleContext.Provider value={{ user, admin, adviser, client, loadUserData, clearUserData }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error('useRole must be used within RoleProvider');
  }
  return context;
}