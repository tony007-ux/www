'use client';

interface DidYouKnowProps {
  facts: string[];
}

export default function DidYouKnow({ facts }: DidYouKnowProps) {
  if (!facts.length) return null;

  return (
    <section className="section did-you-know">
      <h2 className="section-title">Did You Know?</h2>
      <ul className="dyk-list">
        {facts.map((fact, i) => (
          <li key={i} className="dyk-item">
            <span className="dyk-bullet">✦</span>
            {fact}
          </li>
        ))}
      </ul>
    </section>
  );
}
