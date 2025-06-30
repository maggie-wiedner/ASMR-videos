'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth-context';
import AuthFlowModal from '../components/auth/AuthFlowModal';
import { supabase } from '../lib/supabase';

interface EnhancedPrompt {
  title: string;
  description: string;
}

interface SavedPrompt {
  id: string;
  user_id: string;
  session_id: string;
  original_prompt: string;
  title: string;
  description: string;
  is_favorited: boolean;
  used_for_video: boolean;
  created_at: string;
}

interface PromptSession {
  session_id: string;
  original_prompt: string;
  created_at: string;
  prompts: SavedPrompt[];
}

export default function HomePage() {
  const { user, loading } = useAuth();
  const [prompt, setPrompt] = useState('');
  const [submittedPrompt, setSubmittedPrompt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [enhancedPrompts, setEnhancedPrompts] = useState<EnhancedPrompt[]>([]);
  const [selectedPrompt, setSelectedPrompt] = useState<EnhancedPrompt | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  
  // Saved prompts state
  const [savedPrompts, setSavedPrompts] = useState<SavedPrompt[]>([]);
  const [promptSessions, setPromptSessions] = useState<PromptSession[]>([]);
  const [loadingSavedPrompts, setLoadingSavedPrompts] = useState(false);
  const [viewMode, setViewMode] = useState<'sessions' | 'individual' | 'favorites'>('sessions');
  
  // Video generation states
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [predictionId, setPredictionId] = useState<string | null>(null);
  const [videoStatus, setVideoStatus] = useState<string | null>(null);
  const [videoOutput, setVideoOutput] = useState<string | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [videoDebugInfo, setVideoDebugInfo] = useState<any>(null);

  // Access control state
  const [hasAccess, setHasAccess] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(false);
  const [paymentModalDismissed, setPaymentModalDismissed] = useState(false);

  // Auto-fetch saved prompts when user is authenticated
  useEffect(() => {
    if (user) {
      fetchSavedPrompts();
    }
  }, [user]);

  // Check if user has sufficient wallet balance for video generation
  useEffect(() => {
    const checkUserAccess = async () => {
      if (!user) {
        setHasAccess(false);
        return;
      }

      setCheckingAccess(true);
      try {
        // Fetch total deposits (money added to wallet)
        const { data: payments, error: paymentsError } = await supabase
          .from('payments')
          .select('amount')
          .eq('user_id', user.id)
          .eq('status', 'completed');

        if (paymentsError) {
          console.error('Error fetching payments:', paymentsError);
          setHasAccess(false);
          return;
        }

        // Fetch total spent on videos (money deducted from wallet)
        const { data: videos, error: videosError } = await supabase
          .from('user_videos')
          .select('id')
          .eq('user_id', user.id)
          .eq('status', 'completed');

        if (videosError) {
          console.error('Error fetching videos:', videosError);
          setHasAccess(false);
          return;
        }

        // Calculate wallet balance: deposits - (videos * $6)
        const totalDeposits = payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0;
        const totalSpent = (videos?.length || 0) * 600; // $6.00 = 600 cents per video
        const walletBalance = totalDeposits - totalSpent;
        
        // User has access if wallet balance >= $6 (600 cents)
        setHasAccess(walletBalance >= 600);
      } catch (err) {
        console.error('Error checking access:', err);
        setHasAccess(false);
      } finally {
        setCheckingAccess(false);
      }
    };

    checkUserAccess();
  }, [user]);

  // Poll for video generation status
  useEffect(() => {
    if (!predictionId) return;

    const pollStatus = async () => {
      try {
        const response = await fetch(`/api/status?id=${predictionId}`);
        const data = await response.json();
        
        setVideoStatus(data.status);
        setVideoDebugInfo(data.debug);
        
        if (data.status === 'succeeded' && data.output) {
          setVideoOutput(data.output);
          setIsGeneratingVideo(false);
        } else if (data.status === 'failed') {
          setVideoError(data.error || 'Video generation failed');
          setIsGeneratingVideo(false);
        }
      } catch (err: any) {
        setVideoError('Failed to check video status: ' + err.message);
        setIsGeneratingVideo(false);
      }
    };

    const interval = setInterval(pollStatus, 2000);
    return () => clearInterval(interval);
  }, [predictionId]);

  const generateVideo = async (promptToUse: string) => {
    if (!user) {
      setVideoError('User authentication required');
      return;
    }

    setIsGeneratingVideo(true);
    setVideoError(null);
    setVideoOutput(null);
    setPredictionId(null);
    setVideoStatus(null);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          enhancedPrompt: promptToUse,
          userId: user.id,
          originalPrompt: submittedPrompt || promptToUse
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        // Handle insufficient balance error specially
        if (response.status === 402) {
          setVideoError(`Insufficient wallet balance. You need $${data.requiredAmount} but only have $${data.walletBalance?.toFixed(2) || '0.00'}. Please add funds to continue.`);
        } else {
          setVideoError(data.error || 'Failed to start video generation');
        }
        setVideoDebugInfo(data.debug);
        setIsGeneratingVideo(false);
        
        // Refresh access status if payment is required
        if (response.status === 402) {
          // Trigger a re-check of user access
          window.location.reload();
        }
      } else {
        setPredictionId(data.predictionId);
        setVideoStatus(data.status);
        setVideoDebugInfo(data.debug);
        
        // Show success message about wallet deduction
        if (data.message) {
          console.log(data.message);
        }
      }
    } catch (err: any) {
      setVideoError('Network error: ' + err.message);
      setIsGeneratingVideo(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittedPrompt(prompt);
    setIsLoading(true);
    setError(null);
    setEnhancedPrompts([]);
    setSelectedPrompt(null);
    setDebugInfo(null);
    
    // Clear video states when starting fresh
    setVideoOutput(null);
    setVideoError(null);
    setPredictionId(null);

    console.log('🔄 Starting prompt enhancement for:', prompt);

    try {
      const response = await fetch('/api/enhance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          prompt,
          userId: user?.id 
        }),
      });

      console.log('📡 API Response status:', response.status);
      console.log('📡 API Response ok:', response.ok);

      const data = await response.json();
      console.log('📦 Raw API response data:', data);
      
      if (!response.ok) {
        console.error('❌ API request failed:', data);
        setError(data.error || 'Failed to enhance prompt');
        setDebugInfo(data.debug);
      } else {
        console.log('✅ API request successful');
        console.log('📝 Enhanced prompts received:', data.enhancedPrompts);
        console.log('📊 Number of prompts:', data.enhancedPrompts?.length || 0);
        
        if (data.enhancedPrompts && Array.isArray(data.enhancedPrompts)) {
          console.log('🎯 First prompt sample:', data.enhancedPrompts[0]);
          console.log('💾 Saved to database:', data.debug?.savedToDatabase);
          setEnhancedPrompts(data.enhancedPrompts);
          
                      // Refresh saved prompts list if we saved new ones
            if (data.sessionId && savedPrompts.length > 0) {
              fetchSavedPrompts();
            }
        } else {
          console.error('❌ enhancedPrompts is not an array:', typeof data.enhancedPrompts);
          setError('Invalid response format from server');
        }
        
        setDebugInfo(data.debug);
      }
    } catch (err: any) {
      console.error('💥 Network error occurred:', err);
      setError('Network error: ' + err.message);
    } finally {
      setIsLoading(false);
      console.log('🏁 Prompt enhancement process completed');
    }
  };

  const handleSelectPrompt = (prompt: EnhancedPrompt) => {
    setSelectedPrompt(prompt);
  };

  const handleGenerateVideo = async () => {
    if (selectedPrompt) {
      await generateVideo(selectedPrompt.description);
      
      // Mark this prompt as used for video if we have it saved
      if (user && savedPrompts.length > 0) {
        const matchingPrompt = savedPrompts.find(p => 
          p.title === selectedPrompt.title && p.description === selectedPrompt.description
        );
        if (matchingPrompt && !matchingPrompt.used_for_video) {
          try {
            await fetch('/api/update-prompt', {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                promptId: matchingPrompt.id,
                userId: user.id,
                updates: { used_for_video: true }
              }),
            });
            console.log('✅ Marked prompt as used for video');
          } catch (err) {
            console.error('💥 Error marking prompt as used:', err);
          }
        }
      }
    }
  };

  const handleEditPrompt = () => {
    setEnhancedPrompts([]);
    setSelectedPrompt(null);
    setError(null);
    setPrompt(submittedPrompt || '');
  };

  const fetchSavedPrompts = async () => {
    if (!user) return;

    setLoadingSavedPrompts(true);
    try {
      console.log('📚 Fetching saved prompts...');
      const response = await fetch(`/api/saved-prompts?userId=${user.id}&limit=50`);
      const data = await response.json();

      if (response.ok) {
        console.log('✅ Loaded saved prompts:', data.prompts.length);
        console.log('✅ Loaded sessions:', data.sessions.length);
        setSavedPrompts(data.prompts);
        setPromptSessions(data.sessions);
      } else {
        console.error('❌ Failed to load saved prompts:', data.error);
      }
    } catch (err) {
      console.error('💥 Error fetching saved prompts:', err);
    } finally {
      setLoadingSavedPrompts(false);
    }
  };

  const loadSavedPromptSession = (session: PromptSession) => {
    console.log('📖 Loading saved prompt session:', session.session_id);
    setPrompt(session.original_prompt);
    setSubmittedPrompt(session.original_prompt);
    // Convert saved prompts back to enhanced prompts format
    const enhancedPromptsFromSession = session.prompts.map(p => ({
      title: p.title,
      description: p.description
    }));
    setEnhancedPrompts(enhancedPromptsFromSession);
    setSelectedPrompt(null);
    setError(null);
  };

  const toggleFavorite = async (promptId: string, currentStatus: boolean) => {
    if (!user) return;

    try {
      console.log('⭐ Toggling favorite for prompt:', promptId);
      const response = await fetch('/api/update-prompt', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          promptId,
          userId: user.id,
          updates: { is_favorited: !currentStatus }
        }),
      });

      if (response.ok) {
        console.log('✅ Favorite toggled successfully');
        // Update local state
        setSavedPrompts(prev => prev.map(p => 
          p.id === promptId ? { ...p, is_favorited: !currentStatus } : p
        ));
        // Update sessions state too
        setPromptSessions(prev => prev.map(session => ({
          ...session,
          prompts: session.prompts.map(p => 
            p.id === promptId ? { ...p, is_favorited: !currentStatus } : p
          )
        })));
      } else {
        console.error('❌ Failed to toggle favorite');
      }
    } catch (err) {
      console.error('💥 Error toggling favorite:', err);
    }
  };

  // Show loading state
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

  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-screen p-4">
      {/* Hero Image Section - Only show when no saved prompts (empty state) */}
      {(!user || promptSessions.length === 0) && (
        <div className="mb-12 w-full max-w-4xl">
          <div className="relative overflow-hidden rounded-2xl">
            <img 
              src="/assets/asmr-hero-image.png" 
              alt="ASMR Video Examples - Relaxing content creation"
              className="w-full object-cover"
            />
          </div>
        </div>
      )}

      {/* Show sign-in prompt if not authenticated */}
      {!user && (
        <div className="w-full max-w-md text-center">
          <AuthFlowModal 
            buttonText="Get Started"
            buttonClassName="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition"
          />
        </div>
      )}

      {/* Show the main tool interface for authenticated users with no enhanced prompts */}
      {user && enhancedPrompts.length === 0 && !selectedPrompt && (
        <div className="w-full max-w-md">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <input
              id="prompt"
              type="text"
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              className="border rounded px-3 py-2 text-lg"
              placeholder="e.g. Rain sounds in a cozy cabin"
              required
            />
            <button
              type="submit"
              disabled={isLoading}
              className="bg-blue-600 text-white px-4 py-2 rounded font-semibold hover:bg-blue-700 transition disabled:bg-gray-400"
            >
              {isLoading ? 'Generating 9 Prompts...' : 'Generate'}
            </button>
          </form>
        </div>
      )}

      {/* Saved Prompts Section - Show by default when user has saved prompts */}
      {user && promptSessions.length > 0 && enhancedPrompts.length === 0 && !selectedPrompt && (
        <div className="w-full max-w-4xl mt-6">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">📚 My Previous Ideas</h3>
            
            {loadingSavedPrompts ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600 mx-auto mb-2"></div>
                <p className="text-gray-600 text-sm">Loading saved prompts...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* View Mode Toggle */}
                <div className="flex justify-center gap-2 mb-4">
                  <button
                    onClick={() => setViewMode('sessions')}
                    className={`px-3 py-1 rounded text-sm ${viewMode === 'sessions' ? 'bg-blue-100 text-blue-800' : 'text-gray-600 hover:text-gray-800'}`}
                  >
                    By Session
                  </button>
                  <button
                    onClick={() => setViewMode('individual')}
                    className={`px-3 py-1 rounded text-sm ${viewMode === 'individual' ? 'bg-blue-100 text-blue-800' : 'text-gray-600 hover:text-gray-800'}`}
                  >
                    All Prompts
                  </button>
                  <button
                    onClick={() => setViewMode('favorites')}
                    className={`px-3 py-1 rounded text-sm ${viewMode === 'favorites' ? 'bg-blue-100 text-blue-800' : 'text-gray-600 hover:text-gray-800'}`}
                  >
                    ⭐ Favorites
                  </button>
                </div>

                {/* Sessions View */}
                {viewMode === 'sessions' && (
                  <div className="space-y-3">
                    {promptSessions.map((session) => (
                      <div
                        key={session.session_id}
                        className="bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer"
                        onClick={() => loadSavedPromptSession(session)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-800 mb-1">"{session.original_prompt}"</h4>
                            <p className="text-gray-500 text-sm">
                              {session.prompts.length} prompts • {new Date(session.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                            Load →
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Individual Prompts View */}
                {viewMode === 'individual' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {savedPrompts.map((savedPrompt) => (
                      <div
                        key={savedPrompt.id}
                        className="bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-sm transition-all"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium text-gray-800 text-sm">{savedPrompt.title}</h4>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(savedPrompt.id, savedPrompt.is_favorited);
                            }}
                            className={`text-lg ${savedPrompt.is_favorited ? 'text-yellow-500' : 'text-gray-300 hover:text-yellow-400'}`}
                          >
                            ⭐
                          </button>
                        </div>
                        <p className="text-gray-600 text-xs line-height-4 mb-2 h-12 overflow-hidden">
                          {savedPrompt.description}
                        </p>
                        <div className="flex justify-between items-center text-xs text-gray-400">
                          <span>{new Date(savedPrompt.created_at).toLocaleDateString()}</span>
                          {savedPrompt.used_for_video && (
                            <span className="bg-green-100 text-green-800 px-2 py-1 rounded">🎬 Used</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Favorites View */}
                {viewMode === 'favorites' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {savedPrompts.filter(p => p.is_favorited).map((savedPrompt) => (
                      <div
                        key={savedPrompt.id}
                        className="bg-white border border-yellow-200 rounded-lg p-4 hover:border-yellow-300 hover:shadow-sm transition-all"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium text-gray-800 text-sm">{savedPrompt.title}</h4>
                          <span className="text-yellow-500 text-lg">⭐</span>
                        </div>
                        <p className="text-gray-600 text-xs line-height-4 mb-2 h-12 overflow-hidden">
                          {savedPrompt.description}
                        </p>
                        <div className="flex justify-between items-center text-xs text-gray-400">
                          <span>{new Date(savedPrompt.created_at).toLocaleDateString()}</span>
                          {savedPrompt.used_for_video && (
                            <span className="bg-green-100 text-green-800 px-2 py-1 rounded">🎬 Used</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add New Prompt Button */}
                <div className="text-center pt-4 border-t border-gray-200">
                  <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-md mx-auto">
                    <input
                      id="prompt"
                      type="text"
                      value={prompt}
                      onChange={e => setPrompt(e.target.value)}
                      className="border rounded px-3 py-2 text-lg"
                      placeholder="e.g. Rain sounds in a cozy cabin"
                      required
                    />
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="bg-blue-600 text-white px-4 py-2 rounded font-semibold hover:bg-blue-700 transition disabled:bg-gray-400"
                    >
                      {isLoading ? 'Generating 9 Prompts...' : '+ Generate New Ideas'}
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="w-full max-w-4xl mt-4">
          <div className="p-4 bg-red-50 border border-red-200 rounded">
            <h3 className="font-semibold text-red-800 mb-2">Error:</h3>
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Enhanced Prompts Grid */}
      {user && enhancedPrompts.length > 0 && !selectedPrompt && (
        <div className="w-full max-w-6xl mt-8">          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {enhancedPrompts.map((prompt, index) => {
              console.log(`🎨 Rendering card ${index}:`, { title: prompt.title, descriptionLength: prompt.description?.length });
              return (
                <div 
                  key={index}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
                  onClick={() => handleSelectPrompt(prompt)}
                >
                  <h3 className="font-semibold text-lg text-gray-800 mb-2">{prompt.title}</h3>
                  <p className="text-gray-600 text-sm h-16 overflow-hidden">{prompt.description}</p>
                  <div className="mt-3">
                    <button className="text-blue-600 hover:text-blue-800 font-medium text-sm">
                      Select This Style →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Selected Prompt Review */}
      {user && selectedPrompt && !isGeneratingVideo && !videoOutput && (
        <div className="w-full max-w-2xl mt-8">
          <div className="p-6 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="font-semibold text-green-800 mb-2 text-xl">✨ Selected Style:</h3>
            <h4 className="font-bold text-lg text-gray-800 mb-3">{selectedPrompt.title}</h4>
            <div className="bg-white p-4 rounded border mb-4">
              <p className="text-gray-800">{selectedPrompt.description}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleGenerateVideo}
                className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition"
              >
                🎬 Generate Video ($6)
              </button>
              <button
                onClick={() => setSelectedPrompt(null)}
                className="bg-gray-500 text-white px-4 py-3 rounded-lg font-semibold hover:bg-gray-600 transition"
              >
                ← Choose Different Style
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Video Generation Status */}
      {isGeneratingVideo && (
        <div className="w-full max-w-2xl mt-8">
          <div className="p-4 bg-purple-50 border border-purple-200 rounded">
            <h3 className="font-semibold text-purple-800 mb-2">🎥 Creating Your ASMR Video...</h3>
            <p className="text-purple-700">
              {videoStatus === 'starting' && 'Starting video generation...'}
              {videoStatus === 'processing' && 'Processing video with AI...'}
              {!videoStatus && 'Sending to video generator...'}
            </p>
            {predictionId && (
              <p className="text-purple-600 text-sm mt-1">This may take 2-3 minutes</p>
            )}
          </div>
        </div>
      )}

      {/* Video Error */}
      {videoError && (
        <div className="w-full max-w-2xl mt-8">
          <div className="p-4 bg-red-50 border border-red-200 rounded">
            <h3 className="font-semibold text-red-800 mb-2">Video Generation Error:</h3>
            <p className="text-red-700 mb-2">{videoError}</p>
            <button
              onClick={handleEditPrompt}
              className="mt-3 bg-blue-600 text-white px-4 py-2 rounded font-semibold hover:bg-blue-700 transition"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Video Output */}
      {videoOutput && (
        <div className="w-full max-w-2xl mt-8">
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded">
            <h3 className="font-semibold text-emerald-800 mb-2">🎉 Your ASMR Video is Ready!</h3>
            <div className="bg-white p-3 rounded border">
              <video 
                src={videoOutput} 
                controls 
                className="w-full max-w-lg mx-auto rounded"
                onError={() => setVideoError('Failed to load video')}
              >
                Your browser does not support the video tag.
              </video>
            </div>
            <button
              onClick={handleEditPrompt}
              className="mt-3 bg-blue-600 text-white px-4 py-2 rounded font-semibold hover:bg-blue-700 transition"
            >
              Create Another Video
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
