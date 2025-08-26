'use client';

import React from 'react';
import { PlayCircle, X } from 'lucide-react';
import { ExtractionSession } from '@/hooks/useExtractionSession';

interface ResumableExtractionBannerProps {
  session: ExtractionSession;
  onResume: () => void;
  onDismiss: () => void;
}

export default function ResumableExtractionBanner({ 
  session, 
  onResume, 
  onDismiss 
}: ResumableExtractionBannerProps) {
  const remainingUrls = session.total_urls - session.processed_urls;
  const percentComplete = Math.round((session.processed_urls / session.total_urls) * 100);
  
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <PlayCircle className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-gray-900">
              Resume Previous Extraction?
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              You have an incomplete {session.type} extraction from {new Date(session.started_at).toLocaleString()}.
            </p>
            <div className="mt-2 space-y-1">
              <div className="text-sm text-gray-700">
                <span className="font-medium">{percentComplete}% complete</span> • 
                <span> {session.processed_urls} of {session.total_urls} URLs processed</span> • 
                <span> {remainingUrls} remaining</span>
              </div>
              {session.credits_used > 0 && (
                <div className="text-sm text-gray-600">
                  Credits used so far: <span className="font-medium">{session.credits_used}</span>
                </div>
              )}
            </div>
            <div className="mt-3 flex gap-3">
              <button
                onClick={onResume}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2"
              >
                <PlayCircle className="w-4 h-4" />
                Resume Extraction
              </button>
              <button
                onClick={onDismiss}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm font-medium"
              >
                Start Fresh
              </button>
            </div>
          </div>
        </div>
        <button
          onClick={onDismiss}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
