import { callLLM } from "./openai.service.js";
import { NORMALIZER_SYSTEM_PROMPT, NORMALIZER_STRICT_SUFFIX } from "./prompts/normalizer.prompt.js";
import { GENERATOR_SYSTEM_PROMPT, GENERATOR_EXPAND_EXISTING_PROMPT } from "./prompts/generator.prompt.js";
import { HUMANIZER_SYSTEM_PROMPT, HUMANIZER_EXPAND_EXISTING_PROMPT, AI_TELL_PHRASES } from "./prompts/humanizer.prompt.js";

const MIN_WORD_COUNT = 850;
const MAX_EXPAND_ATTEMPTS = 2;

function parseJson(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function countWords(text) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

// Safety net for humanizer misses — surfaced to the client so a manager can spot-check
// before publishing, rather than trusting the prompt silently worked.
export function detectAiTellPhrases(text) {
  const lower = text.toLowerCase();
  return AI_TELL_PHRASES.filter((phrase) => lower.includes(phrase));
}

// First pass with basePrompt, then up to MAX_EXPAND_ATTEMPTS calls to expandPrompt that
// take the best-so-far draft and grow it, until MIN_WORD_COUNT is cleared. Returns the
// longest valid draft found even if none clear the bar.
async function generateWithLengthEnforcement({ basePrompt, expandPrompt, baseUserMessage, buildExpandUserMessage }) {
  let best = null;
  let bestWords = 0;

  const firstRaw = await callLLM({ systemPrompt: basePrompt, userMessage: baseUserMessage, jsonMode: true });
  const first = parseJson(firstRaw);
  if (first) {
    best = first;
    bestWords = countWords(first.content);
  }
  console.log(`[length-enforcement] base attempt: ${bestWords} words`);

  for (let attempt = 0; attempt < MAX_EXPAND_ATTEMPTS && bestWords < MIN_WORD_COUNT && best; attempt++) {
    const raw = await callLLM({
      systemPrompt: expandPrompt,
      userMessage: buildExpandUserMessage(best),
      jsonMode: true
    });
    const expanded = parseJson(raw);
    if (!expanded) continue;

    const words = countWords(expanded.content);
    console.log(`[length-enforcement] expand attempt ${attempt + 1}/${MAX_EXPAND_ATTEMPTS}: ${words} words`);
    if (words > bestWords) {
      best = expanded;
      bestWords = words;
    }
  }

  return best;
}

// Stage 1: raw structured manager input -> clean content brief
export async function normalizeInput({ blogTitle, companyName, productName, websiteUrl, keywords, rawDescription }) {
  const userMessage = `
Blog title (if given): ${blogTitle || "(none provided — craft one)"}
Company name: ${companyName}
Product/service name: ${productName}
Website: ${websiteUrl || "(not provided)"}
Target keywords: ${keywords.join(", ")}
Additional notes from manager: ${rawDescription || "(none)"}
`;

  let raw = await callLLM({
    systemPrompt: NORMALIZER_SYSTEM_PROMPT,
    userMessage,
    jsonMode: true
  });

  let brief = parseJson(raw);
  if (!brief) {
    // retry once with a stricter "JSON only" instruction
    raw = await callLLM({
      systemPrompt: NORMALIZER_SYSTEM_PROMPT + NORMALIZER_STRICT_SUFFIX,
      userMessage,
      jsonMode: true
    });
    brief = parseJson(raw);
  }

  if (!brief) {
    const err = new Error("Could not understand the brief. Please rephrase and try again.");
    err.type = "openai_error";
    err.status = 502;
    throw err;
  }

  return brief;
}

// Stage 2: clean brief -> draft blog post, expanded if it comes in short
export async function generateContent(brief) {
  const draft = await generateWithLengthEnforcement({
    basePrompt: GENERATOR_SYSTEM_PROMPT,
    expandPrompt: GENERATOR_EXPAND_EXISTING_PROMPT,
    baseUserMessage: JSON.stringify(brief),
    buildExpandUserMessage: (currentDraft) => JSON.stringify({ brief, currentDraft })
  });

  if (!draft) {
    const err = new Error("Generation returned malformed content.");
    err.type = "openai_error";
    err.status = 502;
    throw err;
  }
  return draft;
}

// Stage 3: raw draft -> humanized draft, expanded if the rewrite comes in short
export async function humanizeContent(draft) {
  const humanized = await generateWithLengthEnforcement({
    basePrompt: HUMANIZER_SYSTEM_PROMPT,
    expandPrompt: HUMANIZER_EXPAND_EXISTING_PROMPT,
    baseUserMessage: JSON.stringify(draft),
    buildExpandUserMessage: (currentDraft) => JSON.stringify({ currentDraft })
  });

  if (!humanized) {
    const err = new Error("Humanizing returned malformed content.");
    err.type = "openai_error";
    err.status = 502;
    throw err;
  }
  return humanized;
}

// Stage 2 + 3 together
export async function runFullPipeline(brief) {
  const draft = await generateContent(brief);
  const humanized = await humanizeContent(draft);
  return { rawDraft: draft, final: humanized };
}
