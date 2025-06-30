'use client';

import React from 'react';
import PromptInput from '../../components/PromptInput';

interface ProjectPromptFormProps {
  prompt: string;
  setPrompt: (prompt: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  projectId: string;
}

export default function ProjectPromptForm({ 
  prompt, 
  setPrompt, 
  onSubmit, 
  isLoading, 
  projectId 
}: ProjectPromptFormProps) {
  return (
    <div className="w-full max-w-6xl mb-8">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Add New Ideas to Project</h2>
      </div>
      <PromptInput 
        prompt={prompt}
        setPrompt={setPrompt}
        onSubmit={onSubmit}
        isLoading={isLoading}
        projectId={projectId}
      />
    </div>
  );
} 