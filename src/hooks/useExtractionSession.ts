import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export interface ExtractionSession {
  id: string;
  user_id: string;
  status: 'in_progress' | 'completed' | 'failed' | 'cancelled';
  type: 'single' | 'bulk';
  total_urls: number;
  processed_urls: number;
  successful_extractions: number;
  failed_extractions: number;
  credits_used: number;
  urls: string[];
  processed_url_indices: number[];
  results: any[];
  error_message?: string;
  started_at: string;
  updated_at: string;
  completed_at?: string;
}

export function useExtractionSession() {
  const { user } = useAuth();
  const [currentSession, setCurrentSession] = useState<ExtractionSession | null>(null);
  const [isRecovering, setIsRecovering] = useState(false);

  // Create a new extraction session
  const createSession = useCallback(async (type: 'single' | 'bulk', urls: string[]) => {
    if (!user?.id) return null;

    try {
      const response = await fetch('/api/extraction-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          type,
          urls
        })
      });

      const data = await response.json();
      if (data.success) {
        setCurrentSession(data.session);
        // Store session ID in sessionStorage for recovery
        sessionStorage.setItem('currentExtractionSession', data.session.id);
        return data.session;
      }
    } catch (error) {
      console.error('Failed to create extraction session:', error);
    }
    return null;
  }, [user]);

  // Update extraction session progress
  const updateSession = useCallback(async (sessionId: string, updates: Partial<ExtractionSession>) => {
    try {
      const response = await fetch(`/api/extraction-sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      const data = await response.json();
      if (data.success) {
        setCurrentSession(data.session);
        return data.session;
      }
    } catch (error) {
      console.error('Failed to update extraction session:', error);
    }
    return null;
  }, []);

  // Complete extraction session
  const completeSession = useCallback(async (sessionId: string, finalStats: any) => {
    const updates = {
      status: 'completed',
      completed_at: new Date().toISOString(),
      ...finalStats
    };
    
    const result = await updateSession(sessionId, updates);
    sessionStorage.removeItem('currentExtractionSession');
    return result;
  }, [updateSession]);

  // Cancel extraction session
  const cancelSession = useCallback(async (sessionId: string) => {
    try {
      const response = await fetch(`/api/extraction-sessions/${sessionId}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      if (data.success) {
        setCurrentSession(null);
        sessionStorage.removeItem('currentExtractionSession');
        return true;
      }
    } catch (error) {
      console.error('Failed to cancel extraction session:', error);
    }
    return false;
  }, []);

  // Recover session on mount
  useEffect(() => {
    const recoverSession = async () => {
      if (!user?.id) return;

      const storedSessionId = sessionStorage.getItem('currentExtractionSession');
      if (!storedSessionId) return;

      setIsRecovering(true);
      try {
        const response = await fetch(`/api/extraction-sessions?userId=${user.id}&sessionId=${storedSessionId}&status=in_progress`);
        const data = await response.json();
        
        if (data.success && data.sessions?.length > 0) {
          const session = data.sessions[0];
          // Only recover if session is still in progress and not too old (24 hours)
          const sessionAge = Date.now() - new Date(session.started_at).getTime();
          const maxAge = 24 * 60 * 60 * 1000; // 24 hours
          
          if (session.status === 'in_progress' && sessionAge < maxAge) {
            setCurrentSession(session);
          } else {
            // Clean up old session
            sessionStorage.removeItem('currentExtractionSession');
          }
        }
      } catch (error) {
        console.error('Failed to recover extraction session:', error);
      } finally {
        setIsRecovering(false);
      }
    };

    recoverSession();
  }, [user]);

  // Get active sessions for user
  const getActiveSessions = useCallback(async () => {
    if (!user?.id) return [];

    try {
      const response = await fetch(`/api/extraction-sessions?userId=${user.id}&status=in_progress`);
      const data = await response.json();
      
      if (data.success) {
        return data.sessions || [];
      }
    } catch (error) {
      console.error('Failed to fetch active sessions:', error);
    }
    return [];
  }, [user]);

  return {
    currentSession,
    isRecovering,
    createSession,
    updateSession,
    completeSession,
    cancelSession,
    getActiveSessions
  };
}
