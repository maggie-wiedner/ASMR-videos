# Database Migration Instructions

## Overview
This migration implements a true project system where users can create persistent projects and add multiple prompt enhancement sessions to each project over time.

## Migration Steps

### 1. Run the Database Migration

Execute the SQL commands in `migrations/001_create_projects.sql` in your Supabase SQL editor:

1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `migrations/001_create_projects.sql`
4. Execute the commands

### 2. Verify the Migration

After running the migration, verify that:

- `projects` table exists with proper structure
- `user_prompts` table has the new `project_id` column
- RLS policies are applied correctly
- Indexes are created

### 3. Test the New System

1. Start the development server: `npm run dev`
2. Create a new account or sign in
3. Try creating your first project with enhanced prompts
4. Verify that the project appears in the project list
5. Navigate to the project page and verify all sessions are displayed
6. Try adding new enhancement sessions to existing projects

## Key Changes

### Database Structure
- **New `projects` table**: Stores project information (name, description, timestamps)
- **Updated `user_prompts` table**: Now includes `project_id` foreign key
- **Enhanced relationships**: Prompts belong to both sessions and projects

### API Updates
- **New `/api/supabase/projects` endpoint**: Full CRUD operations for projects
- **New `/api/openai/enhance-project` endpoint**: Analyzes user input to generate project metadata
- **New `/api/openai/generate-prompts` endpoint**: Creates cohesive prompts using project context
- **Project-aware prompt management**: All prompts are now organized by project

### UI/UX Changes
- **Project-based navigation**: Main studio shows projects instead of sessions
- **Project pages**: Each project has its own dedicated page with sessions
- **Session management**: Multiple enhancement sessions per project
- **"Add New Ideas" functionality**: Easily add more sessions to existing projects

### User Flow
1. **First-time users**: Create a project name when enhancing their first prompt
2. **Returning users**: Can create new projects or add to existing ones
3. **Project management**: Navigate between projects and sessions seamlessly
4. **Persistent organization**: Projects maintain their content across visits

## Benefits

✅ **True persistence**: Projects remain available indefinitely  
✅ **Better organization**: Multiple related sessions grouped together  
✅ **Scalable structure**: Users can create many projects for different themes  
✅ **Enhanced workflow**: Add more ideas to projects over time  
✅ **Clear navigation**: Dedicated pages for each project with session overview  

## Troubleshooting

If you encounter issues:

1. **Database errors**: Verify migration ran successfully in Supabase
2. **API errors**: Check console logs for API endpoint issues
3. **Missing projects**: Ensure RLS policies are configured correctly
4. **Navigation issues**: Clear browser cache and restart dev server

## Data Migration Note

Existing `user_prompts` data will remain intact but won't be associated with projects initially. Users can continue using the system, and new prompts will be properly organized into projects. 