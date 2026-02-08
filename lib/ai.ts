/**
 * AI Response Generation
 * Uses Groq (primary - very fast) or Hugging Face (fallback)
 * Both are FREE - no credit card required
 */

import Groq from 'groq-sdk';

const SYSTEM_PROMPT = `You are a knowledgeable, engaging information assistant - think "gossiping uncle who happens to be a brilliant professor." 
You provide thorough, accurate information in an entertaining yet educational way.
Always use up-to-date information. Be conversational but informative.

You MUST respond with ONLY a valid JSON object. No text before or after. No markdown. No code blocks.
The JSON must have exactly these keys: briefAnswer, keyPoints, overview, flashcards.

Format:
{"briefAnswer":"2-3 sentence summary","keyPoints":["Point 1","Point 2","Point 3","Point 4","Point 5"],"overview":[{"subtopic":"Section Title","content":"Detailed paragraph"},{"subtopic":"Another Section","content":"More details"}],"flashcards":[{"front":"Question or term","back":"Answer or definition"},{"front":"Another question","back":"Answer"}]}

Rules:
- briefAnswer: string, 2-3 sentences
- keyPoints: array of 4-6 strings
- overview: array of 2-4 objects, each with "subtopic" and "content" strings
- flashcards: array of 4-6 objects, each with "front" and "back" strings
- Use double quotes for all JSON strings. Escape internal quotes with \\
- Never omit keyPoints, overview, or flashcards - always include all four sections`;

export interface StructuredResponse {
  briefAnswer: string;
  keyPoints: string[];
  overview: { subtopic: string; content: string }[];
  flashcards: { front: string; back: string }[];
}

export async function generateStructuredResponse(
  query: string,
  searchContext: string
): Promise<StructuredResponse> {
  const groqKey = process.env.GROQ_API_KEY;
  const hfKey = process.env.HUGGINGFACE_API_KEY;

  const userPrompt = `Topic: "${query}"

${searchContext ? `Web search context (use to enhance accuracy):\n${searchContext}\n\n` : ''}
Provide comprehensive information. Return a single JSON object with briefAnswer, keyPoints, overview, and flashcards. No other text.`;

  // Try Groq first (fastest - 3-5 second response)
  if (groqKey) {
    try {
      const groq = new Groq({ apiKey: groqKey });
      const completion = await groq.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
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

  // Try Hugging Face
  if (hfKey) {
    return generateWithHuggingFace(userPrompt, hfKey);
  }

  // Fallback: Structure from search results when no AI available
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
          inputs: `<s>[INST] ${SYSTEM_PROMPT}\n\n${userPrompt} [/INST]`,
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

  // Extract JSON - try multiple strategies
  const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) jsonStr = codeBlockMatch[1].trim();

  const braceMatch = jsonStr.match(/\{[\s\S]*\}/);
  if (braceMatch) jsonStr = braceMatch[0];

  // Fix common LLM mistake: trailing commas before ] or }
  jsonStr = jsonStr.replace(/,\s*([}\]])/g, '$1');

  try {
    const parsed = JSON.parse(jsonStr);

    // Validate and normalize each section
    const keyPoints = Array.isArray(parsed.keyPoints)
      ? parsed.keyPoints.filter((p: unknown) => typeof p === 'string').map((p: string) => String(p).trim()).filter(Boolean)
      : [];

    const overview = Array.isArray(parsed.overview)
      ? parsed.overview
          .filter((o: unknown): o is Record<string, unknown> => o !== null && typeof o === 'object' && ('subtopic' in o || 'content' in o))
          .map((o: { subtopic?: string; content?: string }) => ({
            subtopic: String(o.subtopic ?? o.content ?? 'Section').trim(),
            content: String(o.content ?? o.subtopic ?? '').trim(),
          }))
          .filter((o: { content: string }) => o.content)
      : [];

    const flashcards = Array.isArray(parsed.flashcards)
      ? parsed.flashcards
          .filter((f: unknown): f is Record<string, unknown> => f !== null && typeof f === 'object' && ('front' in f || 'back' in f))
          .map((f: { front?: string; back?: string }) => ({
            front: String(f.front ?? f.back ?? 'Question').trim(),
            back: String(f.back ?? f.front ?? '').trim(),
          }))
          .filter((f: { front: string; back: string }) => f.front && f.back)
      : [];

    // If parsing succeeded but sections are empty, generate from briefAnswer
    const briefAnswer = String(parsed.briefAnswer ?? content.slice(0, 500) ?? 'Information retrieved.').trim();

    if (briefAnswer && keyPoints.length === 0 && overview.length === 0 && flashcards.length === 0) {
      // Fallback: split briefAnswer into key points, create minimal overview and flashcards
      const sentences = briefAnswer.split(/[.!?]+/).map((s: string) => s.trim()).filter((s: string) => s.length > 20);
      return {
        briefAnswer,
        keyPoints: sentences.slice(0, 5),
        overview: [{ subtopic: 'Summary', content: briefAnswer }],
        flashcards: sentences.slice(0, 4).map((s, i) => ({
          front: `Key point ${i + 1}`,
          back: s,
        })),
      };
    }

    return {
      briefAnswer: briefAnswer || 'Information retrieved.',
      keyPoints,
      overview: overview.length > 0 ? overview : [{ subtopic: 'Overview', content: briefAnswer }],
      flashcards,
    };
  } catch {
    // Last resort: use raw content
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

function structureFromSearchResults(query: string, searchContext: string): StructuredResponse {
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
