import { NextRequest, NextResponse } from 'next/server';
import { searchProspects } from '@/utils/wiza';
import { initializeApiKeys } from '@/utils/apiKeyLoader';
import { getApiKeyPool } from '@/utils/apiKeyPool';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Extract search parameters from the request
    const { 
      firstName, 
      lastName, 
      jobTitle, 
      location,
      size = 20 // Default to 20 results
    } = body;

    console.log('Prospect search request:', { firstName, lastName, jobTitle, location, size });

    // Validate at least one search parameter is provided
    if (!firstName && !lastName && !jobTitle && !location) {
      return NextResponse.json(
        { error: 'At least one search parameter is required' },
        { status: 400 }
      );
    }

    // Initialize API keys and get one from the pool
    initializeApiKeys();
    const apiKeyPool = getApiKeyPool();
    const apiKey = apiKeyPool?.getNextKey();

    if (!apiKey) {
      return NextResponse.json(
        { error: 'No API keys available' },
        { status: 503 }
      );
    }

    // Call Wiza prospect search with API key
    const searchResults = await searchProspects(
      firstName,
      lastName,
      jobTitle,
      location,
      size,
      apiKey
    );

    console.log('Wiza search response:', {
      status: searchResults.status,
      totalResults: searchResults.data?.total || 0,
      profilesReturned: searchResults.data?.profiles?.length || 0
    });

    // Transform Wiza results to match our UI format
    const profiles = searchResults.data?.profiles?.map((profile: any, index: number) => ({
      id: `profile-${index}`,
      name: profile.full_name || 'Unknown',
      headline: profile.job_title || '',
      location: profile.location_name || '',
      profileUrl: profile.linkedin_url?.startsWith('http') 
        ? profile.linkedin_url 
        : `https://www.${profile.linkedin_url}`,
      company: profile.job_company_name || '',
      industry: profile.industry || ''
    })) || [];

    return NextResponse.json({
      success: true,
      total: searchResults.data?.total || 0,
      profiles
    });

  } catch (error) {
    console.error('Prospect search error:', error);
    
    let errorMessage = 'Failed to search prospects';
    if (error instanceof Error) {
      errorMessage = error.message;
      
      // Handle specific Wiza API errors
      if (error.message.includes('401')) {
        errorMessage = 'API authentication failed. Please check your Wiza API key.';
      } else if (error.message.includes('429')) {
        errorMessage = 'Rate limit exceeded. Please try again later.';
      } else if (error.message.includes('credits')) {
        errorMessage = 'Insufficient API credits for prospect search.';
      }
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}