import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  glowEffect?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  glowEffect = false
}) => {
  const baseStyles = 'bg-black/40 backdrop-blur-md border border-white/10 rounded-xl p-6';
  const glowStyles = glowEffect
    ? 'shadow-[0_0_20px_rgba(0,240,255,0.2)] border-neon-blue/50'
    : '';

  return (
    <div className={`${baseStyles} ${glowStyles} ${className}`}>
      {children}
    </div>
  );
};
