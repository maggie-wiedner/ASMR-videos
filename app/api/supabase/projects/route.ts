import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../../../lib/supabase';

// Server-side supabase client (bypasses RLS)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

// GET - Fetch user's projects
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  const projectId = searchParams.get('projectId');

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required.' }, { status: 400 });
  }

  try {
    if (projectId) {
      // Get specific project with sessions and prompts
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .eq('user_id', userId)
        .single();

      if (projectError) {
        console.error('❌ Error fetching project:', projectError);
        return NextResponse.json({ error: 'Project not found.' }, { status: 404 });
      }

      // Get sessions (grouped prompts) for this project
      const { data: prompts, error: promptsError } = await supabase
        .from('user_prompts')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (promptsError) {
        console.error('❌ Error fetching project prompts:', promptsError);
        return NextResponse.json({ error: 'Failed to fetch project prompts.' }, { status: 500 });
      }

      // Group prompts by session
      const sessionMap = (prompts || []).reduce((acc: any, prompt) => {
        if (!acc[prompt.session_id]) {
          acc[prompt.session_id] = {
            session_id: prompt.session_id,
            original_prompt: prompt.original_prompt,
            created_at: prompt.created_at,
            prompts: []
          };
        }
        acc[prompt.session_id].prompts.push(prompt);
        return acc;
      }, {});

      const sessions = Object.values(sessionMap);

      return NextResponse.json({
        project,
        sessions,
        promptCount: prompts?.length || 0
      });
    } else {
      // Get all projects for user
      const { data: projects, error } = await supabase
        .from('projects')
        .select(`
          *,
          user_prompts(count)
        `)
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching projects:', error);
        return NextResponse.json({ error: 'Failed to fetch projects.' }, { status: 500 });
      }

      return NextResponse.json({ projects: projects || [] });
    }
  } catch (err: any) {
    console.error('💥 Request failed:', err);
    return NextResponse.json({ error: 'Request failed', debug: err?.message || err }, { status: 500 });
  }
}

// POST - Create new project
export async function POST(req: NextRequest) {
  try {
    const { userId, name, description } = await req.json();

    if (!userId || !name) {
      return NextResponse.json({ error: 'User ID and project name are required.' }, { status: 400 });
    }

    const { data: project, error } = await supabase
      .from('projects')
      .insert({
        user_id: userId,
        name: name.trim(),
        description: description?.trim() || null
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating project:', error);
      return NextResponse.json({ error: 'Failed to create project.' }, { status: 500 });
    }

    return NextResponse.json({ project });
  } catch (err: any) {
    console.error('💥 Request failed:', err);
    return NextResponse.json({ error: 'Request failed', debug: err?.message || err }, { status: 500 });
  }
}

// PATCH - Update project
export async function PATCH(req: NextRequest) {
  try {
    const { projectId, userId, updates } = await req.json();

    if (!projectId || !userId) {
      return NextResponse.json({ error: 'Project ID and user ID are required.' }, { status: 400 });
    }

    const { data: project, error } = await supabase
      .from('projects')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('❌ Error updating project:', error);
      return NextResponse.json({ error: 'Failed to update project.' }, { status: 500 });
    }

    return NextResponse.json({ project });
  } catch (err: any) {
    console.error('💥 Request failed:', err);
    return NextResponse.json({ error: 'Request failed', debug: err?.message || err }, { status: 500 });
  }
}

// DELETE - Delete project
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');
    const userId = searchParams.get('userId');

    if (!projectId || !userId) {
      return NextResponse.json({ error: 'Project ID and user ID are required.' }, { status: 400 });
    }

    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId)
      .eq('user_id', userId);

    if (error) {
      console.error('❌ Error deleting project:', error);
      return NextResponse.json({ error: 'Failed to delete project.' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('💥 Request failed:', err);
    return NextResponse.json({ error: 'Request failed', debug: err?.message || err }, { status: 500 });
  }
} 