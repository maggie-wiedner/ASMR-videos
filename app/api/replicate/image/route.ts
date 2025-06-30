import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
});

export async function POST(req: NextRequest) {
  const { prompt, userId, promptId } = await req.json();
  console.log('🖼️  API received image generation request');
  console.log('👤 User ID:', userId);
  console.log('📝 Prompt ID:', promptId);
  console.log('🎨 Prompt:', prompt?.substring(0, 100) + '...');
  
  if (!prompt) {
    console.error('❌ No prompt provided');
    return NextResponse.json({ error: 'No prompt provided.' }, { status: 400 });
  }

  const replicateToken = process.env.REPLICATE_API_TOKEN;
  if (!replicateToken) {
    console.error('❌ Replicate API token not set');
    return NextResponse.json({ error: 'Replicate API token not set.' }, { status: 500 });
  }

  try {
    console.log('📤 Sending request to Replicate Imagen 4...');
    
    // Generate image using Google Imagen 4
    const prediction = await replicate.predictions.create({
      version: "google/imagen-4",
      input: {
        prompt: prompt,
        aspect_ratio: "16:9", // Good for video thumbnails/first frames
        output_format: "jpg",
        output_quality: 90,
      }
    });

    console.log('📥 Initial prediction created:', prediction.id);
    console.log('📊 Initial status:', prediction.status);

    // Wait for the prediction to complete
    let finalPrediction = prediction;
    while (finalPrediction.status === 'starting' || finalPrediction.status === 'processing') {
      console.log('⏳ Waiting for prediction to complete...');
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
      finalPrediction = await replicate.predictions.get(prediction.id);
      console.log('📊 Status update:', finalPrediction.status);
    }

    console.log('📥 Final prediction received');
    console.log('🖼️  Final status:', finalPrediction.status);
    console.log('🖼️  Output type:', typeof finalPrediction.output);
    
    // Handle the final prediction response
    let imageUrl: string;
    
    console.log('🎯 Processing final prediction');
    console.log('📊 Status:', finalPrediction.status);
    console.log('🖼️  Output:', finalPrediction.output);
    
    if (finalPrediction.status === 'succeeded' && finalPrediction.output) {
      if (typeof finalPrediction.output === 'string') {
        imageUrl = finalPrediction.output;
        console.log('✅ Image URL extracted:', imageUrl);
      } else if (Array.isArray(finalPrediction.output)) {
        imageUrl = finalPrediction.output[0];
        console.log('✅ Image URL extracted from array:', imageUrl);
      } else {
        console.error('❌ Unexpected output format:', finalPrediction.output);
        return NextResponse.json({ 
          error: 'Unexpected output format in prediction response.',
          debug: { 
            status: finalPrediction.status,
            outputType: typeof finalPrediction.output,
            output: finalPrediction.output 
          }
        }, { status: 500 });
      }
    } else {
      console.error('❌ Prediction failed or incomplete:', finalPrediction);
      return NextResponse.json({ 
        error: finalPrediction.error || 'Image generation failed or incomplete.',
        debug: { 
          status: finalPrediction.status,
          error: finalPrediction.error,
          logs: finalPrediction.logs 
        }
      }, { status: 500 });
    }

    console.log('✅ Image generated successfully');
    console.log('🔗 Image URL:', imageUrl);

    return NextResponse.json({ 
      imageUrl: imageUrl,
      promptId: promptId,
      debug: { 
        originalPrompt: prompt,
        outputType: typeof finalPrediction.output,
        isArray: Array.isArray(finalPrediction.output),
        predictionId: finalPrediction.id,
        status: finalPrediction.status
      } 
    });

  } catch (err: any) {
    console.error('💥 Image generation failed:', err);
    
    // Handle specific Replicate errors
    if (err.message?.includes('insufficient funds')) {
      return NextResponse.json({ 
        error: 'Insufficient Replicate credits. Please add funds to your Replicate account.' 
      }, { status: 402 });
    }
    
    if (err.message?.includes('rate limit')) {
      return NextResponse.json({ 
        error: 'Rate limit exceeded. Please try again in a moment.' 
      }, { status: 429 });
    }

    return NextResponse.json({ 
      error: 'Image generation failed', 
      debug: err?.message || err 
    }, { status: 500 });
  }
} 