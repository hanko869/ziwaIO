'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Contact } from '@/types/contact';
import { isValidLinkedInUrl, extractContactFromLinkedIn, checkAPIConfiguration } from '@/utils/extraction';
import { saveContact, getStoredContacts, clearStoredContacts } from '@/utils/storage';
import { generateCSV, downloadCSV } from '@/utils/csv';
import { useLanguage, interpolate } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import DepositCredits from './DepositCredits';
import PaymentDetailsModal from './PaymentDetailsModal';
import { initializeApiKeys } from '@/utils/apiKeyLoader';
import { useExtractionSession } from '@/hooks/useExtractionSession';
import ExtractionWarningDialog from './ExtractionWarningDialog';
import ResumableExtractionBanner from './ResumableExtractionBanner';

const ContactExtractorSubscription: React.FC = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info' | 'warning'; message: string } | null>(null);
  const [apiConfigured, setApiConfigured] = useState<boolean | null>(null);
  const [bulkProgress, setBulkProgress] = useState<{ current: number; total: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [creditBalance, setCreditBalance] = useState<number | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState<any>(null);
  const [showNavigationWarning, setShowNavigationWarning] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<(() => void) | null>(null);

  // Use extraction session hook
  const {
    currentSession,
    isRecovering,
    createSession,
    updateSession,
    completeSession,
    cancelSession,
    getActiveSessions
  } = useExtractionSession();

  // Configuration constants
  const MAX_BULK_URLS = 500; // Increased from 100, max API limit is 2500
  const DELAY_BETWEEN_REQUESTS = 2000; // 2 seconds delay to avoid rate limiting

  // Initialize API keys on component mount
  useEffect(() => {
    initializeApiKeys();
  }, []);

  // Function to fetch contacts from database
  const fetchContactsFromDatabase = async () => {
    if (!user?.id) {
      setContacts([]); // No user, no contacts
      return;
    }
    
    try {
      const response = await fetch(`/api/contacts?userId=${user.id}&limit=10000`);
      if (response.ok) {
        const data = await response.json();
        const dbContacts = data.data || [];
        console.log('Fetched contacts from database:', dbContacts.length);
        
        // Transform database contacts to match our Contact interface
        const transformedContacts: Contact[] = dbContacts.map((dbContact: any) => ({
          id: dbContact.id,
          linkedinUrl: dbContact.linkedin_url,
          name: dbContact.name,
          emails: dbContact.emails || [],
          phones: dbContact.phones || [],
          extractedAt: dbContact.extracted_at,
          jobTitle: dbContact.job_title,
          company: dbContact.company,
          location: dbContact.location
        }));
        
        console.log('Transformed contacts:', transformedContacts.length);
        setContacts(transformedContacts);
      } else {
        console.error('Failed to fetch contacts:', response.status, response.statusText);
        // Don't show error to user, just use empty contacts
        setContacts([]);
      }
    } catch (error) {
      console.error('Error fetching contacts from database:', error);
      // Don't show error to user, just use empty contacts
      setContacts([]);
    }
  };

  // Load contacts from database and check API configuration on component mount
  useEffect(() => {
    // Clear any old localStorage data
    clearStoredContacts(user?.id);
    
    // Load contacts from database
    fetchContactsFromDatabase();
    
    // Check API configuration
    checkAPIConfiguration().then(configured => {
      setApiConfigured(configured);
    });
    
    // Fetch user's credit balance
    fetchCreditBalance();
  }, [user]);

  useEffect(() => {
    fetchCreditBalance();
    
    // Check if returning from payment
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment');
    const npId = urlParams.get('NP_id'); // NOWPayments ID from redirect
    const paymentId = localStorage.getItem('lastPaymentId') || npId;
    
    if (paymentStatus === 'success' && paymentId) {
      console.log('Checking payment status for:', paymentId);
      // Check payment status and update credits
      checkPaymentStatus(paymentId);
      localStorage.removeItem('lastPaymentId');
    }
  }, [user]);

  // Set up navigation warning when extraction is in progress
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isExtracting || currentSession?.status === 'in_progress') {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isExtracting, currentSession]);

  const checkPaymentStatus = async (paymentId: string) => {
    try {
      showFeedback('info', 'Verifying payment...');
      const response = await fetch('/api/payment/check-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId })
      });
      
      const data = await response.json();
      console.log('Payment check response:', data);
      
      if (data.success) {
        showFeedback('success', `Payment confirmed! ${data.creditsAdded || 0} credits have been added to your account.`);
        fetchCreditBalance(); // Refresh credit balance
      } else {
        showFeedback('error', data.message || 'Payment verification failed. Please contact support.');
        console.error('Payment check failed:', data);
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
      showFeedback('error', 'Failed to verify payment. Please contact support.');
    }
  };

  const fetchCreditBalance = async () => {
    try {
      const response = await fetch('/api/credits/balance', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setCreditBalance(data.balance);
      }
    } catch (error) {
      console.error('Failed to fetch credit balance:', error);
    }
  };

  const showFeedback = (type: 'success' | 'error' | 'info' | 'warning', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 7000);
  };

  const handlePaymentComplete = async () => {
    setShowPaymentModal(false);
    // Refresh credit balance
    await fetchCreditBalance();
    showFeedback('success', 'Payment successful! Credits have been added to your account.');
  };

  const handleExtractContact = async () => {
    if (!linkedinUrl.trim()) {
      showFeedback('error', t.feedback.enterUrl);
      return;
    }

    if (!isValidLinkedInUrl(linkedinUrl)) {
      showFeedback('error', t.feedback.invalidUrl);
      return;
    }

    // Check API configuration before proceeding
    if (apiConfigured === false) {
      showFeedback('error', t.feedback.apiNotConfigured);
      return;
    }

    // Check if user has credits
    if (creditBalance !== null && creditBalance < 1) {
      showFeedback('error', 'Insufficient credits. Please deposit more credits.');
      setShowPaymentModal(true);
      return;
    }

    setIsExtracting(true);
    showFeedback('info', t.feedback.extracting);

    // Create extraction session (optional, don't fail if it errors)
    let session = null;
    try {
      session = await createSession('single', [linkedinUrl]);
    } catch (error) {
      console.log('Session creation failed, continuing without session:', error);
    }

    try {
      const result = await extractContactFromLinkedIn(linkedinUrl, user?.id);
      
      if (result.success && result.contact) {
        // Add the new contact to state (database save happens in extraction)
        setContacts(prev => [...prev, result.contact!]);
        setLinkedinUrl('');
        
        // Refresh credit balance after extraction
        await fetchCreditBalance();
        
        const emailCount = result.contact.emails?.length || (result.contact.email ? 1 : 0);
        const phoneCount = result.contact.phones?.length || (result.contact.phone ? 1 : 0);
        
        const contactInfo = [];
        if (emailCount > 0) {
          const emailText = emailCount === 1 ? 
            interpolate(t.feedback.email_one, { count: emailCount }) : 
            interpolate(t.feedback.email_other, { count: emailCount });
          contactInfo.push(emailText);
        }
        if (phoneCount > 0) {
          const phoneText = phoneCount === 1 ? 
            interpolate(t.feedback.phone_one, { count: phoneCount }) : 
            interpolate(t.feedback.phone_other, { count: phoneCount });
          contactInfo.push(phoneText);
        }
        
        const detailInfo = contactInfo.length > 0 ? 
          interpolate(t.feedback.foundDetails, { details: contactInfo.join(` ${t.feedback.and} `) }) : 
          t.feedback.limitedInfo;
        
        const creditsUsed = emailCount * 1 + phoneCount * 2;
        const successMessage = `✅ Extraction Successful!\n\n` +
          `👤 ${result.contact.name || 'Unknown'}\n` +
          `💼 ${result.contact.jobTitle || 'No title'} at ${result.contact.company || 'No company'}\n` +
          `📍 ${result.contact.location || 'No location'}\n\n` +
          `📧 Emails found: ${emailCount}\n` +
          `📱 Phone numbers found: ${phoneCount}\n` +
          `💰 Credits used: ${creditsUsed}`;
        
        showFeedback('success', successMessage);
        
        // Add the contact to the local list
        setContacts(prevContacts => [result.contact, ...prevContacts]);
        
        // Clear the input field
        setLinkedinUrl('');
        
        // Refresh credit balance
        await fetchCreditBalance();
      } else {
        showFeedback('error', result.error || t.feedback.failedExtract);
      }
      
      // Complete session
      if (session) {
        await completeSession(session.id, {
          processed_urls: 1,
          successful_extractions: result.success ? 1 : 0,
          failed_extractions: result.success ? 0 : 1
        });
      }
    } catch (error) {
      console.error('Contact extraction error:', error);
      showFeedback('error', t.feedback.unexpectedError);
      
      // Mark session as failed
      if (session) {
        await updateSession(session.id, {
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    } finally {
      setIsExtracting(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check if it's a text file
    if (!file.name.endsWith('.txt')) {
      showFeedback('error', t.feedback.wrongFileType);
      return;
    }

    // Check API configuration before proceeding
    if (apiConfigured === false) {
      showFeedback('error', t.feedback.apiNotConfigured);
      return;
    }

    try {
      const text = await file.text();
      const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
      
      // Extract valid LinkedIn URLs
      const validUrls: string[] = [];
      const invalidLines: string[] = [];
      
      lines.forEach(line => {
        if (isValidLinkedInUrl(line)) {
          validUrls.push(line);
        } else if (line.includes('linkedin.com')) {
          // Try to fix common URL issues
          let fixedUrl = line;
          if (!line.startsWith('http')) {
            fixedUrl = 'https://' + line;
          }
          if (isValidLinkedInUrl(fixedUrl)) {
            validUrls.push(fixedUrl);
          } else {
            invalidLines.push(line);
          }
        } else {
          invalidLines.push(line);
        }
      });

      if (validUrls.length === 0) {
        showFeedback('error', t.feedback.noValidUrls);
        return;
      }

      if (validUrls.length > MAX_BULK_URLS) {
        showFeedback('error', interpolate(t.feedback.tooManyUrls, { count: validUrls.length }));
        return;
      }

      if (invalidLines.length > 0) {
        showFeedback('warning', interpolate(t.feedback.someInvalidUrls, { 
          valid: validUrls.length, 
          invalid: invalidLines.length 
        }));
      } else {
        showFeedback('info', interpolate(t.feedback.processingUrls, { count: validUrls.length }));
      }

      setIsExtracting(true);
      
      // Create extraction session (skip if it fails)
      console.log('Creating extraction session for', validUrls.length, 'URLs');
      let session = null;
      try {
        session = await createSession('bulk', validUrls);
        console.log('Created session:', session);
      } catch (error) {
        console.log('Session creation failed, continuing without session tracking:', error);
      }
      
      let successCount = 0;
      let failedCount = 0;
      let noContactCount = 0;
      let errorCount = 0;
      const extractedContacts: Contact[] = [];
      setBulkProgress({ current: 0, total: validUrls.length });

      try {
        // Use the server-side bulk extraction API
        console.log('Starting server-side bulk extraction for', validUrls.length, 'URLs');
        
        // Generate a unique progress ID
        const progressId = `progress-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // Start the extraction
        const extractionPromise = fetch('/api/extract-bulk-simple', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            urls: validUrls,
            userId: user?.id,
            sessionId: session?.id,
            progressId: progressId
          })
        });

        // Poll for progress updates
        let pollInterval: NodeJS.Timeout | null = null;
        
        // Use progress ID for polling
        console.log('Starting progress polling with ID:', progressId);
        pollInterval = setInterval(async () => {
          try {
            // Try the new progress endpoint first
            const progressResponse = await fetch(`/api/extract-bulk-simple/progress?id=${progressId}`);
            if (progressResponse.ok) {
              const progressData = await progressResponse.json();
              console.log('Progress update:', progressData);
              
              // Only update progress if we have valid data (not pending/not_found)
              if (progressData.status !== 'pending' && progressData.status !== 'not_found') {
                if (progressData.processed !== undefined && progressData.total > 0) {
                  console.log('Setting bulk progress:', progressData.processed, '/', progressData.total);
                  setBulkProgress({ 
                    current: progressData.processed, 
                    total: progressData.total || validUrls.length 
                  });
                }
              } else {
                console.log('Progress status is pending/not_found, keeping existing progress');
              }
              // If pending, keep the existing progress (don't reset to 0)
              
              // Stop polling if extraction is complete
              if (progressData.status === 'completed') {
                if (pollInterval) clearInterval(pollInterval);
              }
            } else {
              console.error('Progress response not ok:', progressResponse.status);
            }
          } catch (error) {
            console.error('Error polling progress:', error);
          }
        }, 1000); // Poll every second

        // Wait for extraction to complete
        const response = await extractionPromise;
        
        // Stop polling
        if (pollInterval) clearInterval(pollInterval);

        if (!response.ok) {
          console.error('Bulk extraction failed:', response.status, response.statusText);
          const errorText = await response.text();
          console.error('Error response:', errorText);
          
          let error;
          try {
            error = JSON.parse(errorText);
          } catch (e) {
            error = { error: errorText || 'Bulk extraction failed' };
          }
          throw new Error(error.error || 'Bulk extraction failed');
        }

        const data = await response.json();
        console.log('Bulk extraction response:', data);

        // Process results
        if (data.results && Array.isArray(data.results)) {
          data.results.forEach((result: any) => {
            if (result.success && result.contact) {
              extractedContacts.push(result.contact);
              // Check if contact has any info
              const hasPhone = result.contact.phones && result.contact.phones.length > 0;
              if (hasPhone) {
                successCount++;
              } else {
                noContactCount++;
              }
            } else {
              failedCount++;
              // Check if it's a specific error type
              if (result.error?.includes('Service temporarily unavailable')) {
                errorCount++;
              }
            }
          });
          
          // Set final progress
          setBulkProgress({ current: validUrls.length, total: validUrls.length });
        }

        // Update stats from server response
        if (data.stats) {
          successCount = data.stats.successful || successCount;
          failedCount = data.stats.failed || failedCount;
        }
      } catch (error) {
        console.error('Bulk extraction error:', error);
        showFeedback('error', error instanceof Error ? error.message : 'Bulk extraction failed');
        
        // Mark session as failed
        if (session) {
          await updateSession(session.id, {
            status: 'failed',
            error_message: error instanceof Error ? error.message : 'Unknown error'
          });
        }
        
        setIsExtracting(false);
        setBulkProgress(null);
        return;
      }

      // Wait a moment for database writes to complete
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Add only the new extracted contacts to the list (don't fetch all from DB)
      setContacts(prevContacts => [...extractedContacts, ...prevContacts]);
      
      // Refresh credit balance
      await fetchCreditBalance();
      
      // Complete session
      if (session) {
        await completeSession(session.id, {
          processed_urls: validUrls.length,
          successful_extractions: successCount,
          failed_extractions: failedCount
        });
      }
      
      // Clear progress bar before showing results
      setIsExtracting(false);
      setBulkProgress(null);
      
      // Create detailed success message
      const totalProcessed = lines.length;
      const message = `Extraction Complete!\n\n` +
        `📊 Summary:\n` +
        `• Total URLs submitted: ${totalProcessed}\n` +
        `• Valid LinkedIn URLs: ${validUrls.length}\n` +
        `• Invalid URLs: ${invalidLines.length}\n\n` +
        `✅ Results:\n` +
        `• Successful extractions: ${successCount} (found contact info)\n` +
        `• Profiles without contact info: ${noContactCount}\n` +
        `• Failed extractions: ${failedCount}\n` +
        (errorCount > 0 ? `• Service errors: ${errorCount}\n` : '') +
        `\n💰 Credits used: ${successCount * 2}`;
      
      showFeedback('success', message);

    } catch (error) {
      console.error('File upload error:', error);
      showFeedback('error', t.feedback.fileReadError);
      
      // Mark session as failed
      if (session) {
        await updateSession(session.id, {
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'File processing error'
        });
      }
    } finally {
      setIsExtracting(false);
      setBulkProgress(null);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDownloadCSV = async () => {
    if (contacts.length === 0) {
      showFeedback('error', t.feedback.noContactsDownload);
      return;
    }

    try {
      const csvContent = generateCSV(contacts);
      const timestamp = new Date().toISOString().split('T')[0];
      downloadCSV(csvContent, `linkedin_contacts_${timestamp}.csv`);
      
      // Clear all data after successful download (DB + client)
      if (user?.id) {
        try {
          await fetch(`/api/contacts?userId=${user.id}`, { method: 'DELETE' });
        } catch (e) {
          console.error('Failed to delete contacts from DB:', e);
        }
      }
      clearStoredContacts(user?.id);
      setContacts([]);
      showFeedback('success', interpolate(t.feedback.downloadSuccess, { count: contacts.length }));
    } catch (error) {
      console.error('CSV download error:', error);
      showFeedback('error', t.feedback.csvError);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isExtracting) {
      handleExtractContact();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Header with Credits */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-center">
            {t.hero.title}
          </h1>
          <p className="text-xl text-center mb-8 opacity-90">
            {t.hero.subtitle}
          </p>
          <div className="flex items-center justify-center">
            <div className="bg-white/20 backdrop-blur-sm rounded-full px-8 py-4 flex items-center gap-4">
              <span className="text-lg font-medium">
                Credit Balance: 
                <span className="text-2xl font-bold ml-2">
                  {user?.role === 'admin' ? '∞' : (creditBalance === null ? '...' : creditBalance)}
                </span>
                {user?.role === 'admin' ? ' (Unlimited)' : ' credits'}
              </span>
              {user?.role !== 'admin' && (
                <button
                  onClick={() => setShowPaymentModal(true)}
                  className="ml-4 px-4 py-1 bg-white text-purple-600 rounded-full text-sm font-medium hover:bg-purple-50 transition-colors"
                >
                  Deposit Credits
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Resumable Session Banner */}
        {!isRecovering && currentSession && currentSession.status === 'in_progress' && (
          <ResumableExtractionBanner
            session={currentSession}
            onResume={async () => {
              // Resume extraction with remaining URLs
              const remainingUrls = currentSession.urls.filter(
                (_, index) => !currentSession.processed_url_indices.includes(index)
              );
              setIsExtracting(true);
              setBulkProgress({ 
                current: currentSession.processed_urls, 
                total: currentSession.total_urls 
              });
              // Continue processing remaining URLs
              // TODO: Implement resume logic
              showFeedback('info', 'Resuming extraction...');
            }}
            onDismiss={() => {
              cancelSession(currentSession.id);
            }}
          />
        )}
        
        {/* Feedback Message */}
        {feedback && (
          <div className={`mb-6 p-4 rounded-2xl shadow-sm whitespace-pre-line transform transition-all duration-300 ${
            feedback.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' :
            feedback.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' :
            feedback.type === 'warning' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
            'bg-blue-50 text-blue-800 border border-blue-200'
          }`}>
            <div className="flex items-start">
              <div className="flex-shrink-0">
                {feedback.type === 'success' && (
                  <svg className="h-5 w-5 text-green-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
                {feedback.type === 'error' && (
                  <svg className="h-5 w-5 text-red-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">{feedback.message}</p>
              </div>
            </div>
          </div>
        )}

        {/* URL Input Section */}
        <div className="bg-white rounded-3xl shadow-xl p-8 mb-8 border border-gray-100">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{t.extraction.title}</h2>
            <p className="text-gray-600">{t.extraction.subtitle}</p>
          </div>
          
          <div className="flex flex-col gap-6">
            {/* Single URL Input */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </div>
                <input
                  type="url"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={t.extraction.singleUrlPlaceholder}
                  className="pl-10 w-full px-4 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-purple-100 focus:border-purple-500 outline-none text-gray-900 placeholder-gray-400 transition-all duration-200"
                  disabled={isExtracting}
                />
              </div>
              <button
                onClick={handleExtractContact}
                disabled={isExtracting || (apiConfigured === false)}
                className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl font-semibold hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center min-w-[200px]"
              >
                {isExtracting && !bulkProgress ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {t.extraction.extracting}
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                    </svg>
                    {t.extraction.extractButton}
                  </>
                )}
              </button>
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">{t.extraction.or}</span>
              </div>
            </div>

            {/* File Upload */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{t.extraction.bulkUpload.title}</h3>
                  <p className="text-sm text-gray-600">{t.extraction.bulkUpload.subtitle}</p>
                </div>
                <label className="relative">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".txt"
                    onChange={handleFileUpload}
                    disabled={isExtracting}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isExtracting}
                    className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    {t.extraction.bulkUpload.chooseFile}
                  </button>
                </label>
              </div>

              {/* Progress Bar */}
              {bulkProgress && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>{t.extraction.bulkUpload.processing}</span>
                    <span>{bulkProgress.current} / {bulkProgress.total}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-gradient-to-r from-indigo-600 to-purple-600 h-2.5 rounded-full transition-all duration-300"
                      style={{ width: `${(bulkProgress.current / bulkProgress.total) * 100}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Pricing Info */}
          <div className="mt-6 bg-purple-50 rounded-xl p-4 text-sm">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                                     <p className="text-purple-900 font-medium">Email: 1 credit | Phone: 2 credits</p>
                <p className="text-purple-700">No charge if no results found</p>
              </div>
              <div className="text-right">
                <p className="text-purple-900 font-medium">Minimum deposit: 10 USDT</p>
                <p className="text-purple-700">30 credits / USDT</p>
              </div>
            </div>
          </div>
        </div>

        {/* Contacts List Section */}
        <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">
                {t.contacts.title}
              </h2>
              <p className="text-gray-600">
                {contacts.length === 1 ? 
                  interpolate(t.contacts.count_one, { count: contacts.length }) : 
                  interpolate(t.contacts.count_other, { count: contacts.length })}
              </p>
            </div>
            <div className="flex gap-3">
              {contacts.some(contact => !contact.email && !contact.phone) && (
                <button
                  onClick={() => {
                    const contactsWithInfo = contacts.filter(contact => 
                      (contact.emails && contact.emails.length > 0) || 
                      (contact.phones && contact.phones.length > 0) ||
                      contact.email || 
                      contact.phone
                    );
                    setContacts(contactsWithInfo);
                    showFeedback('info', t.feedback.removedContacts);
                  }}
                  className="px-5 py-2.5 bg-amber-100 text-amber-700 rounded-xl font-medium hover:bg-amber-200 transition-colors duration-200 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  {t.contacts.cleanUp}
                </button>
              )}
              {contacts.length > 0 && (
                <button
                  onClick={handleDownloadCSV}
                  className="px-5 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-medium hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  {t.contacts.downloadCSV}
                </button>
              )}
            </div>
          </div>

          {contacts.length === 0 ? (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-4">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{t.contacts.noContacts}</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                {t.contacts.noContactsDesc}
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {contacts.map((contact) => (
                <div key={contact.id} className={`group relative overflow-hidden rounded-2xl border-2 p-6 transition-all duration-200 hover:shadow-lg ${
                  !contact.email && !contact.phone ? 'border-amber-200 bg-amber-50/50' : 'border-gray-200 bg-white hover:border-purple-200'
                }`}>
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                          {contact.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 text-lg">{contact.name}</h3>
                          {(!contact.emails || contact.emails.length === 0) && 
                           (!contact.phones || contact.phones.length === 0) && 
                           !contact.email && !contact.phone && (
                            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">
                              {t.contacts.noContactInfo}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        {/* Display all emails */}
                        {contact.emails && contact.emails.length > 0 ? (
                          <div className="space-y-1">
                            {contact.emails?.map((email, index) => (
                              <div key={`email-${index}`} className="flex items-center gap-2 text-gray-600">
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                <span>{email}</span>
                                {index === 0 && contact.emails && contact.emails.length > 1 && (
                                  <span className="text-xs text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full">{t.contacts.primary}</span>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : contact.email ? (
                          <div className="flex items-center gap-2 text-gray-600">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            <span>{contact.email}</span>
                          </div>
                        ) : null}
                        
                        {/* Display all phone numbers */}
                        {contact.phones && contact.phones.length > 0 ? (
                          <div className="space-y-1">
                            {contact.phones?.map((phone, index) => (
                              <div key={`phone-${index}`} className="flex items-center gap-2 text-gray-600">
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                                <span>{phone}</span>
                                {index === 0 && contact.phones && contact.phones.length > 1 && (
                                  <span className="text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded-full">{t.contacts.primary}</span>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : contact.phone ? (
                          <div className="flex items-center gap-2 text-gray-600">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            <span>{contact.phone}</span>
                          </div>
                        ) : null}

                        {/* Display job title and company */}
                        {(contact.jobTitle || contact.company) && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            <span>
                              {contact.jobTitle && contact.company ? `${contact.jobTitle} at ${contact.company}` :
                               contact.jobTitle || contact.company}
                            </span>
                          </div>
                        )}

                        {/* Display location */}
                        {contact.location && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            <span>{contact.location}</span>
                          </div>
                        )}

                        {/* Display education - Note: Not available from API */}
                        {contact.education && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14v7" />
                            </svg>
                            <span>{contact.education}</span>
                          </div>
                        )}
                        
                        {(!contact.emails || contact.emails.length === 0) && 
                         (!contact.phones || contact.phones.length === 0) && 
                         !contact.email && !contact.phone && (
                          <div className="text-amber-600 text-sm italic">
                            {t.contacts.profileNoInfo}
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2 pt-2">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                          </svg>
                          <a href={contact.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:text-purple-700 font-medium">
                            {t.contacts.viewProfile}
                          </a>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <span className="text-xs text-gray-500">
                        {new Date(contact.extractedAt).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Payment Modal */}
      {showPaymentModal && (
        user?.id ? (
          <PaymentModal 
            userId={user.id} 
            onClose={() => setShowPaymentModal(false)}
            onPaymentComplete={handlePaymentComplete}
          />
        ) : (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Login Required</h2>
              <p className="text-gray-600 mb-6">
                Please log in to deposit credits. Your payment and credits need to be associated with your account.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => window.location.href = '/login'}
                  className="flex-1 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors"
                >
                  Go to Login
                </button>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 py-3 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
};

// Payment Modal Component
function PaymentModal({ userId, onClose, onPaymentComplete }: { 
  userId: string; 
  onClose: () => void;
  onPaymentComplete: () => void;
}) {
  const { t } = useLanguage();
  const [depositAmount, setDepositAmount] = useState('10');
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState<any>(null);
  
  // Show the actual credits they'll receive (30 credits per USDT)
  const creditsToReceive = Math.floor(parseFloat(depositAmount || '0') * 30);

  const handlePayment = async () => {
    const amount = parseFloat(depositAmount);
    if (!amount || amount < 10) {
      alert('Minimum deposit is 10 USDT');
      return;
    }

    setPaymentLoading(true);
    
    try {
      // Create payment with NOWPayments
      const response = await fetch('/api/payment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          amount,
          currency: 'usdttrc20'
        })
      });

      const data = await response.json();
      console.log('Payment response:', data);
      console.log('Response status:', response.status);
      
      if (data.testMode) {
        // Test mode - simulate successful payment
        alert(`Test Mode: ${data.message}\nAmount: ${data.amount} USDT\nCredits: ${data.credits}`);
        
        // Simulate adding credits by calling the webhook
        const webhookResponse = await fetch('/api/payment/webhook', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            payment_id: data.paymentId,
            payment_status: 'finished',
            order_id: `${userId}_${Date.now()}`,
            price_amount: data.amount,
            price_currency: 'usd'
          })
        });
        
        if (webhookResponse.ok) {
          onClose();
          onPaymentComplete();
        } else {
          throw new Error('Failed to process test payment');
        }
      } else if (data.success && data.paymentUrl) {
        // Save payment ID for later verification
        if (data.paymentId) {
          localStorage.setItem('lastPaymentId', data.paymentId);
        }
        // Redirect to NOWPayments checkout
        window.location.href = data.paymentUrl;
      } else if (data.success && data.payAddress) {
        // Show payment details modal
        setPaymentDetails({
          paymentId: data.paymentId,
          payAddress: data.payAddress,
          payAmount: data.payAmount,
          payCurrency: data.payCurrency,
          createdAt: new Date().toISOString()
        });
      } else {
        throw new Error(data.error || 'Failed to create payment');
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert(error instanceof Error ? error.message : 'Payment failed. Please try again.');
    } finally {
      setPaymentLoading(false);
    }
  };

  // If we have payment details, show the PaymentDetailsModal
  if (paymentDetails) {
    return (
      <PaymentDetailsModal
        paymentData={paymentDetails}
        onClose={() => {
          setPaymentDetails(null);
          onClose();
        }}
        onPaymentComplete={onPaymentComplete}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Deposit Credits</h2>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Deposit Amount (USDT)
            </label>
            <input
              type="number"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              min="10"
              step="1"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Minimum deposit: 10 USDT
            </p>
          </div>

          <div className="bg-purple-50 rounded-xl p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-700">You will receive:</span>
              <span className="text-2xl font-bold text-purple-600">
                {creditsToReceive} credits
              </span>
            </div>
            <p className="text-sm text-gray-600">
              Estimated {Math.floor(creditsToReceive / 3)}-{creditsToReceive} extractions
            </p>
          </div>

          <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Total amount to pay:</span>
              <span className="text-xl font-bold text-amber-700">
                ${depositAmount} USD
              </span>
            </div>
            <p className="text-xs text-amber-600 mt-1">

            </p>
          </div>

          <button
            onClick={handlePayment}
            disabled={paymentLoading || !depositAmount || parseFloat(depositAmount) < 10}
            className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {paymentLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            ) : (
              'Proceed to Payment'
            )}
          </button>

          <div className="text-center text-sm text-gray-500">
            <p>Pay as you go - only charged for successful extractions</p>
            <p className="mt-1">Powered by NOWPayments</p>

          </div>
        </div>
      </div>
      
      {/* Navigation Warning Dialog */}
      <ExtractionWarningDialog
        isOpen={showNavigationWarning}
        onConfirm={() => {
          if (pendingNavigation) {
            pendingNavigation();
          }
          setShowNavigationWarning(false);
        }}
        onCancel={() => {
          setShowNavigationWarning(false);
          setPendingNavigation(null);
        }}
        progress={bulkProgress}
      />
    </div>
  );
}

export default ContactExtractorSubscription; 