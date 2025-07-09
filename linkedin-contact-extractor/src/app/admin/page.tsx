'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminAccess() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to login page
    // The middleware will handle authentication and role checking
    router.push('/login?redirect=/admin/dashboard');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-gray-900">Redirecting to login...</h2>
      </div>
    </div>
  );
} 