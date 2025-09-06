-- Create extraction_sessions table to track ongoing extractions
CREATE TABLE IF NOT EXISTS public.extraction_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL DEFAULT 'in_progress', -- in_progress, completed, failed, cancelled
  type VARCHAR(20) NOT NULL, -- single, bulk
  total_urls INTEGER NOT NULL DEFAULT 0,
  processed_urls INTEGER NOT NULL DEFAULT 0,
  successful_extractions INTEGER NOT NULL DEFAULT 0,
  failed_extractions INTEGER NOT NULL DEFAULT 0,
  credits_used INTEGER NOT NULL DEFAULT 0,
  urls TEXT[], -- Array of all URLs to process
  processed_url_indices INTEGER[], -- Indices of processed URLs
  results JSONB DEFAULT '[]'::jsonb, -- Store extraction results
  error_message TEXT,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_extraction_sessions_user_id ON public.extraction_sessions(user_id);
CREATE INDEX idx_extraction_sessions_status ON public.extraction_sessions(status);
CREATE INDEX idx_extraction_sessions_created_at ON public.extraction_sessions(created_at DESC);

-- Enable RLS
ALTER TABLE public.extraction_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own extraction sessions" ON public.extraction_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own extraction sessions" ON public.extraction_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own extraction sessions" ON public.extraction_sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON public.extraction_sessions TO authenticated;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_extraction_session_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_extraction_sessions_updated_at
  BEFORE UPDATE ON public.extraction_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_extraction_session_updated_at();
