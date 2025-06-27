'use client';

import React, { useState, useEffect } from 'react';

export default function HomePage() {
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

  const generateVideo = async (enhancedPrompt: string) => {
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
        body: JSON.stringify({ enhancedPrompt }),
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
        
        // Automatically start video generation after prompt enhancement
        await generateVideo(data.enhancedPrompt);
      }
    } catch (err: any) {
      setError('Network error: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-4xl font-extrabold text-foreground tracking-tight mb-8">
        ASMR Video Generator
      </h1>
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
          disabled={isLoading || isGeneratingVideo}
          className="bg-blue-600 text-white px-4 py-2 rounded font-semibold hover:bg-blue-700 transition disabled:bg-gray-400"
        >
          {isLoading ? 'Enhancing...' : isGeneratingVideo ? 'Generating Video...' : 'Generate Video'}
        </button>
      </form>

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

        {enhancedPrompt && (
          <div className="p-4 bg-green-50 border border-green-200 rounded">
            <h3 className="font-semibold text-green-800 mb-2">Enhanced Prompt:</h3>
            <p className="text-green-700 mb-2">{enhancedPrompt}</p>
            {debugInfo && (
              <details className="mt-2">
                <summary className="cursor-pointer text-green-600 hover:text-green-800">Debug Info</summary>
                <pre className="mt-2 text-xs bg-green-100 p-2 rounded overflow-auto">
                  {JSON.stringify(debugInfo, null, 2)}
                </pre>
              </details>
            )}
          </div>
        )}

        {/* Video Generation Status */}
        {isGeneratingVideo && (
          <div className="p-4 bg-purple-50 border border-purple-200 rounded">
            <h3 className="font-semibold text-purple-800 mb-2">Video Generation Status:</h3>
            <p className="text-purple-700">
              {videoStatus === 'starting' && 'Starting video generation...'}
              {videoStatus === 'processing' && 'Processing video with Veo3...'}
              {!videoStatus && 'Sending to Replicate...'}
            </p>
            {predictionId && (
              <p className="text-purple-600 text-sm mt-1">Prediction ID: {predictionId}</p>
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
          </div>
        )}

        {videoOutput && (
          <div className="p-4 bg-green-50 border border-green-200 rounded">
            <h3 className="font-semibold text-green-800 mb-4">Generated Video:</h3>
            <video 
              controls 
              className="w-full max-w-lg mx-auto rounded shadow"
              src={videoOutput}
            >
              Your browser does not support the video tag.
            </video>
            {videoDebugInfo && (
              <details className="mt-4">
                <summary className="cursor-pointer text-green-600 hover:text-green-800">Debug Info</summary>
                <pre className="mt-2 text-xs bg-green-100 p-2 rounded overflow-auto">
                  {JSON.stringify(videoDebugInfo, null, 2)}
                </pre>
              </details>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
