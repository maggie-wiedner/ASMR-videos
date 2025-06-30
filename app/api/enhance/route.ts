import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../../lib/supabase';

// Server-side supabase client (bypasses RLS)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

export async function POST(req: NextRequest) {
  const { prompt, userId, projectId } = await req.json();
  console.log('🚀 API received prompt:', prompt);
  console.log('👤 User ID:', userId);
  console.log('📁 Project ID:', projectId);
  
  if (!prompt) {
    console.error('❌ No prompt provided');
    return NextResponse.json({ error: 'No prompt provided.' }, { status: 400 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('❌ OpenAI API key not set');
    return NextResponse.json({ error: 'OpenAI API key not set.' }, { status: 500 });
  }

  const systemPrompt =
    `You are an expert ASMR video creator and cinematographer. Given a general idea, create 9 different detailed, creative, and sensory-rich ASMR video prompts for a video generation model.

Each prompt should be a unique interpretation of the idea, with different:
- Settings and times of day
- Camera movements and angles
- Visual details and atmospheres
- Moods and styles

For each of the 9 prompts, describe a specific scene that includes:
- A clear setting and time of day
- What's happening moment by moment
- How the camera moves (e.g., tracking, overhead, slow pan, zoom-in)
- Vivid visual details (e.g., weather, lighting, textures, colors)
- Any expressions, actions, or key visual surprises

IMPORTANT: Return ONLY a valid JSON array. Do not include any markdown formatting, code blocks, or additional text. Your response must start with [ and end with ].

Format:
[
  {
    "title": "Cozy Rain Cabin",
    "description": "A warm, dimly lit log cabin interior during a gentle rainstorm. The camera slowly pans across wet windows as soft rain creates rhythmic patterns. Golden lamplight flickers over comfortable blankets and steaming tea cups. The scene captures intimate moments of solitude and warmth."
  },
  {
    "title": "Morning Dew Garden",
    "description": "At sunrise, delicate hands tend to herbs in a misty garden. The camera follows water droplets falling from leaves as morning light filters through fog. Each movement is deliberate and peaceful, creating visual poetry of nature's awakening ritual."
  }
]

Make each prompt cinematic, emotionally resonant, and immediately engaging. Return only the JSON array.`;

  try {
    console.log('📤 Sending request to OpenAI...');
    
    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
        max_tokens: 2000,
        temperature: 0.9,
      }),
    });

    console.log('📥 OpenAI response status:', openaiRes.status);
    console.log('📥 OpenAI response ok:', openaiRes.ok);

    const data = await openaiRes.json();
    console.log('📦 OpenAI response data keys:', Object.keys(data));
    
    if (!openaiRes.ok) {
      console.error('❌ OpenAI API error:', data);
      return NextResponse.json({ error: data.error || 'OpenAI API error', debug: data }, { status: 500 });
    }

    const enhanced = data.choices?.[0]?.message?.content?.trim();
    console.log('📝 Raw OpenAI response length:', enhanced?.length || 0);
    console.log('📝 Raw OpenAI response (first 200 chars):', enhanced?.substring(0, 200) + '...');
    console.log('📝 Raw OpenAI response (last 200 chars):', '...' + enhanced?.substring(enhanced.length - 200));
    
    if (!enhanced) {
      console.error('❌ No enhanced prompts returned from OpenAI');
      return NextResponse.json({ error: 'No enhanced prompts returned.', debug: data }, { status: 500 });
    }

    try {
      console.log('🔍 Starting JSON parsing...');
      
      // Clean up the response - remove markdown code blocks if present
      let cleanedResponse = enhanced.trim();
      console.log('🧹 Original response starts with:', cleanedResponse.substring(0, 50));
      
      // Remove markdown code block markers
      if (cleanedResponse.startsWith('```json')) {
        console.log('🧹 Removing ```json markers');
        cleanedResponse = cleanedResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanedResponse.startsWith('```')) {
        console.log('🧹 Removing ``` markers');
        cleanedResponse = cleanedResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      console.log('🧹 Cleaned response starts with:', cleanedResponse.substring(0, 50));
      console.log('🧹 Cleaned response ends with:', cleanedResponse.substring(cleanedResponse.length - 50));
      
      // Try to parse the JSON response
      console.log('🔍 Attempting JSON.parse...');
      const prompts = JSON.parse(cleanedResponse);
      console.log('✅ JSON.parse successful, type:', typeof prompts);
      console.log('✅ Is array:', Array.isArray(prompts));
      console.log('✅ Array length:', prompts?.length);
      
      if (!Array.isArray(prompts)) {
        throw new Error(`Response is not an array, got: ${typeof prompts}`);
      }
      
      if (prompts.length === 0) {
        throw new Error('Empty array returned');
      }
      
      // Validate each prompt has required fields
      console.log('🔍 Validating prompts...');
      const validPrompts = [];
      for (let i = 0; i < prompts.length; i++) {
        const p = prompts[i];
        console.log(`🔍 Validating prompt ${i}:`, { title: p?.title, hasDescription: !!p?.description });
        if (!p || typeof p !== 'object') {
          console.warn(`❌ Prompt ${i} is not an object:`, p);
          continue;
        }
        if (!p.title || !p.description) {
          console.warn(`❌ Prompt ${i} missing required fields:`, p);
          continue;
        }
        validPrompts.push({
          title: String(p.title).trim(),
          description: String(p.description).trim()
        });
      }

      console.log('✅ Valid prompts count:', validPrompts.length);

      if (validPrompts.length === 0) {
        throw new Error('No valid prompts found');
      }

      console.log('🎉 Successfully parsed and validated prompts');
      
      // Save individual prompts to database if user is provided
      let savedPromptCount = 0;
      let sessionId: string | null = null;
      let finalProjectId: string | null = projectId;
      
      if (userId) {
        try {
          console.log('💾 Saving individual prompts to database...');
          
          // Handle project creation/linking
          if (!finalProjectId) {
            // Auto-generate a project name based on the prompt
            const projectName = prompt.length > 50 ? `${prompt.substring(0, 47)}...` : prompt;
            console.log('📁 Creating new project:', projectName);
            const { data: newProject, error: projectError } = await supabase
              .from('projects')
              .insert({
                user_id: userId,
                name: projectName,
                description: `ASMR project: ${prompt}`
              })
              .select()
              .single();

            if (projectError) {
              console.error('❌ Failed to create project:', projectError);
            } else {
              finalProjectId = newProject.id;
              console.log('✅ Created new project:', finalProjectId);
            }
          } else if (finalProjectId) {
            console.log('📁 Using existing project:', finalProjectId);
            // Update project's updated_at timestamp
            await supabase
              .from('projects')
              .update({ updated_at: new Date().toISOString() })
              .eq('id', finalProjectId)
              .eq('user_id', userId);
          }
          
          // Generate a session ID to group these prompts together
          sessionId = crypto.randomUUID();
          console.log('🆔 Session ID:', sessionId);
          
          // Insert all prompts with the same session ID and project ID
          const promptsToInsert = validPrompts.map(enhancedPrompt => ({
            user_id: userId,
            session_id: sessionId,
            project_id: finalProjectId,
            original_prompt: prompt, // Use the original user input, not the enhanced prompt
            title: enhancedPrompt.title,
            description: enhancedPrompt.description,
            is_favorited: false,
            used_for_video: false
          }));

          const { data: savedPrompts, error: saveError } = await supabase
            .from('user_prompts')
            .insert(promptsToInsert)
            .select();

          if (saveError) {
            console.error('❌ Failed to save prompts to database:', saveError);
          } else {
            savedPromptCount = savedPrompts?.length || 0;
            console.log('✅ Saved', savedPromptCount, 'individual prompts to database');
          }
        } catch (dbError) {
          console.error('💥 Database error:', dbError);
        }
      }

      return NextResponse.json({ 
        enhancedPrompts: validPrompts, 
        sessionId: sessionId,
        projectId: finalProjectId,
        savedPromptCount: savedPromptCount,
        debug: { 
          ...data, 
          originalResponse: enhanced,
          cleanedResponse: cleanedResponse,
          validPromptsCount: validPrompts.length,
          savedToDatabase: savedPromptCount > 0,
          projectCreated: !projectId && !!finalProjectId
        } 
      });
    } catch (parseError) {
      console.error('❌ JSON parsing failed:', parseError);
      console.error('❌ Raw response:', enhanced);
      
      // More intelligent fallback - try to extract JSON-like content
      console.log('🔍 Attempting regex extraction...');
      const jsonMatch = enhanced.match(/\[\s*{[\s\S]*}\s*\]/);
      if (jsonMatch) {
        console.log('✅ Found JSON-like content via regex');
        try {
          const extractedJson = jsonMatch[0];
          console.log('🔍 Extracted JSON length:', extractedJson.length);
          const prompts = JSON.parse(extractedJson);
          if (Array.isArray(prompts) && prompts.length > 0) {
            const validPrompts = prompts.filter(p => p && p.title && p.description);
            console.log('✅ Regex extraction successful, valid prompts:', validPrompts.length);
            if (validPrompts.length > 0) {
              return NextResponse.json({ 
                enhancedPrompts: validPrompts, 
                debug: { ...data, extractedFromText: true } 
              });
            }
          }
        } catch (extractError) {
          console.error('❌ Extraction also failed:', extractError);
        }
      } else {
        console.log('❌ No JSON-like content found via regex');
      }
      
      // Final fallback: create a single prompt from the entire response
      console.log('🔄 Using final fallback - single prompt');
      return NextResponse.json({ 
        enhancedPrompts: [{ 
          title: 'Enhanced Prompt', 
          description: enhanced 
        }], 
        debug: { 
          ...data, 
          parseError: parseError instanceof Error ? parseError.message : String(parseError),
          fallbackUsed: true
        } 
      });
    }
  } catch (err: any) {
    console.error('💥 Request failed:', err);
    return NextResponse.json({ error: 'Request failed', debug: err?.message || err }, { status: 500 });
  }
} 