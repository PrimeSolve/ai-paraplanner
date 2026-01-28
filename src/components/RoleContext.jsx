import React, { createContext, useState, useContext } from 'react';

const RoleContext = createContext();

export function RoleProvider({ children }) {
  const [user, setUser] = useState(null);
  const [originalUser, setOriginalUser] = useState(null);
  
  // Navigation chain: [{ type: 'advice_group', id: 123, name: 'PrimeSolve' }, { type: 'adviser', id: 456, name: 'Sarah Johnson' }]
  const [navigationChain, setNavigationChain] = useState([]);

  const loadUserData = (userData) => {
    setUser(userData);
    if (!originalUser) {
      setOriginalUser(userData);
    }
  };

  const clearUserData = () => {
    setUser(null);
    setOriginalUser(null);
    setNavigationChain([]);
  };

  // Push a new level onto the navigation chain
  const switchRole = (type, id, name) => {
    if (!originalUser && user) {
      setOriginalUser(user);
    }
    setNavigationChain(prev => [...prev, { type, id, name }]);
  };

  // Pop back to a specific level in the chain (by index)
  const navigateToLevel = (index) => {
    if (index < 0) {
      // Go all the way back to original
      setNavigationChain([]);
    } else {
      setNavigationChain(prev => prev.slice(0, index + 1));
    }
  };

  // Go back one level
  const navigateUp = () => {
    setNavigationChain(prev => prev.slice(0, -1));
  };

  // Reset completely to original user
  const resetToOriginal = () => {
    setNavigationChain([]);
  };

  // Helper getters
  const currentLevel = navigationChain.length > 0 
    ? navigationChain[navigationChain.length - 1] 
    : null;
  
  const currentType = currentLevel?.type || originalUser?.role || 'admin';
  
  const switchedToId = currentLevel?.id || null;

  // Get ID for a specific type in the chain
  const getIdForType = (type) => {
    const found = navigationChain.find(n => n.type === type);
    return found?.id || null;
  };

  const isViewingAs = navigationChain.length > 0;

  return (
    <RoleContext.Provider value={{ 
      user, 
      originalUser,
      navigationChain,
      currentLevel,
      currentType,
      switchedToId,
      isViewingAs,
      loadUserData, 
      clearUserData, 
      switchRole, 
      navigateUp,
      navigateToLevel,
      resetToOriginal,
      getIdForType,
    }}>
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