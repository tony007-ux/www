'use client';

import { useState, useEffect } from 'react';
import {
  getBookmarks,
  getHistory,
  getCollections,
  toggleBookmark,
  clearHistory,
  createCollection,
  addToCollection,
  type Bookmark,
  type HistoryItem,
  type Collection,
} from '@/lib/storage';

interface BookmarkHistoryPanelProps {
  currentQuery?: string;
  onSearch: (query: string) => void;
  isBookmarked: boolean;
  onBookmarkChange: () => void;
}

export default function BookmarkHistoryPanel({
  currentQuery,
  onSearch,
  isBookmarked,
  onBookmarkChange,
}: BookmarkHistoryPanelProps) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<'history' | 'bookmarks' | 'collections'>('history');
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [newCollectionName, setNewCollectionName] = useState('');

  const refresh = () => {
    setBookmarks(getBookmarks());
    setHistory(getHistory());
    setCollections(getCollections());
  };

  useEffect(() => {
    refresh();
  }, [open, isBookmarked]);

  const handleBookmark = () => {
    if (!currentQuery) return;
    toggleBookmark(currentQuery);
    onBookmarkChange();
    refresh();
  };

  const handleClearHistory = () => {
    clearHistory();
    refresh();
  };

  const handleCreateCollection = () => {
    const name = newCollectionName.trim();
    if (!name) return;
    createCollection(name);
    setNewCollectionName('');
    refresh();
  };

  const handleAddToCollection = (collectionId: string) => {
    if (!currentQuery) return;
    addToCollection(collectionId, currentQuery);
    refresh();
  };

  return (
    <div className="bookmark-history-panel">
      <div className="bh-header">
        <button
          type="button"
          className={`bookmark-btn ${isBookmarked ? 'active' : ''}`}
          onClick={handleBookmark}
          disabled={!currentQuery}
          title={isBookmarked ? 'Remove bookmark' : 'Bookmark'}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
          </svg>
        </button>
        <button
          type="button"
          className="panel-toggle"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 12h18M3 6h18M3 18h18" />
          </svg>
          Saved & History
        </button>
      </div>

      {open && (
        <div className="bh-dropdown">
          <div className="bh-tabs">
            <button
              type="button"
              className={tab === 'history' ? 'active' : ''}
              onClick={() => setTab('history')}
            >
              History
            </button>
            <button
              type="button"
              className={tab === 'bookmarks' ? 'active' : ''}
              onClick={() => setTab('bookmarks')}
            >
              Bookmarks
            </button>
            <button
              type="button"
              className={tab === 'collections' ? 'active' : ''}
              onClick={() => setTab('collections')}
            >
              Collections
            </button>
          </div>

          <div className="bh-content">
            {tab === 'history' && (
              <>
                {history.length > 0 && (
                  <button type="button" className="bh-clear" onClick={handleClearHistory}>
                    Clear history
                  </button>
                )}
                {history.length === 0 ? (
                  <p className="bh-empty">No search history yet</p>
                ) : (
                  <ul className="bh-list">
                    {history.map((h, i) => (
                      <li key={i}>
                        <button type="button" onClick={() => { onSearch(h.query); setOpen(false); }}>
                          {h.query}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}

            {tab === 'bookmarks' && (
              <>
                {bookmarks.length === 0 ? (
                  <p className="bh-empty">No bookmarks yet</p>
                ) : (
                  <ul className="bh-list">
                    {bookmarks.map((b, i) => (
                      <li key={i}>
                        <button type="button" onClick={() => { onSearch(b.query); setOpen(false); }}>
                          {b.query}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}

            {tab === 'collections' && (
              <>
                <div className="bh-new-collection">
                  <input
                    type="text"
                    placeholder="New collection name"
                    value={newCollectionName}
                    onChange={(e) => setNewCollectionName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateCollection()}
                  />
                  <button type="button" onClick={handleCreateCollection}>
                    Create
                  </button>
                </div>
                {collections.length === 0 ? (
                  <p className="bh-empty">No collections yet</p>
                ) : (
                  <ul className="bh-collections">
                    {collections.map((c) => (
                      <li key={c.id} className="bh-collection">
                        <strong>{c.name}</strong>
                        <div className="bh-collection-queries">
                          {c.queries.slice(0, 5).map((q, j) => (
                            <button
                              key={j}
                              type="button"
                              onClick={() => { onSearch(q); setOpen(false); }}
                            >
                              {q}
                            </button>
                          ))}
                          {c.queries.length > 5 && <span>+{c.queries.length - 5} more</span>}
                        </div>
                        {currentQuery && (
                          <button
                            type="button"
                            className="bh-add-to"
                            onClick={() => handleAddToCollection(c.id)}
                          >
                            + Add current
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
