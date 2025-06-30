'use client';

import React from 'react';

interface PromptInputProps {
  prompt: string;
  setPrompt: (prompt: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  projectId?: string;
}

export default function PromptInput({ prompt, setPrompt, onSubmit, isLoading, projectId }: PromptInputProps) {
  return (
    <div className="w-full max-w-6xl mx-auto mb-20">
      <div className="bg-white rounded-3xl p-20 min-h-[600px] flex flex-col justify-center">
        <div className="text-center mb-20">
          <h2 className="text-6xl font-bold text-gray-900 mb-10 leading-tight">
            {projectId ? 'Add New Ideas to Project' : 'Create Your ASMR Video'}
          </h2>
          <p className="text-2xl text-gray-600 leading-relaxed max-w-4xl mx-auto">
            {projectId 
              ? 'Describe your new idea to add more enhanced prompts to this project'
              : 'Describe your idea and we\'ll generate enhanced prompts for you'
            }
          </p>
        </div>
        <form onSubmit={onSubmit}>
          <div className="relative">
            <input
              id="prompt"
              type="text"
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              className="w-full border-3 border-gray-200 rounded-2xl px-8 py-8 pr-24 text-2xl placeholder-gray-400 focus:border-blue-500 focus:outline-none transition-colors shadow-sm"
              placeholder="e.g. Rain sounds in a cozy cabin"
              required
            />
            <button
              type="submit"
              disabled={isLoading}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black text-white p-4 rounded-full hover:bg-gray-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed shadow-lg"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 