'use client';

import { useEffect } from 'react';

export default function TestAnalytics() {
  useEffect(() => {
    // Check if Analytics is loaded
    if (typeof window !== 'undefined') {
      // @ts-ignore
      if (window.va) {
        console.log('✅ Vercel Analytics is loaded!');
        console.log('Analytics object:', window.va);
      } else {
        console.log('⏳ Vercel Analytics not loaded yet...');
        
        // Check again after a delay
        setTimeout(() => {
          // @ts-ignore
          if (window.va) {
            console.log('✅ Vercel Analytics loaded after delay!');
          } else {
            console.log('❌ Vercel Analytics not found');
          }
        }, 2000);
      }
    }
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Vercel Analytics Test Page</h1>
      <p className="mb-4">Open your browser console to see if Analytics is loaded.</p>
      
      <div className="bg-gray-100 p-4 rounded">
        <h2 className="font-bold mb-2">How to verify Analytics is working:</h2>
        <ol className="list-decimal list-inside space-y-2">
          <li>Open browser DevTools (F12)</li>
          <li>Go to the Console tab</li>
          <li>Look for "✅ Vercel Analytics is loaded!" message</li>
          <li>In Network tab, look for requests to "vitals.vercel-insights.com"</li>
        </ol>
      </div>
      
      <div className="mt-4 p-4 bg-blue-50 rounded">
        <p className="font-bold">Note:</p>
        <p>Analytics will fully work when deployed to Vercel. In local development, you might see limited functionality.</p>
      </div>
    </div>
  );
}
