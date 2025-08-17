'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface KeyStatus {
  key: string;
  available: boolean;
  credits: {
    email_credits: number;
    phone_credits: number;
    api_credits: number;
  } | null;
  error: string | null;
}

export default function ApiKeyStatus() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [keyData, setKeyData] = useState<{
    totalKeys: number;
    availableKeys: number;
    keyStatuses: KeyStatus[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchKeyStatus();
    }
  }, [user]);

  const fetchKeyStatus = async () => {
    try {
      const response = await fetch('/api/wiza/key-status');
      if (!response.ok) {
        throw new Error('Failed to fetch key status');
      }
      const data = await response.json();
      setKeyData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  if (user?.role !== 'admin') {
    return null;
  }

  if (loading) {
    return <div className="p-4">Loading API key status...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-600">Error: {error}</div>;
  }

  if (!keyData) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4">Wiza API Key Status</h2>
      
      <div className="mb-4 space-y-2">
        <p className="text-sm text-gray-600">
          Total Keys: <span className="font-semibold">{keyData.totalKeys}</span>
        </p>
        <p className="text-sm text-gray-600">
          Available Keys: <span className="font-semibold text-green-600">{keyData.availableKeys}</span>
        </p>
        {keyData.totalKeys > 1 && (
          <p className="text-sm text-blue-600">
            🚀 Parallel extraction enabled with {keyData.totalKeys} API keys
          </p>
        )}
      </div>

      <div className="space-y-3">
        {keyData.keyStatuses.map((status, index) => (
          <div key={index} className="border rounded p-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-mono text-sm">{status.key}</p>
                <p className={`text-sm ${status.available ? 'text-green-600' : 'text-red-600'}`}>
                  {status.available ? '✓ Available' : '✗ Unavailable'}
                </p>
              </div>
              
              {status.credits && (
                <div className="text-right text-sm">
                  <p>API Credits: {status.credits.api_credits}</p>
                  <p>Email Credits: {status.credits.email_credits}</p>
                  <p>Phone Credits: {status.credits.phone_credits}</p>
                </div>
              )}
              
              {status.error && (
                <p className="text-red-500 text-sm">{status.error}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={fetchKeyStatus}
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
      >
        Refresh Status
      </button>
    </div>
  );
} 