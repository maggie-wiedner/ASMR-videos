import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../../../lib/supabase';

// Server-side supabase client (bypasses RLS)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

export async function POST(req: NextRequest) {
  const { prompt, projectMetadata, userId, projectId } = await req.json();
  console.log('🚀 Generate Prompts API received:');
  console.log('📝 Prompt:', prompt);
  console.log('📋 Project Metadata:', projectMetadata);
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

  // Generate prompts with or without project context
  const systemPrompt = projectMetadata 
    ? `You are an expert ASMR video creator and cinematographer. You are working on a project called "${projectMetadata.title}".

PROJECT CONTEXT:
Description: ${projectMetadata.description}
Creative Direction: ${projectMetadata.theme}

Based on this project context and the user's specific input, create 9 different detailed, creative, and sensory-rich ASMR video prompts for a video generation model. Each prompt should feel cohesive with the project theme while offering unique variations.

Each prompt should be a unique interpretation that fits the project theme, with different:
- Settings and times of day (within the project context)
- Camera movements and angles
- Visual details and atmospheres (consistent with the theme)
- Moods and styles (harmonious with the project description)

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
    "title": "Morning Rain Contemplation",
    "description": "A warm, dimly lit cabin bedroom at dawn. The camera slowly pans across rain-streaked windows as soft morning light filters through. Steam rises from a mug of coffee on the windowsill. The scene captures a peaceful moment of solitude and reflection within the cabin's embrace."
  }
]

Make each prompt cinematic, emotionally resonant, cohesive with the project theme, and immediately engaging. Return only the JSON array.`
    : `You are an expert ASMR video creator and cinematographer. Given a general idea, create 9 different detailed, creative, and sensory-rich ASMR video prompts for a video generation model.

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
  }
]

Make each prompt cinematic, emotionally resonant, and immediately engaging. Return only the JSON array.`;

  try {
    console.log('📤 Sending request to OpenAI for prompt generation...');
    
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
    const data = await openaiRes.json();
    
    if (!openaiRes.ok) {
      console.error('❌ OpenAI API error:', data);
      return NextResponse.json({ error: data.error || 'OpenAI API error', debug: data }, { status: 500 });
    }

    const enhanced = data.choices?.[0]?.message?.content?.trim();
    console.log('📝 Raw OpenAI response length:', enhanced?.length || 0);
    
    if (!enhanced) {
      console.error('❌ No enhanced prompts returned from OpenAI');
      return NextResponse.json({ error: 'No enhanced prompts returned.', debug: data }, { status: 500 });
    }

    try {
      console.log('🔍 Starting JSON parsing...');
      
      // Clean up the response - remove markdown code blocks if present
      let cleanedResponse = enhanced.trim();
      
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      // Try to parse the JSON response
      const prompts = JSON.parse(cleanedResponse);
      
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
            // Use the provided project metadata or fall back to basic name
            const projectName = projectMetadata?.title || (prompt.length > 50 ? `${prompt.substring(0, 47)}...` : prompt);
            const projectDescription = projectMetadata?.description || `ASMR project: ${prompt}`;
            
            console.log('📁 Creating new project:', projectName);
            const { data: newProject, error: projectError } = await supabase
              .from('projects')
              .insert({
                user_id: userId,
                name: projectName,
                description: projectDescription
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
            original_prompt: prompt, // Use the original user input
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
          projectCreated: !projectId && !!finalProjectId,
          usedProjectMetadata: !!projectMetadata
        } 
      });
    } catch (parseError) {
      console.error('❌ JSON parsing failed:', parseError);
      
      // More intelligent fallback - try to extract JSON-like content
      const jsonMatch = enhanced.match(/\[\s*{[\s\S]*}\s*\]/);
      if (jsonMatch) {
        console.log('✅ Found JSON-like content via regex');
        try {
          const extractedJson = jsonMatch[0];
          const prompts = JSON.parse(extractedJson);
          if (Array.isArray(prompts) && prompts.length > 0) {
            const validPrompts = prompts.filter(p => p && p.title && p.description);
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