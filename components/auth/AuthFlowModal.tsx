'use client';

import React, { useState, useEffect } from 'react';
import AuthForm from './AuthForm';
import { useAuth } from '../../lib/auth-context';
import { supabase } from '../../lib/supabase';

interface AuthFlowModalProps {
  buttonText?: string;
  buttonClassName?: string;
  autoOpen?: boolean;
  onPaymentModalClosed?: () => void;
}

export default function AuthFlowModal({ 
  buttonText = "Sign In",
  buttonClassName = "bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium transition",
  autoOpen = false,
  onPaymentModalClosed
}: AuthFlowModalProps) {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [flowStep, setFlowStep] = useState<'auth' | 'payment'>('auth');
  const [hasAccess, setHasAccess] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(false);

  // Auto-open modal if autoOpen prop is true
  useEffect(() => {
    if (autoOpen && !showModal) {
      setShowModal(true);
      if (user) {
        setFlowStep('payment');
      }
    }
  }, [autoOpen, showModal, user]);

  // Check if user has access when they sign in
  useEffect(() => {
    const checkUserAccess = async () => {
      if (!user) {
        setHasAccess(false);
        return;
      }

      setCheckingAccess(true);
      try {
        const { data, error } = await supabase
          .from('payments')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'completed')
          .limit(1);

        if (error) {
          console.error('Error checking access:', error);
          setHasAccess(false);
        } else {
          const userHasAccess = data && data.length > 0;
          setHasAccess(userHasAccess);
          
          // If user has access, close modal. If not, ensure we're on payment step
          if (userHasAccess) {
            setShowModal(false);
          } else if (flowStep !== 'payment') {
            // Only set to payment if we're not already there (avoid overriding manual transitions)
            setFlowStep('payment');
          }
        }
      } catch (err) {
        console.error('Error checking access:', err);
        setHasAccess(false);
      } finally {
        setCheckingAccess(false);
      }
    };

    if (user && showModal) {
      checkUserAccess();
    }
  }, [user, showModal, flowStep]);

  const openModal = () => {
    setIsSignUp(false);
    // If user is already signed in, go directly to payment step
    setFlowStep(user ? 'payment' : 'auth');
    setShowModal(true);
  };

  const closeModal = () => {
    // If closing payment modal, notify parent
    if (flowStep === 'payment' && onPaymentModalClosed) {
      onPaymentModalClosed();
    }
    setShowModal(false);
    setFlowStep('auth');
  };

  const handleAuthSuccess = () => {
    // Transition directly to payment step - don't close modal
    setFlowStep('payment');
  };

  const handleToggleMode = (signUpMode: boolean) => {
    setIsSignUp(signUpMode);
  };

  const handlePurchaseAccess = async () => {
    if (!user) return;

    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      } else {
        console.error('Failed to create checkout session:', data.error);
      }
    } catch (err: any) {
      console.error('Network error:', err.message);
    }
  };

  const getModalTitle = () => {
    if (flowStep === 'auth') {
      return isSignUp ? 'Sign Up' : 'Sign In';
    } else {
      return 'Get Access';
    }
  };

  return (
    <>
      {/* Sign In Button */}
      <button
        onClick={openModal}
        className={buttonClassName}
      >
        {buttonText}
      </button>
      
      {/* Modal */}
      {showModal && !checkingAccess && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                {getModalTitle()}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                ✕
              </button>
            </div>



            {!checkingAccess && flowStep === 'auth' && (
              <AuthForm 
                onSuccess={handleAuthSuccess}
                onToggleMode={handleToggleMode}
              />
            )}

            {!checkingAccess && flowStep === 'payment' && user && (
              <div className="text-center">
                <div className="mb-6">
                  <div className="text-green-500 text-4xl mb-3">🎉</div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    Welcome, {user.email?.split('@')[0]}!
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">
                    You're almost ready to create amazing ASMR videos
                  </p>
                </div>

                <button
                  onClick={handlePurchaseAccess}
                  className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition mb-3"
                >
                  Purchase Access - $6.00
                </button>

                <p className="text-xs text-gray-500">
                  🔒 Secure payment powered by Stripe
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
} 