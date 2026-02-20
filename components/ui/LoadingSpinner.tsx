'use client';

import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  message
}) => {
  const sizeStyles = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4'
  };
  
  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className={`
        ${sizeStyles[size]}
        border-[#FF006E] border-t-transparent
        rounded-full animate-spin
      `} />
      {message && (
        <p className="text-gray-400 text-sm">{message}</p>
      )}
    </div>
  );
};
