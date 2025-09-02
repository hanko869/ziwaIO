import { NextRequest, NextResponse } from 'next/server';
import { extractContactsInParallel } from '@/utils/parallelExtraction';
import { initializeApiKeys } from '@/utils/apiKeyLoader';
import { getApiKeyPool } from '@/utils/apiKeyPool';
import { createClient } from '@supabase/supabase-js';
import { progressStore } from '@/utils/progressStore';

export async function POST(request: NextRequest) {
  try {
    const { urls, userId, sessionId, progressId } = await request.json();
    
    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json(
        { error: 'URLs array is required' },
        { status: 400 }
      );
    }
    
    // Initialize API keys on server side where all env vars are accessible
    console.log('Initializing API keys from environment...');
    console.log('WIZA_API_KEY exists:', !!process.env.WIZA_API_KEY);
    console.log('WIZA_API_KEY_2 exists:', !!process.env.WIZA_API_KEY_2);
    console.log('WIZA_API_KEY_3 exists:', !!process.env.WIZA_API_KEY_3);
    console.log('WIZA_API_KEY_4 exists:', !!process.env.WIZA_API_KEY_4);
    console.log('WIZA_API_KEY_5 exists:', !!process.env.WIZA_API_KEY_5);
    console.log('WIZA_API_KEY_6 exists:', !!process.env.WIZA_API_KEY_6);
    console.log('WIZA_API_KEY_7 exists:', !!process.env.WIZA_API_KEY_7);
    console.log('WIZA_API_KEY_8 exists:', !!process.env.WIZA_API_KEY_8);
    console.log('WIZA_API_KEY_9 exists:', !!process.env.WIZA_API_KEY_9);
    console.log('WIZA_API_KEY_10 exists:', !!process.env.WIZA_API_KEY_10);
    
    initializeApiKeys();
    const apiKeyPool = getApiKeyPool();
    const availableKeys = apiKeyPool?.getAvailableKeysCount() || 1;
    
    console.log(`Server: Starting bulk extraction with ${availableKeys} API keys for ${urls.length} URLs`);
    
    // Initialize Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    let supabase = null;
    
    if (supabaseUrl && supabaseKey) {
      supabase = createClient(supabaseUrl, supabaseKey);
    }
    
    // Update session if provided
    if (sessionId && supabase) {
      await supabase
        .from('extraction_sessions')
        .update({ status: 'in_progress', processed_urls: 0 })
        .eq('id', sessionId);
    }
    
    // Process extraction with optimized concurrency
    // Log extraction start details
    console.log(`Server: Starting bulk extraction`);
    console.log(`Server: Processing ${urls.length} URLs with ${availableKeys} API keys`);
    console.log(`Server: Environment - NODE_ENV: ${process.env.NODE_ENV || 'development'}, VERCEL_ENV: ${process.env.VERCEL_ENV || 'not-vercel'}`);
    
    const extractionStartTime = Date.now();
    let lastProgressUpdate = Date.now();
    
    // Initialize progress tracking
    if (progressId) {
      const initialProgress = {
        total: urls.length,
        processed: 0,
        successful: 0,
        failed: 0,
        started: 0,
        lastUpdate: Date.now(),
        status: 'in_progress' as const
      };
      progressStore.set(progressId, initialProgress);
      console.log('Initialized progress tracking for:', progressId);
    }
    
    // Calculate optimal concurrency explicitly - SPEED IS PRIORITY
    const optimalConcurrency = Math.min(availableKeys * 10, 100);
    console.log(`Server: Using ${optimalConcurrency} concurrent requests (${availableKeys} keys * 10 multiplier, max 100)`);
    
    const results = await extractContactsInParallel(urls, {
      maxConcurrent: optimalConcurrency, // Explicitly set concurrency for maximum speed
      delayBetweenBatches: 0, // No delay for maximum speed
      onProgress: async (completed, total) => {
        const elapsed = Date.now() - extractionStartTime;
        const rate = completed / (elapsed / 1000);
        console.log(`Server: Progress ${completed}/${total} (${rate.toFixed(1)} URLs/sec, ${(elapsed/1000).toFixed(1)}s elapsed)`);
        
        // Update progress tracking
        if (progressId) {
          const currentProgress = progressStore.get(progressId);
          if (currentProgress) {
            progressStore.set(progressId, {
              ...currentProgress,
              processed: completed,
              lastUpdate: Date.now()
            });
            // Log only key milestones
            if (completed === 1 || completed % 50 === 0 || completed === total) {
              console.log(`Extraction progress: ${completed}/${total} for ID: ${progressId}`);
            }
          } else {
            console.warn(`No progress found for ID: ${progressId} when trying to update`);
          }
        }
        
        // Update session progress if available
        if (sessionId && supabase) {
          await supabase
            .from('extraction_sessions')
            .update({
              processed_urls: completed,
              successful_extractions: 0,
              failed_extractions: 0
            })
            .eq('id', sessionId);
        }
      }
    });
    
    const extractionTime = Date.now() - extractionStartTime;
    console.log(`Server: Bulk extraction completed in ${extractionTime}ms (${(extractionTime / 1000).toFixed(1)}s)`);
    console.log(`Server: Average time per URL: ${(extractionTime / urls.length).toFixed(0)}ms`);
    
    // Count successful extractions and calculate credits
    let successCount = 0;
    let creditsUsed = 0;
    let totalEmails = 0;
    let totalPhones = 0;
    
    // Save contacts to database if userId provided
    // (Supabase already initialized above)
    
    // Process results and save to database
    let processedIndices: number[] = [];
    let serviceErrors = 0;
    let noContactErrors = 0;
    let otherErrors = 0;
    
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      if (result.success && result.contact) {
        successCount++;
        processedIndices.push(i);
        // Our pricing: 1 credit per email, 2 credits per phone
        const emailCount = result.contact.emails?.length || 0;
        const phoneCount = result.contact.phones?.length || 0;
        totalEmails += emailCount;
        totalPhones += phoneCount;
        creditsUsed += (emailCount * 1) + (phoneCount * 2);
        
        // Skip database saving for bulk extractions - users download immediately
        // Database saving was causing unnecessary delays
      } else {
        // Count error types
        if (result.error?.includes('Service temporarily unavailable')) {
          serviceErrors++;
        } else if (result.error?.includes('no contact information')) {
          noContactErrors++;
        } else {
          otherErrors++;
        }
      }
    }
    
    console.log(`Extraction Summary: ${successCount} successful, ${serviceErrors} service errors, ${noContactErrors} no contact info, ${otherErrors} other errors`);
    

    
    // Update final progress
    if (progressId) {
      const currentProgress = progressStore.get(progressId);
      if (currentProgress) {
        progressStore.set(progressId, {
          ...currentProgress,
          processed: results.length,
          successful: successCount,
          failed: results.length - successCount,
          lastUpdate: Date.now(),
          status: 'completed'
        });
      }
    }
    
    // Deduct credits if userId provided
    if (userId && creditsUsed > 0) {
      try {
        // Import creditService
        const { creditService } = await import('@/lib/credits');
        await creditService.deductCredits(userId, creditsUsed, 'bulk_extraction');
        console.log(`Bulk extraction: Deducted ${creditsUsed} credits for ${totalEmails} email(s) x 1 + ${totalPhones} phone(s) x 2`);
      } catch (creditError) {
        console.error('Credit deduction error:', creditError);
        // Continue without deducting credits
      }
    }
    
    // Update session with final stats if provided
    // (Supabase already initialized above)
    
    if (sessionId && supabase) {
      await supabase
        .from('extraction_sessions')
        .update({
          processed_urls: results.length,
          successful_extractions: successCount,
          failed_extractions: results.length - successCount,
          credits_used: creditsUsed,
          processed_url_indices: processedIndices,
          results: results,
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', sessionId);
    }
    
    // Log final API key usage
    const finalKeyStats = apiKeyPool?.getAllKeysStatus();
    console.log('Server: Final API key usage:', finalKeyStats);
    
    return NextResponse.json({
      success: true,
      results,
      stats: {
        total: urls.length,
        successful: successCount,
        failed: urls.length - successCount,
        apiKeysUsed: availableKeys
      }
    });
    
  } catch (error) {
    console.error('Bulk extraction error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Extraction failed' 
      },
      { status: 500 }
    );
  }
}
