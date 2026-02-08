'use client';

interface KeyPointsProps {
  points: string[];
}

export default function KeyPoints({ points }: KeyPointsProps) {
  if (!points.length) return null;

  return (
    <section className="section key-points">
      <h2 className="section-title">Key Points</h2>
      <ul className="points-list">
        {points.map((point, i) => (
          <li key={i} className="point-item">
            {point}
          </li>
        ))}
      </ul>
    </section>
  );
}
