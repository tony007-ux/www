/**
 * localStorage utilities for bookmarks, history, collections, theme, and study planner
 * All operations are synchronous and lightweight for performance
 */

const KEYS = {
  THEME: 'infoquest-theme',
  BOOKMARKS: 'infoquest-bookmarks',
  HISTORY: 'infoquest-history',
  COLLECTIONS: 'infoquest-collections',
  STUDY: 'infoquest-study',
} as const;

const MAX_HISTORY = 50;
const MAX_BOOKMARKS = 100;

// --- Theme ---
export type Theme = 'dark' | 'light';

export function getTheme(): Theme {
  if (typeof window === 'undefined') return 'dark';
  const t = localStorage.getItem(KEYS.THEME);
  return t === 'light' ? 'light' : 'dark';
}

export function setTheme(theme: Theme): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEYS.THEME, theme);
  document.documentElement.setAttribute('data-theme', theme);
}

// --- History ---
export interface HistoryItem {
  query: string;
  timestamp: number;
}

export function getHistory(): HistoryItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KEYS.HISTORY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr.slice(0, MAX_HISTORY) : [];
  } catch {
    return [];
  }
}

export function addToHistory(query: string): void {
  if (typeof window === 'undefined' || !query?.trim()) return;
  const list = getHistory().filter((h) => h.query.toLowerCase() !== query.trim().toLowerCase());
  list.unshift({ query: query.trim(), timestamp: Date.now() });
  localStorage.setItem(KEYS.HISTORY, JSON.stringify(list.slice(0, MAX_HISTORY)));
}

export function clearHistory(): void {
  localStorage.removeItem(KEYS.HISTORY);
}

// --- Bookmarks ---
export interface Bookmark {
  query: string;
  timestamp: number;
}

export function getBookmarks(): Bookmark[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KEYS.BOOKMARKS);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function isBookmarked(query: string): boolean {
  return getBookmarks().some((b) => b.query.toLowerCase() === query.trim().toLowerCase());
}

export function toggleBookmark(query: string): boolean {
  if (typeof window === 'undefined' || !query?.trim()) return false;
  const list = getBookmarks();
  const idx = list.findIndex((b) => b.query.toLowerCase() === query.trim().toLowerCase());
  if (idx >= 0) {
    list.splice(idx, 1);
    localStorage.setItem(KEYS.BOOKMARKS, JSON.stringify(list));
    return false;
  }
  list.unshift({ query: query.trim(), timestamp: Date.now() });
  localStorage.setItem(KEYS.BOOKMARKS, JSON.stringify(list.slice(0, MAX_BOOKMARKS)));
  return true;
}

// --- Collections ---
export interface Collection {
  id: string;
  name: string;
  queries: string[];
  createdAt: number;
}

export function getCollections(): Collection[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KEYS.COLLECTIONS);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function addToCollection(collectionId: string, query: string): void {
  const list = getCollections();
  const col = list.find((c) => c.id === collectionId);
  if (!col || !query?.trim()) return;
  if (!col.queries.includes(query.trim())) {
    col.queries.push(query.trim());
    localStorage.setItem(KEYS.COLLECTIONS, JSON.stringify(list));
  }
}

export function createCollection(name: string): Collection {
  const list = getCollections();
  const id = 'c' + Date.now();
  const col: Collection = { id, name, queries: [], createdAt: Date.now() };
  list.push(col);
  localStorage.setItem(KEYS.COLLECTIONS, JSON.stringify(list));
  return col;
}

export function removeFromCollection(collectionId: string, query: string): void {
  const list = getCollections();
  const col = list.find((c) => c.id === collectionId);
  if (!col) return;
  col.queries = col.queries.filter((q) => q !== query);
  localStorage.setItem(KEYS.COLLECTIONS, JSON.stringify(list));
}

// --- Study Planner ---
export interface StudyData {
  streak: number;
  lastStudyDate: string; // YYYY-MM-DD
  goals: { topic: string; completed: boolean }[];
  badges: string[];
}

export const DEFAULT_STUDY: StudyData = { streak: 0, lastStudyDate: '', goals: [], badges: [] };

export function getStudyData(): StudyData {
  if (typeof window === 'undefined') return DEFAULT_STUDY;
  try {
    const raw = localStorage.getItem(KEYS.STUDY);
    const data = raw ? JSON.parse(raw) : DEFAULT_STUDY;
    return { ...DEFAULT_STUDY, ...data };
  } catch {
    return DEFAULT_STUDY;
  }
}

export function recordStudySession(): void {
  const data = getStudyData();
  const today = new Date().toISOString().slice(0, 10);
  const last = data.lastStudyDate;
  let streak = data.streak;
  if (last === today) return; // already recorded today
  const yesterday = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
  if (last === yesterday) streak += 1;
  else if (last && last !== today) streak = 1;
  else streak = 1;
  const badges = [...(data.badges || [])];
  if (streak >= 7 && !badges.includes('week')) badges.push('week');
  if (streak >= 30 && !badges.includes('month')) badges.push('month');
  const updated = { ...data, streak, lastStudyDate: today, badges };
  localStorage.setItem(KEYS.STUDY, JSON.stringify(updated));
}

export function addStudyGoal(topic: string): void {
  const data = getStudyData();
  const goals = [...(data.goals || [])];
  if (!goals.some((g) => g.topic === topic)) goals.push({ topic, completed: false });
  localStorage.setItem(KEYS.STUDY, JSON.stringify({ ...data, goals }));
}

export function toggleGoalComplete(topic: string): void {
  const data = getStudyData();
  const goals = (data.goals || []).map((g) =>
    g.topic === topic ? { ...g, completed: !g.completed } : g
  );
  localStorage.setItem(KEYS.STUDY, JSON.stringify({ ...data, goals }));
}
