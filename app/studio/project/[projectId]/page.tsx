'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../../lib/auth-context';
import Link from 'next/link';
import VideoGenerator from '../../components/VideoGenerator';
import EnhancedPromptsOverview from '../components/EnhancedPromptsOverview';
import ProjectPromptForm from '../components/ProjectPromptForm';
import BackButton from '../../../../components/BackButton';

interface EnhancedPrompt {
  id?: string;
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

interface Project {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export default function ProjectPage() {
  const { projectId } = useParams();
  const router = useRouter();
  const { user, loading } = useAuth();
  
  const [project, setProject] = useState<Project | null>(null);
  const [sessions, setSessions] = useState<PromptSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<PromptSession | null>(null);
  const [enhancedPrompts, setEnhancedPrompts] = useState<EnhancedPrompt[]>([]);
  const [selectedPrompt, setSelectedPrompt] = useState<EnhancedPrompt | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNewPromptForm, setShowNewPromptForm] = useState(false);
  
  // New prompt input states
  const [prompt, setPrompt] = useState('');
  const [submittedPrompt, setSubmittedPrompt] = useState('');
  
  // Video generation states
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [predictionId, setPredictionId] = useState<string | null>(null);
  const [videoStatus, setVideoStatus] = useState<string | null>(null);
  const [videoOutput, setVideoOutput] = useState<string | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !projectId) return;

    const fetchProject = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/supabase/projects?userId=${user.id}&projectId=${projectId}`);
        const data = await response.json();

        if (response.ok && data.project) {
          setProject(data.project);
          setSessions(data.sessions || []);
          
          // Flatten all prompts from all sessions into one array
          if (data.sessions && data.sessions.length > 0) {
            const allEnhancedPrompts = data.sessions.flatMap((session: PromptSession) =>
              session.prompts.map((p: SavedPrompt) => ({
                id: p.id,
                title: p.title,
                description: p.description
              }))
            );
            setEnhancedPrompts(allEnhancedPrompts);
          }
        } else {
          setError('Project not found');
        }
      } catch (err) {
        setError('Failed to load project');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProject();
  }, [user, projectId]);

  // Poll for video generation status
  useEffect(() => {
    if (!predictionId) return;

    const pollStatus = async () => {
      try {
        const response = await fetch(`/api/replicate/status?id=${predictionId}`);
        const data = await response.json();
        
        setVideoStatus(data.status);
        
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
           originalPrompt: promptToUse
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
        setIsGeneratingVideo(false);
        
        // Refresh access status if payment is required
        if (response.status === 402) {
          // Trigger a re-check of user access
          window.location.reload();
        }
      } else {
        setPredictionId(data.predictionId);
        setVideoStatus(data.status);
        
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

  const handleSelectPrompt = (prompt: EnhancedPrompt) => {
    setSelectedPrompt(prompt);
  };

  const handleGenerateVideo = async () => {
    if (selectedPrompt) {
      await generateVideo(selectedPrompt.description);
      
      // Mark this prompt as used for video if we have it saved
      if (user && sessions.length > 0) {
        // Find the matching prompt across all sessions
        let matchingPrompt: SavedPrompt | null = null;
        for (const session of sessions) {
          const foundPrompt = session.prompts.find((p: SavedPrompt) => 
            p.title === selectedPrompt.title && p.description === selectedPrompt.description
          );
          if (foundPrompt) {
            matchingPrompt = foundPrompt;
            break;
          }
        }
        
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

  const handleBackToStudio = () => {
    setSelectedPrompt(null);
    setEnhancedPrompts([]);
    setError(null);
  };

  const handleAddNewSession = () => {
    setShowNewPromptForm(true);
    setSelectedPrompt(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittedPrompt(prompt);
    setIsLoading(true);
    setError(null);
    
    console.log('🔄 Starting prompt enhancement for existing project:', projectId);

    try {
      // For existing projects, we can skip project metadata generation
      // and go straight to prompt generation with existing project context
      const response = await fetch('/api/openai/generate-prompts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          prompt,
          projectMetadata: null, // Let it use fallback for existing projects
          userId: user?.id,
          projectId: projectId
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.error('❌ API request failed:', data);
        setError(data.error || 'Failed to generate prompts');
      } else {
        console.log('✅ Prompts generated successfully');
        
        if (data.enhancedPrompts && Array.isArray(data.enhancedPrompts)) {
          // Refresh the project data to show the new session
          window.location.reload(); // Simple refresh for now
        } else {
          setError('Invalid response format from server');
        }
      }
    } catch (err: any) {
      console.error('💥 Network error occurred:', err);
      setError('Network error: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (loading || isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading project...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-4">{error}</h2>
          <BackButton 
            href="/studio"
            text="Back to Studio"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          />
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-600 mb-4">Project not found</h2>
          <BackButton 
            href="/studio"
            text="Back to Studio"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center min-h-screen p-4 pt-12">
      {/* Navigation */}
      <div className="w-full max-w-6xl mb-8">
        {showNewPromptForm ? (
          <BackButton 
            onClick={() => setShowNewPromptForm(false)}
            text="← Back to Project"
          />
        ) : (
          <BackButton 
            href="/studio"
            text="← Back to Studio"
          />
        )}
      </div>

      {/* Project Info */}
      {!showNewPromptForm && !selectedPrompt && project && (
        <div className="w-full max-w-6xl mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{project.name}</h1>
                {project.description && (
                  <p className="text-gray-600 leading-relaxed">{project.description}</p>
                )}
              </div>
              <span className="text-sm text-gray-500 whitespace-nowrap ml-4">
                Created {new Date(project.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Prompts Overview */}
      {!showNewPromptForm && !selectedPrompt && (
        <EnhancedPromptsOverview 
          enhancedPrompts={enhancedPrompts}
          onSelectPrompt={handleSelectPrompt}
          onAddNewSession={handleAddNewSession}
          projectId={projectId as string}
        />
      )}

      {/* New Prompt Form */}
      {showNewPromptForm && (
        <ProjectPromptForm 
          prompt={prompt}
          setPrompt={setPrompt}
          onSubmit={handleSubmit}
          isLoading={isLoading}
          projectId={projectId as string}
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
        onTryAgain={handleBackToStudio}
      />
    </div>
  );
} 