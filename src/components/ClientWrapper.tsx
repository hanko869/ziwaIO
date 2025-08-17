'use client';

import { AuthProvider } from '@/contexts/AuthContext';
import ContactExtractorSubscription from './ContactExtractorSubscription';

export default function ClientWrapper() {
  return (
    <AuthProvider>
      <ContactExtractorSubscription />
    </AuthProvider>
  );
} 