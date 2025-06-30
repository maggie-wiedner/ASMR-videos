import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../../lib/supabase';

// Server-side supabase client (bypasses RLS)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  const sessionId = searchParams.get('sessionId');
  const limit = parseInt(searchParams.get('limit') || '50');
  const favoritedOnly = searchParams.get('favorited') === 'true';

  console.log('📚 Fetching saved prompts for user:', userId);
  if (sessionId) {
    console.log('🎯 Filtering by session:', sessionId);
  }

  if (!userId) {
    console.error('❌ No userId provided');
    return NextResponse.json({ error: 'User ID is required.' }, { status: 400 });
  }

  try {
    let query = supabase
      .from('user_prompts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (sessionId) {
      query = query.eq('session_id', sessionId);
    }

    if (favoritedOnly) {
      query = query.eq('is_favorited', true);
    }

    const { data: prompts, error } = await query;

    if (error) {
      console.error('❌ Database error:', error);
      return NextResponse.json({ error: 'Failed to fetch saved prompts.' }, { status: 500 });
    }

    console.log('✅ Found', prompts?.length || 0, 'saved prompts');

    // Group prompts by session for easier display
    const groupedPrompts = (prompts || []).reduce((acc: any, prompt) => {
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

    const sessions = Object.values(groupedPrompts);

    return NextResponse.json({ 
      prompts: prompts || [],
      sessions: sessions,
      count: prompts?.length || 0
    });
  } catch (err: any) {
    console.error('💥 Request failed:', err);
    return NextResponse.json({ error: 'Request failed', debug: err?.message || err }, { status: 500 });
  }
} 