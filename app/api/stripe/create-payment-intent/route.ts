import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil',
});

export async function POST(req: NextRequest) {
  try {
    const { enhancedPrompt, userId } = await req.json();

    if (!enhancedPrompt || !userId) {
      return NextResponse.json(
        { error: 'Enhanced prompt and user ID are required' },
        { status: 400 }
      );
    }

    // Create payment intent for $6.00
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 600, // $6.00 in cents
      currency: 'usd',
      metadata: {
        userId,
        enhancedPrompt,
        service: 'asmr_video_generation',
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error: any) {
    console.error('Error creating payment intent:', error);
    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    );
  }
} 