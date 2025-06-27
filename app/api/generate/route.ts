import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { enhancedPrompt } = await req.json();
  if (!enhancedPrompt) {
    return NextResponse.json({ error: 'No enhanced prompt provided.' }, { status: 400 });
  }

  const replicateToken = process.env.REPLICATE_API_TOKEN;
  if (!replicateToken) {
    return NextResponse.json({ error: 'Replicate API token not set.' }, { status: 500 });
  }

  try {
    const replicateRes = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Token ${replicateToken}`,
      },
      body: JSON.stringify({
        version: "google/veo-3", // Using the model identifier
        input: {
          prompt: enhancedPrompt,
          // Optional parameters based on Veo3 capabilities
          duration: 5, // seconds
          aspect_ratio: "16:9",
          // Add other parameters as needed
        },
      }),
    });

    const data = await replicateRes.json();
    if (!replicateRes.ok) {
      return NextResponse.json({ 
        error: data.detail || 'Replicate API error', 
        debug: data 
      }, { status: 500 });
    }

    // Replicate returns a prediction object with an ID that we can poll for results
    return NextResponse.json({ 
      prediction: data,
      predictionId: data.id,
      status: data.status,
      debug: data 
    });
  } catch (err: any) {
    return NextResponse.json({ 
      error: 'Request failed', 
      debug: err?.message || err 
    }, { status: 500 });
  }
} 