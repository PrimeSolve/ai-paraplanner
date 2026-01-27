import React, { createContext, useState, useContext } from 'react';

const RoleContext = createContext();

export function RoleProvider({ children }) {
  const [originalUser, setOriginalUser] = useState(null);
  const [currentRole, setCurrentRole] = useState(null); // 'admin', 'advice_group', 'adviser', 'client'
  const [switchedToId, setSwitchedToId] = useState(null); // ID of the entity being viewed as

  const switchRole = (role, id, user) => {
    if (!originalUser) {
      setOriginalUser(user);
    }
    setCurrentRole(role);
    setSwitchedToId(id);
  };

  const resetToOriginal = () => {
    setCurrentRole(null);
    setSwitchedToId(null);
    setOriginalUser(null);
  };

  return (
    <RoleContext.Provider value={{ originalUser, currentRole, switchedToId, switchRole, resetToOriginal }}>
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