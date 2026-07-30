'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import dynamic from 'next/dynamic';

const SignInPage = dynamic(() => import('@/components/ui/sign-in-flow-1').then(mod => ({ default: mod.SignInPage })), { ssr: false });

export function AuthModal() {
  const { isAuthModalOpen, closeAuthModal } = useAuth();

  const handleSuccess = () => {
    setTimeout(() => {
      closeAuthModal();
    }, 2000); // Allow the "You're in!" animation to play
  };

  return (
    <AnimatePresence>
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeAuthModal}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-4xl h-[80vh] bg-black border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-white/5"
          >
            <button
              onClick={closeAuthModal}
              className="absolute top-8 right-8 z-[210] p-2 rounded-full bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-all"
            >
              <X className="w-6 h-6" />
            </button>

            <SignInPage onSuccess={handleSuccess} />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
