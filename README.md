# Info Quest — AI-Powered Information Retrieval

A comprehensive web app that provides detailed information on any topic. Combines real-time web search with AI to deliver structured answers, key points, overviews, images, flashcards, and sources—all in 3–5 seconds.

## Features

- **Brief Answer** — Concise summary at the top
- **Key Points** — Bullet list of important information
- **Overview** — Detailed explanation organized by subtopics
- **Images** — Relevant photos from Pexels (lazy-loaded)
- **Flashcards** — Interactive flip cards for quick review
- **Resources** — Links to sources
- **PDF Download** — Single button to export everything as one PDF

## Tech Stack (100% Free APIs)

| Service   | Purpose    | API Key Required |
|----------|------------|------------------|
| DuckDuckGo | Web search | No               |
| Groq     | AI (primary) | Yes (free at console.groq.com) |
| Hugging Face | AI (fallback) | Yes (free at huggingface.co) |
| Pexels   | Images     | Yes (free at pexels.com/api) |

## Setup

1. Clone and install:

```bash
npm install
```

2. Copy `.env.example` to `.env.local` and add your API keys:

```bash
cp .env.example .env.local
```

3. Get free API keys (no credit card):

- **Groq** (recommended): https://console.groq.com — fastest responses
- **Hugging Face**: https://huggingface.co/settings/tokens — fallback AI
- **Pexels**: https://www.pexels.com/api/ — images

4. Run the app:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## API Keys (All Free)

- **GROQ_API_KEY** — Primary AI provider. Free tier, very fast.
- **HUGGINGFACE_API_KEY** — Fallback AI if Groq fails.
- **PEXELS_API_KEY** — Image search. 200 req/hr free.

The app works with only Groq + Pexels. DuckDuckGo search requires no key. If no AI key is set, the app returns structured search results instead.

## Deployment

Deploy to Vercel, Netlify, or any Node host:

```bash
npm run build
npm start
```

Add the same env vars in your hosting dashboard.

## Project Structure

```
├── app/
│   ├── api/query/route.ts   # Main API: search + AI + images
│   ├── layout.tsx
│   ├── page.tsx             # Main page
│   └── globals.css
├── components/
│   ├── SearchBar.tsx
│   ├── BriefAnswer.tsx
│   ├── KeyPoints.tsx
│   ├── Overview.tsx
│   ├── ImageGallery.tsx
│   ├── Flashcards.tsx
│   └── Resources.tsx
├── lib/
│   ├── search.ts            # DuckDuckGo (no key)
│   ├── ai.ts                # Groq / Hugging Face
│   ├── images.ts            # Pexels
│   └── pdf.ts               # jsPDF
└── package.json
```

## License

MIT
