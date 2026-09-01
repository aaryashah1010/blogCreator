# Blog Content Generator — Architecture Overview

## What this system does

Content managers (whose written English is often rough) give three things:

1. Website info (URL and/or a short description of the business)
2. Target keywords
3. A freeform description of what they want written

The system turns that into a polished, humanized blog post ready to publish — without the content manager needing to write a good prompt themselves.

## Why three LLM calls instead of one

A single prompt that tries to "understand messy input + write SEO content + sound human" produces inconsistent results and is hard to debug. Splitting it into three focused stages means each stage has one job, is independently testable, and failures are easy to trace.

```
Manager input (raw, messy)
        |
        v
[1] Brief Normalizer   -- cleans input into structured JSON brief
        |
        v
[2] Content Generator  -- writes the blog post from the clean brief
        |
        v
[3] Humanizer           -- rewrites for natural tone, removes "AI voice"
        |
        v
Published to page (React frontend)
```

## Tech stack

| Layer      | Choice                                   |
|------------|-------------------------------------------|
| Frontend   | React (form + draft preview + publish UI) |
| Backend    | Node.js + Express                         |
| LLM        | OpenAI API (GPT-4o or GPT-4o-mini)        |
| Storage    | Any DB (Postgres/Mongo) — stores drafts, brief JSON, and stage outputs for debugging |
| Auth       | Whatever your existing content-manager login system is (out of scope here) |

## High-level request flow

1. User fills out a form in React: website info, keywords, freeform description.
2. React POSTs this to `POST /api/content/generate` on the Node backend.
3. Backend runs the 3-stage pipeline sequentially, calling OpenAI for each stage.
4. Backend saves each stage's output to the DB (brief JSON, raw draft, humanized draft) — this is critical for debugging bad outputs later.
5. Backend returns the final humanized post (+ metadata like title, meta description) to React.
6. React displays it in an editable preview. Content manager can tweak and hit "Publish."

## Files in this doc set

- `01-architecture-overview.md` — this file
- `02-backend-api-design.md` — Express routes, request/response shapes, error handling, env vars
- `03-llm-prompts-pipeline.md` — the actual system prompts for each of the 3 stages, OpenAI call structure, JSON schemas
- `04-frontend-integration.md` — React component breakdown, state, API calls, UI states

## Key design decisions worth locking in early

- **Stage 1 output (the brief) should be editable by the user before generation runs.** This is the single highest-leverage feature for accuracy — if the normalizer misreads the manager's intent, they catch it before wasting a full generation + humanize pass.
- **Never let the raw, messy manager input reach Stage 2 directly.** Stage 2 only ever sees the clean JSON brief from Stage 1. This is what keeps output quality consistent regardless of how bad the input English is.
- **Log every stage's output.** When a post comes out wrong, you need to know whether the normalizer misunderstood the brief, the generator went off-topic, or the humanizer mangled good content.
- **Treat the humanizer as a full rewrite, not a light edit pass.** A "polish this a bit" prompt barely changes anything; you need an explicit rewrite instruction (see doc 03).
