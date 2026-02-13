/**
 * Main API route - orchestrates search, AI, and images
 * Runs in parallel for speed (3-5 second target)
 */

import { searchWeb, formatSearchContext, type SearchResult } from '@/lib/search';
import { generateStructuredResponse, type StructuredResponse, type DifficultyLevel } from '@/lib/ai';
import { searchImages, type PexelsImage } from '@/lib/images';

function hasContent(r: StructuredResponse): boolean {
  return !!(
    (r.briefAnswer && r.briefAnswer.length > 10) ||
    (r.keyPoints && r.keyPoints.length > 0) ||
    (r.overview && r.overview.length > 0 && r.overview.some((o) => o.content?.length > 0)) ||
    (r.flashcards && r.flashcards.length > 0)
  );
}

export interface QueryResponse {
  query: string;
  briefAnswer: string;
  keyPoints: string[];
  overview: { subtopic: string; content: string }[];
  flashcards: { front: string; back: string }[];
  images: PexelsImage[];
  resources: SearchResult[];
  timeline?: { date: string; title: string; description: string }[];
  didYouKnow?: string[];
  mindMap?: { nodes: { id: string; label: string }[]; connections: { from: string; to: string }[] };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const query = body?.query;
    const difficulty: DifficultyLevel = ['simple', 'medium', 'advanced'].includes(body?.difficulty)
      ? body.difficulty
      : 'medium';

    if (!query || typeof query !== 'string') {
      return Response.json({ error: 'Query is required' }, { status: 400 });
    }

    const trimmedQuery = query.trim().slice(0, 200);
    if (!trimmedQuery) {
      return Response.json({ error: 'Query cannot be empty' }, { status: 400 });
    }

    // Run search and image fetch in parallel (no AI dependency)
    const [searchResults, images] = await Promise.all([
      searchWeb(trimmedQuery),
      searchImages(trimmedQuery),
    ]);

    const searchContext = formatSearchContext(searchResults);

    // AI generation (uses search context for accuracy)
    let aiResponse: StructuredResponse = await generateStructuredResponse(
      trimmedQuery,
      searchContext,
      difficulty
    );

    // Fallback: if AI returns empty content, use structured search results
    if (!hasContent(aiResponse)) {
      const { structureFromSearchResults } = await import('@/lib/ai');
      aiResponse = structureFromSearchResults(trimmedQuery, searchContext);
    }

    const response: QueryResponse = {
      query: trimmedQuery,
      briefAnswer: aiResponse.briefAnswer,
      keyPoints: aiResponse.keyPoints,
      overview: aiResponse.overview,
      flashcards: aiResponse.flashcards,
      images,
      resources: searchResults.slice(0, 8),
      timeline: aiResponse.timeline,
      didYouKnow: aiResponse.didYouKnow,
      mindMap: aiResponse.mindMap,
    };

    return Response.json(response);
  } catch (error) {
    console.error('Query API error:', error);
    return Response.json(
      { error: 'Failed to process query. Please try again.' },
      { status: 500 }
    );
  }
}
