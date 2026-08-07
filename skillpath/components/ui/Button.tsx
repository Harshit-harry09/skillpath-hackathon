// updated
import React from 'react';
import { motion } from 'framer-motion';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'brand';
  children: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', children, ...props }, ref) => {
    const baseClass = "px-7 py-3 font-mono text-[14px] font-medium tracking-[0.04em] uppercase transition-colors transition-transform duration-150 ease-out disabled:opacity-35 disabled:cursor-not-allowed relative overflow-hidden flex items-center justify-center gap-2 rounded-xl";
    
    const variants = {
      primary: "bg-primary text-on-primary border border-hairline tactile-button",
      ghost: "bg-transparent text-black border border-hairline hover:bg-surface-soft dark:text-white",
      brand: "bg-brand-pink text-white border-none shadow-[0_12px_24px_rgba(255,77,139,0.3)] hover:shadow-[0_16px_32px_rgba(255,77,139,0.4)] transition-shadow"
    };

    const combinedClass = `${baseClass} ${variants[variant] || variants.primary} ${className}`;

    return (
      <motion.button
        ref={ref as any}
        className={combinedClass}
        whileHover={{ 
          scale: 1.02,
          y: -1,
          transition: { type: "spring", stiffness: 400, damping: 10 }
        }}
        whileTap={{ 
          scale: 0.97,
          transition: { type: "spring", stiffness: 600, damping: 15 }
        }}
        {...(props as any)}
      >
        {children}
      </motion.button>
    );
  }
);


Button.displayName = 'Button';

