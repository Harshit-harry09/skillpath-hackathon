// updated
import React from 'react';

interface ChipProps {
  variant?: 'filled' | 'outline';
  children: React.ReactNode;
  className?: string;
}

export const Chip: React.FC<ChipProps> = ({ variant = 'filled', children, className = '' }) => {
  const baseClass = "px-4 py-[6px] font-sans font-medium text-body-sm rounded-sm inline-flex items-center justify-center whitespace-nowrap transition-colors";
  const filledClass = "bg-ink text-on-primary";
  const outlineClass = "bg-transparent text-ink border border-hairline hover:bg-surface-soft";

  const combinedClass = `${baseClass} ${variant === 'filled' ? filledClass : outlineClass} ${className}`;

  return (
    <span className={combinedClass}>
      {children}
    </span>
  );
};
