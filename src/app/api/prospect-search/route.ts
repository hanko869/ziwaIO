import { NextRequest, NextResponse } from 'next/server';

// ProxyCurl API integration example
// You would need to sign up at https://proxycurl.com and get an API key
const PROXYCURL_API_KEY = process.env.PROXYCURL_API_KEY || '';

async function searchLinkedInProfiles(criteria: any) {
  // If no API key, return mock data
  if (!PROXYCURL_API_KEY) {
    return generateMockProfiles(criteria);
  }

  try {
    // ProxyCurl person search endpoint
    const searchParams = new URLSearchParams();
    
    // Build search query
    if (criteria.location) {
      searchParams.append('country', criteria.location);
    }
    
    // ProxyCurl uses different parameters, this is an example
    // Actual implementation would map your criteria to their API format
    const response = await fetch(
      `https://api.proxycurl.com/api/v2/search/person?${searchParams.toString()}`,
      {
        headers: {
          'Authorization': `Bearer ${PROXYCURL_API_KEY}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('ProxyCurl API error');
    }

    const data = await response.json();
    
    // Transform ProxyCurl results to match our format
    return data.results.map((person: any, index: number) => ({
      id: String(index + 1),
      name: person.full_name || 'Unknown',
      headline: person.headline || person.occupation || '',
      location: person.location || '',
      profileUrl: person.linkedin_url || '',
      experience: person.experiences?.[0]?.title || ''
    }));
    
  } catch (error) {
    console.error('ProxyCurl search error:', error);
    // Fallback to mock data if API fails
    return generateMockProfiles(criteria);
  }
}

// Mock data for demonstration
function generateMockProfiles(criteria: any) {
  const allProfiles = [
    {
      id: '1',
      name: 'John Smith',
      headline: 'Senior Software Engineer at Tech Corp',
      location: 'New York, NY',
      profileUrl: 'https://linkedin.com/in/johnsmith',
      experience: '6-10 years'
    },
    {
      id: '2', 
      name: 'Sarah Johnson',
      headline: 'Product Manager | Building innovative solutions',
      location: 'San Francisco, CA',
      profileUrl: 'https://linkedin.com/in/sarahjohnson',
      experience: '3-5 years'
    },
    {
      id: '3',
      name: 'Michael Chen',
      headline: 'Data Scientist | Machine Learning Enthusiast',
      location: 'Seattle, WA',
      profileUrl: 'https://linkedin.com/in/michaelchen',
      experience: '6-10 years'
    },
    {
      id: '4',
      name: 'Emily Davis',
      headline: 'Marketing Director at Growth Startup',
      location: 'Austin, TX',
      profileUrl: 'https://linkedin.com/in/emilydavis',
      experience: '11-15 years'
    },
    {
      id: '5',
      name: 'Robert Wilson',
      headline: 'CEO & Founder | Serial Entrepreneur',
      location: 'Boston, MA',
      profileUrl: 'https://linkedin.com/in/robertwilson',
      experience: '16+ years'
    },
    {
      id: '6',
      name: 'Lisa Anderson',
      headline: 'UX Designer | Creating user-centric experiences',
      location: 'New York, NY',
      profileUrl: 'https://linkedin.com/in/lisaanderson',
      experience: '3-5 years'
    },
    {
      id: '7',
      name: 'David Martinez',
      headline: 'Sales Director | B2B SaaS Expert',
      location: 'Chicago, IL',
      profileUrl: 'https://linkedin.com/in/davidmartinez',
      experience: '11-15 years'
    },
    {
      id: '8',
      name: 'Jennifer Lee',
      headline: 'HR Manager | People & Culture Leader',
      location: 'New York, NY',
      profileUrl: 'https://linkedin.com/in/jenniferlee',
      experience: '6-10 years'
    }
  ];

  // Filter based on criteria
  let filtered = [...allProfiles];
  
  if (criteria.location) {
    filtered = filtered.filter(p => 
      p.location.toLowerCase().includes(criteria.location.toLowerCase())
    );
  }
  
  if (criteria.experience) {
    filtered = filtered.filter(p => p.experience === criteria.experience);
  }
  
  // For age range, we can't filter mock data, but in real API this would be used
  
  return filtered;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { location, experience, ageRange } = body;

    console.log('Received search request:', { location, experience, ageRange });

    // Search for profiles using either real API or mock data
    const profiles = await searchLinkedInProfiles({ location, experience, ageRange });

    // Simulate API delay for better UX
    await new Promise(resolve => setTimeout(resolve, 500));

    return NextResponse.json({
      success: true,
      profiles,
      total: profiles.length,
      searchCriteria: { location, experience, ageRange },
      usingMockData: !PROXYCURL_API_KEY
    });

  } catch (error) {
    console.error('Prospect search error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to search prospects',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 