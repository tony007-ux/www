'use client';

interface BriefAnswerProps {
  content: string;
  query: string;
}

export default function BriefAnswer({ content, query }: BriefAnswerProps) {
  return (
    <section className="section brief-answer">
      <h2 className="section-title">Brief Answer</h2>
      <p className="brief-content">{content}</p>
    </section>
  );
}
