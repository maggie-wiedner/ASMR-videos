import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '../../../lib/supabase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil',
});

export async function POST(req: NextRequest) {
  try {
    const { sessionId, userId } = await req.json();

    if (!sessionId || !userId) {
      return NextResponse.json(
        { error: 'Session ID and user ID are required' },
        { status: 400 }
      );
    }

    // Retrieve the session from Stripe to verify payment
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      return NextResponse.json(
        { error: 'Payment not completed' },
        { status: 400 }
      );
    }

    // Check if payment already recorded to prevent duplicates
    const { data: existingPayment } = await supabase
      .from('payments')
      .select('*')
      .eq('stripe_payment_id', session.payment_intent as string)
      .single();

    if (existingPayment) {
      return NextResponse.json({
        success: true,
        message: 'Payment already recorded',
        payment: existingPayment,
      });
    }

    // Record payment in our database
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        user_id: userId,
        stripe_payment_id: session.payment_intent as string,
        amount: session.amount_total || 0,
        status: 'completed',
      })
      .select()
      .single();

    if (paymentError) {
      console.error('Error recording payment:', paymentError);
      return NextResponse.json(
        { error: 'Failed to record payment' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      payment,
      session: {
        id: session.id,
        payment_status: session.payment_status,
        amount_total: session.amount_total,
      },
    });
  } catch (error: any) {
    console.error('Error verifying payment:', error);
    return NextResponse.json(
      { error: 'Failed to verify payment' },
      { status: 500 }
    );
  }
} 