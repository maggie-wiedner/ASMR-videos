'use client';

import React from 'react';
import { useAuth } from '../../lib/auth-context';
import AuthFlowModal from '../auth/AuthFlowModal';

export default function TopNav() {
  const { user, signOut } = useAuth();

  const handleSignOut = () => {
    signOut();
  };

  return (
    <nav className="bg-white shadow-sm border-b sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-gray-900">
              ASMR Generator
            </h1>
          </div>
          
          <div className="flex items-center space-x-4">
            {user ? (
              <button
                onClick={handleSignOut}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Sign Out
              </button>
            ) : (
              <AuthFlowModal />
            )}
          </div>
        </div>
      </div>
    </nav>
  );
} 