'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

interface Project {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  user_prompts?: any[];
}

interface SavedPromptCardsProps {
  projects: Project[];
  isLoading?: boolean;
}

export default function SavedPromptCards({ projects, isLoading = false }: SavedPromptCardsProps) {
  const router = useRouter();
  // Show loading skeleton when loading
  if (isLoading) {
    return (
      <div className="w-full">
        <h3 className="text-xl font-semibold text-gray-800 mb-6 text-left">Your Projects</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((index) => (
            <div
              key={index}
              className="bg-white border border-gray-200 rounded-lg p-4 animate-pulse"
            >
              <div className="h-6 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
              <div className="flex justify-between items-center">
                <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/3"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Show empty state if not loading and no projects exist
  if (!isLoading && projects.length === 0) {
    return (
      <div className="w-full">
        <h3 className="text-xl font-semibold text-gray-800 mb-6 text-left">Your Projects</h3>
        <div className="text-center py-8 text-gray-500">
          <p>Your projects will appear here after you create them.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <h3 className="text-xl font-semibold text-gray-800 mb-6 text-left">Your Projects</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((project) => (
          <div
            key={project.id}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
            onClick={() => router.push(`/studio/project/${project.id}`)}
          >
            <h4 className="font-semibold text-lg text-gray-800 mb-2">{project.name}</h4>
            <p className="text-gray-600 text-sm mb-3">
              {project.description || 'No description'}
            </p>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-xs">
                Updated {new Date(project.updated_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 