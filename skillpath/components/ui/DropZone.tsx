'use client';
// updated
 
import React, { useState, useRef } from 'react';
import { X, Upload, FileText } from 'lucide-react';
import { motion } from 'framer-motion';
 
interface DropZoneProps {
  onFileSelect: (file: File | null) => void;
  className?: string;
  disabled?: boolean;
}
 
export const DropZone: React.FC<DropZoneProps> = ({ onFileSelect, className = '', disabled = false }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
 
  const handleDrag = (e: React.DragEvent) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true);
    } else if (e.type === 'dragleave') {
      setIsDragging(false);
    }
  };
 
  const handleDrop = (e: React.DragEvent) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selected = e.dataTransfer.files[0];
      if (selected.type === 'application/pdf') {
        setFile(selected);
        onFileSelect(selected);
      } else {
        alert('Please upload a PDF file.');
      }
    }
  };
 
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      onFileSelect(selected);
    }
  };
 
  const clearFile = (e: React.MouseEvent) => {
    if (disabled) return;
    e.stopPropagation();
    setFile(null);
    onFileSelect(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };
 
  if (file) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`h-full min-h-[140px] w-full bg-ink/[0.03] border border-ink/10 rounded-[16px] flex items-center justify-between px-6 transition-all relative overflow-hidden group ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-10 h-10 rounded-xl bg-ink/5 flex items-center justify-center border border-ink/10">
            <FileText size={18} className="text-brand-teal" />
          </div>
          <div className="flex flex-col">
            <span className="font-sans text-sm font-bold text-ink truncate max-w-[180px] sm:max-w-[280px]">{file.name}</span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[9px] text-ink/30 font-bold uppercase tracking-widest">Vector Ready</span>
              <span className="w-1 h-1 rounded-full bg-ink/10" />
              <span className="font-mono text-[9px] text-ink/50 font-bold uppercase">{(file.size / 1024 / 1024).toFixed(1)}MB</span>
            </div>
          </div>
        </div>
        <button 
          onClick={clearFile} 
          disabled={disabled}
          className={`relative z-10 w-8 h-8 flex items-center justify-center bg-ink/5 hover:bg-ink/10 rounded-lg transition-all border border-ink/10 ${disabled ? 'opacity-20 cursor-not-allowed' : ''}`} 
          aria-label="Remove file"
        >
          <X size={14} className="text-ink/40 hover:text-ink" />
        </button>
      </motion.div>
    );
  }
 
  return (
    <motion.div 
      onClick={() => !disabled && inputRef.current?.click()}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      whileHover={!disabled ? { scale: 1.005 } : {}}
      whileTap={!disabled ? { scale: 0.995 } : {}}
      className={`h-full min-h-[140px] w-full border-2 border-dashed rounded-[16px] flex items-center justify-center transition-all duration-300 shadow-[inset_3px_3px_6px_rgba(0,0,0,0.06),inset_-2px_-2px_4px_rgba(255,255,255,0.25)] dark:shadow-[inset_2px_2px_10px_rgba(0,0,0,0.4)]
        ${disabled ? 'cursor-not-allowed border-ink/5 bg-ink/[0.01]' : 'cursor-pointer'}
        ${isDragging ? 'border-brand-teal bg-brand-teal/5' : 'border-ink/5 dark:border-white/5 bg-ink/[0.01] dark:bg-white/[0.01]'}
        ${!disabled ? 'hover:border-ink/20 dark:hover:border-white/20 hover:bg-ink/[0.03] dark:hover:bg-white/[0.03]' : ''}
        ${className}
      `}
    >
      <input 
        type="file" 
        ref={inputRef} 
        onChange={handleChange} 
        accept="application/pdf" 
        className="hidden" 
      />
      
      <div className="flex flex-col items-center gap-3 relative z-10">
        <div className="w-10 h-10 rounded-xl bg-ink/5 border border-ink/10 flex items-center justify-center group-hover:scale-110 transition-transform">
          <Upload size={18} className="text-ink/20" />
        </div>
        <div className="text-center">
          <p className="font-sans text-[13px] font-bold text-ink/60">
            Drop PDF or <span className="text-brand-teal underline decoration-brand-teal/20 underline-offset-4">browse</span>
          </p>
          <p className="font-sans text-[10px] text-ink/30 font-medium mt-1 uppercase tracking-widest">
            Maximum Identity Depth: 10MB
          </p>
        </div>
      </div>
    </motion.div>
  );
};
