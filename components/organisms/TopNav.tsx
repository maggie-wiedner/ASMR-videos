import React from 'react';
import Link from 'next/link';

export default function TopNav() {
  return (
    <nav className="bg-background border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link href="/" className="flex items-center hover:text-primary">
              <span className="text-lg font-semibold">Home</span>
            </Link>
          </div>
          <div className="flex space-x-8">
            {/* Navigation links removed - keeping just Home for now */}
          </div>
        </div>
      </div>
    </nav>
  );
} 