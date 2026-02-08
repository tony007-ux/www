'use client';

import { useState } from 'react';

interface Flashcard {
  front: string;
  back: string;
}

interface FlashcardsProps {
  cards: Flashcard[];
}

export default function Flashcards({ cards }: FlashcardsProps) {
  const [flipped, setFlipped] = useState<Record<number, boolean>>({});
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!cards.length) return null;

  const current = cards[currentIndex];
  const isFlipped = flipped[currentIndex];

  const flip = () => {
    setFlipped((p) => ({ ...p, [currentIndex]: !p[currentIndex] }));
  };

  const next = () => {
    setCurrentIndex((i) => (i + 1) % cards.length);
  };

  const prev = () => {
    setCurrentIndex((i) => (i - 1 + cards.length) % cards.length);
  };

  return (
    <section className="section flashcards">
      <h2 className="section-title">Flashcards</h2>
      <div className="flashcards-container">
        <div
          className={`flashcard ${isFlipped ? 'flipped' : ''}`}
          onClick={flip}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') flip();
          }}
        >
          <div className="flashcard-inner">
            <div className="flashcard-front">
              <p>{current.front}</p>
              <span className="flip-hint">Click to flip</span>
            </div>
            <div className="flashcard-back">
              <p>{current.back}</p>
            </div>
          </div>
        </div>
        <div className="flashcard-nav">
          <button type="button" onClick={prev} className="nav-btn" aria-label="Previous card">
            ← Prev
          </button>
          <span className="flashcard-counter">
            {currentIndex + 1} / {cards.length}
          </span>
          <button type="button" onClick={next} className="nav-btn" aria-label="Next card">
            Next →
          </button>
        </div>
        <div className="flashcard-list">
          {cards.map((c, i) => (
            <button
              key={i}
              type="button"
              className={`flashcard-thumb ${i === currentIndex ? 'active' : ''}`}
              onClick={() => setCurrentIndex(i)}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
