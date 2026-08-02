'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  Clock3,
  Code2,
  History,
  MessageSquareText,
  RotateCcw,
  Sparkles,
  Target,
  Trophy,
  UserRound,
  WandSparkles,
  X,
  Lock,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useAuth } from '@/context/AuthContext';
import { Ripple } from '@/components/ui/ripple';
import {
  buildInterviewQuestions,
  fallbackFeedback,
  fallbackFollowUp,
  INTERVIEW_LEVELS,
  INTERVIEW_QUESTION_TYPES,
  INTERVIEW_ROLES,
  type InterviewFeedback,
  type InterviewQuestion,
  type InterviewQuestionType,
  type SavedInterviewSession,
} from '@/lib/interview';

const STORAGE_KEY = 'skillpath-interview-sessions';
type Phase = 'setup' | 'session' | 'report';

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value));
}

function clampScore(value: number) {
  return Math.max(1, Math.min(10, Math.round(value)));
}

function mergeFeedback(first: InterviewFeedback, followUp: InterviewFeedback): InterviewFeedback {
  return {
    score: clampScore((first.score + followUp.score) / 2),
    strengths: Array.from(new Set([...first.strengths, ...followUp.strengths])).slice(0, 3),
    improvements: Array.from(new Set([...first.improvements, ...followUp.improvements])).slice(0, 3),
    idealAnswer: followUp.idealAnswer || first.idealAnswer,
    followUp: null,
    source: first.source === 'gemini' || followUp.source === 'gemini' ? 'gemini' : 'deterministic_fallback',
  };
}

