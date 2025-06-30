'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../lib/auth-context';
import AuthFlowModal from '../components/auth/AuthFlowModal';

export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Redirect logged-in users to studio
  useEffect(() => {
    if (user) {
      router.push('/studio');
    }
  }, [user, router]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render content for logged-in users (they're being redirected)
  if (user) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to studio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-screen p-4">
      {/* Hero Image Section */}
      <div className="mb-12 w-full max-w-4xl">
        <div className="relative overflow-hidden rounded-2xl">
          <img 
            src="/assets/asmr-hero-image.png" 
            alt="ASMR Video Examples - Relaxing content creation"
            className="w-full object-cover"
          />
        </div>
      </div>

      {/* Educational Content */}
      <div className="w-full max-w-2xl text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Create Stunning ASMR Videos with AI
        </h1>
        <p className="text-xl text-gray-600 mb-6">
          Transform your simple ideas into professional ASMR video prompts. Our AI enhances your concepts and generates beautiful, relaxing content.
        </p>
        
        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="p-4">
            <div className="text-3xl mb-2">✨</div>
            <h3 className="font-semibold text-gray-800 mb-2">AI-Enhanced Prompts</h3>
            <p className="text-sm text-gray-600">Turn basic ideas into detailed, professional video concepts</p>
          </div>
          <div className="p-4">
            <div className="text-3xl mb-2">🎬</div>
            <h3 className="font-semibold text-gray-800 mb-2">Video Generation</h3>
            <p className="text-sm text-gray-600">Generate high-quality ASMR videos from your enhanced prompts</p>
          </div>
          <div className="p-4">
            <div className="text-3xl mb-2">💫</div>
            <h3 className="font-semibold text-gray-800 mb-2">Save & Organize</h3>
            <p className="text-sm text-gray-600">Keep track of your ideas and build your content library</p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="w-full max-w-md text-center">
        <AuthFlowModal 
          buttonText="Start Creating for Free"
          buttonClassName="w-full bg-blue-600 text-white py-4 px-8 rounded-lg font-semibold text-lg hover:bg-blue-700 transition"
        />
        <p className="text-sm text-gray-500 mt-3">
          No credit card required to get started
        </p>
      </div>
    </div>
  );
}
