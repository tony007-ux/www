/**
 * AI Response Generation
 * Uses Groq (primary - very fast) or Hugging Face (fallback)
 * Both are FREE - no credit card required
 */

import Groq from 'groq-sdk';

const BASE_SYSTEM = `You are a knowledgeable, engaging information assistant. Provide accurate, comprehensive information.
You MUST respond with ONLY a valid JSON object. No text before or after. No markdown code blocks.
Required keys: briefAnswer (string), keyPoints (array of strings), overview (array of {subtopic, content}), flashcards (array of {front, back}).`;

export type DifficultyLevel = 'simple' | 'medium' | 'advanced';

const DIFFICULTY_HINTS: Record<DifficultyLevel, string> = {
  simple: 'Use very simple language. Explain like to a curious 10-year-old. Short sentences. Avoid jargon.',
  medium: 'Use clear, accessible language. Suitable for general adult audience.',
  advanced: 'Use precise terminology. Include technical details and nuances. Suitable for experts.',
};

export interface TimelineItem {
  date: string;
  title: string;
  description: string;
}

export interface MindMapNode {
  id: string;
  label: string;
}

export interface StructuredResponse {
  briefAnswer: string;
  keyPoints: string[];
  overview: { subtopic: string; content: string }[];
  flashcards: { front: string; back: string }[];
  timeline?: TimelineItem[];
  didYouKnow?: string[];
  mindMap?: { nodes: MindMapNode[]; connections: { from: string; to: string }[] };
}

export async function generateStructuredResponse(
  query: string,
  searchContext: string,
  difficulty: DifficultyLevel = 'medium'
): Promise<StructuredResponse> {
  const groqKey = process.env.GROQ_API_KEY;
  const hfKey = process.env.HUGGINGFACE_API_KEY;
  const diffHint = DIFFICULTY_HINTS[difficulty];

  const userPrompt = `Topic: "${query}"
${diffHint}

${searchContext ? `Web context:\n${searchContext}\n` : ''}
Return a JSON object with these exact keys:
- briefAnswer: 2-3 sentence summary (required)
- keyPoints: array of 4-6 strings
- overview: array of objects with "subtopic" and "content"
- flashcards: array of objects with "front" and "back"
- timeline: REQUIRED for historical topics, people, events, wars, revolutions, inventions, or anything with dates. Array of 4-8 objects: {"date":"YYYY or YYYY-MM","title":"Event name","description":"Brief detail"}. Include key milestones in chronological order. If not applicable, use [].
- didYouKnow: 3-5 fun facts (array of strings)
- mindMap: {"nodes":[{"id":"1","label":"Concept"}],"connections":[{"from":"1","to":"2"}]} - 5-8 nodes, 4-8 connections

Return ONLY valid JSON.`;

  if (groqKey) {
    try {
      const groq = new Groq({ apiKey: groqKey });
      const completion = await groq.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: BASE_SYSTEM },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.5,
        max_tokens: 2048,
        response_format: { type: 'json_object' },
      });

      const content = completion.choices[0]?.message?.content || '';
      return parseAIResponse(content);
    } catch (error) {
      console.error('Groq error:', error);
      if (hfKey) {
        return generateWithHuggingFace(userPrompt, hfKey);
      }
    }
  }

  if (hfKey) {
    return generateWithHuggingFace(userPrompt, hfKey);
  }

  return structureFromSearchResults(query, searchContext);
}

async function generateWithHuggingFace(userPrompt: string, apiKey: string): Promise<StructuredResponse> {
  try {
    const response = await fetch(
      'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: `<s>[INST] ${BASE_SYSTEM}\n\n${userPrompt} [/INST]`,
          parameters: {
            max_new_tokens: 2048,
            temperature: 0.7,
            return_full_text: false,
          },
        }),
      }
    );

    const data = await response.json();
    const content = Array.isArray(data) ? data[0]?.generated_text : data?.generated_text || '';
    return parseAIResponse(content);
  } catch (error) {
    console.error('Hugging Face error:', error);
    throw new Error('AI service unavailable');
  }
}

