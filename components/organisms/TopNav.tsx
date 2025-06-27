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
            <Link href="/page1" className="flex items-center text-foreground hover:text-primary">
              Page 1
            </Link>
            <Link href="/page2" className="flex items-center text-foreground hover:text-primary">
              Page 2
            </Link>
            <Link href="/page3" className="flex items-center text-foreground hover:text-primary">
              Page 3
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
} 