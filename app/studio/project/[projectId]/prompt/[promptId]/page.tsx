'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../../../../lib/auth-context';
import Link from 'next/link';

interface SavedPrompt {
  id: string;
  user_id: string;
  session_id: string;
  project_id: string;
  original_prompt: string;
  title: string;
  description: string;
  is_favorited: boolean;
  used_for_video: boolean;
  created_at: string;
}

interface Project {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export default function PromptDetailPage() {
  const { projectId, promptId } = useParams();
  const router = useRouter();
  const { user, loading } = useAuth();
  
  const [prompt, setPrompt] = useState<SavedPrompt | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Image generation states
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !projectId || !promptId) return;

    const fetchPromptDetails = async () => {
      setIsLoading(true);
      try {
        // Fetch project details first
        const projectResponse = await fetch(`/api/supabase/projects?userId=${user.id}&projectId=${projectId}`);
        const projectData = await projectResponse.json();

        if (projectResponse.ok && projectData.project) {
          setProject(projectData.project);
          
          // Find the specific prompt in the sessions
          let foundPrompt: SavedPrompt | null = null;
          for (const session of projectData.sessions) {
            const matchingPrompt = session.prompts.find((p: SavedPrompt) => p.id === promptId);
            if (matchingPrompt) {
              foundPrompt = matchingPrompt;
              break;
            }
          }
          
          if (foundPrompt) {
            setPrompt(foundPrompt);
          } else {
            setError('Prompt not found');
          }
        } else {
          setError('Project not found');
        }
      } catch (err) {
        setError('Failed to load prompt details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPromptDetails();
  }, [user, projectId, promptId]);

  const generateFirstFrame = async () => {
    if (!prompt || !user) return;

    setIsGeneratingImage(true);
    setImageError(null);
    setGeneratedImage(null);

    try {
      const response = await fetch('/api/replicate/image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt.description,
          userId: user.id,
          promptId: prompt.id
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setImageError(data.error || 'Failed to generate image');
      } else {
        setGeneratedImage(data.imageUrl);
      }
    } catch (err: any) {
      setImageError('Network error: ' + err.message);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  if (loading || isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading prompt details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-4">{error}</h2>
          <Link 
            href={`/studio/project/${projectId}`}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Back to Project
          </Link>
        </div>
      </div>
    );
  }

  if (!prompt || !project) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-600 mb-4">Prompt not found</h2>
          <Link 
            href={`/studio/project/${projectId}`}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Back to Project
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center min-h-screen p-4 pt-12">
      {/* Header */}
      <div className="w-full max-w-4xl mb-8">
        <div className="flex items-center justify-between mb-4">
          <Link 
            href={`/studio/project/${projectId}`}
            className="flex items-center text-blue-600 hover:text-blue-800 font-medium"
          >
            ← Back to {project.name}
          </Link>
          <span className="text-sm text-gray-500">
            Created {new Date(prompt.created_at).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Prompt Details */}
      <div className="w-full max-w-4xl mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">{prompt.title}</h1>
          
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">Full Description</h2>
            <p className="text-gray-700 leading-relaxed text-lg">{prompt.description}</p>
          </div>

          {/* Image Generation Section */}
          <div className="border-t pt-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">First Frame Preview</h2>
            
            {!generatedImage && !isGeneratingImage && (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">Generate a preview image of your ASMR scene</p>
                <button
                  onClick={generateFirstFrame}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-medium"
                >
                  Generate First Frame
                </button>
              </div>
            )}

            {isGeneratingImage && (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Generating your first frame...</p>
                <p className="text-sm text-gray-500 mt-2">This may take 30-60 seconds</p>
              </div>
            )}

            {imageError && (
              <div className="text-center py-8">
                <p className="text-red-600 mb-4">{imageError}</p>
                <button
                  onClick={generateFirstFrame}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-medium"
                >
                  Try Again
                </button>
              </div>
            )}

            {generatedImage && (
              <div className="space-y-6">
                <div className="rounded-lg overflow-hidden border border-gray-200">
                  <img 
                    src={generatedImage} 
                    alt="Generated first frame"
                    className="w-full h-auto"
                  />
                </div>
                
                <div className="flex gap-4 justify-center">
                  <button
                    onClick={generateFirstFrame}
                    className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition font-medium"
                  >
                    Generate Another
                  </button>
                  <button
                    onClick={() => router.push(`/studio/project/${projectId}?generateVideo=${promptId}`)}
                    className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition font-medium"
                  >
                    Generate Video →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 