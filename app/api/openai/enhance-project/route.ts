import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { prompt } = await req.json();
  console.log('🚀 Enhance Project API received prompt:', prompt);
  
  if (!prompt) {
    console.error('❌ No prompt provided');
    return NextResponse.json({ error: 'No prompt provided.' }, { status: 400 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('❌ OpenAI API key not set');
    return NextResponse.json({ error: 'OpenAI API key not set.' }, { status: 500 });
  }

  const metadataSystemPrompt = `You are an expert creative director for ASMR content. Given a user's idea, create cohesive project metadata that will guide the creation of multiple related ASMR video prompts.

Analyze the user's input and generate:
1. A pithy, professional project title (2-4 words max)
2. A comprehensive project description that captures the essence and mood
3. A thematic direction that explains what type of content/moments each prompt should focus on

Return ONLY a valid JSON object with this exact format:

{
  "title": "Cozy Cabin Retreat",
  "description": "An intimate collection of peaceful cabin moments centered around rain, warmth, and solitude. Each scene should evoke feelings of comfort, security, and gentle relaxation.",
  "theme": "Focus on sensory details of cabin life: rain patterns, warm lighting, cozy textures, steam from hot drinks, crackling fires, and quiet contemplative moments. Each prompt should feel like a different room or time of day in the same peaceful retreat."
}

Make the title concise but evocative. The description should set the emotional tone. The theme should provide specific creative direction for generating cohesive prompts.`;

  try {
    console.log('📤 Sending request to OpenAI for project analysis...');
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: metadataSystemPrompt },
          { role: 'user', content: prompt },
        ],
        max_tokens: 400,
        temperature: 0.7,
      }),
    });

    console.log('📥 OpenAI response status:', response.status);
    const data = await response.json();
    
    if (!response.ok) {
      console.error('❌ OpenAI API error:', data);
      return NextResponse.json({ error: data.error || 'OpenAI API error', debug: data }, { status: 500 });
    }

    const metadataText = data.choices?.[0]?.message?.content?.trim();
    if (!metadataText) {
      console.error('❌ No metadata returned');
      return NextResponse.json({ error: 'No metadata returned from OpenAI.', debug: data }, { status: 500 });
    }

    try {
      // Parse the JSON response
      let cleanedResponse = metadataText.trim();
      console.log('🧹 Original response starts with:', cleanedResponse.substring(0, 50));
      
      // Remove markdown code block markers
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      const metadata = JSON.parse(cleanedResponse);
      console.log('✅ Generated project metadata:', metadata);

      // Validate metadata structure
      if (!metadata.title || !metadata.description || !metadata.theme) {
        throw new Error('Invalid metadata structure');
      }

      return NextResponse.json({ 
        projectMetadata: {
          title: String(metadata.title).trim(),
          description: String(metadata.description).trim(),
          theme: String(metadata.theme).trim()
        },
        debug: {
          originalResponse: metadataText,
          cleanedResponse: cleanedResponse
        }
      });
    } catch (parseError) {
      console.error('❌ JSON parsing failed:', parseError);
      
      // Fallback: extract title from user prompt
      const fallbackTitle = prompt.length > 50 ? `${prompt.substring(0, 47)}...` : prompt;
      
      return NextResponse.json({ 
        projectMetadata: {
          title: fallbackTitle,
          description: `ASMR project: ${prompt}`,
          theme: `Create atmospheric ASMR content based on: ${prompt}`
        },
        debug: { 
          parseError: parseError instanceof Error ? parseError.message : String(parseError),
          fallbackUsed: true,
          originalResponse: metadataText
        } 
      });
    }
  } catch (err: any) {
    console.error('💥 Request failed:', err);
    return NextResponse.json({ error: 'Request failed', debug: err?.message || err }, { status: 500 });
  }
} 