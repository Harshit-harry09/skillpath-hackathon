// updated
/**
 * Local history manager — saves analysis results to localStorage
 * so users can revisit past analyses without authentication.
 */

const STORAGE_KEY = 'skillpath_history';

export interface HistoryEntry {
  type?: 'analyze' | 'explore';
  share_token: string;
  gap_score?: number;
  weeks_required: number;
  company_type: string;
  mvc_skills: string[];
  created_at: string;
  /** First 80 chars of the JD for preview or Job Title for explore */
  jd_preview: string;
  resume_text?: string;
}

export function getHistory(): HistoryEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as HistoryEntry[];
  } catch {
    return [];
  }
}

export function saveToHistory(entry: HistoryEntry): void {
  if (typeof window === 'undefined') return;
  try {
    const history = getHistory();
    // Avoid duplicates
    const exists = history.some((h) => h.share_token === entry.share_token);
    if (exists) return;
    // Add to front (newest first), cap at 50
    history.unshift(entry);
    if (history.length > 50) history.pop();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch {
    // localStorage might be full or blocked
  }
}

export function removeFromHistory(shareToken: string): void {
  if (typeof window === 'undefined') return;
  try {
    const history = getHistory().filter((h) => h.share_token !== shareToken);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch {
    // ignore
  }
}

export function clearHistory(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
