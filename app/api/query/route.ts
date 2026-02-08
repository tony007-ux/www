/**
 * Main API route - orchestrates search, AI, and images
 * Runs in parallel for speed (3-5 second target)
 */

import { searchWeb, formatSearchContext, type SearchResult } from '@/lib/search';
import { generateStructuredResponse, type StructuredResponse } from '@/lib/ai';
import { searchImages, type PexelsImage } from '@/lib/images';

export interface QueryResponse {
  query: string;
  briefAnswer: string;
  keyPoints: string[];
  overview: { subtopic: string; content: string }[];
  flashcards: { front: string; back: string }[];
  images: PexelsImage[];
  resources: SearchResult[];
}

export async function POST(request: Request) {
  try {
    const { query } = await request.json();
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
    const aiResponse: StructuredResponse = await generateStructuredResponse(
      trimmedQuery,
      searchContext
    );

    const response: QueryResponse = {
      query: trimmedQuery,
      briefAnswer: aiResponse.briefAnswer,
      keyPoints: aiResponse.keyPoints,
      overview: aiResponse.overview,
      flashcards: aiResponse.flashcards,
      images,
      resources: searchResults.slice(0, 8),
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
