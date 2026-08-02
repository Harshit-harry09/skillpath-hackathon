'use client';

import React, { useRef, useState } from 'react';
import { motion, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useDraft } from '@/context/DraftContext';
import {
  ArrowDownRight,
  ArrowRight,
  BarChart3,
  BrainCircuit,
  ChevronRight,
  CircleDot,
  FileText,
  Map,
  MessageSquareText,
  MoveUpRight,
  Play,
  ScanSearch,
  Sparkles,
  Target,
  Timer,
  TrendingUp,
  Zap,
} from 'lucide-react';

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

const sampleRoles = [
  'Full-stack AI engineer',
  'LLM systems architect',
  'Senior ML infrastructure',
];

const stageData = [
  {
    title: 'Read the role',
    copy: 'Turn a job description into the actual skills the team will evaluate.',
    icon: FileText,
    marker: '01',
  },
  {
    title: 'Find the delta',
    copy: 'Rank missing skills by market signal, not by whatever is trending today.',
    icon: ScanSearch,
    marker: '02',
  },
  {
    title: 'Work the route',
    copy: 'Follow a clear weekly plan with proof points you can take into an interview.',
    icon: Target,
    marker: '03',
  },
];

const featureData = [
  {
    title: 'A smaller, sharper skill set',
    copy: 'MVC finds the few capabilities that change your odds most. No 40-item checklist.',
    icon: BrainCircuit,
    className: 'home-feature-wide',
  },
  {
    title: 'Market context built in',
    copy: 'See where a skill matters, what it unlocks, and how much signal it carries.',
    icon: TrendingUp,
    className: 'home-feature-tall',
  },
  {
    title: 'A date you can work toward',
    copy: 'The plan ends with a ready-by date, not a vague promise to keep learning.',
    icon: Timer,
    className: 'home-feature-small',
  },
  {
    title: 'Interview reps that adapt',
    copy: 'Practice the role, then pressure-test the answers that still feel soft.',
    icon: MessageSquareText,
    className: 'home-feature-small home-feature-accent',
  },
];

function Reveal({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.24 }}
      transition={{ duration: 0.55, delay, ease: EASE_OUT }}
    >
      {children}
    </motion.div>
  );
}

function MagneticButton({ children, onClick, secondary = false }: { children: React.ReactNode; onClick: () => void; secondary?: boolean }) {
  const reduce = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 260, damping: 22, mass: 0.35 });
  const springY = useSpring(y, { stiffness: 260, damping: 22, mass: 0.35 });

  const reset = () => {
    x.set(0);
    y.set(0);
  };

  const move = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (reduce || event.pointerType !== 'mouse') return;
    const rect = event.currentTarget.getBoundingClientRect();
    x.set((event.clientX - (rect.left + rect.width / 2)) * 0.12);
    y.set((event.clientY - (rect.top + rect.height / 2)) * 0.12);
  };

  return (
    <motion.button
      type="button"
      onClick={onClick}
      onPointerMove={move}
      onPointerLeave={reset}
      style={reduce ? undefined : { x: springX, y: springY }}
      className={`home-button group ${secondary ? 'home-button-secondary' : 'home-button-primary'}`}
    >
      {children}
    </motion.button>
  );
}

function PathSpine({ target }: { target: React.RefObject<HTMLElement | null> }) {
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target, offset: ['start start', 'end end'] });
  const pathLength = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <div className="home-path-layer" aria-hidden="true">
      <svg viewBox="0 0 1000 5600" preserveAspectRatio="none" className="home-path-svg">
        <path
          className="home-path-base"
          d="M742 0 C742 250 250 230 290 520 C330 810 850 770 830 1080 C810 1390 160 1320 210 1720 C260 2120 850 2050 760 2440 C670 2830 170 2670 220 3130 C270 3590 850 3480 790 3930 C730 4380 260 4230 290 4700 C310 5100 690 5270 690 5600"
        />
        <motion.path
          className="home-path-progress"
          d="M742 0 C742 250 250 230 290 520 C330 810 850 770 830 1080 C810 1390 160 1320 210 1720 C260 2120 850 2050 760 2440 C670 2830 170 2670 220 3130 C270 3590 850 3480 790 3930 C730 4380 260 4230 290 4700 C310 5100 690 5270 690 5600"
          style={{ pathLength: reduce ? 1 : pathLength }}
        />
        {!reduce && <motion.circle className="home-path-orb" cx="742" cy="0" r="10" style={{ cy: useTransform(scrollYProgress, [0, 1], [0, 5600]) }} />}
      </svg>
    </div>
  );
}