function parseAIResponse(content: string): StructuredResponse {
  let jsonStr = content.trim();

  const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) jsonStr = codeBlockMatch[1].trim();

  const braceMatch = jsonStr.match(/\{[\s\S]*\}/);
  if (braceMatch) jsonStr = braceMatch[0];

  jsonStr = jsonStr.replace(/,\s*([}\]])/g, '$1');

  try {
    const parsed = JSON.parse(jsonStr);

    const p = (k: string) => parsed[k] ?? parsed[k.replace(/([A-Z])/g, '_$1').toLowerCase()];

    const briefAnswer = String(p('briefAnswer') ?? p('brief_answer') ?? content.slice(0, 600) ?? 'Information retrieved.').trim();

    const keyPoints = Array.isArray(p('keyPoints'))
      ? (p('keyPoints') as unknown[]).filter((x: unknown) => typeof x === 'string').map((x: string) => String(x).trim()).filter(Boolean)
      : [];

    const overviewRaw = p('overview');
    const overview = Array.isArray(overviewRaw)
      ? (overviewRaw as unknown[])
          .filter((o: unknown): o is Record<string, unknown> => o !== null && typeof o === 'object')
          .map((o: Record<string, unknown>) => {
            const sub = String(o.subtopic ?? o.title ?? o.section ?? o.name ?? 'Section').trim();
            const cont = String(o.content ?? o.description ?? o.text ?? o.body ?? sub ?? '').trim();
            return { subtopic: sub || 'Section', content: cont };
          })
          .filter((o) => o.content || o.subtopic)
      : [];

    const flashcardsRaw = p('flashcards');
    const flashcards = Array.isArray(flashcardsRaw)
      ? (flashcardsRaw as unknown[])
          .filter((f: unknown): f is Record<string, unknown> => f !== null && typeof f === 'object')
          .map((f: Record<string, unknown>) => ({
            front: String(f.front ?? f.question ?? f.term ?? f.back ?? 'Question').trim(),
            back: String(f.back ?? f.answer ?? f.definition ?? f.front ?? '').trim(),
          }))
          .filter((f) => f.front && f.back)
      : [];

    if (keyPoints.length === 0 && overview.length === 0 && flashcards.length === 0) {
      const text = briefAnswer || content.slice(0, 600);
      const sentences = text.split(/[.!?]+/).map((s: string) => s.trim()).filter((s: string) => s.length > 15);
      return {
        briefAnswer: text || 'Information retrieved.',
        keyPoints: sentences.slice(0, 5),
        overview: [{ subtopic: 'Summary', content: text }],
        flashcards: sentences.slice(0, 4).map((s, i) => ({ front: `Key point ${i + 1}`, back: s })),
      };
    }

    const timeline = Array.isArray(parsed.timeline)
      ? parsed.timeline
          .filter((t: unknown): t is Record<string, unknown> => t !== null && typeof t === 'object')
          .map((t: { date?: string; title?: string; description?: string }) => ({
            date: String(t.date ?? ''),
            title: String(t.title ?? ''),
            description: String(t.description ?? ''),
          }))
          .filter((t: { date: string; title: string }) => t.date || t.title)
      : [];

    const didYouKnow = Array.isArray(parsed.didYouKnow)
      ? parsed.didYouKnow.filter((x: unknown) => typeof x === 'string').map((x: string) => String(x).trim()).filter(Boolean)
      : [];

    let mindMap: StructuredResponse['mindMap'];
    if (parsed.mindMap && typeof parsed.mindMap === 'object') {
      const m = parsed.mindMap as Record<string, unknown>;
      const nodes = Array.isArray(m.nodes)
        ? (m.nodes as Array<{ id?: string; label?: string }>)
            .filter((n) => n && typeof n === 'object')
            .map((n) => ({ id: String(n.id ?? ''), label: String(n.label ?? '') }))
            .filter((n) => n.id || n.label)
        : [];
      const connections = Array.isArray(m.connections)
        ? (m.connections as Array<{ from?: string; to?: string }>)
            .filter((c) => c && typeof c === 'object')
            .map((c) => ({ from: String(c.from ?? ''), to: String(c.to ?? '') }))
            .filter((c) => c.from && c.to)
        : [];
      if (nodes.length > 0) mindMap = { nodes, connections };
    }

    return {
      briefAnswer: briefAnswer || content.slice(0, 500) || 'Information retrieved.',
      keyPoints: keyPoints.length > 0 ? keyPoints : [briefAnswer].filter(Boolean),
      overview: overview.length > 0 ? overview : [{ subtopic: 'Overview', content: briefAnswer }],
      flashcards,
      timeline: timeline.length > 0 ? timeline : undefined,
      didYouKnow: didYouKnow.length > 0 ? didYouKnow : undefined,
      mindMap,
    };
  } catch {
    const fallback = content.slice(0, 500) || 'Could not parse AI response.';
    const sentences = fallback.split(/[.!?]+/).map((s) => s.trim()).filter((s) => s.length > 15);
    return {
      briefAnswer: fallback,
      keyPoints: sentences.slice(0, 5),
      overview: [{ subtopic: 'Summary', content: fallback }],
      flashcards: sentences.slice(0, 4).map((s, i) => ({ front: `Point ${i + 1}`, back: s })),
    };
  }
}

export function structureFromSearchResults(query: string, searchContext: string): StructuredResponse {
  const lines = searchContext.split('\n').filter(Boolean);
  const snippets = lines
    .map((l) => l.replace(/^\d+\.\s*/, '').split('\n')[0])
    .filter(Boolean)
    .slice(0, 6);

  return {
    briefAnswer: `Here's what we found about "${query}" from web search. For richer AI-generated responses, add a free Groq API key (console.groq.com) to your .env file.`,
    keyPoints: snippets.slice(0, 5),
    overview: [
      {
        subtopic: 'Search Results',
        content: snippets.join('\n\n') || 'No results found. Try a different search query.',
      },
    ],
    flashcards: snippets.slice(0, 4).map((s, i) => ({
      front: `Key point ${i + 1}`,
      back: s,
    })),
  };
}
