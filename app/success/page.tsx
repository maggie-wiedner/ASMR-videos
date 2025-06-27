'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '../../lib/auth-context';
import { supabase } from '../../lib/supabase';

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handlePaymentSuccess = async () => {
      const sessionId = searchParams.get('session_id');
      
      if (!sessionId || !user) {
        setError('Missing payment session or user information');
        setIsProcessing(false);
        return;
      }

      try {
        // Verify payment with our backend
        const response = await fetch('/api/verify-payment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionId,
            userId: user.id,
          }),
        });

        const data = await response.json();
        
        if (response.ok) {
          // Payment verified successfully
          setIsProcessing(false);
          setTimeout(() => {
            router.push('/');
          }, 3000);
        } else {
          setError(data.error || 'Failed to verify payment');
          setIsProcessing(false);
        }
      } catch (err: any) {
        setError('Network error: ' + err.message);
        setIsProcessing(false);
      }
    };

    handlePaymentSuccess();
  }, [searchParams, user, router]);

  if (isProcessing) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold mb-2">Processing your payment...</h2>
          <p className="text-gray-600">Please wait while we confirm your purchase.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-red-600 mb-4">Payment Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex items-center justify-center min-h-screen">
      <div className="text-center max-w-md">
        <div className="text-green-500 text-6xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold text-green-600 mb-4">Payment Successful!</h2>
        <p className="text-gray-600 mb-6">
          Congratulations! You now have lifetime access to all ASMR video generation tools.
        </p>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="text-sm text-green-700">
            <p>✅ Unlimited prompt enhancements</p>
            <p>✅ Unlimited video generations</p>
            <p>✅ Priority processing</p>
            <p>✅ Lifetime access</p>
          </div>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Redirecting you to the app in a few seconds...
        </p>
        <button
          onClick={() => router.push('/')}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          Start Creating Videos
        </button>
      </div>
    </div>
  );
} 