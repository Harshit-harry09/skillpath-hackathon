'use client';
// updated

import React, { useState, useEffect, useCallback } from 'react';
import {
  Building2,
  Plus,
  RefreshCw,
  Search,
  ExternalLink,
  CheckCircle2,
  Trash2,
  Sparkles,
  Briefcase,
  MapPin,
  Clock,
  Layers,
  X,
  Filter,
  Eye,
  AlertCircle,
} from 'lucide-react';

interface TrackedCompany {
  id: string;
  board_token: string;
  display_name: string;
  active: boolean;
  added_at: string;
  last_refreshed_at: string | null;
  last_status: 'success' | 'error' | 'pending';
  last_error_message: string | null;
  job_count: number;
  new_job_count: number;
}

interface JobPosting {
  id: string;
  gh_id: number;
  board_token: string;
  company_name: string;
  title: string;
  location: string;
  department: string;
  absolute_url: string;
  content_html: string;
  first_seen_at: string;
  updated_at_remote: string;
  is_new: boolean;
  seen_at: string | null;
}

const PRESET_COMPANIES = [
  { token: 'stripe', name: 'Stripe' },
  { token: 'cloudflare', name: 'Cloudflare' },
  { token: 'airbnb', name: 'Airbnb' },
  { token: 'figma', name: 'Figma' },
  { token: 'vercel', name: 'Vercel' },
  { token: 'datadog', name: 'DataDog' },
  { token: 'coinbase', name: 'Coinbase' },
  { token: 'discord', name: 'Discord' },
  { token: 'gitlab', name: 'GitLab' },
  { token: 'lyft', name: 'Lyft' },
];

