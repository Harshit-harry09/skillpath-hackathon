'use client';
// updated

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Rocket, Briefcase, Building2, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface DreamOnboardingProps {
  onComplete: (dreamDescription: string, context: DreamContext) => void;
  onCancel: () => void;
}

export interface DreamContext {
  dreamRole: string;
  currentRole: string;
  experience: string;
  companyType: string;
}

const DREAM_ROLES = [
  'Software Engineer',
  'Data Scientist',
  'Product Manager',
  'DevOps Engineer',
  'ML Engineer',
];

const EXPERIENCE_LEVELS = [
  { label: '0–1', value: '0-1 years' },
  { label: '1–2', value: '1-2 years' },
  { label: '3–5', value: '3-5 years' },
  { label: '5–8', value: '5-8 years' },
  { label: '8+', value: '8+ years' },
];

const COMPANY_TYPES = [
  { label: 'FAANG / Big Tech', value: 'faang', keywords: 'large-scale systems, competitive compensation, rigorous technical interviews' },
  { label: 'Series A–C Startup', value: 'startup', keywords: 'fast-paced, equity, seed, series A startup, scrappy' },
  { label: 'Enterprise', value: 'enterprise', keywords: 'enterprise, stability, compliance, fortune 500' },
  { label: 'Remote-first', value: 'remote', keywords: 'remote-first, distributed team, async communication' },
];

const STEP_COUNT = 3;

const slideVariants: any = {
  enter: (dir: number) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -80 : 80, opacity: 0 }),
};

