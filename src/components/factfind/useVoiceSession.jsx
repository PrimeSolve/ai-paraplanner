import { useState, useEffect, useRef, useCallback } from 'react';

const BRIDGE_ENDPOINT = 'https://solver-cors-proxy.tim-hall.workers.dev/livekit/start';

export function useVoiceSession({ factFind, updateSection, activeTabId, clientId }) {
  const [status, setStatus] = useState('idle');
  const [writeCount, setWriteCount] = useState(0);
  const roomRef = useRef(null);
  const processedIds = useRef(new Set());
  const statusRef = useRef('idle');

  // ---- TAB TO SECTION MAPPING ----
  const sectionMap = {
    basic_details: 'personal',
    contact: 'personal',
    health: 'personal',
    employment: 'personal',
    estate: 'personal',
    centrelink: 'personal',
    children: 'dependants',
    trusts: 'trusts_companies',
    smsf: 'smsf',
    superannuation: 'superannuation',
    pension: 'superannuation',
    income: 'income_expenses',
    expenses: 'income_expenses',
    assets: 'assets_liabilities',
    debts: 'assets_liabilities',
    insurance: 'insurance',
    super_caps: 'super_tax',
    tax: 'super_tax',
  };

  // ---- ARRAY KEY LOOKUP FOR REPEATING ENTITIES ----
  function getArrayKey(tab, fields) {
    const names = Object.keys(fields);
    switch (tab) {
      case 'children':
        return names.some(f => f.startsWith('dep_')) ? 'dependants_list' : 'children';
      case 'trusts':
        return 'entities';
      case 'pension':
        return names.some(f => f.startsWith('annuit')) ? 'annuities' : 'pensions';
      case 'assets': return 'assets';
      case 'debts': return 'liabilities';
      case 'insurance': return 'policies';
      case 'superannuation': return 'funds';
      case 'smsf': return 'smsf_details';
      default: return 'items';
    }
  }

  // ---- APPLY A WRITE TO THE FACTFIND ----
  const applyWrite = useCallback((msg) => {
    const { tab, fields, entity_index } = msg;
    const sectionKey = sectionMap[tab];
    if (!sectionKey || !fields) return;

    const currentSection = factFind?.[sectionKey] || {};

    if (entity_index === undefined || entity_index === null) {
      // Simple tab — merge fields
      if (tab === 'basic_details' || tab === 'contact' || tab === 'health' || tab === 'employment' || tab === 'estate' || tab === 'centrelink') {
        updateSection(sectionKey, { ...currentSection, ...fields });
      } else {
        updateSection(sectionKey, { ...currentSection, ...fields });
      }
    } else {
      // Repeating entity — update array at index
      const arrayKey = getArrayKey(tab, fields);
      const arr = [...(currentSection[arrayKey] || [])];
      while (arr.length <= entity_index) arr.push({});
      arr[entity_index] = { ...arr[entity_index], ...fields };
      updateSection(sectionKey, { ...currentSection, [arrayKey]: arr });
    }

    setWriteCount(prev => prev + 1);
    console.log('[Voice] Applied WRITE:', tab, Object.keys(fields));
  }, [factFind, updateSection]);

  // ---- HANDLE DATA FROM AGENT ----
  const handleData = useCallback((payload) => {
    try {
      const msg = JSON.parse(new TextDecoder().decode(payload));

      if (msg.type === 'WRITE') {
        if (processedIds.current.has(msg.write_id)) return;
        processedIds.current.add(msg.write_id);
        applyWrite(msg);
      }

      if (msg.type === 'TAB_COMPLETE') {
        console.log('[Voice] Tab complete:', msg.tab, '→', msg.next_tab);
      }

      if (msg.type === 'SAY') {
        console.log('[Voice] Agent says:', msg.text);
      }
    } catch (e) {
      console.error('[Voice] Parse error:', e);
    }
  }, [applyWrite]);

  // ---- START VOICE SESSION ----
  const startVoice = useCallback(async () => {
    // Prevent multiple simultaneous attempts
    if (statusRef.current === 'connecting' || statusRef.current === 'connected') {
      console.log('[Voice] Already connecting/connected, skipping...');
      return;
    }

    try {
      statusRef.current = 'connecting';
      setStatus('connecting');

      // Check if LivekitClient is available
      if (typeof window.LivekitClient === 'undefined') {
        throw new Error('LiveKit SDK not loaded. Please refresh the page.');
      }

      // 1. Call the endpoint to create a room and get a token
      const res = await fetch(BRIDGE_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ClientId: clientId || 'default-client' }),
      });

      if (!res.ok) throw new Error('Failed to create room');
      const { url, token, room_name } = await res.json();

      console.log('[Voice] Room created:', room_name);

      // 2. Connect to the LiveKit room
      const room = new window.LivekitClient.Room();
      roomRef.current = room;

      room.on(window.LivekitClient.RoomEvent.DataReceived, (payload, participant) => {
        handleData(payload);
      });

      room.on(window.LivekitClient.RoomEvent.Connected, () => {
        statusRef.current = 'connected';
        setStatus('connected');
        console.log('[Voice] Connected to room');

        // Send initial TAB_ACTIVATED so the agent knows which tab to start on
        const currentTab = activeTabId || 'basic_details';
        const payload = JSON.stringify({
          type: 'TAB_ACTIVATED',
          active_tab_id: currentTab,
          ts: Date.now(),
        });
        room.localParticipant
          .publishData(new TextEncoder().encode(payload), { reliable: true })
          .then(() => console.log('[Voice] Sent initial TAB_ACTIVATED:', currentTab))
          .catch(err => console.error('[Voice] Initial TAB_ACTIVATED error:', err));
      });

      room.on(window.LivekitClient.RoomEvent.Disconnected, () => {
        statusRef.current = 'disconnected';
        setStatus('disconnected');
        console.log('[Voice] Disconnected');
      });

      await room.connect(url, token);

    } catch (err) {
      console.error('[Voice] Start failed:', err);
      statusRef.current = 'error';
      setStatus('error');
    }
  }, [clientId, handleData]);

  // ---- SEND TAB CHANGE TO AGENT ----
  useEffect(() => {
    if (!roomRef.current || statusRef.current !== 'connected' || !activeTabId) return;

    const payload = JSON.stringify({
      type: 'TAB_ACTIVATED',
      active_tab_id: activeTabId,
      ts: Date.now(),
    });

    roomRef.current.localParticipant
      .publishData(new TextEncoder().encode(payload), { reliable: true })
      .then(() => console.log('[Voice] Sent TAB_ACTIVATED:', activeTabId))
      .catch(err => console.error('[Voice] Tab send error:', err));
  }, [activeTabId]);

  // ---- STOP SESSION ----
  const stopVoice = useCallback(() => {
    if (roomRef.current) {
      roomRef.current.disconnect();
      roomRef.current = null;
    }
    statusRef.current = 'idle';
    setStatus('idle');
    setWriteCount(0);
    processedIds.current.clear();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (roomRef.current) roomRef.current.disconnect();
    };
  }, []);

  return { status, writeCount, startVoice, stopVoice };
}