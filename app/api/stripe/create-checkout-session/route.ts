import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil',
});

export async function POST(req: NextRequest) {
  try {
    const { userId, priceId } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Define wallet funding tiers
    const pricingTiers = {
      starter: {
        amount: 600, // $6.00 in cents (1 video)
        name: 'ASMR Generator - Starter Pack',
        description: 'Add $6 to your wallet (1 video at $6 each)'
      },
      basic: {
        amount: 3000, // $30.00 in cents (5 videos)
        name: 'ASMR Generator - Basic Pack',
        description: 'Add $30 to your wallet (5 videos at $6 each)'
      },
      pro: {
        amount: 6000, // $60.00 in cents (10 videos)
        name: 'ASMR Generator - Pro Pack',
        description: 'Add $60 to your wallet (10 videos at $6 each)'
      },
      business: {
        amount: 12000, // $120.00 in cents (20 videos)
        name: 'ASMR Generator - Business Pack',
        description: 'Add $120 to your wallet (20 videos at $6 each)'
      }
    };

    const selectedTier = pricingTiers[priceId as keyof typeof pricingTiers] || pricingTiers.pro;

    // Create Stripe Checkout Session for one-time payment
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: selectedTier.name,
              description: selectedTier.description,
            },
            unit_amount: selectedTier.amount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${req.nextUrl.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.nextUrl.origin}/`,
      metadata: {
        userId,
        service: 'wallet_funding',
        priceId: priceId || 'pro',
        amount: selectedTier.amount.toString(),
      },
    });

    return NextResponse.json({
      url: session.url,
      sessionId: session.id,
    });
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    
    // Check if it's a Stripe API key issue
    if (error.type === 'StripeAuthenticationError' || error.message?.includes('No API key provided')) {
      return NextResponse.json(
        { error: 'Stripe configuration error: Please check your STRIPE_SECRET_KEY environment variable' },
        { status: 500 }
      );
    }
    
    // Check if it's other Stripe errors
    if (error.type && error.type.startsWith('Stripe')) {
      return NextResponse.json(
        { error: 'Stripe error: ' + error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create checkout session: ' + (error.message || 'Unknown error') },
      { status: 500 }
    );
  }
} 