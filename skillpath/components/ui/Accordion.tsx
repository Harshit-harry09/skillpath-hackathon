'use client';
// updated

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AccordionProps {
  title: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const Accordion: React.FC<AccordionProps> = ({ title, children, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`border-b border-hairline ${className}`}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full justify-between items-center py-4 font-mono text-[13px] uppercase tracking-[0.06em] text-left focus:outline-none text-ink"
      >
        <span>{title}</span>
        <span className="text-muted font-mono">[{isOpen ? '−' : '+'}]</span>
      </button>
      
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="pb-4">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
