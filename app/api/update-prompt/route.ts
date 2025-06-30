import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../../lib/supabase';

// Server-side supabase client (bypasses RLS)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

export async function PATCH(req: NextRequest) {
  const { promptId, userId, updates } = await req.json();

  console.log('🔧 Updating prompt:', promptId, 'for user:', userId);
  console.log('📝 Updates:', updates);

  if (!promptId || !userId) {
    console.error('❌ Missing promptId or userId');
    return NextResponse.json({ error: 'Prompt ID and User ID are required.' }, { status: 400 });
  }

  try {
    const { data: updatedPrompt, error } = await supabase
      .from('user_prompts')
      .update(updates)
      .eq('id', promptId)
      .eq('user_id', userId) // Ensure user can only update their own prompts
      .select()
      .single();

    if (error) {
      console.error('❌ Database error:', error);
      return NextResponse.json({ error: 'Failed to update prompt.' }, { status: 500 });
    }

    if (!updatedPrompt) {
      console.error('❌ Prompt not found or access denied');
      return NextResponse.json({ error: 'Prompt not found or access denied.' }, { status: 404 });
    }

    console.log('✅ Prompt updated successfully');

    return NextResponse.json({ 
      prompt: updatedPrompt,
      success: true
    });
  } catch (err: any) {
    console.error('💥 Request failed:', err);
    return NextResponse.json({ error: 'Request failed', debug: err?.message || err }, { status: 500 });
  }
} 