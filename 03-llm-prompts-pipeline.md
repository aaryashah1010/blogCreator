# LLM Pipeline — Prompts & OpenAI Integration

## OpenAI service wrapper

```js
// services/openai.service.js
import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function callLLM({ systemPrompt, userMessage, jsonMode = false }) {
  const response = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage }
    ],
    response_format: jsonMode ? { type: "json_object" } : undefined,
    temperature: 0.7
  });
  return response.choices[0].message.content;
}
```

Use `jsonMode: true` for Stage 1 so OpenAI enforces valid JSON output structurally — this removes most parsing failures.

## Stage 1 — Brief Normalizer

**Goal:** turn messy input into a clean structured brief. Never writes content itself.

```js
// services/normalizer.prompt.js
export const NORMALIZER_SYSTEM_PROMPT = `
You are a content brief editor for a blog content team.

You will receive:
- Website info (business description or URL context)
- A list of target keywords
- A rough, possibly grammatically broken description from a content manager of what they want written

Your job is ONLY to produce a clean, structured content brief. Do not write any blog content.
Do not invent facts about the business that weren't stated or reasonably implied.
If the manager's intent is ambiguous, make the most reasonable interpretation and record it in "assumptions".

Output valid JSON only, in this exact shape:
{
  "topic": string,
  "audience": string,
  "tone": string,
  "primaryKeyword": string,
  "secondaryKeywords": string[],
  "mustInclude": string[],
  "wordCountTarget": number,
  "assumptions": string[]
}
`;
```

**Call:**
```js
const userMessage = `
Website info: ${websiteInfo}
Keywords: ${keywords.join(", ")}
Manager's request: ${rawDescription}
`;

const briefJson = await callLLM({
  systemPrompt: NORMALIZER_SYSTEM_PROMPT,
  userMessage,
  jsonMode: true
});
```

## Stage 2 — Content Generator

**Goal:** write the actual blog post from the clean brief only — never from the raw manager input.

```js
export const GENERATOR_SYSTEM_PROMPT = `
You are an SEO blog writer. You will receive a structured content brief in JSON.
Write a complete blog post that:
- Matches the requested tone and audience
- Naturally includes the primary keyword in the title, first paragraph, and at least one subheading
- Naturally includes secondary keywords without keyword-stuffing
- Covers every point in "mustInclude"
- Targets the requested word count (+/- 15%)
- Uses clear subheadings (H2/H3) and short paragraphs suited for web reading
- Does not fabricate specific facts, statistics, or claims about the business beyond what's implied in the brief

Output valid JSON in this shape:
{
  "title": string,
  "metaDescription": string,
  "content": string   // markdown, using ## and ### for headings
}
`;
```

**Call:**
```js
const draftJson = await callLLM({
  systemPrompt: GENERATOR_SYSTEM_PROMPT,
  userMessage: JSON.stringify(brief),
  jsonMode: true
});
```

## Stage 3 — Humanizer

**Goal:** rewrite (not lightly edit) so the post reads naturally and avoids common "AI voice" patterns.

This must be phrased as a full rewrite instruction, or the model will barely touch the text.

```js
export const HUMANIZER_SYSTEM_PROMPT = `
You are an editor who rewrites AI-drafted blog posts so they read like they were written by an experienced human blogger.

Rewrite the entire post — do not just lightly edit it. Preserve all factual content, structure, and headings, but change:
- Sentence rhythm: vary sentence length, avoid repetitive sentence structures
- Avoid these overused AI phrases entirely: "in today's fast-paced world", "it's important to note", "in conclusion", "unlock the power of", "dive into", "when it comes to", "whether you're X or Y"
- Use contractions where natural
- Prefer concrete, specific language over generic marketing language
- Keep it confident and readable, not robotic or overly formal

Do not change the meaning, add new claims, or remove required keywords.

Output valid JSON in this shape:
{
  "title": string,
  "metaDescription": string,
  "content": string
}
`;
```

**Call:**
```js
const humanizedJson = await callLLM({
  systemPrompt: HUMANIZER_SYSTEM_PROMPT,
  userMessage: JSON.stringify(draftJson),
  jsonMode: true
});
```

## Orchestration

```js
// services/pipeline.service.js
export async function runFullPipeline(brief) {
  const draft = await generateContent(brief);       // Stage 2
  const humanized = await humanizeContent(draft);    // Stage 3
  return { rawDraft: draft, final: humanized };
}
```

Stage 1 is called separately (via `POST /api/content/brief`) so the frontend can show it for review before Stages 2–3 run.

## Tuning notes

- If output still sounds "AI-ish" after Stage 3, the fastest lever is adding 2–3 example paragraphs of your brand's actual voice directly into the humanizer system prompt — few-shot examples work better than more instructions.
- Keep a running list of phrases your team flags as "sounds AI" and add them to the avoid-list above as you find them.
- Log `rawDraft` vs `final` for every post so you can spot-check how much the humanizer is actually changing.
