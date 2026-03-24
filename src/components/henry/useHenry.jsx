import { useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axiosInstance from '@/api/axiosInstance';

// TODO: add streaming support for faster response feel

/**
 * Hook that manages Henry co-pilot panel state and messaging.
 *
 * @param {object} options
 * @param {'adviser'|'client'} options.version - Which Henry variant to use
 * @param {string} options.adviserId - Adviser entity ID (adviser version only)
 * @param {string} options.userName - Display name for the welcome message
 * @param {string} options.adviserName - Adviser full name (for system prompt context)
 * @param {string} options.adviceGroupName - Advice group name (for system prompt context)
 * @param {string} options.clientId - Client entity ID (client version only)
 */
export default function useHenry({ version = 'adviser', adviserId, userName, adviserName, adviceGroupName, clientId } = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const openPanel = useCallback(() => setIsOpen(true), []);
  const closePanel = useCallback(() => setIsOpen(false), []);
  const togglePanel = useCallback(() => setIsOpen(prev => !prev), []);

  const clearHistory = useCallback(() => {
    setMessages([]);
  }, []);

  const sendMessage = useCallback(async (text) => {
    const userMsg = {
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      // Build conversation history for the API (role + content only)
      const conversationHistory = messages.map(m => ({ role: m.role, content: m.content }));

      const payload = {
        messages: [...conversationHistory, { role: 'user', content: text }],
        currentPage: location.pathname,
        version,
        ...(version === 'adviser' && adviserId ? { adviserId } : {}),
        ...(version === 'client' && clientId ? { clientId } : {}),
      };

      const response = await axiosInstance.post('/henry/chat', payload);
      const data = response.data;

      // Handle navigate_to_page tool action
      if (data.action === 'navigate') {
        navigate(`/${data.page}`);
      }

      const assistantMsg = {
        role: 'assistant',
        content: data.reply,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (error) {
      console.error('Henry chat error:', error);
      const errorMsg = {
        role: 'assistant',
        content: 'Sorry, I ran into an issue processing your request. Please try again.',
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  }, [messages, location.pathname, version, adviserId, clientId, navigate]);

  return {
    isOpen,
    messages,
    isLoading,
    currentPage: location.pathname,
    sendMessage,
    openPanel,
    closePanel,
    togglePanel,
    clearHistory,
  };
}
