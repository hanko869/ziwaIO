'use client';

import React, { useState } from 'react';
import { Settings, Save } from 'lucide-react';

export default function SystemSettings() {
  const [settings, setSettings] = useState({
    creditsPerEmail: 1,
    creditsPerPhone: 2,
    creditsPerUSDT: 30,
    minDepositUSDT: 20
  });

  const handleSave = async () => {
    alert('Settings saved! (This is a placeholder - backend integration needed)');
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">System Settings</h2>
      
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Pricing Configuration</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Credits per Email
            </label>
            <input
              type="number"
              value={settings.creditsPerEmail}
              onChange={(e) => setSettings({ ...settings, creditsPerEmail: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Credits per Phone
            </label>
            <input
              type="number"
              value={settings.creditsPerPhone}
              onChange={(e) => setSettings({ ...settings, creditsPerPhone: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Credits per USDT
            </label>
            <input
              type="number"
              value={settings.creditsPerUSDT}
              onChange={(e) => setSettings({ ...settings, creditsPerUSDT: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Minimum Deposit (USDT)
            </label>
            <input
              type="number"
              value={settings.minDepositUSDT}
              onChange={(e) => setSettings({ ...settings, minDepositUSDT: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>
        
        <div className="mt-6">
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
} 