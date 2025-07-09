'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminDashboard from '@/components/admin/AdminDashboard';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/check', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const userData = await response.json();
        if (userData.role === 'admin') {
          setUser(userData);
        } else {
          router.push('/');
        }
      } else {
        router.push('/login');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  return <AdminDashboard />;
} 