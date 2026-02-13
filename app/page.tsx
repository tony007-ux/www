'use client';

import { useState, useCallback, useEffect } from 'react';
import SearchBar from '@/components/SearchBar';
import BriefAnswer from '@/components/BriefAnswer';
import KeyPoints from '@/components/KeyPoints';
import Overview from '@/components/Overview';
import ImageGallery from '@/components/ImageGallery';
import Flashcards from '@/components/Flashcards';
import Resources from '@/components/Resources';
import Timeline from '@/components/Timeline';
import DidYouKnow from '@/components/DidYouKnow';
import MindMap from '@/components/MindMap';
import ThemeToggle from '@/components/ThemeToggle';
import DifficultySelector from '@/components/DifficultySelector';
import BookmarkHistoryPanel from '@/components/BookmarkHistoryPanel';
import StudyPlanner from '@/components/StudyPlanner';
import { generatePDF } from '@/lib/pdf';
import { addToHistory, isBookmarked, recordStudySession } from '@/lib/storage';
import type { DifficultyLevel } from '@/lib/ai';

interface QueryResponse {
  query: string;
  briefAnswer: string;
  keyPoints: string[];
  overview: { subtopic: string; content: string }[];
  flashcards: { front: string; back: string }[];
  images: Array<{
    id: number;
    url: string;
    src: { original: string; large: string; medium: string; small: string };
    alt: string;
    photographer: string;
    photographer_url: string;
  }>;
  resources: Array<{ title: string; url: string; snippet?: string }>;
  timeline?: { date: string; title: string; description: string }[];
  didYouKnow?: string[];
  mindMap?: { nodes: { id: string; label: string }[]; connections: { from: string; to: string }[] };
}

export default function Home() {
  const [data, setData] = useState<QueryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('medium');
  const [bookmarked, setBookmarked] = useState(false);

  const handleSearch = useCallback(async (query: string) => {
    setLoading(true);
    setError(null);
    setData(null);

    try {
      const res = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, difficulty }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Request failed');
      setData(json);
      addToHistory(query);
      recordStudySession();
      setBookmarked(isBookmarked(query));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [difficulty]);

  useEffect(() => {
    if (data) setBookmarked(isBookmarked(data.query));
  }, [data]);

  const handleDownloadPDF = useCallback(async () => {
    if (!data) return;
    setPdfLoading(true);
    try {
      const blob = await generatePDF({
        query: data.query,
        briefAnswer: data.briefAnswer,
        keyPoints: data.keyPoints,
        overview: data.overview,
        flashcards: data.flashcards,
        resources: data.resources.map((r) => ({ title: r.title, url: r.url })),
        timeline: data.timeline,
        didYouKnow: data.didYouKnow,
        mindMap: data.mindMap,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `info-quest-${data.query.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PDF error:', err);
    } finally {
      setPdfLoading(false);
    }
  }, [data]);

  return (
    <main className="main">
      <header className="header">
        <div className="header-top">
          <h1 className="logo">Info Quest</h1>
          <div className="header-actions">
            <ThemeToggle />
            <BookmarkHistoryPanel
              currentQuery={data?.query}
              onSearch={handleSearch}
              isBookmarked={bookmarked}
              onBookmarkChange={() => setBookmarked(isBookmarked(data?.query ?? ''))}
            />
          </div>
        </div>
        <p className="tagline">AI-powered information retrieval — your gossipy uncle meets personal tutor</p>
        <DifficultySelector value={difficulty} onChange={setDifficulty} disabled={loading} />
        <SearchBar onSearch={handleSearch} isLoading={loading} />
      </header>

      {loading && (
        <div className="loading-overlay">
          <div className="loading-content">
            <div className="loading-spinner" />
            <p>Searching the web & generating your answer...</p>
            <span className="loading-time">Typically 3–5 seconds</span>
          </div>
        </div>
      )}

      {error && (
        <div className="error-banner">
          <p>{error}</p>
        </div>
      )}

      {data && !loading && (
        <div className="results">
          <div className="results-header">
            <h2 className="results-query">{data.query}</h2>
            <button
              type="button"
              className="download-btn"
              onClick={handleDownloadPDF}
              disabled={pdfLoading}
            >
              {pdfLoading ? (
                <>
                  <span className="btn-spinner" />
                  Generating PDF...
                </>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Download PDF
                </>
              )}
            </button>
          </div>

          <div className="results-grid">
            <div className="results-col results-main">
              <BriefAnswer content={data.briefAnswer} query={data.query} />
              <KeyPoints points={data.keyPoints} />
              <Overview sections={data.overview} />
              {data.timeline && data.timeline.length > 0 && <Timeline items={data.timeline} />}
              {data.didYouKnow && data.didYouKnow.length > 0 && <DidYouKnow facts={data.didYouKnow} />}
            </div>
            <div className="results-col results-side">
              <ImageGallery images={data.images} query={data.query} />
              <Flashcards cards={data.flashcards} />
              {data.mindMap && data.mindMap.nodes.length > 0 && (
                <MindMap nodes={data.mindMap.nodes} connections={data.mindMap.connections} />
              )}
              <Resources resources={data.resources} />
              <StudyPlanner currentTopic={data.query} />
            </div>
          </div>
        </div>
      )}

      {!data && !loading && !error && (
        <div className="empty-state">
          <p>Type any topic above and hit Enter</p>
          <p className="empty-examples">e.g. &quot;Machu Picchu&quot;, &quot;Photosynthesis&quot;, &quot;Marie Curie&quot;</p>
          <StudyPlanner />
        </div>
      )}
    </main>
  );
}
