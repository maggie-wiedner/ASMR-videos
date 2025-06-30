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
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

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

  const handlePurchaseAccess = async (priceId: 'starter' | 'basic' | 'pro' | 'business') => {
    if (!user) return;

    setIsProcessingPayment(true);
    setPaymentError(null);

    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          priceId,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      } else {
        console.error('Failed to create checkout session:', data.error);
        setPaymentError(data.error || 'Failed to create checkout session. Please try again.');
        setIsProcessingPayment(false);
      }
    } catch (err: any) {
      console.error('Network error:', err.message);
      setPaymentError('Network error. Please check your connection and try again.');
      setIsProcessingPayment(false);
    }
  };



  const getModalTitle = () => {
    if (flowStep === 'auth') {
      return isSignUp ? 'Sign Up' : 'Sign In';
    } else {
      return 'Add Funds';
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
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
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
                  <div className="text-blue-500 text-4xl mb-3">💰</div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    Add Funds to Your Wallet
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Each ASMR video costs $6.00 to generate. Add funds to get started!
                  </p>
                </div>

                {paymentError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                    {paymentError}
                  </div>
                )}

                {/* Funding Options */}
                <div className="space-y-3 mb-4">
                  {/* $6 - 1 Video */}
                  <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-semibold text-gray-800">Starter</h4>
                      <div className="text-right">
                        <span className="text-2xl font-bold text-green-600">$6</span>
                        <p className="text-xs text-gray-500">1 video</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">Perfect for trying out the service</p>
                    <button
                      onClick={() => handlePurchaseAccess('starter')}
                      disabled={isProcessingPayment}
                      className="w-full bg-green-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-green-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {isProcessingPayment ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Processing...
                        </div>
                      ) : (
                        'Add $6.00'
                      )}
                    </button>
                  </div>

                  {/* $30 - 5 Videos */}
                  <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-semibold text-gray-800">Basic</h4>
                      <div className="text-right">
                        <span className="text-2xl font-bold text-blue-600">$30</span>
                        <p className="text-xs text-gray-500">5 videos</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">Great for regular use</p>
                    <button
                      onClick={() => handlePurchaseAccess('basic')}
                      disabled={isProcessingPayment}
                      className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {isProcessingPayment ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Processing...
                        </div>
                      ) : (
                        'Add $30.00'
                      )}
                    </button>
                  </div>

                  {/* $60 - 10 Videos */}
                  <div className="border-2 border-blue-500 rounded-lg p-4 bg-blue-50 relative">
                    <div className="absolute -top-2 left-4 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                      POPULAR
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-semibold text-gray-800">Pro</h4>
                      <div className="text-right">
                        <span className="text-2xl font-bold text-blue-600">$60</span>
                        <p className="text-xs text-gray-500">10 videos</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">Best value for creators</p>
                    <button
                      onClick={() => handlePurchaseAccess('pro')}
                      disabled={isProcessingPayment}
                      className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {isProcessingPayment ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Processing...
                        </div>
                      ) : (
                        'Add $60.00'
                      )}
                    </button>
                  </div>

                  {/* $120 - 20 Videos */}
                  <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-semibold text-gray-800">Business</h4>
                      <div className="text-right">
                        <span className="text-2xl font-bold text-purple-600">$120</span>
                        <p className="text-xs text-gray-500">20 videos</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">For heavy usage and teams</p>
                    <button
                      onClick={() => handlePurchaseAccess('business')}
                      disabled={isProcessingPayment}
                      className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-purple-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {isProcessingPayment ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Processing...
                        </div>
                      ) : (
                        'Add $120.00'
                      )}
                    </button>
                  </div>
                </div>

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