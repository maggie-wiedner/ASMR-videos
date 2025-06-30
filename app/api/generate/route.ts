import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabase-admin';

export async function POST(req: NextRequest) {
  const { enhancedPrompt, userId, originalPrompt } = await req.json();
  
  if (!enhancedPrompt) {
    return NextResponse.json({ error: 'No enhanced prompt provided.' }, { status: 400 });
  }
  
  if (!userId) {
    return NextResponse.json({ error: 'User authentication required.' }, { status: 401 });
  }

  // Check wallet balance before generating video
  try {
    // Fetch total deposits (money added to wallet)
    const { data: payments, error: paymentsError } = await supabaseAdmin
      .from('payments')
      .select('amount')
      .eq('user_id', userId)
      .eq('status', 'completed');

    if (paymentsError) {
      return NextResponse.json({ error: 'Error checking wallet balance.' }, { status: 500 });
    }

    // Fetch total spent on videos (money deducted from wallet)
    const { data: videos, error: videosError } = await supabaseAdmin
      .from('user_videos')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'completed');

    if (videosError) {
      return NextResponse.json({ error: 'Error checking video history.' }, { status: 500 });
    }

    // Calculate wallet balance: deposits - (videos * $6)
    const totalDeposits = payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0;
    const totalSpent = (videos?.length || 0) * 600; // $6.00 = 600 cents per video
    const walletBalance = totalDeposits - totalSpent;
    
    // Check if user has sufficient balance ($6 = 600 cents)
    if (walletBalance < 600) {
      return NextResponse.json({ 
        error: 'Insufficient wallet balance. Please add funds to continue.',
        walletBalance: walletBalance / 100, // Convert to dollars for display
        requiredAmount: 6
      }, { status: 402 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Error verifying wallet balance.' }, { status: 500 });
  }

  const replicateToken = process.env.REPLICATE_API_TOKEN;
  if (!replicateToken) {
    return NextResponse.json({ error: 'Replicate API token not set.' }, { status: 500 });
  }

  try {
    // Create user_videos record (this effectively deducts $6 from wallet)
    const { data: videoRecord, error: videoError } = await supabaseAdmin
      .from('user_videos')
      .insert({
        user_id: userId,
        original_prompt: originalPrompt || enhancedPrompt,
        enhanced_prompt: enhancedPrompt,
        status: 'processing'
      })
      .select()
      .single();

    if (videoError) {
      return NextResponse.json({ 
        error: 'Error creating video record: ' + videoError.message 
      }, { status: 500 });
    }

    // Start video generation with Replicate
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

    const replicateData = await replicateRes.json();
    if (!replicateRes.ok) {
      // If Replicate fails, mark video as failed but don't refund (generation was attempted)
      await supabaseAdmin
        .from('user_videos')
        .update({ status: 'failed' })
        .eq('id', videoRecord.id);
      
      return NextResponse.json({ 
        error: replicateData.detail || 'Replicate API error', 
        debug: replicateData 
      }, { status: 500 });
    }

    // Update video record with Replicate prediction ID
    await supabaseAdmin
      .from('user_videos')
      .update({ 
        status: 'processing',
        // You might want to add a prediction_id column to track this
      })
      .eq('id', videoRecord.id);

    // Return success response
    return NextResponse.json({ 
      prediction: replicateData,
      predictionId: replicateData.id,
      status: replicateData.status,
      videoRecordId: videoRecord.id,
      message: '$6.00 deducted from wallet',
      debug: replicateData 
    });
  } catch (err: any) {
    return NextResponse.json({ 
      error: 'Request failed', 
      debug: err?.message || err 
    }, { status: 500 });
  }
} 