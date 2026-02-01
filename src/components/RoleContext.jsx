import React, { createContext, useState, useContext, useCallback, useRef } from 'react';
import { base44 } from '@/api/base44Client';

const RoleContext = createContext();

export function RoleProvider({ children }) {
  const [user, setUser] = useState(null);
  const [originalUser, setOriginalUser] = useState(null);
  const [entityCacheRef] = useState({ current: {} });
  const hasLoadedRef = useRef(false);
  
  // Navigation chain: [{ type: 'advice_group', id: 123, name: 'PrimeSolve' }, { type: 'adviser', id: 456, name: 'Sarah Johnson' }]
  const [navigationChain, setNavigationChain] = useState([]);

  const loadUserData = useCallback(async (userData) => {
    // Check if in test mode - this takes precedence
    const testModeEntity = localStorage.getItem('test_mode_entity');
    if (testModeEntity) {
      const entity = JSON.parse(testModeEntity);
      console.log('Test mode active, impersonating entity:', entity);
      
      // Create mock user data based on entity
      userData = {
        id: entity.id,
        email: entity.email,
        full_name: entity.displayInfo,
        role: 'user', // All entities are 'user' role except admin
        entityType: entity.type, // 'adviser', 'client', 'advice_group'
        entity: entity.entity, // The full entity data
        isTestMode: true
      };

      console.log('Test entity loaded as user:', userData);
      
      setUser(userData);
      if (!originalUser) {
        setOriginalUser(userData);
      }
      return;
    }

    // Normal user loading - check if linked to an entity
    let linkedEntity = null;
    if (userData.role === 'user') {
      try {
        // Check cache first to avoid repeat queries
        const cacheKey = `user_${userData.id}`;
        if (entityCacheRef.current[cacheKey]) {
          linkedEntity = entityCacheRef.current[cacheKey];
        } else {
          const advisers = await base44.entities.Adviser.filter({ user_id: userData.id });
          if (advisers.length > 0) {
            linkedEntity = { type: 'adviser', data: advisers[0] };
          } else {
            const clients = await base44.entities.Client.filter({ user_id: userData.id });
            if (clients.length > 0) {
              linkedEntity = { type: 'client', data: clients[0] };
            } else {
              const groups = await base44.entities.AdviceGroup.filter({ user_id: userData.id });
              if (groups.length > 0) {
                linkedEntity = { type: 'advice_group', data: groups[0] };
              }
            }
          }
          entityCacheRef.current[cacheKey] = linkedEntity;
        }
        console.log('Linked entity:', linkedEntity);
      } catch (error) {
        console.error('Error loading linked entity:', error);
      }
    }
    
    setUser({ ...userData, linkedEntity });
    if (!originalUser) {
      setOriginalUser({ ...userData, linkedEntity });
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