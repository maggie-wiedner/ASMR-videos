-- Create projects table
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON public.projects(created_at DESC);

-- Add project_id column to user_prompts table
ALTER TABLE public.user_prompts 
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE;

-- Create index for project_id
CREATE INDEX IF NOT EXISTS idx_user_prompts_project_id ON public.user_prompts(project_id);

-- Enable RLS on projects table
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for projects - users can only see their own projects
CREATE POLICY IF NOT EXISTS "Users can manage their own projects" ON public.projects
    FOR ALL USING (auth.uid() = user_id);

-- Update RLS policy for user_prompts to include project access
-- (Keep existing policies and add project-based access) 