export function InterviewLab() {
  const [mounted, setMounted] = useState(false);
  const { theme } = useTheme();
  const { user, openAuthModal } = useAuth();
  const [phase, setPhase] = useState<Phase>('setup');
  const [isOptionsModalOpen, setIsOptionsModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState<0 | 1 | 2>(0);
  const [roleOption, setRoleOption] = useState<string>(INTERVIEW_ROLES[0]);
  const [customRole, setCustomRole] = useState('');
  const [experience, setExperience] = useState('Mid-level');
  const [selectedTypes, setSelectedTypes] = useState<InterviewQuestionType[]>(['technical', 'behavioral']);
  const [questionCount, setQuestionCount] = useState(5);

  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [answersById, setAnswersById] = useState<Record<string, string>>({});
  const [feedbackById, setFeedbackById] = useState<Record<string, InterviewFeedback>>({});
  const [activeFeedback, setActiveFeedback] = useState<InterviewFeedback | null>(null);
  const [followUpPrompt, setFollowUpPrompt] = useState<string | null>(null);
  const [isFollowUp, setIsFollowUp] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [completedSession, setCompletedSession] = useState<SavedInterviewSession | null>(null);
  const [savedSessions, setSavedSessions] = useState<SavedInterviewSession[]>([]);
  const [error, setError] = useState('');
  const [activeRole, setActiveRole] = useState('');
  const [activeExperience, setActiveExperience] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && theme === 'dark';
  const particleColor = isDark ? '#6366f1' : '#ff4d8b';
  const trailColor = isDark ? '0, 0, 0' : '255, 250, 240';

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) setSavedSessions(JSON.parse(stored) as SavedInterviewSession[]);

      const roleFromUrl = new URLSearchParams(window.location.search).get('role')?.trim();
      if (roleFromUrl) {
        if (INTERVIEW_ROLES.includes(roleFromUrl as typeof INTERVIEW_ROLES[number])) {
          setRoleOption(roleFromUrl);
        } else {
          setRoleOption('__custom__');
          setCustomRole(roleFromUrl);
        }
      }
    } catch {
      // Local history is optional; the interview remains usable if storage is unavailable.
    }
  }, []);

  const targetRole = roleOption === '__custom__' ? customRole.trim() : roleOption;
  const currentQuestion = questions[questionIndex];
  const currentFeedback = currentQuestion ? feedbackById[currentQuestion.id] : undefined;
  const isSetupComplete = targetRole.length > 0 && experience.length > 0 && selectedTypes.length > 0;

  const progressLabel = useMemo(() => {
    if (!currentQuestion) return '';
    return isFollowUp ? `Follow-up · Question ${questionIndex + 1} of ${questions.length}` : `Question ${questionIndex + 1} of ${questions.length}`;
  }, [currentQuestion, isFollowUp, questionIndex, questions.length]);

  const updateSavedSessions = (next: SavedInterviewSession[]) => {
    setSavedSessions(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Saving is best-effort for private browsing and storage-limited environments.
    }
  };

  const startSession = (overrideQuestion?: InterviewQuestion, roleOverride?: string, experienceOverride?: string) => {
    if (!isSetupComplete && !overrideQuestion) return;
    const nextQuestions = overrideQuestion
      ? [overrideQuestion]
      : buildInterviewQuestions(targetRole, experience, selectedTypes, questionCount);

    setActiveRole(roleOverride || targetRole);
    setActiveExperience(experienceOverride || experience);
    setQuestions(nextQuestions);
    setQuestionIndex(0);
    setAnswer('');
    setAnswersById({});
    setFeedbackById({});
    setActiveFeedback(null);
    setFollowUpPrompt(null);
    setIsFollowUp(false);
    setCompletedSession(null);
    setError('');
    setPhase('session');
  };

  const submitAnswer = async () => {
    if (!currentQuestion || !answer.trim() || isEvaluating) return;
    const submittedAnswer = answer.trim();
    setIsEvaluating(true);
    setError('');

    let feedback: InterviewFeedback;
    try {
      const response = await fetch('/api/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: activeRole || targetRole,
          experience: activeExperience || experience,
          question: {
            ...currentQuestion,
            prompt: isFollowUp && followUpPrompt ? followUpPrompt : currentQuestion.prompt,
          },
          answer: submittedAnswer,
          allowFollowUp: !isFollowUp,
        }),
      });

      if (!response.ok) throw new Error('Feedback unavailable');
      feedback = await response.json() as InterviewFeedback;
    } catch {
      feedback = fallbackFeedback(
        { ...currentQuestion, prompt: isFollowUp && followUpPrompt ? followUpPrompt : currentQuestion.prompt },
        submittedAnswer,
      );
    }

    setAnswersById((previous) => ({
      ...previous,
      [currentQuestion.id]: isFollowUp && previous[currentQuestion.id]
        ? `${previous[currentQuestion.id]}\n\nFollow-up answer: ${submittedAnswer}`
        : submittedAnswer,
    }));

    if (isFollowUp && currentFeedback) {
      const merged = mergeFeedback(currentFeedback, feedback);
      setFeedbackById((previous) => ({ ...previous, [currentQuestion.id]: merged }));
      setActiveFeedback(merged);
      setFollowUpPrompt(null);
      setIsFollowUp(false);
    } else {
      const nextFollowUp = feedback.followUp || (feedback.score < 7 ? fallbackFollowUp(currentQuestion) : null);
      setFeedbackById((previous) => ({ ...previous, [currentQuestion.id]: feedback }));
      setActiveFeedback(feedback);
      setFollowUpPrompt(nextFollowUp);
    }

    setAnswer('');
    setIsEvaluating(false);
  };

  const finishSession = () => {
    const questionResults = questions
      .map((question) => ({ question, answer: answersById[question.id] || '', feedback: feedbackById[question.id] }))
      .filter((item): item is { question: InterviewQuestion; answer: string; feedback: InterviewFeedback } => Boolean(item.feedback))
      ;

    const saved: SavedInterviewSession = {
      id: `interview-${Date.now()}`,
      role: activeRole || targetRole,
      experience: activeExperience || experience,
      questionTypes: Array.from(new Set(questions.map((question) => question.type))),
      questionCount: questions.length,
      completedAt: new Date().toISOString(),
      averageScore: questionResults.length
        ? Math.round((questionResults.reduce((sum, item) => sum + item.feedback.score, 0) / questionResults.length) * 10) / 10
        : 0,
      questions: questionResults,
    };

    setCompletedSession(saved);
    updateSavedSessions([saved, ...savedSessions].slice(0, 12));
    setPhase('report');
  };

  const goToNextQuestion = () => {
    if (questionIndex >= questions.length - 1) {
      finishSession();
      return;
    }
    setQuestionIndex((index) => index + 1);
    setAnswer('');
    setActiveFeedback(null);
    setFollowUpPrompt(null);
    setIsFollowUp(false);
  };

  const beginFollowUp = () => {
    setIsFollowUp(true);
    setAnswer('');
    setFollowUpPrompt(followUpPrompt || (currentQuestion ? fallbackFollowUp(currentQuestion) : null));
  };

  const toggleQuestionType = (type: InterviewQuestionType) => {
    setSelectedTypes((previous) => previous.includes(type)
      ? previous.filter((item) => item !== type)
      : [...previous, type]);
  };

  const retryQuestion = (savedQuestion: SavedInterviewSession['questions'][number]) => {
    setRoleOption(INTERVIEW_ROLES.includes(completedSession?.role as typeof INTERVIEW_ROLES[number]) ? completedSession?.role || roleOption : '__custom__');
    if (!INTERVIEW_ROLES.includes(completedSession?.role as typeof INTERVIEW_ROLES[number])) setCustomRole(completedSession?.role || '');
    setExperience(completedSession?.experience || experience);
    setQuestionCount(1);
    setSelectedTypes([savedQuestion.question.type]);
    startSession(savedQuestion.question, completedSession?.role, completedSession?.experience);
  };

  const openSavedSession = (session: SavedInterviewSession) => {
    setCompletedSession(session);
    setPhase('report');
  };

  const resetToSetup = () => {
    setPhase('setup');
    setCompletedSession(null);
    setActiveFeedback(null);
    setFollowUpPrompt(null);
    setError('');
  };

  return (
    <main className="relative min-h-screen w-full bg-canvas text-ink px-4 sm:px-6 lg:px-12 pt-24 pb-32 overflow-hidden font-sans">
      {/* Hero Magic UI Ripple Background */}
      <Ripple
        mainCircleSize={300}
        mainCircleOpacity={0.6}
        numCircles={9}
        className="fixed inset-0 z-0 pointer-events-none"
      />

      <div className="relative z-10 max-w-4xl mx-auto">
        {phase === 'setup' && (
          <div className="text-center mb-10">
            {/* Top Badge */}
            <div className="flex items-center justify-center gap-2 mb-6">
              <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-brand-pink/10 border border-brand-pink/20 text-[11px] text-brand-pink font-mono font-bold tracking-widest uppercase shadow-sm">
                <Sparkles size={12} className="fill-current" /> AI INTERVIEW ENGINE
              </span>
            </div>

            {/* Serif Italic Display Headline */}
            <h1 className="font-display text-4xl sm:text-6xl text-ink mb-6 text-center tracking-tight font-black leading-tight">
              What role are you <br />
              <span className="text-brand-pink italic font-serif font-normal">practicing for?</span>
            </h1>

            {/* Subtitle */}
            <p className="font-sans text-lg sm:text-[20px] text-muted max-w-xl mx-auto leading-relaxed text-center font-medium">
              Enter a target role, and our AI interviewer will ask tailored technical, coding, and system design questions.
            </p>

            {/* Tactile Button Container (No Search Bar) */}
            <div className="mt-10 flex justify-center">
              <div className="bg-surface-card/90 border border-hairline p-3 rounded-[28px] shadow-2xl tactile-card inline-flex">
                <button
                  type="button"
                  onClick={() => {
                    if (!user) {
                      openAuthModal();
                      return;
                    }
                    setModalStep(0);
                    setIsOptionsModalOpen(true);
                  }}
                  className="flex items-center justify-center gap-3 px-10 py-5 bg-ink dark:bg-brand-pink text-white rounded-[20px] font-mono font-black text-sm tracking-wider uppercase transition-all hover:opacity-90 active:scale-[0.97] tactile-button cursor-pointer shadow-lg group"
                >
                  <span>START INTERVIEW</span>
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>

            {/* Bottom Micro-Caption */}
            <div className="flex items-center justify-center gap-6 text-[10px] text-muted font-mono font-bold uppercase tracking-[0.2em] pt-8">
              <span>NO RESUME REQUIRED</span>
              <span className="w-1 h-1 rounded-full bg-hairline" />
              <span>ADAPTIVE AI SCORING</span>
            </div>
          </div>
        )}

        {/* Step-by-Step Options Pop-over Modal */}
        <AnimatePresence>
          {isOptionsModalOpen && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.93, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.93, y: 15 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="relative w-full max-w-xl bg-surface-card border border-hairline rounded-[32px] p-6 sm:p-8 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
              >
                {/* Step Progress & Close Header */}
                <div className="flex items-center justify-between border-b border-hairline pb-4 mb-6">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-pink/15 text-brand-pink text-xs font-mono font-black border border-brand-pink/30">
                      0{modalStep + 1}
                    </span>
                    <div>
                      <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-brand-pink">
                        Step {modalStep + 1} of 3
                      </span>
                      <h3 className="font-display text-lg font-black text-ink leading-none mt-0.5">
                        {modalStep === 0 && 'Target Role'}
                        {modalStep === 1 && 'Years & Experience Level'}
                        {modalStep === 2 && 'Question Formats & Length'}
                      </h3>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsOptionsModalOpen(false)}
                    className="p-2 rounded-xl text-muted hover:text-ink hover:bg-surface-soft transition-colors cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Progress Bar */}
                <div className="flex gap-2 mb-6">
                  {[0, 1, 2].map((st) => (
                    <div
                      key={st}
                      className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                        st <= modalStep ? 'bg-brand-pink' : 'bg-hairline'
                      }`}
                    />
                  ))}
                </div>

                {/* Modal Step Contents */}
                <AnimatePresence mode="wait">
                  {modalStep === 0 && (
                    <motion.div
                      key="step-role"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="space-y-5"
                    >
                      <div>
                        <h4 className="font-display text-xl font-black text-ink">What role are you practicing for?</h4>
                        <p className="text-xs text-muted mt-1">Select a role preset or enter a custom job title.</p>
                      </div>

                      <div className="grid gap-2 sm:grid-cols-2">
                        {INTERVIEW_ROLES.map((role) => (
                          <button
                            key={role}
                            type="button"
                            onClick={() => {
                              setRoleOption(role);
                              setCustomRole('');
                            }}
                            className={`p-3.5 rounded-2xl border text-left text-xs font-bold transition-all duration-150 active:scale-95 cursor-pointer flex items-center justify-between ${
                              roleOption === role
                                ? 'border-brand-pink bg-brand-pink/10 text-brand-pink shadow-sm'
                                : 'border-hairline bg-canvas text-ink hover:border-ink/20'
                            }`}
                          >
                            <span>{role}</span>
                            {roleOption === role && <Check size={16} />}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => setRoleOption('__custom__')}
                          className={`p-3.5 rounded-2xl border text-left text-xs font-bold transition-all duration-150 active:scale-95 cursor-pointer sm:col-span-2 flex items-center justify-between ${
                            roleOption === '__custom__'
                              ? 'border-brand-pink bg-brand-pink/10 text-brand-pink'
                              : 'border-dashed border-hairline bg-canvas text-muted hover:border-ink/20'
                          }`}
                        >
                          <span>+ Enter Custom Role Title</span>
                          {roleOption === '__custom__' && <Check size={16} />}
                        </button>
                      </div>

                      {roleOption === '__custom__' && (
                        <input
                          autoFocus
                          type="text"
                          value={customRole}
                          onChange={(e) => setCustomRole(e.target.value)}
                          placeholder="e.g. Lead Solutions Architect, Senior AI Engineer..."
                          className="w-full py-3.5 px-4 bg-canvas border border-brand-pink/40 rounded-xl text-sm font-semibold text-ink focus:outline-none placeholder:text-muted/40"
                        />
                      )}
                    </motion.div>
                  )}

                  {modalStep === 1 && (
                    <motion.div
                      key="step-exp"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="space-y-5"
                    >
                      <div>
                        <h4 className="font-display text-xl font-black text-ink">How many years of experience?</h4>
                        <p className="text-xs text-muted mt-1">Calibrates the interviewer evaluation bar and question difficulty.</p>
                      </div>

                      <div className="grid gap-2.5 sm:grid-cols-2">
                        {INTERVIEW_LEVELS.map((lvl) => (
                          <button
                            key={lvl.value}
                            type="button"
                            onClick={() => setExperience(lvl.value)}
                            className={`p-4 rounded-2xl border text-left transition-all duration-150 active:scale-95 cursor-pointer ${
                              experience === lvl.value
                                ? 'border-brand-pink bg-brand-pink/10 text-brand-pink shadow-sm'
                                : 'border-hairline bg-canvas text-ink hover:border-ink/20'
                            }`}
                          >
                            <span className="block text-xs font-black">{lvl.value}</span>
                            <span className="block text-[11px] text-muted mt-1 leading-relaxed">{lvl.description}</span>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {modalStep === 2 && (
                    <motion.div
                      key="step-format"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="space-y-5"
                    >
                      <div>
                        <h4 className="font-display text-xl font-black text-ink">What question types do you want?</h4>
                        <p className="text-xs text-muted mt-1">Select one or more question formats for this session.</p>
                      </div>

                      <div className="grid gap-2 sm:grid-cols-2">
                        {INTERVIEW_QUESTION_TYPES.map((type) => {
                          const active = selectedTypes.includes(type.value);
                          return (
                            <button
                              key={type.value}
                              type="button"
                              onClick={() => toggleQuestionType(type.value)}
                              className={`flex items-start gap-3 p-3.5 rounded-2xl border text-left transition-all duration-150 active:scale-95 cursor-pointer ${
                                active
                                  ? 'border-brand-teal bg-brand-teal/10 text-brand-teal shadow-sm'
                                  : 'border-hairline bg-canvas text-ink hover:border-ink/20'
                              }`}
                            >
                              <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-black ${active ? 'bg-brand-teal text-white' : 'bg-surface-soft text-muted'}`}>
                                {type.value === 'coding' ? <Code2 size={13} /> : type.icon}
                              </span>
                              <div className="flex-1">
                                <span className="block text-xs font-black">{type.label}</span>
                                <span className="block text-[11px] text-muted">{type.description}</span>
                              </div>
                              {active && <Check size={16} className="text-brand-teal shrink-0 mt-0.5" />}
                            </button>
                          );
                        })}
                      </div>

                      <div>
                        <label className="block text-xs font-mono font-bold uppercase tracking-widest text-muted mb-2">
                          Questions Per Session
                        </label>
                        <div className="grid grid-cols-3 gap-2 rounded-2xl border border-hairline bg-canvas p-1.5">
                          {[3, 5, 8].map((count) => (
                            <button
                              key={count}
                              type="button"
                              onClick={() => setQuestionCount(count)}
                              className={`min-h-9 rounded-xl text-xs font-black transition-all duration-150 active:scale-95 cursor-pointer ${
                                questionCount === count
                                  ? 'bg-ink text-white shadow-sm'
                                  : 'text-muted hover:bg-surface-soft hover:text-ink'
                              }`}
                            >
                              {count} Questions
                            </button>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Modal Footer Controls */}
                <div className="mt-8 flex items-center justify-between border-t border-hairline pt-5">
                  <button
                    type="button"
                    onClick={() => {
                      if (modalStep === 0) setIsOptionsModalOpen(false);
                      else setModalStep((st) => (st - 1) as 0 | 1 | 2);
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-muted hover:text-ink transition-colors cursor-pointer"
                  >
                    <ArrowLeft size={15} />
                    <span>{modalStep === 0 ? 'Cancel' : 'Back'}</span>
                  </button>

                  {modalStep < 2 ? (
                    <button
                      type="button"
                      disabled={!targetRole.trim()}
                      onClick={() => setModalStep((st) => (st + 1) as 0 | 1 | 2)}
                      className="flex items-center gap-2 rounded-xl bg-brand-pink px-6 py-3 text-xs font-black text-white shadow-md active:scale-[0.96] disabled:opacity-40 cursor-pointer"
                    >
                      <span>NEXT: {modalStep === 0 ? 'EXPERIENCE' : 'QUESTION TYPES'}</span>
                      <ArrowRight size={15} />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setIsOptionsModalOpen(false);
                        startSession();
                      }}
                      disabled={!isSetupComplete}
                      className="flex items-center gap-2 rounded-xl bg-brand-pink px-6 py-3 text-xs font-black text-white shadow-[0_8px_24px_rgba(255,77,139,0.35)] active:scale-[0.96] disabled:opacity-40 cursor-pointer group"
                    >
                      <span>LAUNCH INTERVIEW SESSION</span>
                      <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {phase === 'session' && currentQuestion && (
          <section className="mx-auto max-w-4xl">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><button type="button" onClick={resetToSetup} className="flex min-h-10 items-center gap-2 text-sm font-bold text-muted transition-colors hover:text-ink"><X size={16} /> End session</button><div className="font-mono text-xs font-black uppercase tracking-widest text-muted">{progressLabel}</div></div>
            <div className="h-1.5 overflow-hidden rounded-full bg-hairline"><motion.div className="h-full rounded-full bg-brand-teal" animate={{ width: `${((questionIndex + (activeFeedback && !followUpPrompt ? 1 : 0)) / questions.length) * 100}%` }} /></div>
            <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
              <div className="rounded-[28px] border border-hairline bg-surface-card p-5 shadow-xl sm:p-8">
                <div className="flex flex-wrap items-center justify-between gap-3"><span className="rounded-full border border-brand-pink/25 bg-brand-pink/10 px-3 py-1 text-[11px] font-black uppercase tracking-widest text-brand-pink">{isFollowUp ? 'Adaptive follow-up' : currentQuestion.label}</span><span className="text-xs font-bold text-muted">Focus: {currentQuestion.focus}</span></div>
                <h2 className="mt-7 font-display text-2xl font-black leading-tight sm:text-3xl" style={{ textWrap: 'balance' }}>{isFollowUp && followUpPrompt ? followUpPrompt : currentQuestion.prompt}</h2>

                {!activeFeedback || isFollowUp ? (
                  <div className="mt-8">
                    <label htmlFor="interview-answer" className="mb-2 flex items-center justify-between gap-3 text-xs font-black uppercase tracking-widest text-muted">
                      <span>{currentQuestion.answerMode === 'code' ? 'Your solution / explanation' : 'Your answer'}</span>
                      <span className="font-mono normal-case tracking-normal">{answer.trim().split(/\s+/).filter(Boolean).length} words</span>
                    </label>
                    <textarea
                      id="interview-answer"
                      autoFocus
                      value={answer}
                      onChange={(event) => setAnswer(event.target.value)}
                      placeholder={currentQuestion.answerMode === 'code' ? 'Write your solution here, then explain complexity and edge cases…' : 'Answer as if you were speaking to the interviewer…'}
                      className={`min-h-[240px] w-full resize-y rounded-2xl border border-hairline bg-canvas px-4 py-4 text-[15px] leading-relaxed text-ink outline-none transition-colors placeholder:text-muted/50 focus:border-brand-teal ${currentQuestion.answerMode === 'code' ? 'font-mono text-sm' : ''}`}
                    />
                    {currentQuestion.answerMode === 'code' && (
                      <p className="mt-2 flex items-center gap-2 text-xs text-muted">
                        <Code2 size={14} className="text-brand-teal" /> Coding answers are reviewed as text/code in this MVP; execution is not required.
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={submitAnswer}
                      disabled={!answer.trim() || isEvaluating}
                      className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-pink px-5 text-sm font-black text-white shadow-[4px_4px_0_var(--bold-border)] transition-transform active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {isEvaluating ? (
                        <><Sparkles size={17} className="animate-pulse" /> Reviewing answer…</>
                      ) : (
                        <>Submit answer <ArrowRight size={17} /></>
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="mt-8 space-y-5">
                    {/* Verdict Banner */}
                    <div
                      className={`p-4 rounded-2xl border flex items-center justify-between gap-4 ${
                        activeFeedback.score >= 8
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                          : activeFeedback.score >= 5
                          ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400'
                          : 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl font-mono text-sm font-black bg-current/10 shrink-0">
                          {activeFeedback.score >= 8 ? '✓' : activeFeedback.score >= 5 ? '!' : '✕'}
                        </span>
                        <div>
                          <span className="text-xs font-mono font-black uppercase tracking-widest block">
                            {activeFeedback.score >= 8
                              ? 'Correct / Strong Answer'
                              : activeFeedback.score >= 5
                              ? 'Partially Correct / Missing Details'
                              : 'Incorrect / Needs Revision'}
                          </span>
                          <span className="text-[11px] opacity-80 font-medium">
                            {activeFeedback.source === 'gemini' ? 'AI Interviewer Evaluation' : 'Rubric Evaluation'}
                          </span>
                        </div>
                      </div>
                      <span className="font-mono text-3xl font-black tabular-nums shrink-0">
                        {activeFeedback.score}
                        <span className="text-sm opacity-60">/10</span>
                      </span>
                    </div>

                    {/* Detailed Side-by-Side Right vs Wrong Breakdown */}
                    <div className="grid gap-4 sm:grid-cols-2">
                      {/* What You Got Right */}
                      <div className="p-4 rounded-2xl bg-canvas border border-emerald-500/20 shadow-sm">
                        <div className="flex items-center gap-2 mb-3 text-emerald-500">
                          <Check size={16} />
                          <span className="text-xs font-mono font-black uppercase tracking-widest">What You Got Right</span>
                        </div>
                        <ul className="space-y-2">
                          {activeFeedback.strengths.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-xs leading-relaxed text-ink font-medium">
                              <span className="text-emerald-500 font-black mt-0.5">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* What Was Wrong / Missing */}
                      <div className="p-4 rounded-2xl bg-canvas border border-rose-500/20 shadow-sm">
                        <div className="flex items-center gap-2 mb-3 text-rose-500">
                          <X size={16} />
                          <span className="text-xs font-mono font-black uppercase tracking-widest">What Was Wrong / Missing</span>
                        </div>
                        <ul className="space-y-2">
                          {activeFeedback.improvements.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-xs leading-relaxed text-ink font-medium">
                              <span className="text-rose-500 font-black mt-0.5">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Model Ideal Answer */}
                    <div className="p-4 rounded-2xl bg-surface-soft/60 border border-hairline">
                      <div className="flex items-center gap-2 mb-2 text-brand-pink">
                        <Sparkles size={16} />
                        <span className="text-xs font-mono font-black uppercase tracking-widest">Ideal Reference Answer</span>
                      </div>
                      <p className="text-sm leading-relaxed text-ink font-medium">{activeFeedback.idealAnswer}</p>
                    </div>

                    {/* Next Action Buttons */}
                    <div className="flex flex-wrap items-center gap-3 pt-2">
                      {followUpPrompt && !isFollowUp && (
                        <>
                          <button
                            type="button"
                            onClick={beginFollowUp}
                            className="flex min-h-11 items-center gap-2 rounded-xl bg-ink text-white px-5 text-xs font-mono font-black uppercase tracking-wider transition-transform active:scale-[0.96] cursor-pointer shadow-md"
                          >
                            Answer follow-up
                            <ChevronRight size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setFollowUpPrompt(null)}
                            className="text-xs font-bold text-muted underline underline-offset-4 hover:text-ink cursor-pointer"
                          >
                            Skip follow-up
                          </button>
                        </>
                      )}
                      {(!followUpPrompt || isFollowUp) && (
                        <button
                          type="button"
                          onClick={goToNextQuestion}
                          className="flex min-h-11 items-center gap-2 rounded-xl bg-brand-pink text-white px-6 text-xs font-mono font-black uppercase tracking-wider transition-transform active:scale-[0.96] cursor-pointer shadow-md"
                        >
                          <span>{questionIndex >= questions.length - 1 ? 'See Report' : 'Next Question'}</span>
                          <ArrowRight size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <aside className="space-y-4"><div className="rounded-[24px] border border-hairline bg-surface-card p-5 shadow-sm"><p className="text-xs font-black uppercase tracking-widest text-muted">Session brief</p><p className="mt-3 font-display text-xl font-black">{activeRole || targetRole}</p><p className="mt-1 text-sm text-muted">{activeExperience || experience} · {questions.length} questions</p><div className="mt-5 flex flex-wrap gap-2">{selectedTypes.map((type) => <span key={type} className="rounded-full bg-surface-soft px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-muted">{INTERVIEW_QUESTION_TYPES.find((item) => item.value === type)?.label}</span>)}</div></div><div className="rounded-[24px] border border-brand-pink/20 bg-brand-pink/5 p-5"><p className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-brand-pink"><Sparkles size={14} /> Interviewer tip</p><p className="mt-2 text-sm leading-relaxed text-ink">Think out loud. A good interview answer makes your reasoning visible, not just your conclusion.</p></div></aside>
            </div>
          </section>
        )}

        {phase === 'report' && completedSession && (
          <section className="mx-auto max-w-5xl">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3"><button type="button" onClick={resetToSetup} className="flex min-h-10 items-center gap-2 text-sm font-bold text-muted transition-colors hover:text-ink"><ArrowLeft size={16} /> New session</button><span className="font-mono text-xs font-black uppercase tracking-widest text-muted">Saved · {formatDate(completedSession.completedAt)}</span></div>
            <div className="grid gap-5 lg:grid-cols-[240px_minmax(0,1fr)]"><div className="rounded-[28px] border border-brand-teal/25 bg-brand-teal/10 p-6"><Trophy className="text-brand-teal" size={24} /><p className="mt-8 text-xs font-black uppercase tracking-widest text-muted">Session score</p><p className="mt-1 font-display text-6xl font-black tabular-nums text-ink">{completedSession.averageScore}<span className="text-xl text-muted">/10</span></p><p className="mt-3 text-sm leading-relaxed text-muted">{completedSession.averageScore >= 7 ? 'Solid session. Keep sharpening the edges.' : 'Good practice session. Retry the weak spots before your next interview.'}</p></div><div className="rounded-[28px] border border-hairline bg-surface-card p-6 shadow-xl sm:p-8"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-[11px] font-black uppercase tracking-widest text-brand-pink">Interview report</p><h2 className="mt-2 font-display text-3xl font-black">{completedSession.role}</h2><p className="mt-1 text-sm text-muted">{completedSession.experience} · {completedSession.questionCount} questions · {completedSession.questionTypes.map((type) => INTERVIEW_QUESTION_TYPES.find((item) => item.value === type)?.label).join(', ')}</p></div><button type="button" onClick={() => startSession()} className="flex min-h-10 items-center gap-2 rounded-xl border border-hairline px-3 text-sm font-bold text-muted transition-colors hover:bg-surface-soft hover:text-ink"><RotateCcw size={15} /> Try another</button></div><div className="mt-8 space-y-3">{completedSession.questions.map((item, index) => { const weak = item.feedback.score < 7; return <div key={item.question.id} className={`rounded-2xl border p-4 ${weak ? 'border-brand-pink/25 bg-brand-pink/5' : 'border-hairline bg-canvas'}`}><div className="flex flex-wrap items-start justify-between gap-3"><div className="flex gap-3"><span className="font-mono text-xs font-black text-muted">0{index + 1}</span><div><span className="text-[10px] font-black uppercase tracking-widest text-muted">{item.question.label}</span><p className="mt-1 text-sm font-bold leading-relaxed text-ink">{item.question.prompt}</p></div></div><span className={`shrink-0 font-mono text-sm font-black tabular-nums ${weak ? 'text-brand-pink' : 'text-brand-teal'}`}>{item.feedback.score}/10</span></div>{weak && <button type="button" onClick={() => retryQuestion(item)} className="mt-4 flex min-h-9 items-center gap-2 rounded-lg bg-brand-pink px-3 text-xs font-black text-white transition-transform active:scale-[0.96]"><RotateCcw size={13} /> Try again</button>}</div>; })}</div></div></div>
          </section>
        )}

        {phase === 'setup' && savedSessions.length > 0 && <section className="mt-10"><div className="mb-4 flex items-center gap-2"><History size={17} className="text-muted" /><h2 className="font-display text-xl font-black">Previous sessions</h2><span className="text-xs text-muted">Saved on this device</span></div><div className="grid gap-3 md:grid-cols-3">{savedSessions.slice(0, 3).map((session) => <button key={session.id} type="button" onClick={() => openSavedSession(session)} className="rounded-2xl border border-hairline bg-surface-card p-4 text-left shadow-sm transition-colors hover:border-brand-teal/40 hover:bg-surface-soft"><div className="flex items-center justify-between gap-2"><span className="truncate text-sm font-black text-ink">{session.role}</span><span className="font-mono text-sm font-black tabular-nums text-brand-teal">{session.averageScore}/10</span></div><p className="mt-1 text-xs text-muted">{formatDate(session.completedAt)} · {session.questionCount} questions</p></button>)}</div></section>}
        {error && <p className="mt-6 text-center text-sm font-bold text-brand-pink">{error}</p>}
      </div>
    </main>
  );
}