export function DreamOnboarding({ onComplete, onCancel }: DreamOnboardingProps) {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);

  // Step 1
  const [dreamRole, setDreamRole] = useState('');
  const [customRole, setCustomRole] = useState('');

  // Step 2
  const [currentRole, setCurrentRole] = useState('');
  const [experience, setExperience] = useState('');

  // Step 3
  const [companyType, setCompanyType] = useState('');

  const selectedDreamRole = dreamRole === '__custom__' ? customRole : dreamRole;

  const canProceed = () => {
    if (step === 0) return selectedDreamRole.trim().length > 0;
    if (step === 1) return currentRole.trim().length > 0 && experience.length > 0;
    if (step === 2) return companyType.length > 0;
    return false;
  };

  const goNext = () => {
    if (step < STEP_COUNT - 1) {
      setDirection(1);
      setStep(s => s + 1);
    } else {
      handleSubmit();
    }
  };

  const goBack = () => {
    if (step > 0) {
      setDirection(-1);
      setStep(s => s - 1);
    }
  };

  const handleSubmit = () => {
    const company = COMPANY_TYPES.find(c => c.value === companyType);
    const companyLabel = company?.label || companyType;
    const companyKeywords = company?.keywords || '';

    // Build a structured JD-like text that the existing pipeline can parse
    const dreamDescription = [
      `Job Title: ${selectedDreamRole}`,
      `Company Type: ${companyLabel}`,
      ``,
      `About the role:`,
      `We are looking for a ${selectedDreamRole} to join our ${companyLabel} team.`,
      `This is a role suited for candidates with ${experience} of professional experience.`,
      companyKeywords ? `Environment: ${companyKeywords}.` : '',
      ``,
      `Ideal candidate:`,
      `- Strong background in ${selectedDreamRole.toLowerCase()} fundamentals`,
      `- Currently working as: ${currentRole || 'Career transition'}`,
      `- ${experience} of relevant industry experience`,
      `- Passionate about growing into a ${selectedDreamRole} role at a ${companyLabel} organization`,
      ``,
      `Requirements:`,
      `- Core technical skills required for ${selectedDreamRole}`,
      `- Experience level: ${experience}`,
      `- Company environment: ${companyLabel}`,
    ].filter(Boolean).join('\n');

    const context: DreamContext = {
      dreamRole: selectedDreamRole,
      currentRole,
      experience,
      companyType: companyType,
    };

    onComplete(dreamDescription, context);
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="space-y-10"
      >
        {/* Progress Indicator */}
        <div className="flex items-center justify-center gap-2 mb-2">
          {Array.from({ length: STEP_COUNT }).map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <motion.div
                animate={{
                  width: i === step ? 32 : 8,
                  backgroundColor: i <= step ? 'var(--color-brand-pink)' : 'var(--color-muted)',
                  opacity: i <= step ? 1 : 0.25,
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className="h-2 rounded-full"
              />
            </div>
          ))}
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait" custom={direction}>
          {step === 0 && (
            <motion.div
              key="step-0"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-8"
            >
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-brand-pink/10 border border-brand-pink/20 flex items-center justify-center">
                  <Rocket className="text-brand-pink" size={26} />
                </div>
                <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight">What's your dream role?</h2>
                <p className="text-muted text-sm max-w-md">Pick one, or type your own. This calibrates every recommendation.</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {DREAM_ROLES.map(role => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => { setDreamRole(role); setCustomRole(''); }}
                    className={`relative px-4 py-3.5 rounded-xl border text-[13px] font-semibold transition-all duration-200 text-left
                      ${dreamRole === role
                        ? 'bg-brand-pink/10 border-brand-pink/40 text-brand-pink shadow-[0_0_0_1px_rgba(255,77,139,0.15)]'
                        : 'bg-canvas border-hairline text-ink/70 hover:border-ink/20 hover:bg-surface-soft'
                      }`}
                  >
                    {dreamRole === role && (
                      <motion.div layoutId="dream-role-check" className="absolute top-2 right-2">
                        <Check size={14} className="text-brand-pink" />
                      </motion.div>
                    )}
                    {role}
                  </button>
                ))}

                {/* Custom option */}
                <button
                  type="button"
                  onClick={() => setDreamRole('__custom__')}
                  className={`relative px-4 py-3.5 rounded-xl border text-[13px] font-semibold transition-all duration-200 text-left col-span-1 md:col-span-1
                    ${dreamRole === '__custom__'
                      ? 'bg-brand-pink/10 border-brand-pink/40 text-brand-pink shadow-[0_0_0_1px_rgba(255,77,139,0.15)]'
                      : 'bg-canvas border-hairline text-ink/70 hover:border-ink/20 hover:bg-surface-soft border-dashed'
                    }`}
                >
                  {dreamRole === '__custom__' ? (
                    <input
                      autoFocus
                      type="text"
                      value={customRole}
                      onChange={(e) => setCustomRole(e.target.value)}
                      placeholder="Type your dream role..."
                      className="w-full bg-transparent focus:outline-none text-brand-pink placeholder:text-brand-pink/40"
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span className="text-muted">Custom: Type your own…</span>
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div
              key="step-1"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-8"
            >
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-brand-teal/10 border border-brand-teal/20 flex items-center justify-center">
                  <Briefcase className="text-brand-teal" size={26} />
                </div>
                <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight">Where are you now?</h2>
                <p className="text-muted text-sm max-w-md">This helps us measure the exact gap to your target.</p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-muted mb-3">Current Role</label>
                  <input
                    type="text"
                    value={currentRole}
                    onChange={(e) => setCurrentRole(e.target.value)}
                    placeholder="e.g. Junior Developer, Student, Marketing Analyst..."
                    className="w-full bg-canvas border border-hairline rounded-xl px-5 py-4 font-sans text-[15px] text-ink focus:outline-none focus:border-brand-teal/40 transition-colors placeholder:text-muted/40"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-muted mb-3">Years of Experience</label>
                  <div className="flex gap-2 flex-wrap">
                    {EXPERIENCE_LEVELS.map(lvl => (
                      <button
                        key={lvl.value}
                        type="button"
                        onClick={() => setExperience(lvl.value)}
                        className={`px-5 py-3 rounded-xl border text-[13px] font-bold transition-all duration-200
                          ${experience === lvl.value
                            ? 'bg-brand-teal/10 border-brand-teal/40 text-brand-teal'
                            : 'bg-canvas border-hairline text-ink/60 hover:border-ink/20 hover:bg-surface-soft'
                          }`}
                      >
                        {lvl.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step-2"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-8"
            >
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-brand-ochre/10 border border-brand-ochre/20 flex items-center justify-center">
                  <Building2 className="text-brand-ochre" size={26} />
                </div>
                <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight">What kind of company?</h2>
                <p className="text-muted text-sm max-w-md">Different environments demand different skill profiles.</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {COMPANY_TYPES.map(ct => (
                  <button
                    key={ct.value}
                    type="button"
                    onClick={() => setCompanyType(ct.value)}
                    className={`relative px-5 py-4 rounded-xl border text-[13px] font-semibold transition-all duration-200 text-left
                      ${companyType === ct.value
                        ? 'bg-brand-ochre/10 border-brand-ochre/40 text-brand-ochre shadow-[0_0_0_1px_rgba(232,185,74,0.15)]'
                        : 'bg-canvas border-hairline text-ink/70 hover:border-ink/20 hover:bg-surface-soft'
                      }`}
                  >
                    {companyType === ct.value && (
                      <motion.div layoutId="company-check" className="absolute top-2.5 right-2.5">
                        <Check size={14} className="text-brand-ochre" />
                      </motion.div>
                    )}
                    {ct.label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-4">
          <button
            onClick={step === 0 ? onCancel : goBack}
            className="flex items-center gap-1.5 text-muted hover:text-ink font-bold uppercase tracking-widest text-xs transition-colors"
          >
            {step > 0 && <ChevronLeft size={14} />}
            {step === 0 ? 'Cancel' : 'Back'}
          </button>

          <Button
            variant="brand"
            onClick={goNext}
            disabled={!canProceed()}
            className="min-w-[200px] h-[56px] rounded-2xl text-[15px] font-bold gap-3"
          >
            <span>{step < STEP_COUNT - 1 ? 'Continue' : 'Analyze My Path'}</span>
            <ChevronRight size={20} className="shrink-0" />
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
