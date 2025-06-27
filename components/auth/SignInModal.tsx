'use client';

import React, { useState } from 'react';
import AuthForm from './AuthForm';

interface SignInModalProps {
  buttonText?: string;
  buttonClassName?: string;
}

export default function SignInModal({ 
  buttonText = "Sign In",
  buttonClassName = "bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium transition"
}: SignInModalProps) {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const openSignIn = () => {
    setIsSignUp(false);
    setShowAuthModal(true);
  };

  const closeModal = () => {
    setShowAuthModal(false);
  };

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
  };

  const handleToggleMode = (signUpMode: boolean) => {
    setIsSignUp(signUpMode);
  };

  return (
    <>
      {/* Sign In Button */}
      <button
        onClick={openSignIn}
        className={buttonClassName}
      >
        {buttonText}
      </button>
      
      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                {isSignUp ? 'Sign Up' : 'Sign In'}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                ✕
              </button>
            </div>
            <AuthForm 
              onSuccess={handleAuthSuccess}
              onToggleMode={handleToggleMode}
            />
          </div>
        </div>
      )}
    </>
  );
} 