'use client';

interface Resource {
  title: string;
  url: string;
  snippet?: string;
}

interface ResourcesProps {
  resources: Resource[];
}

export default function Resources({ resources }: ResourcesProps) {
  if (!resources.length) return null;

  return (
    <section className="section resources">
      <h2 className="section-title">Sources & Resources</h2>
      <ul className="resources-list">
        {resources.map((r, i) => (
          <li key={i} className="resource-item">
            <a href={r.url} target="_blank" rel="noopener noreferrer" className="resource-link">
              {r.title}
            </a>
            {r.snippet && <p className="resource-snippet">{r.snippet}</p>}
          </li>
        ))}
      </ul>
    </section>
  );
}
