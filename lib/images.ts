/**
 * Pexels API - Free image search
 * 200 requests/hour, 20,000/month on free tier
 * No credit card required
 */

export interface PexelsImage {
  id: number;
  url: string;
  src: {
    original: string;
    large2x: string;
    large: string;
    medium: string;
    small: string;
  };
  alt: string;
  photographer: string;
  photographer_url: string;
}

export async function searchImages(query: string, count: number = 6): Promise<PexelsImage[]> {
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) return [];

  try {
    const response = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${count}`,
      {
        headers: {
          Authorization: apiKey,
        },
      }
    );

    if (!response.ok) return [];

    const data = await response.json();
    return (data.photos || []).map((p: Record<string, unknown>) => ({
      id: p.id,
      url: p.url,
      src: p.src,
      alt: p.alt || query,
      photographer: p.photographer,
      photographer_url: p.photographer_url,
    }));
  } catch (error) {
    console.error('Pexels API error:', error);
    return [];
  }
}
