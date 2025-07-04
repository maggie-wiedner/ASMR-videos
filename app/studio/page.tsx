'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../lib/auth-context';
import AuthFlowModal from '../../components/auth/AuthFlowModal';
import { supabase } from '../../lib/supabase';
import PromptInput from './components/PromptInput';
import SavedPromptCards from './components/SavedPromptCards';
import EnhancedPromptsGrid from './project/components/EnhancedPromptsGrid';
import VideoGenerator from './components/VideoGenerator';

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

export default function StudioPage() {
  const { user, loading } = useAuth();
  const [prompt, setPrompt] = useState('');
  const [submittedPrompt, setSubmittedPrompt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [enhancedPrompts, setEnhancedPrompts] = useState<EnhancedPrompt[]>([]);
  const [selectedPrompt, setSelectedPrompt] = useState<EnhancedPrompt | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [projectMetadata, setProjectMetadata] = useState<any>(null);
  
  // Saved prompts state
  const [savedPrompts, setSavedPrompts] = useState<SavedPrompt[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
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

  // Auto-fetch projects when user is authenticated
  useEffect(() => {
    if (user) {
      fetchProjects();
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
        const response = await fetch(`/api/replicate/status?id=${predictionId}`);
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
      const response = await fetch('/api/replicate/video', {
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
    setProjectMetadata(null);
    
    // Clear video states when starting fresh
    setVideoOutput(null);
    setVideoError(null);
    setPredictionId(null);

    console.log('🔄 Starting two-step enhancement for:', prompt);

    try {
      // Step 1: Enhance project metadata
      console.log('📋 Step 1: Generating project metadata...');
              const projectResponse = await fetch('/api/openai/enhance-project', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      const projectData = await projectResponse.json();
      
      if (!projectResponse.ok) {
        console.error('❌ Project enhancement failed:', projectData);
        setError(projectData.error || 'Failed to analyze project');
        setDebugInfo(projectData.debug);
        return;
      }

      console.log('✅ Project metadata generated:', projectData.projectMetadata);
      setProjectMetadata(projectData.projectMetadata);

      // Step 2: Generate prompts using project metadata
      console.log('📝 Step 2: Generating prompts with project context...');
              const promptsResponse = await fetch('/api/openai/generate-prompts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          prompt,
          projectMetadata: projectData.projectMetadata,
          userId: user?.id
        }),
      });

      const promptsData = await promptsResponse.json();
      
      if (!promptsResponse.ok) {
        console.error('❌ Prompt generation failed:', promptsData);
        setError(promptsData.error || 'Failed to generate prompts');
        setDebugInfo(promptsData.debug);
      } else {
        console.log('✅ Prompts generated successfully');
        console.log('📝 Enhanced prompts received:', promptsData.enhancedPrompts);
        console.log('📊 Number of prompts:', promptsData.enhancedPrompts?.length || 0);
        
        if (promptsData.enhancedPrompts && Array.isArray(promptsData.enhancedPrompts)) {
          console.log('🎯 First prompt sample:', promptsData.enhancedPrompts[0]);
          console.log('💾 Saved to database:', promptsData.debug?.savedToDatabase);
          setEnhancedPrompts(promptsData.enhancedPrompts);
          
          // Refresh projects list if we saved new ones
          if (promptsData.projectId && projects.length >= 0) {
            fetchProjects();
          }
        } else {
          console.error('❌ enhancedPrompts is not an array:', typeof promptsData.enhancedPrompts);
          setError('Invalid response format from server');
        }
        
        setDebugInfo(promptsData.debug);
      }
    } catch (err: any) {
      console.error('💥 Network error occurred:', err);
      setError('Network error: ' + err.message);
    } finally {
      setIsLoading(false);
      console.log('🏁 Two-step enhancement process completed');
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
            await fetch('/api/supabase/prompts/update', {
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

  const fetchProjects = async () => {
    if (!user) return;

    setLoadingProjects(true);
    try {
      console.log('📚 Fetching projects...');
      const response = await fetch(`/api/supabase/projects?userId=${user.id}`);
      const data = await response.json();

      if (response.ok) {
        console.log('✅ Loaded projects:', data.projects.length);
        setProjects(data.projects);
      } else {
        console.error('❌ Failed to load projects:', data.error);
      }
    } catch (err) {
      console.error('💥 Error fetching projects:', err);
    } finally {
      setLoadingProjects(false);
    }
  };



  // Note: toggleFavorite functionality temporarily removed for project migration
  // Will be re-implemented within individual project pages

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
    <div className="flex-1 flex flex-col items-center min-h-screen p-4 pt-12">
      {/* Show sign-in prompt if not authenticated */}
      {!user && (
        <div className="w-full max-w-md text-center mt-32">
          <AuthFlowModal 
            buttonText="Get Started"
            buttonClassName="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition"
          />
        </div>
      )}

      {/* Main interface for authenticated users */}
      {user && enhancedPrompts.length === 0 && !selectedPrompt && (
        <div className="w-full max-w-6xl">
          <PromptInput 
            prompt={prompt}
            setPrompt={setPrompt}
            onSubmit={handleSubmit}
            isLoading={isLoading}
          />
          <SavedPromptCards 
            projects={projects}
            isLoading={loadingProjects}
          />
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

      {/* Project Metadata Display */}
      {user && projectMetadata && enhancedPrompts.length > 0 && !selectedPrompt && (
        <div className="w-full max-w-4xl mb-8">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                🎨 Generated Project: "{projectMetadata.title}"
              </h3>
              <p className="text-gray-600 leading-relaxed mb-3">
                {projectMetadata.description}
              </p>
              {projectMetadata.theme && (
                <div className="text-sm text-gray-500 italic border-t border-blue-200 pt-3">
                  <strong>Creative Direction:</strong> {projectMetadata.theme}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Prompts Grid */}
      {user && enhancedPrompts.length > 0 && !selectedPrompt && (
        <EnhancedPromptsGrid 
          enhancedPrompts={enhancedPrompts}
          onSelectPrompt={handleSelectPrompt}
        />
      )}

      {/* Video Generation Flow */}
      <VideoGenerator 
        selectedPrompt={selectedPrompt}
        isGeneratingVideo={isGeneratingVideo}
        videoStatus={videoStatus}
        videoError={videoError}
        videoOutput={videoOutput}
        onGenerateVideo={handleGenerateVideo}
        onDeselectPrompt={() => setSelectedPrompt(null)}
        onTryAgain={handleEditPrompt}
      />
    </div>
  );
}
