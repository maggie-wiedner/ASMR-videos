import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const predictionId = searchParams.get('id');
  
  if (!predictionId) {
    return NextResponse.json({ error: 'No prediction ID provided.' }, { status: 400 });
  }

  const replicateToken = process.env.REPLICATE_API_TOKEN;
  if (!replicateToken) {
    return NextResponse.json({ error: 'Replicate API token not set.' }, { status: 500 });
  }

  try {
    const replicateRes = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
      headers: {
        Authorization: `Token ${replicateToken}`,
      },
    });

    const data = await replicateRes.json();
    if (!replicateRes.ok) {
      return NextResponse.json({ 
        error: data.detail || 'Replicate API error', 
        debug: data 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      status: data.status,
      output: data.output,
      error: data.error,
      prediction: data,
      debug: data 
    });
  } catch (err: any) {
    return NextResponse.json({ 
      error: 'Request failed', 
      debug: err?.message || err 
    }, { status: 500 });
  }
} 