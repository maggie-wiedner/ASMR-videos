'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '../../lib/auth-context';
import { supabase } from '../../lib/supabase';

function SuccessPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handlePaymentSuccess = async () => {
      const sessionId = searchParams.get('session_id');
      
      // Debug logging
      console.log('Success page loaded with URL:', window.location.href);
      console.log('Session ID:', sessionId);
      console.log('User:', user);
      
      if (!sessionId) {
        setError('Missing payment session ID. Please check the URL contains session_id parameter.');
        setIsProcessing(false);
        return;
      }
      
      if (!user) {
        // Wait for user to load, but show helpful message after 3 seconds
        const timeout = setTimeout(() => {
          setError('Please sign in to complete payment verification. Your payment was successful, but we need to verify your account.');
          setIsProcessing(false);
        }, 3000);
        return () => clearTimeout(timeout);
      }

      try {
        // Verify payment with our backend
        const response = await fetch('/api/stripe/verify-payment', {
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

    if (user) {
      handlePaymentSuccess();
    }
  }, [searchParams, user, router]);

  if (isProcessing) {
    const sessionId = searchParams.get('session_id');
    
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold mb-2">Processing your payment...</h2>
          <p className="text-gray-600 mb-4">Please wait while we confirm your purchase.</p>
          {sessionId && (
            <div className="text-xs text-gray-400 bg-gray-50 rounded p-2">
              Session ID: {sessionId.substring(0, 20)}...
            </div>
          )}
          {!user && (
            <p className="text-sm text-orange-600 mt-4">
              ⏳ Waiting for authentication to load...
            </p>
          )}
        </div>
      </div>
    );
  }

  if (error) {
    const isAuthError = error.includes('sign in');
    
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <div className={`text-6xl mb-4 ${isAuthError ? 'text-orange-500' : 'text-red-500'}`}>
            {isAuthError ? '🔐' : '❌'}
          </div>
          <h2 className={`text-2xl font-bold mb-4 ${isAuthError ? 'text-orange-600' : 'text-red-600'}`}>
            {isAuthError ? 'Authentication Required' : 'Payment Error'}
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => router.push('/')}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              {isAuthError ? 'Go to Sign In' : 'Return to Home'}
            </button>
            {isAuthError && (
              <button
                onClick={() => window.location.reload()}
                className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition"
              >
                Retry
              </button>
            )}
          </div>
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

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold mb-2">Loading...</h2>
        </div>
      </div>
    }>
      <SuccessPageContent />
    </Suspense>
  );
} 