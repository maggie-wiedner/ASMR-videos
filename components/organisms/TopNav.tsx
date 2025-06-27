'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../lib/auth-context';
import AuthForm from '../auth/AuthForm';

export default function TopNav() {
  const { user, loading, signOut } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  if (loading) {
    return (
      <nav className="bg-background border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <span className="text-lg font-semibold">ASMR Video Generator</span>
            </div>
            <div className="flex items-center">
              <span className="text-gray-500">Loading...</span>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-background border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link href="/" className="flex items-center hover:text-primary">
              <span className="text-lg font-semibold">ASMR Video Generator</span>
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <span className="text-sm text-gray-600">
                  Welcome, {user.email}
                </span>
                <button
                  onClick={signOut}
                  className="bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded text-sm font-medium transition"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium transition"
                >
                  Sign In
                </button>
                
                {/* Auth Modal */}
                {showAuthModal && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                      <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold">Sign In</h2>
                        <button
                          onClick={() => setShowAuthModal(false)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          ✕
                        </button>
                      </div>
                      <AuthForm onSuccess={() => setShowAuthModal(false)} />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
} 