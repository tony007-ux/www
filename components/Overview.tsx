'use client';

interface OverviewSection {
  subtopic: string;
  content: string;
}

interface OverviewProps {
  sections: OverviewSection[];
}

export default function Overview({ sections }: OverviewProps) {
  if (!sections.length) return null;

  return (
    <section className="section overview">
      <h2 className="section-title">Overview</h2>
      <div className="overview-sections">
        {sections.map((s, i) => (
          <div key={i} className="overview-block">
            <h3 className="overview-subtopic">{s.subtopic}</h3>
            <p className="overview-content">{s.content}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