export default function JobsTrackerPage() {
  const [companies, setCompanies] = useState<TrackedCompany[]>([]);
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<string>('all');
  const [filterNewOnly, setFilterNewOnly] = useState<boolean>(false);

  // Track Company Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [inputToken, setInputToken] = useState('');
  const [inputName, setInputName] = useState('');
  const [addError, setAddError] = useState<string | null>(null);
  const [addingCompany, setAddingCompany] = useState(false);

  // Detail Modal State
  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);

  // Fetch Companies & Jobs
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [compRes, jobsRes] = await Promise.all([
        fetch('/api/jobs/companies'),
        fetch('/api/jobs'),
      ]);

      const compData = await compRes.json();
      const jobsData = await jobsRes.json();

      if (compData.success) {
        setCompanies(compData.companies || []);
      }
      if (jobsData.success) {
        setJobs(jobsData.jobs || []);
      }
    } catch (err) {
      console.error('Failed to load job tracker data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle Refresh All
  const handleRefreshAll = async () => {
    try {
      setRefreshing(true);
      const res = await fetch('/api/jobs/refresh', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        await fetchData();
      }
    } catch (err) {
      console.error('Error refreshing jobs:', err);
    } finally {
      setRefreshing(false);
    }
  };

  // Handle Add Company
  const handleAddCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputToken.trim()) return;

    try {
      setAddingCompany(true);
      setAddError(null);

      const res = await fetch('/api/jobs/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          board_token: inputToken.trim(),
          display_name: inputName.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        setAddError(data.error || 'Failed to track company');
        return;
      }

      setInputToken('');
      setInputName('');
      setIsAddModalOpen(false);
      await fetchData();
    } catch (err: any) {
      setAddError(err?.message || 'Network error while adding company');
    } finally {
      setAddingCompany(false);
    }
  };

  // Handle Untrack Company
  const handleUntrackCompany = async (token: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Are you sure you want to untrack "${token}"?`)) return;

    try {
      const res = await fetch(`/api/jobs/companies/${token}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        await fetchData();
      }
    } catch (err) {
      console.error('Failed to untrack company:', err);
    }
  };

  // Handle Mark Job as Seen
  const handleMarkSeen = async (jobId: string) => {
    try {
      const res = await fetch('/api/jobs/mark-seen', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [jobId] }),
      });
      const data = await res.json();
      if (data.success) {
        setJobs((prev) =>
          prev.map((j) => (j.id === jobId ? { ...j, is_new: false } : j))
        );
        setCompanies((prev) =>
          prev.map((c) => {
            const targetJob = jobs.find((j) => j.id === jobId);
            if (targetJob && targetJob.board_token === c.board_token && c.new_job_count > 0) {
              return { ...c, new_job_count: c.new_job_count - 1 };
            }
            return c;
          })
        );
      }
    } catch (err) {
      console.error('Failed to mark job as seen:', err);
    }
  };

  // Handle Mark All as Seen
  const handleMarkAllSeen = async () => {
    try {
      const res = await fetch('/api/jobs/mark-seen', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ all: true }),
      });
      const data = await res.json();
      if (data.success) {
        setJobs((prev) => prev.map((j) => ({ ...j, is_new: false })));
        setCompanies((prev) => prev.map((c) => ({ ...c, new_job_count: 0 })));
      }
    } catch (err) {
      console.error('Failed to mark all as seen:', err);
    }
  };

  // Derived Stats
  const totalJobsCount = jobs.length;
  const newJobsCount = jobs.filter((j) => j.is_new).length;
  const activeCompaniesCount = companies.filter((c) => c.active).length;

  // Filtered Jobs
  const filteredJobs = jobs.filter((job) => {
    if (selectedCompany !== 'all' && job.board_token !== selectedCompany) {
      return false;
    }
    if (filterNewOnly && !job.is_new) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = job.title.toLowerCase().includes(q);
      const matchCompany = job.company_name.toLowerCase().includes(q);
      const matchLoc = job.location.toLowerCase().includes(q);
      const matchDept = job.department.toLowerCase().includes(q);
      if (!matchTitle && !matchCompany && !matchLoc && !matchDept) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="min-h-screen pt-24 pb-32 px-4 sm:px-8 lg:px-16 dot-grid">
      <div className="max-w-[1280px] mx-auto space-y-8">
        {/* Header Title & Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 sm:p-8 rounded-2xl border border-hairline bg-surface-card shadow-lg">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-pink/10 border border-brand-pink/30 text-brand-pink text-xs font-black uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              Greenhouse API Live Integration
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-ink">
              Live Company Job Tracker
            </h1>
            <p className="text-sm sm:text-base text-muted font-medium max-w-2xl">
              Track target companies, auto-pull their public job postings from Greenhouse, and catch newly posted roles instantly.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="tactile-button px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 bg-brand-pink text-white hover:opacity-95 transition-all shadow-md"
            >
              <Plus className="w-4 h-4" />
              Track Company
            </button>

            <button
              onClick={handleRefreshAll}
              disabled={refreshing}
              className="tactile-button px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 bg-surface-strong text-ink hover:bg-hairline transition-all border border-hairline disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-brand-pink' : ''}`} />
              {refreshing ? 'Syncing...' : 'Refresh All'}
            </button>
          </div>
        </div>

        {/* Stats Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="tactile-card p-6 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-muted">Tracked Companies</p>
              <p className="text-3xl font-black text-ink mt-1">{activeCompaniesCount}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-brand-pink/10 flex items-center justify-center border border-brand-pink/20">
              <Building2 className="w-6 h-6 text-brand-pink" />
            </div>
          </div>

          <div className="tactile-card p-6 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-muted">Total Live Postings</p>
              <p className="text-3xl font-black text-ink mt-1">{totalJobsCount}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-sky-500/10 flex items-center justify-center border border-sky-500/20">
              <Briefcase className="w-6 h-6 text-sky-500" />
            </div>
          </div>

          <div className="tactile-card p-6 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-muted">New Postings Unread</p>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-3xl font-black text-brand-pink">{newJobsCount}</p>
                {newJobsCount > 0 && (
                  <span className="px-2 py-0.5 text-[10px] font-black uppercase bg-brand-pink text-white rounded-full animate-pulse">
                    NEW
                  </span>
                )}
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
              <Sparkles className="w-6 h-6 text-emerald-500" />
            </div>
          </div>
        </div>

        {/* Tracked Companies Ribbon */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black tracking-tight text-ink flex items-center gap-2">
              <Building2 className="w-5 h-5 text-brand-pink" />
              Active Tracked Boards
            </h2>
            <span className="text-xs font-bold text-muted">
              {companies.length} board{companies.length === 1 ? '' : 's'} tracked
            </span>
          </div>

          {companies.length === 0 ? (
            <div className="tactile-card p-8 rounded-2xl text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-brand-pink/10 text-brand-pink flex items-center justify-center mx-auto">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-ink">No companies tracked yet</h3>
                <p className="text-xs text-muted mt-1">
                  Add a Greenhouse board token (e.g. <code className="bg-surface-strong px-1.5 py-0.5 rounded text-brand-pink font-mono">stripe</code>) to start auto-syncing job postings.
                </p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="tactile-button px-4 py-2 rounded-xl font-bold text-xs bg-brand-pink text-white"
              >
                + Track Your First Company
              </button>
            </div>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
              <button
                onClick={() => setSelectedCompany('all')}
                className={`px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all border ${
                  selectedCompany === 'all'
                    ? 'bg-brand-pink text-white border-brand-pink shadow-md'
                    : 'bg-surface-card text-ink border-hairline hover:border-brand-pink/50'
                }`}
              >
                All Companies ({totalJobsCount})
              </button>

              {companies.map((comp) => {
                const isSelected = selectedCompany === comp.board_token;
                return (
                  <div
                    key={comp.board_token}
                    onClick={() => setSelectedCompany(comp.board_token)}
                    className={`group relative cursor-pointer px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap flex items-center gap-2 transition-all border ${
                      isSelected
                        ? 'bg-ink text-white border-ink shadow-md'
                        : 'bg-surface-card text-ink border-hairline hover:border-ink/50'
                    }`}
                  >
                    <span>{comp.display_name}</span>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                        comp.new_job_count > 0
                          ? 'bg-brand-pink text-white'
                          : isSelected
                          ? 'bg-white/20 text-white'
                          : 'bg-hairline text-muted'
                      }`}
                    >
                      {comp.job_count}
                    </span>

                    {comp.last_status === 'error' && (
                      <span title={comp.last_error_message || 'Fetch error'}>
                        <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                      </span>
                    )}

                    <button
                      onClick={(e) => handleUntrackCompany(comp.board_token, e)}
                      title="Untrack company"
                      className="opacity-0 group-hover:opacity-100 hover:text-rose-500 transition-opacity p-0.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Filter Controls & Search */}
        <div className="tactile-card p-4 sm:p-6 rounded-2xl space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative w-full sm:w-96">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="text"
                placeholder="Search job title, location, or department..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="tactile-input w-full pl-10 pr-4 py-2.5 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-pink text-ink"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink text-xs"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Filter Toggle Pills */}
            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
              <button
                onClick={() => setFilterNewOnly(!filterNewOnly)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all border ${
                  filterNewOnly
                    ? 'bg-brand-pink text-white border-brand-pink shadow'
                    : 'bg-surface-strong text-muted border-hairline hover:text-ink'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                {filterNewOnly ? 'Showing New Only' : 'Filter New Only'}
                {newJobsCount > 0 && (
                  <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                )}
              </button>

              {newJobsCount > 0 && (
                <button
                  onClick={handleMarkAllSeen}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-muted hover:text-ink transition-colors flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  Mark All Read
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Postings Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black tracking-tight text-ink flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-brand-pink" />
              Live Job Postings ({filteredJobs.length})
            </h2>
            {selectedCompany !== 'all' && (
              <button
                onClick={() => setSelectedCompany('all')}
                className="text-xs font-bold text-brand-pink hover:underline"
              >
                Clear company filter
              </button>
            )}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="tactile-card p-6 rounded-2xl space-y-3 animate-pulse">
                  <div className="h-4 bg-hairline rounded w-1/3" />
                  <div className="h-6 bg-hairline rounded w-3/4" />
                  <div className="h-4 bg-hairline rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="tactile-card p-12 rounded-2xl text-center space-y-3">
              <Layers className="w-8 h-8 text-muted mx-auto" />
              <h3 className="text-base font-bold text-ink">No job postings found</h3>
              <p className="text-xs text-muted max-w-sm mx-auto">
                {filterNewOnly
                  ? 'All new job postings have been marked as read.'
                  : 'Try adjusting your search query or tracking additional company boards.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredJobs.map((job) => (
                <div
                  key={job.id}
                  className={`tactile-card p-6 rounded-2xl space-y-4 flex flex-col justify-between relative transition-all hover:scale-[1.01] ${
                    job.is_new ? 'border-l-4 border-l-brand-pink bg-brand-pink/5' : ''
                  }`}
                >
                  <div className="space-y-2">
                    {/* Header line: company badge + NEW indicator */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2.5 py-1 rounded-lg text-xs font-black tracking-wide uppercase bg-surface-strong text-ink border border-hairline">
                        {job.company_name}
                      </span>

                      {job.is_new ? (
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-brand-pink text-white shadow-sm flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            NEW
                          </span>
                          <button
                            onClick={() => handleMarkSeen(job.id)}
                            title="Mark as seen"
                            className="text-xs text-muted hover:text-emerald-500 transition-colors"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-muted font-medium flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Seen
                        </span>
                      )}
                    </div>

                    {/* Job Title */}
                    <h3 className="text-lg font-black tracking-tight text-ink line-clamp-2">
                      {job.title}
                    </h3>

                    {/* Meta info tags */}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted font-medium pt-1">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-brand-pink" />
                        <span>{job.location}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5 text-sky-500" />
                        <span>{job.department}</span>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer Actions */}
                  <div className="pt-3 border-t border-hairline flex items-center justify-between gap-2">
                    <button
                      onClick={() => setSelectedJob(job)}
                      className="text-xs font-bold text-ink hover:text-brand-pink flex items-center gap-1 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View Description
                    </button>

                    <a
                      href={job.absolute_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="tactile-button px-3.5 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 bg-ink text-white hover:opacity-90"
                    >
                      Apply Now
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Company Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="tactile-card bg-surface-card max-w-md w-full p-6 sm:p-8 rounded-3xl space-y-6 relative border border-hairline shadow-2xl animate-fade-in">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute right-5 top-5 text-muted hover:text-ink p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <div className="w-10 h-10 rounded-xl bg-brand-pink/10 text-brand-pink flex items-center justify-center mb-3">
                <Building2 className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-black tracking-tight text-ink">Track Company Board</h2>
              <p className="text-xs text-muted">
                Enter the Greenhouse board token for the company you wish to monitor.
              </p>
            </div>

            <form onSubmit={handleAddCompany} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-ink">
                  Board Token / Slug *
                </label>
                <input
                  type="text"
                  placeholder="e.g. stripe, cloudflare, notion"
                  value={inputToken}
                  onChange={(e) => setInputToken(e.target.value.toLowerCase())}
                  required
                  className="tactile-input w-full px-4 py-2.5 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-pink text-ink"
                />
                <p className="text-[11px] text-muted">
                  The slug in boards.greenhouse.io/<span className="text-brand-pink font-bold">stripe</span>
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-ink">
                  Display Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Stripe Inc."
                  value={inputName}
                  onChange={(e) => setInputName(e.target.value)}
                  className="tactile-input w-full px-4 py-2.5 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-pink text-ink"
                />
              </div>

              {/* Quick Presets */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted">
                  Quick Sample Presets:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_COMPANIES.map((p) => (
                    <button
                      key={p.token}
                      type="button"
                      onClick={() => {
                        setInputToken(p.token);
                        setInputName(p.name);
                      }}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold bg-surface-strong text-ink hover:bg-brand-pink hover:text-white transition-colors border border-hairline"
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>

              {addError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{addError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl font-bold text-xs text-muted hover:text-ink"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={addingCompany}
                  className="tactile-button px-5 py-2.5 rounded-xl font-bold text-xs bg-brand-pink text-white hover:opacity-95 transition-all shadow disabled:opacity-50 flex items-center gap-2"
                >
                  {addingCompany && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  {addingCompany ? 'Verifying & Syncing...' : 'Add & Sync Board'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Job Description View Modal */}
      {selectedJob && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="tactile-card bg-surface-card max-w-2xl w-full max-h-[85vh] flex flex-col rounded-3xl relative border border-hairline shadow-2xl animate-fade-in overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-hairline flex items-start justify-between gap-4 bg-surface-strong">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-brand-pink text-white">
                  {selectedJob.company_name}
                </span>
                <h2 className="text-xl font-black tracking-tight text-ink mt-1">
                  {selectedJob.title}
                </h2>
                <p className="text-xs text-muted font-medium mt-1">
                  {selectedJob.location} • {selectedJob.department}
                </p>
              </div>

              <button
                onClick={() => setSelectedJob(null)}
                className="text-muted hover:text-ink p-1 rounded-lg bg-surface-card"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-4 text-sm text-ink prose prose-slate dark:prose-invert max-w-none">
              {selectedJob.content_html ? (
                <div
                  dangerouslySetInnerHTML={{ __html: selectedJob.content_html }}
                  className="job-description-html"
                />
              ) : (
                <p className="text-muted italic">No full job description provided by Greenhouse.</p>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-hairline bg-surface-strong flex items-center justify-between">
              <span className="text-xs text-muted font-mono">ID: {selectedJob.gh_id}</span>

              <a
                href={selectedJob.absolute_url}
                target="_blank"
                rel="noopener noreferrer"
                className="tactile-button px-5 py-2 rounded-xl font-bold text-xs bg-brand-pink text-white flex items-center gap-2 shadow"
              >
                Apply on Official Site
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