function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const { user, openAuthModal } = useAuth();
  const router = useRouter();
  const reduce = useReducedMotion();

  const goAnalyze = () => (user ? router.push('/analyze') : openAuthModal());

  return (
    <section ref={sectionRef} className="home-hero" aria-labelledby="home-title">
      <div className="home-hero-grid" />
      <div className="home-hero-glow" />
      <div className="home-container home-hero-inner">
        <Reveal className="home-hero-copy">
          <div className="home-kicker"><span className="home-kicker-mark"><CircleDot size={14} /></span> Career intelligence for the next role</div>
          <h1 id="home-title">Build your next move <span>with evidence.</span></h1>
          <p>Find the skills, roles, and next steps that move your career forward.</p>
          <div className="home-hero-actions">
            <MagneticButton onClick={goAnalyze}><Zap size={17} fill="currentColor" /> Analyze your fit <ArrowRight size={17} /></MagneticButton>
            <button type="button" className="home-text-link" onClick={() => document.getElementById('explore')?.scrollIntoView({ behavior: 'smooth' })}>Explore roles <ArrowDownRight size={16} /></button>
          </div>
          <div className="home-hero-proof"><span>Local-first analysis</span><span>Evidence-led output</span><span>Free to start</span></div>
        </Reveal>

        <Reveal className="home-hero-visual" delay={0.1}>
          <div className="home-hero-image-wrap">
            <img src="/hero-bg.png" alt="A glowing map of connected cities representing the live career market" className="home-hero-image" />
            <div className="home-hero-image-shade" />
            <div className="home-hero-orbit orbit-one" />
            <div className="home-hero-orbit orbit-two" />
            <div className="home-live-card">
              <div className="home-live-top"><span className="home-live-dot" /> Live market map <span className="home-live-time">now</span></div>
              <div className="home-live-value">+18.4%</div>
              <div className="home-live-label">role signal this quarter</div>
              <div className="home-live-chart"><span /><span /><span /><span /><span /><span /><span /><span /></div>
            </div>
            <div className="home-role-card"><span className="home-role-icon"><BarChart3 size={16} /></span><span><b>AI systems</b><small>high-fit direction</small></span><ArrowRight size={15} /></div>
          </div>
          <div className="home-hero-caption"><span>01</span><span>See the signal before you make the move</span></div>
        </Reveal>
      </div>
      <div className="home-hero-bottom home-container"><span>SkillPath</span><span>Resume to roadmap</span><span>From signal to route</span></div>
    </section>
  );
}

function AnalyzerSection() {
  const [jd, setJd] = useState('');
  const { user, openAuthModal } = useAuth();
  const { setDraft } = useDraft();
  const router = useRouter();

  const handleStart = () => {
    if (!user) { openAuthModal(); return; }
    if (jd.trim()) { setDraft({ jd }); router.push('/analyze'); }
  };

  return (
    <section id="analyze" className="home-section home-analyzer">
      <div className="home-container home-analyzer-grid">
        <Reveal className="home-section-intro">
          <div className="home-kicker"><span className="home-kicker-mark"><ScanSearch size={14} /></span> Start with the role</div>
          <h2>Bring the job description. Leave with a route.</h2>
          <p>Paste a target role and see the gap between your current signal and the work the market is asking for.</p>
          <div className="home-role-list">
            {sampleRoles.map((role) => <button key={role} type="button" onClick={() => setJd(`Target role: ${role}. Requires strong engineering, architecture, and deployment standards.`)}><ChevronRight size={14} />{role}</button>)}
          </div>
        </Reveal>

        <Reveal className="home-analyzer-panel" delay={0.08}>
          <div className="home-panel-head"><span className="home-panel-title"><span className="home-panel-lights"><i /><i /><i /></span> Target role evaluator</span><span className="home-status"><span /> Ready</span></div>
          <label htmlFor="jd-input" className="sr-only">Target job description</label>
          <div className="home-editor">
            <div className="home-editor-gutter">{Array.from({ length: 9 }).map((_, index) => <span key={index}>{String(index + 1).padStart(2, '0')}</span>)}</div>
            <textarea id="jd-input" value={jd} onChange={(event) => setJd(event.target.value)} placeholder="Paste a target job description, role requirements, or expectations here" spellCheck={false} />
          </div>
          <div className="home-panel-foot"><span><Sparkles size={15} /> {jd.length} characters <em>local match + gap analysis</em></span><button type="button" onClick={handleStart} disabled={!jd.trim()} className="home-panel-cta">Generate roadmap <ArrowRight size={16} /></button></div>
        </Reveal>
      </div>
    </section>
  );
}

