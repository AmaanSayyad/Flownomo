'use client';

import React from 'react';

interface BannerProps {
  message: string;
  type: 'warning' | 'error' | 'info';
  onClose?: () => void;
}

export const Banner: React.FC<BannerProps> = ({ message, type, onClose }) => {
  const typeStyles = {
    warning: 'bg-yellow-900/50 border-yellow-500 text-yellow-100',
    error: 'bg-red-900/50 border-red-500 text-red-100',
    info: 'bg-blue-900/50 border-blue-500 text-blue-100'
  };
  
  const icons = {
    warning: '⚠️',
    error: '❌',
    info: 'ℹ️'
  };
  
  return (
    <div className={`
      ${typeStyles[type]}
      border-2 rounded-lg p-4
      flex items-center gap-3
    `}>
      <span className="text-xl">{icons[type]}</span>
      <p className="flex-1 font-medium">{message}</p>
      {onClose && (
        <button
          onClick={onClose}
          className="text-xl hover:opacity-70 transition-opacity"
        >
          ×
        </button>
      )}
    </div>
  );
};
