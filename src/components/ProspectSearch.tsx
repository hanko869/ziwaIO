'use client';

import React, { useState } from 'react';
import { FiSearch, FiDownload, FiCheck } from 'react-icons/fi';
import { useLanguage } from '@/contexts/LanguageContext';

interface SearchCriteria {
  location: string;
  experience: string;
  ageRange: string;
}

interface LinkedInProfile {
  id: string;
  name: string;
  headline: string;
  location: string;
  profileUrl: string;
  imageUrl?: string;
  experience?: string;
  selected?: boolean;
}

export default function ProspectSearch() {
  const { t } = useLanguage();
  const [searchCriteria, setSearchCriteria] = useState<SearchCriteria>({
    location: '',
    experience: '',
    ageRange: ''
  });
  const [searchResults, setSearchResults] = useState<LinkedInProfile[]>([]);
  const [selectedProfiles, setSelectedProfiles] = useState<Set<string>>(new Set());
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    console.log('Starting search with criteria:', searchCriteria);
    setIsSearching(true);
    setError(null);
    
    try {
      const response = await fetch('/api/prospect-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(searchCriteria),
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Response error:', errorData);
        throw new Error('Search failed');
      }

      const data = await response.json();
      console.log('Search results:', data);
      setSearchResults(data.profiles || []);
    } catch (err) {
      setError('Failed to search profiles. Please try again.');
      console.error('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const toggleProfileSelection = (profileId: string) => {
    const newSelection = new Set(selectedProfiles);
    if (newSelection.has(profileId)) {
      newSelection.delete(profileId);
    } else {
      newSelection.add(profileId);
    }
    setSelectedProfiles(newSelection);
  };

  const exportSelectedProfiles = () => {
    const selectedData = searchResults
      .filter(profile => selectedProfiles.has(profile.id))
      .map(profile => profile.profileUrl);
    
    // Create a text file with LinkedIn URLs
    const content = selectedData.join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `linkedin-prospects-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Search Form */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-6">LinkedIn Prospect Search</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location
            </label>
            <input
              type="text"
              value={searchCriteria.location}
              onChange={(e) => setSearchCriteria({ ...searchCriteria, location: e.target.value })}
              placeholder="e.g., New York, USA"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Years of Experience
            </label>
            <select
              value={searchCriteria.experience}
              onChange={(e) => setSearchCriteria({ ...searchCriteria, experience: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">Any</option>
              <option value="0-2">0-2 years</option>
              <option value="3-5">3-5 years</option>
              <option value="6-10">6-10 years</option>
              <option value="11-15">11-15 years</option>
              <option value="16+">16+ years</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Age Range
            </label>
            <select
              value={searchCriteria.ageRange}
              onChange={(e) => setSearchCriteria({ ...searchCriteria, ageRange: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">Any</option>
              <option value="18-24">18-24</option>
              <option value="25-34">25-34</option>
              <option value="35-44">35-44</option>
              <option value="45-54">45-54</option>
              <option value="55+">55+</option>
            </select>
          </div>
        </div>
        
        <button
          onClick={handleSearch}
          disabled={isSearching}
          className="w-full md:w-auto px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <FiSearch className="w-5 h-5" />
          {isSearching ? 'Searching...' : 'Search Prospects'}
        </button>
        
        {error && (
          <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg">
            {error}
          </div>
        )}
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold">
              Search Results ({selectedProfiles.size} selected)
            </h3>
            {selectedProfiles.size > 0 && (
              <button
                onClick={exportSelectedProfiles}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <FiDownload className="w-4 h-4" />
                Export Selected
              </button>
            )}
          </div>
          
          <div className="mb-4 p-4 bg-blue-50 text-blue-700 rounded-lg">
            <p className="text-sm">
              <strong>Note:</strong> Currently showing demo data. To use real LinkedIn search, you need to integrate with:
            </p>
            <ul className="text-sm mt-2 ml-4 list-disc">
              <li>ProxyCurl API - $49/month for 1000 searches</li>
              <li>Phantombuster - $30/month starter plan</li>
              <li>Apify LinkedIn Scraper - $49/month</li>
            </ul>
          </div>

          <div className="space-y-4">
            {searchResults.map((profile) => (
              <div
                key={profile.id}
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                  selectedProfiles.has(profile.id) 
                    ? 'border-purple-500 bg-purple-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => toggleProfileSelection(profile.id)}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-5 h-5 mt-1">
                    {selectedProfiles.has(profile.id) && (
                      <FiCheck className="w-5 h-5 text-purple-600" />
                    )}
                  </div>
                  
                  <div className="flex-grow">
                    <h4 className="font-semibold text-gray-900">{profile.name}</h4>
                    <p className="text-sm text-gray-600 mt-1">{profile.headline}</p>
                    <p className="text-sm text-gray-500 mt-1">{profile.location}</p>
                    {profile.experience && (
                      <p className="text-sm text-gray-500 mt-1">Experience: {profile.experience}</p>
                    )}
                    <a
                      href={profile.profileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-purple-600 hover:underline mt-2 inline-block"
                      onClick={(e) => e.stopPropagation()}
                    >
                      View LinkedIn Profile →
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {searchResults.length === 0 && !isSearching && (
        <div className="text-center py-12 text-gray-500">
          Enter search criteria and click "Search Prospects" to find LinkedIn profiles
        </div>
      )}
    </div>
  );
} 