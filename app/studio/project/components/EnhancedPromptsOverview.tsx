'use client';

import React from 'react';
import EnhancedPromptsGrid from './EnhancedPromptsGrid';

interface EnhancedPrompt {
  id?: string;
  title: string;
  description: string;
}

interface EnhancedPromptsOverviewProps {
  enhancedPrompts: EnhancedPrompt[];
  onSelectPrompt?: (prompt: EnhancedPrompt) => void;
  onAddNewSession: () => void;
  projectId?: string;
}

export default function EnhancedPromptsOverview({ 
  enhancedPrompts, 
  onSelectPrompt, 
  onAddNewSession,
  projectId 
}: EnhancedPromptsOverviewProps) {
  return (
    <div className="w-full max-w-6xl mb-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Enhanced Ideas</h2>
        <button
          onClick={onAddNewSession}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-medium"
        >
          + Add New Ideas
        </button>
      </div>
      
      {enhancedPrompts.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500 mb-4">No enhanced ideas yet.</p>
          <button
            onClick={onAddNewSession}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-medium"
          >
            Create Your First Enhanced Ideas
          </button>
        </div>
      ) : (
        <EnhancedPromptsGrid 
          enhancedPrompts={enhancedPrompts}
          onSelectPrompt={onSelectPrompt}
          projectId={projectId}
          enableNavigation={true}
        />
      )}
    </div>
  );
} 