'use client';

import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Users, DollarSign, Activity, Settings, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import UserManagement from './UserManagement';
import ActivityLog from './ActivityLog';
import Statistics from './Statistics';
import SystemSettings from './SystemSettings';

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalExtractions: 0,
    totalRevenue: 0,
    todayActivity: 0
  });

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch('/api/admin/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                {stats.activeUsers} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Extractions</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalExtractions}</div>
              <p className="text-xs text-muted-foreground">
                All time
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.totalRevenue}</div>
              <p className="text-xs text-muted-foreground">
                Total revenue
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Activity</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.todayActivity}</div>
              <p className="text-xs text-muted-foreground">
                Actions today
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Statistics />
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <UserManagement />
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <ActivityLog />
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <SystemSettings />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 