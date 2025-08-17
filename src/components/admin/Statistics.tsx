'use client';

import React, { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function Statistics() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      const response = await fetch('/api/admin/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading statistics...</div>;
  }

  if (!stats) {
    return <div className="text-center py-8 text-gray-500">Failed to load statistics</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Overview Statistics</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Success Rate */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Extraction Success Rate</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-gray-900">{stats.successRate || 0}%</span>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Recent Activities</h3>
          <div className="space-y-2">
            {stats.recentActivities?.slice(0, 5).map((activity: any, index: number) => (
              <div key={index} className="text-sm">
                <span className="font-medium">{activity.username}</span>
                <span className="text-gray-500"> - {activity.action}</span>
                <span className="text-gray-400 text-xs ml-2">
                  {new Date(activity.timestamp).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Activity Chart Placeholder */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-sm font-medium text-gray-500 mb-4">Daily Activity</h3>
        <div className="h-48 flex items-center justify-center text-gray-400">
          <p>Activity chart visualization would go here</p>
        </div>
      </div>
    </div>
  );
} 