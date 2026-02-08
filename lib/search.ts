/**
 * DuckDuckGo Search - No API key required
 * Uses duck-duck-scrape package for real-time web search
 */

import { search as ddgSearch, SafeSearchType } from 'duck-duck-scrape';

export interface SearchResult {
  title: string;
  url: string;
  snippet?: string;
}

export async function searchWeb(query: string): Promise<SearchResult[]> {
  try {
    const results = await ddgSearch(query, {
      safeSearch: SafeSearchType.MODERATE,
    });

    return (results.results || []).map((r) => ({
      title: r.title || 'Untitled',
      url: r.url || '#',
      snippet: r.description || '',
    }));
  } catch (error) {
    console.error('Search error:', error);
    return [];
  }
}

/**
 * Format search results into context for AI
 */
export function formatSearchContext(results: SearchResult[]): string {
  return results
    .slice(0, 10)
    .map((r, i) => `${i + 1}. ${r.title}\n   URL: ${r.url}\n   ${r.snippet || ''}`)
    .join('\n\n');
}
