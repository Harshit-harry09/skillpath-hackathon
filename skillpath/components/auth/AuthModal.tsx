import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { SignInPage } from '@/components/ui/sign-in-flow-1';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-modal-title"
            aria-describedby="auth-modal-desc"
            className="relative w-full max-w-lg bg-black border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden"
          >
            {/* Visually hidden accessibility title & description for dialog structure */}
            <h2 id="auth-modal-title" className="sr-only">Authentication Modal</h2>
            <p id="auth-modal-desc" className="sr-only">Sign in or create an account to access your profile and skill paths.</p>

            {/* Close Button */}
            <button
              onClick={onClose}
              aria-label="Close authentication modal"
              className="absolute top-6 right-6 z-50 p-2 text-white/50 hover:text-white transition-colors bg-white/5 hover:bg-white/10 rounded-full"
            >
              <X size={20} />
            </button>

            {/* High-end Auth Flow */}
            <SignInPage className="min-h-[600px]" onSuccess={() => setTimeout(onClose, 1000)} />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
