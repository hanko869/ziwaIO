'use client';

import { useEffect, useState } from 'react';

export default function AdminDashboard() {
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    // Check if admin session exists
    const adminSession = localStorage.getItem('admin_session');
    if (adminSession === 'true') {
      setIsAuthorized(true);
    } else {
      // Redirect to admin login
      window.location.href = '/admin';
    }
  }, []);

  if (!isAuthorized) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Stats Cards */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-sm font-medium text-gray-500 mb-2">Total Users</h2>
            <p className="text-3xl font-bold text-gray-900">0</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-sm font-medium text-gray-500 mb-2">Total Revenue</h2>
            <p className="text-3xl font-bold text-gray-900">$0</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-sm font-medium text-gray-500 mb-2">Active Subscriptions</h2>
            <p className="text-3xl font-bold text-gray-900">0</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-sm font-medium text-gray-500 mb-2">Credits Sold</h2>
            <p className="text-3xl font-bold text-gray-900">0</p>
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <a href="/admin/users" className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Manage Users</h3>
            <p className="text-gray-600">View and manage user accounts</p>
          </a>
          
          <a href="/admin/payments" className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Payment History</h3>
            <p className="text-gray-600">View all payment transactions</p>
          </a>
          
          <a href="/admin/settings" className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Settings</h3>
            <p className="text-gray-600">Configure pricing and system settings</p>
          </a>
        </div>
      </div>
    </div>
  );
} 