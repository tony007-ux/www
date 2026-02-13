'use client';

interface TimelineItem {
  date: string;
  title: string;
  description: string;
}

interface TimelineProps {
  items: TimelineItem[];
}

export default function Timeline({ items }: TimelineProps) {
  if (!items.length) return null;

  return (
    <section className="section timeline-section">
      <h2 className="section-title">Timeline</h2>
      <div className="timeline">
        {items.map((item, i) => (
          <div key={i} className="timeline-item">
            <div className="timeline-marker" />
            <div className="timeline-content">
              <span className="timeline-date">{item.date}</span>
              <h3 className="timeline-title">{item.title}</h3>
              {item.description && <p className="timeline-desc">{item.description}</p>}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