function MethodSection() {
  return (
    <section id="how-it-works" className="home-section home-method">
      <div className="home-container">
        <Reveal className="home-section-heading"><div><div className="home-kicker"><span className="home-kicker-mark"><Map size={14} /></span> A visible method</div><h2>Make progress you can point to.</h2></div><p>One system from the first read of a role to the moment you are ready to talk about it.</p></Reveal>
        <div className="home-stage-track">
          <div className="home-stage-line" />
          {stageData.map((stage, index) => {
            const Icon = stage.icon;
            return <Reveal key={stage.title} className="home-stage" delay={index * 0.07}><div className="home-stage-marker"><Icon size={19} /></div><span className="home-stage-index">{stage.marker}</span><h3>{stage.title}</h3><p>{stage.copy}</p></Reveal>;
          })}
        </div>
      </div>
    </section>
  );
}

function SignalSection() {
  return (
    <section id="explore" className="home-section home-signal">
      <div className="home-container home-signal-grid">
        <Reveal className="home-signal-copy"><div className="home-kicker"><span className="home-kicker-mark"><TrendingUp size={14} /></span> Market signal</div><h2>Cut through the noise.</h2><p>Most career advice gets broader as you need it to get sharper. SkillPath narrows the field to the moves that matter for your target.</p><a href="/explore" className="home-inline-link">Explore the role map <MoveUpRight size={16} /></a></Reveal>
        <Reveal className="home-signal-board" delay={0.08}>
          <div className="home-board-head"><span>Role signal</span><span>Last 90 days <ChevronRight size={13} /></span></div>
          <div className="home-board-feature"><div className="home-board-feature-top"><span>AI platform engineer</span><b>strong fit</b></div><div className="home-board-bar"><span /></div><div className="home-board-meta"><span>Architecture</span><span>+42 signal points</span></div></div>
          {[['Systems design', '+36', '84%'], ['Evaluation pipelines', '+29', '71%'], ['Observability', '+18', '56%']].map((item, index) => <div className="home-board-row" key={item[0]}><span className="home-board-row-icon">{index + 1}</span><span>{item[0]}</span><b>{item[1]}</b><i style={{ width: item[2] }} /></div>)}
        </Reveal>
      </div>
    </section>
  );
}

function InterviewSection() {
  const router = useRouter();
  return (
    <section className="home-section home-interview">
      <div className="home-container home-interview-grid">
        <Reveal className="home-interview-copy"><div className="home-kicker"><span className="home-kicker-mark"><MessageSquareText size={14} /></span> The final mile</div><h2>Then pressure-test the story.</h2><p>Turn the plan into language you can use. Practice with adaptive follow-ups that expose the parts that still need a rep.</p><button type="button" className="home-button home-button-secondary" onClick={() => router.push('/interview-lab')}>Open Interview Lab <ArrowRight size={16} /></button></Reveal>
        <Reveal className="home-interview-console" delay={0.1}>
          <div className="home-console-head"><span><span className="home-console-live" /> interview lab</span><span>role: senior backend</span></div>
          <div className="home-console-question"><span className="home-console-label">follow-up question</span><p>What tradeoff would make you choose the opposite approach?</p><div className="home-console-actions"><button type="button"><Play size={14} fill="currentColor" /> Record answer</button><button type="button">Change mode <ChevronRight size={14} /></button></div></div>
          <div className="home-console-modes"><span>Technical</span><span>Coding test</span><span>System design</span><span>Behavioral</span></div>
        </Reveal>
      </div>
    </section>
  );
}

