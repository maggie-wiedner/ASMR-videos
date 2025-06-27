import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { prompt } = await req.json();
  if (!prompt) {
    return NextResponse.json({ error: 'No prompt provided.' }, { status: 400 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'OpenAI API key not set.' }, { status: 500 });
  }

  const systemPrompt =
    `You are an expert ASMR video creator and cinematographer. Given a general idea, rewrite it as a detailed, creative, and sensory-rich ASMR video prompt for a video generation model.

Describe a specific scene or sequence that captures the idea clearly and emotionally. Include:
- A clear setting and time of day
- What's happening moment by moment
- How the camera moves (e.g., tracking, overhead, slow pan, zoom-in)
- Vivid visual details (e.g., weather, lighting, textures, colors)
- Any expressions, actions, or key visual surprises

The goal is to make the scene feel cinematic, emotionally resonant, and immediately engaging.`;

  try {
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
        max_tokens: 200,
        temperature: 0.8,
      }),
    });

    const data = await openaiRes.json();
    if (!openaiRes.ok) {
      return NextResponse.json({ error: data.error || 'OpenAI API error', debug: data }, { status: 500 });
    }

    const enhanced = data.choices?.[0]?.message?.content?.trim();
    if (!enhanced) {
      return NextResponse.json({ error: 'No enhanced prompt returned.', debug: data }, { status: 500 });
    }

    return NextResponse.json({ enhancedPrompt: enhanced, debug: data });
  } catch (err: any) {
    return NextResponse.json({ error: 'Request failed', debug: err?.message || err }, { status: 500 });
  }
} 