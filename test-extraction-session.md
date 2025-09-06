# Extraction Session Management - Test Guide

## Setup Instructions

1. **Create the database table**: 
   - Go to your Supabase SQL Editor
   - Copy and paste the SQL from `scripts/create-extraction-sessions-table.sql`
   - Run the SQL to create the extraction_sessions table

2. **Test the features**:

### Test 1: Page Refresh During Single Extraction
1. Start a single LinkedIn URL extraction
2. While it's processing, refresh the page (F5)
3. Expected: Browser should show a warning dialog about leaving the page
4. If you proceed, the extraction continues on the server but you lose visibility

### Test 2: Page Refresh During Bulk Extraction
1. Upload a text file with multiple LinkedIn URLs (5-10 URLs)
2. Start the bulk extraction
3. While it's processing (watch the progress bar), refresh the page
4. Expected: 
   - Browser warning about leaving the page
   - After refresh, you should see a "Resume Previous Extraction?" banner
   - The banner shows how many URLs were already processed
   - You can choose to resume or start fresh

### Test 3: Resume Interrupted Extraction
1. Start a bulk extraction with 10+ URLs
2. After a few are processed, refresh the page
3. Click "Resume Extraction" on the banner
4. Expected: Extraction continues from where it left off, not reprocessing already done URLs

### Test 4: Cancel and Start Fresh
1. Have an interrupted extraction session
2. On the resume banner, click "Start Fresh" or the X button
3. Expected: The session is cancelled and you can start a new extraction

## Key Features Implemented:

1. **Extraction Sessions Database**:
   - Tracks all extraction progress
   - Stores processed URLs to avoid reprocessing
   - Saves credits used

2. **Navigation Warning**:
   - Browser-level warning when trying to leave during extraction
   - Custom warning dialog (if implemented with React Router)

3. **Session Recovery**:
   - Automatically detects incomplete sessions on page load
   - Shows resumable extraction banner
   - Prevents credit waste from reprocessing

4. **Progress Persistence**:
   - Session progress updates every 5 URLs
   - Real-time tracking of successful/failed extractions

## Monitoring:

Check the `extraction_sessions` table in Supabase to see:
- Session status (in_progress, completed, failed, cancelled)
- Number of processed URLs
- Credits used
- Which URLs were processed (processed_url_indices)

## Notes:

- Sessions older than 24 hours are not resumable (considered stale)
- Only one extraction can be active at a time per user
- Credits are deducted as URLs are processed, not upfront
