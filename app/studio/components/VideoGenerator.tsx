'use client';

import React from 'react';

interface EnhancedPrompt {
  title: string;
  description: string;
}

interface VideoGeneratorProps {
  selectedPrompt: EnhancedPrompt | null;
  isGeneratingVideo: boolean;
  videoStatus: string | null;
  videoError: string | null;
  videoOutput: string | null;
  onGenerateVideo: () => void;
  onDeselectPrompt: () => void;
  onTryAgain: () => void;
}

export default function VideoGenerator({
  selectedPrompt,
  isGeneratingVideo,
  videoStatus,
  videoError,
  videoOutput,
  onGenerateVideo,
  onDeselectPrompt,
  onTryAgain
}: VideoGeneratorProps) {
  // Selected Prompt Review
  if (selectedPrompt && !isGeneratingVideo && !videoOutput) {
    return (
      <div className="w-full max-w-2xl mt-8">
        <div className="p-6 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="font-semibold text-green-800 mb-2 text-xl">✨ Selected Style:</h3>
          <h4 className="font-bold text-lg text-gray-800 mb-3">{selectedPrompt.title}</h4>
          <div className="bg-white p-4 rounded border mb-4">
            <p className="text-gray-800">{selectedPrompt.description}</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onGenerateVideo}
              className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition"
            >
              🎬 Generate Video ($6)
            </button>
            <button
              onClick={onDeselectPrompt}
              className="bg-gray-500 text-white px-4 py-3 rounded-lg font-semibold hover:bg-gray-600 transition"
            >
              ← Choose Different Style
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Video Generation Status
  if (isGeneratingVideo) {
    return (
      <div className="w-full max-w-2xl mt-8">
        <div className="p-4 bg-purple-50 border border-purple-200 rounded">
          <h3 className="font-semibold text-purple-800 mb-2">🎥 Creating Your ASMR Video...</h3>
          <p className="text-purple-700">
            {videoStatus === 'starting' && 'Starting video generation...'}
            {videoStatus === 'processing' && 'Processing video with AI...'}
            {!videoStatus && 'Sending to video generator...'}
          </p>
          <p className="text-purple-600 text-sm mt-1">This may take 2-3 minutes</p>
        </div>
      </div>
    );
  }

  // Video Error
  if (videoError) {
    return (
      <div className="w-full max-w-2xl mt-8">
        <div className="p-4 bg-red-50 border border-red-200 rounded">
          <h3 className="font-semibold text-red-800 mb-2">Video Generation Error:</h3>
          <p className="text-red-700 mb-2">{videoError}</p>
          <button
            onClick={onTryAgain}
            className="mt-3 bg-blue-600 text-white px-4 py-2 rounded font-semibold hover:bg-blue-700 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Video Output
  if (videoOutput) {
    return (
      <div className="w-full max-w-2xl mt-8">
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded">
          <h3 className="font-semibold text-emerald-800 mb-2">🎉 Your ASMR Video is Ready!</h3>
          <div className="bg-white p-3 rounded border">
            <video 
              src={videoOutput} 
              controls 
              className="w-full max-w-lg mx-auto rounded"
              onError={() => console.error('Failed to load video')}
            >
              Your browser does not support the video tag.
            </video>
          </div>
          <button
            onClick={onTryAgain}
            className="mt-3 bg-blue-600 text-white px-4 py-2 rounded font-semibold hover:bg-blue-700 transition"
          >
            Create Another Video
          </button>
        </div>
      </div>
    );
  }

  return null;
} 