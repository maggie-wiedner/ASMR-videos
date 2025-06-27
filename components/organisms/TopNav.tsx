'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '../../lib/auth-context';

export default function TopNav() {
  const { user, loading, signOut } = useAuth();

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
              <span className="text-sm text-gray-600">
                Try prompt enhancement free • Sign in to generate videos
              </span>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
} 