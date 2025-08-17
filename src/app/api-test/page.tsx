'use client';

import { useState, useEffect } from 'react';
import { initializeApiKeys } from '@/utils/apiKeyLoader';
import { getApiKeyPool } from '@/utils/apiKeyPool';

export default function ApiTestPage() {
  const [keyInfo, setKeyInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkApiKeys();
  }, []);

  const checkApiKeys = async () => {
    try {
      // Initialize API keys
      initializeApiKeys();
      const pool = getApiKeyPool();
      
      if (pool) {
        const status = pool.getAllKeysStatus();
        setKeyInfo({
          totalKeys: status.length,
          availableKeys: pool.getAvailableKeysCount(),
          keys: status
        });
      }
      
      // Also try fetching from API
      const response = await fetch('/api/wiza/key-status');
      if (response.ok) {
        const data = await response.json();
        setKeyInfo((prev: any) => ({
          ...prev,
          apiData: data
        }));
      }
    } catch (error) {
      console.error('Error checking API keys:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8">Loading API key information...</div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">API Key Test Page</h1>
      
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Local Pool Status</h2>
        {keyInfo && (
          <div>
            <p>Total Keys Loaded: <strong>{keyInfo.totalKeys || 0}</strong></p>
            <p>Available Keys: <strong>{keyInfo.availableKeys || 0}</strong></p>
            
            <div className="mt-4">
              <h3 className="font-semibold mb-2">Keys:</h3>
              {keyInfo.keys?.map((key: any, index: number) => (
                <div key={index} className="p-2 border rounded mb-2">
                  <p>Key {index + 1}: {key.key}</p>
                  <p>Available: {key.available ? '✅ Yes' : '❌ No'}</p>
                  <p>Usage Count: {key.usage?.count || 0}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Server API Response</h2>
        {keyInfo?.apiData ? (
          <pre className="bg-gray-100 p-4 rounded overflow-auto">
            {JSON.stringify(keyInfo.apiData, null, 2)}
          </pre>
        ) : (
          <p className="text-gray-500">Could not fetch from API (admin auth required)</p>
        )}
      </div>

      <div className="mt-6">
        <button
          onClick={checkApiKeys}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Refresh
        </button>
      </div>
    </div>
  );
} 