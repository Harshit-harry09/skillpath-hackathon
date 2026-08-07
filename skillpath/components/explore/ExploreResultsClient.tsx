'use client';
// updated

import React, { useEffect, useState } from 'react';
import SkillMap from '@/components/explore/SkillMap';
import ExploreStats from '@/components/explore/ExploreStats';
import ExploreCTA from '@/components/explore/ExploreCTA';
import MarketCompensation from '@/components/explore/MarketCompensation';
import TargetEmployers from '@/components/explore/TargetEmployers';
import { Footer } from '@/components/landing/CtaSection';

import Link from 'next/link';

export default function ExploreResultsClient({
  shareToken,
  initialData,
}: {
  shareToken: string;
  initialData: any | null;
}) {
  const [data, setData] = useState<any | null>(initialData);
  const [loading, setLoading] = useState(!initialData);

  useEffect(() => {
    // 1. Try reading from sessionStorage cache first (instant 0ms)
    try {
      const cached = sessionStorage.getItem(`explore_${shareToken}`);
      if (cached) {
        const json = JSON.parse(cached);
        console.log('[Explore] Loaded instantly from sessionStorage cache:', shareToken);
        setData(json);
        setLoading(false);
        return;
      }
    } catch (e) {
      console.warn('[Explore] SessionStorage read error:', e);
    }

    if (initialData) {
      setData(initialData);
      setLoading(false);
      return;
    }

    // 2. Fetch from API fallback if database is connected
    async function fetchFromApi() {
      try {
        const res = await fetch(`/api/explore/${shareToken}`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
          try {
            sessionStorage.setItem(`explore_${shareToken}`, JSON.stringify(json));
          } catch { /* ignore */ }
        }
      } catch (err) {
        console.error('[Explore] Fetch error:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchFromApi();
  }, [shareToken, initialData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-canvas flex flex-col items-center justify-center p-8">
        <div className="w-12 h-12 border-4 border-brand-pink border-t-transparent rounded-full animate-spin mb-4" />
        <p className="font-mono text-sm text-muted">Building Skill Architecture...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-canvas flex flex-col items-center justify-center p-8 text-center">
        <h1 className="font-display text-4xl text-ink mb-4">Exploration Not Found</h1>
        <p className="font-sans text-muted mb-8 max-w-md">
          We couldn't find a skill map for this role. Try searching for a new role.
        </p>
        <Link href="/explore" className="px-6 py-3 bg-brand-pink text-white font-bold rounded-xl hover:opacity-90 transition-opacity">
          Explore Roles
        </Link>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-canvas text-ink selection:bg-brand-pink/20 font-sans">
      <div className="max-w-[1280px] mx-auto px-8 lg:px-24 pt-48 pb-16">
        {/* Header Section */}
        <header className="mb-20">
          <span className="font-bold text-[11px] text-muted tracking-widest uppercase mb-6 block">Skill Map Explorer</span>
          <h1 className="font-display text-display-lg md:text-[80px] text-ink mb-8 leading-[1.05] tracking-tight">
            {data.role}
          </h1>
          <div className="flex flex-wrap items-center gap-6 font-sans font-bold text-[12px] tracking-widest uppercase">
            <span className="text-muted">{data.seniority} level</span>
            <span className="w-1.5 h-1.5 bg-hairline rounded-full" />
            <span className="text-brand-teal">{data.company_type} context</span>
          </div>
        </header>

        {/* MVC High-level Highlight */}
        <section className="mb-32">
          <div className="bg-surface-card border border-hairline rounded-[32px] p-10 md:p-16 relative overflow-hidden shadow-sm">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-teal/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />

            <div className="relative z-10">
              <span className="font-bold text-[10px] text-brand-teal uppercase tracking-[0.2em] mb-8 block">The Interview Gatekeepers</span>
              <h2 className="font-display text-display-md text-ink mb-10 max-w-2xl leading-tight">
                These {data.mvc_skills?.length || 0} skills appear in 80%+ of JDs for this role. Master these to get interviews.
              </h2>

              <div className="flex flex-wrap gap-4">
                {(data.mvc_skills || []).map((skill: string) => (
                  <span
                    key={skill}
                    className="font-sans font-semibold text-body-md text-ink border border-hairline px-8 py-4 rounded-xl bg-canvas hover:bg-surface-soft transition-colors cursor-default"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Stats Row */}
        <ExploreStats data={data as any} />

        {/* Full Skill Map */}
        <section className="pt-32 pb-16 border-t border-hairline">
          <header className="mb-20 max-w-2xl">
            <h2 className="font-display text-display-md text-ink mb-6">Full Skill Architecture</h2>
            <p className="font-sans text-[20px] text-muted leading-relaxed">
              Every technical competency and analytical requirement identified from thousands of market-active job descriptions.
            </p>
          </header>
          {data.skill_map?.categories && (
            <SkillMap categories={data.skill_map.categories} />
          )}
        </section>

        {/* Feature 1: Market Compensation Matrix */}
        <MarketCompensation roleName={data.role} salaryRange={data.salary_range} />

        {/* Feature 2: Top Target Employers */}
        <TargetEmployers roleName={data.role} employers={data.top_employers} />

        {/* Conversion CTA */}
        <ExploreCTA explorationData={data as any} />
      </div>

      <Footer />
    </main>
  );
}
