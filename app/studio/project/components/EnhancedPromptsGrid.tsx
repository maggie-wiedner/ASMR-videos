'use client';

import React from 'react';
import Link from 'next/link';

interface EnhancedPrompt {
  id?: string;
  title: string;
  description: string;
}

interface EnhancedPromptsGridProps {
  enhancedPrompts: EnhancedPrompt[];
  onSelectPrompt?: (prompt: EnhancedPrompt) => void;
  projectId?: string;
  enableNavigation?: boolean;
}

export default function EnhancedPromptsGrid({ 
  enhancedPrompts, 
  onSelectPrompt, 
  projectId, 
  enableNavigation = false 
}: EnhancedPromptsGridProps) {
  if (enhancedPrompts.length === 0) return null;

  const handlePromptClick = (prompt: EnhancedPrompt) => {
    if (onSelectPrompt && !enableNavigation) {
      onSelectPrompt(prompt);
    }
  };

  return (
    <div className="w-full max-w-6xl mt-8">          
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {enhancedPrompts.map((prompt, index) => {
          const content = (
            <>
              <h3 className="font-semibold text-lg text-gray-800 mb-2">{prompt.title}</h3>
              <p className="text-gray-600 text-sm h-16 overflow-hidden">{prompt.description}</p>
            </>
          );

          if (enableNavigation && projectId && prompt.id) {
            return (
              <Link 
                key={prompt.id || index}
                href={`/studio/project/${projectId}/prompt/${prompt.id}`}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer block"
              >
                {content}
              </Link>
            );
          }

          return (
            <div 
              key={prompt.id || index}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
              onClick={() => handlePromptClick(prompt)}
            >
              {content}
            </div>
          );
        })}
      </div>
    </div>
  );
} 