function FeaturesSection() {
  return (
    <section id="features" className="home-section home-features">
      <div className="home-container">
        <Reveal className="home-section-heading home-features-heading"><div><div className="home-kicker"><span className="home-kicker-mark"><Sparkles size={14} /></span> One system, end to end</div><h2>Everything should make the next step clearer.</h2></div><p>Small decisions add up when the whole path is designed to work together.</p></Reveal>
        <div className="home-feature-grid">
          {featureData.map((feature, index) => { const Icon = feature.icon; return <Reveal key={feature.title} className={`home-feature ${feature.className}`} delay={index * 0.06}><div className="home-feature-icon"><Icon size={18} /></div><div className="home-feature-content"><h3>{feature.title}</h3><p>{feature.copy}</p></div>{index === 0 && <div className="home-feature-bars"><span /><span /><span /><span /><span /><span /><span /></div>}{index === 1 && <div className="home-feature-radar"><i /><i /><i /><i /></div>}{index === 2 && <div className="home-feature-date">03<span>JUL</span></div>}{index === 3 && <div className="home-feature-wave"><span /><span /><span /><span /><span /></div>}</Reveal>; })}
        </div>
      </div>
    </section>
  );
}

function ProofSection() {
  return (
    <section className="home-section home-proof">
      <div className="home-container">
        <Reveal className="home-proof-heading"><div className="home-kicker"><span className="home-kicker-mark"><Zap size={14} /></span> What changes</div><h2>Less guessing. More useful work.</h2></Reveal>
        <div className="home-proof-list">
          {[['01', 'A skill gap you can explain', 'Know exactly what is missing and why it matters to the role.'], ['02', 'A roadmap with a finish line', 'Trade an endless feed of content for a week-by-week sequence.'], ['03', 'Confidence that survives follow-ups', 'Practice the reasoning behind your answer, not just the answer itself.']].map(([marker, title, copy], index) => <Reveal key={marker} className="home-proof-row" delay={index * 0.07}><span className="home-proof-marker">{marker}</span><h3>{title}</h3><p>{copy}</p><ArrowRight size={18} /></Reveal>)}
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  const { user, openAuthModal } = useAuth();
  const router = useRouter();
  const goAnalyze = () => (user ? router.push('/analyze') : openAuthModal());
  return <section className="home-final"><div className="home-container home-final-inner"><Reveal><div className="home-kicker"><span className="home-kicker-mark"><CircleDot size={14} /></span> Your next role is a system</div><h2>Make the next move<br /><span>deliberate.</span></h2><p>Start with the role. Build the route. Keep the evidence.</p><MagneticButton onClick={goAnalyze}>Analyze your fit <ArrowRight size={17} /></MagneticButton></Reveal><div className="home-final-path" aria-hidden="true"><svg viewBox="0 0 700 300" preserveAspectRatio="none"><path d="M20 260 C120 250 80 150 190 160 C310 176 300 42 420 68 C515 89 520 202 680 30" /><circle cx="20" cy="260" r="6" /><circle cx="680" cy="30" r="6" /></svg></div></div></section>;
}

function HomeFooter() {
  return <footer className="home-footer"><div className="home-container home-footer-inner"><a href="/" className="home-brand"><span>SP</span> SkillPath</a><span className="home-footer-copy">Career intelligence for the next role.</span><div className="home-footer-links"><a href="/explore">Explore</a><a href="/interview-lab">Interview Lab</a><a href="https://github.com/shauryap9006-cell" target="_blank" rel="noreferrer" aria-label="SkillPath on GitHub"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg></a><a href="https://www.linkedin.com/in/shaurya-singh-971005357/" target="_blank" rel="noreferrer" aria-label="SkillPath on LinkedIn"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg></a><a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="SkillPath on Instagram"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg></a></div></div></footer>;
}

export function HomeExperience() {
  const pageRef = useRef<HTMLElement>(null);
  return <main ref={pageRef} className="home-shell"><PathSpine target={pageRef} /><Hero /><AnalyzerSection /><MethodSection /><SignalSection /><InterviewSection /><FeaturesSection /><ProofSection /><FinalCta /><HomeFooter /></main>;
}
