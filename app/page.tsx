'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth-context';

export default function HomePage() {
  const { user, loading } = useAuth();
  const [prompt, setPrompt] = useState('');
  const [submittedPrompt, setSubmittedPrompt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [enhancedPrompt, setEnhancedPrompt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  
  // Video generation states
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [predictionId, setPredictionId] = useState<string | null>(null);
  const [videoStatus, setVideoStatus] = useState<string | null>(null);
  const [videoOutput, setVideoOutput] = useState<string | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [videoDebugInfo, setVideoDebugInfo] = useState<any>(null);



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

    const interval = setInterval(pollStatus, 2000); // Poll every 2 seconds
    return () => clearInterval(interval);
  }, [predictionId]);

  const generateVideo = async (promptToUse: string) => {
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
        body: JSON.stringify({ enhancedPrompt: promptToUse }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        setVideoError(data.error || 'Failed to start video generation');
        setVideoDebugInfo(data.debug);
        setIsGeneratingVideo(false);
      } else {
        setPredictionId(data.predictionId);
        setVideoStatus(data.status);
        setVideoDebugInfo(data.debug);
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
    setEnhancedPrompt(null);
    setDebugInfo(null);
    
    // Clear video states when starting fresh
    setVideoOutput(null);
    setVideoError(null);
    setPredictionId(null);

    try {
      const response = await fetch('/api/enhance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        setError(data.error || 'Failed to enhance prompt');
        setDebugInfo(data.debug);
      } else {
        setEnhancedPrompt(data.enhancedPrompt);
        setDebugInfo(data.debug);
        // REMOVED: Automatic video generation - now user must approve first
      }
    } catch (err: any) {
      setError('Network error: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprovePrompt = () => {
    if (!user) {
      // Show message to sign in via the top navigation
      setError('Please sign in using the button in the top navigation to generate videos.');
      return;
    }
    
    if (enhancedPrompt) {
      // TODO: Add payment step here before generating video
      generateVideo(enhancedPrompt);
    }
  };

  const handleEditPrompt = () => {
    // Allow user to go back and edit
    setEnhancedPrompt(null);
    setError(null);
    setPrompt(submittedPrompt || '');
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
      <h1 className="text-4xl font-extrabold text-foreground tracking-tight mb-8">
        ASMR Video Generator
      </h1>
      

      
      {!enhancedPrompt && (
        <form onSubmit={handleSubmit} className="w-full max-w-md flex flex-col gap-4">
          <label htmlFor="prompt" className="text-lg font-medium">Enter your ASMR video idea:</label>
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
            {isLoading ? 'Enhancing Prompt...' : '✨ Enhance Prompt (Free)'}
          </button>
        </form>
      )}



      {/* Debugging UI */}
      <div className="w-full max-w-2xl mt-8 space-y-4">
        {submittedPrompt && (
          <div className="p-4 bg-gray-100 rounded shadow">
            <h3 className="font-semibold text-gray-800 mb-2">Original Prompt:</h3>
            <p className="text-gray-700 font-mono text-sm">{submittedPrompt}</p>
          </div>
        )}

        {isLoading && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded">
            <h3 className="font-semibold text-blue-800 mb-2">Status:</h3>
            <p className="text-blue-700">Calling OpenAI API to enhance prompt...</p>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded">
            <h3 className="font-semibold text-red-800 mb-2">Prompt Enhancement Error:</h3>
            <p className="text-red-700 mb-2">{error}</p>
            {debugInfo && (
              <details className="mt-2">
                <summary className="cursor-pointer text-red-600 hover:text-red-800">Debug Info</summary>
                <pre className="mt-2 text-xs bg-red-100 p-2 rounded overflow-auto">
                  {JSON.stringify(debugInfo, null, 2)}
                </pre>
              </details>
            )}
          </div>
        )}

        {enhancedPrompt && !isGeneratingVideo && !videoOutput && (
          <div className="p-4 bg-green-50 border border-green-200 rounded">
            <h3 className="font-semibold text-green-800 mb-4">✨ Enhanced Prompt Ready for Review:</h3>
            <div className="bg-white p-3 rounded border mb-4">
              <p className="text-gray-800">{enhancedPrompt}</p>
            </div>
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded mb-4">
              <p className="text-yellow-800 text-sm">
                💰 <strong>Cost:</strong> $6.00 per video generation
              </p>
              {!user && (
                <p className="text-yellow-800 text-sm mt-1">
                  🔐 Sign in required for video generation
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleApprovePrompt}
                className="bg-green-600 text-white px-4 py-2 rounded font-semibold hover:bg-green-700 transition"
              >
                {user ? '🎬 Pay $6 & Generate Video' : '🔐 Sign In to Generate Video'}
              </button>
              <button
                onClick={handleEditPrompt}
                className="bg-gray-500 text-white px-4 py-2 rounded font-semibold hover:bg-gray-600 transition"
              >
                ✏️ Edit Prompt
              </button>
            </div>
          </div>
        )}

        {/* Video Generation Status */}
        {isGeneratingVideo && (
          <div className="p-4 bg-purple-50 border border-purple-200 rounded">
            <h3 className="font-semibold text-purple-800 mb-2">🎥 Video Generation in Progress:</h3>
            <p className="text-purple-700">
              {videoStatus === 'starting' && 'Starting video generation...'}
              {videoStatus === 'processing' && 'Processing video with Veo3...'}
              {!videoStatus && 'Sending to Replicate...'}
            </p>
            {predictionId && (
              <p className="text-purple-600 text-sm mt-1">Prediction ID: {predictionId}</p>
            )}
            {videoDebugInfo && (
              <details className="mt-2">
                <summary className="cursor-pointer text-purple-600 hover:text-purple-800">Debug Info</summary>
                <pre className="mt-2 text-xs bg-purple-100 p-2 rounded overflow-auto">
                  {JSON.stringify(videoDebugInfo, null, 2)}
                </pre>
              </details>
            )}
          </div>
        )}

        {videoError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded">
            <h3 className="font-semibold text-red-800 mb-2">Video Generation Error:</h3>
            <p className="text-red-700 mb-2">{videoError}</p>
            {videoDebugInfo && (
              <details className="mt-2">
                <summary className="cursor-pointer text-red-600 hover:text-red-800">Debug Info</summary>
                <pre className="mt-2 text-xs bg-red-100 p-2 rounded overflow-auto">
                  {JSON.stringify(videoDebugInfo, null, 2)}
                </pre>
              </details>
            )}
            <button
              onClick={handleEditPrompt}
              className="mt-3 bg-blue-600 text-white px-4 py-2 rounded font-semibold hover:bg-blue-700 transition"
            >
              Try Again
            </button>
          </div>
        )}

        {videoOutput && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded">
            <h3 className="font-semibold text-emerald-800 mb-2">🎉 Video Generated Successfully!</h3>
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
        )}
      </div>
    </div>
  );
}
