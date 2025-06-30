'use client';

import React from 'react';
import Link from 'next/link';

interface BackButtonProps {
  href?: string;
  onClick?: () => void;
  text?: string;
  className?: string;
}

export default function BackButton({ 
  href, 
  onClick, 
  text = "← Back",
  className = "flex items-center text-blue-600 hover:text-blue-800 font-medium"
}: BackButtonProps) {
  if (href) {
    return (
      <Link href={href} className={className}>
        {text}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button onClick={onClick} className={className}>
        {text}
      </button>
    );
  }

  return null;
} 