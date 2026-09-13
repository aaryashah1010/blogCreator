import { callLLM } from "./openai.service.js";
import { NORMALIZER_SYSTEM_PROMPT, NORMALIZER_STRICT_SUFFIX } from "./prompts/normalizer.prompt.js";
import {
  buildGeneratorSystemPrompt,
  buildGeneratorExpandPrompt,
  buildGeneratorCondensePrompt
} from "./prompts/generator.prompt.js";
import {
  buildHumanizerSystemPrompt,
  buildHumanizerExpandPrompt,
  buildHumanizerCondensePrompt,
  AI_TELL_PHRASES
} from "./prompts/humanizer.prompt.js";
import { BACKLINK_QUERIES_SYSTEM_PROMPT } from "./prompts/backlinkQueries.prompt.js";
import {
  buildWebpageGeneratorPrompt,
  buildWebpageGeneratorExpandPrompt,
  buildWebpageGeneratorCondensePrompt,
  buildWebpageHumanizerPrompt,
  buildWebpageHumanizerExpandPrompt,
  buildWebpageHumanizerCondensePrompt
} from "./prompts/webpage.prompt.js";

const WORD_COUNT_TOLERANCE = 50;
const MAX_LENGTH_ATTEMPTS = 3; // base attempt + up to 2 corrective passes
const DEFAULT_WORD_COUNT_TARGET = 900;

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

function isWebpage(brief) {
  return brief.contentType === "webpage";
}

// Safety net for humanizer misses — surfaced to the client so a manager can spot-check
// before publishing, rather than trusting the prompt silently worked.
export function detectAiTellPhrases(text) {
  const lower = text.toLowerCase();
  return AI_TELL_PHRASES.filter((phrase) => lower.includes(phrase));
}

// First pass with the base prompt, then up to MAX_LENGTH_ATTEMPTS-1 corrective passes —
// expanding if under the target band, condensing if over it — until the result lands
// within +/-WORD_COUNT_TOLERANCE of targetWords. Returns the closest-to-target valid
// draft found even if none land exactly in range.
async function generateWithLengthEnforcement({
  targetWords,
  basePrompt,
  buildExpandPrompt,
  buildCondensePrompt,
  baseUserMessage,
  buildCorrectionUserMessage
}) {
  const min = targetWords - WORD_COUNT_TOLERANCE;
  const max = targetWords + WORD_COUNT_TOLERANCE;

  const firstRaw = await callLLM({ systemPrompt: basePrompt, userMessage: baseUserMessage, jsonMode: true });
  let current = parseJson(firstRaw);
  let currentWords = current ? countWords(current.content) : 0;
  console.log(`[length-enforcement] base attempt: ${currentWords} words (target ${targetWords} +/-${WORD_COUNT_TOLERANCE})`);

  let best = current;
  let bestDistance = current ? Math.abs(currentWords - targetWords) : Infinity;

  for (let attempt = 0; attempt < MAX_LENGTH_ATTEMPTS - 1 && current && (currentWords < min || currentWords > max); attempt++) {
    const needsExpand = currentWords < min;
    const systemPrompt = needsExpand
      ? buildExpandPrompt(targetWords, currentWords)
      : buildCondensePrompt(targetWords, currentWords);

    const raw = await callLLM({
      systemPrompt,
      userMessage: buildCorrectionUserMessage(current),
      jsonMode: true
    });
    const corrected = parseJson(raw);
    if (!corrected) continue;

    current = corrected;
    currentWords = countWords(current.content);
    console.log(`[length-enforcement] ${needsExpand ? "expand" : "condense"} attempt ${attempt + 1}: ${currentWords} words`);

    const distance = Math.abs(currentWords - targetWords);
    if (distance < bestDistance) {
      best = current;
      bestDistance = distance;
    }
  }

  return best;
}

// Stage 1: raw structured manager input -> clean content brief
export async function normalizeInput({ blogTitle, companyName, productName, websiteUrl, keywords, rawDescription, wordCountTarget, contentType }) {
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

  // The word count is a precise user preference, not something the LLM should
  // reinterpret — force it exactly rather than trusting the model to carry it through.
  const requested = Number(wordCountTarget);
  brief.wordCountTarget = requested > 0 ? requested : brief.wordCountTarget || DEFAULT_WORD_COUNT_TARGET;
  brief.contentType = contentType === "webpage" ? "webpage" : "blog";

  return brief;
}

// Stage 2: clean brief -> draft blog post or webpage copy, corrected toward brief.wordCountTarget +/-50
export async function generateContent(brief) {
  const targetWords = Number(brief.wordCountTarget) || DEFAULT_WORD_COUNT_TARGET;
  const webpage = isWebpage(brief);

  const draft = await generateWithLengthEnforcement({
    targetWords,
    basePrompt: webpage ? buildWebpageGeneratorPrompt(targetWords) : buildGeneratorSystemPrompt(targetWords),
    buildExpandPrompt: webpage ? buildWebpageGeneratorExpandPrompt : buildGeneratorExpandPrompt,
    buildCondensePrompt: webpage ? buildWebpageGeneratorCondensePrompt : buildGeneratorCondensePrompt,
    baseUserMessage: JSON.stringify(brief),
    buildCorrectionUserMessage: (currentDraft) => JSON.stringify({ brief, currentDraft })
  });

  if (!draft) {
    const err = new Error("Generation returned malformed content.");
    err.type = "openai_error";
    err.status = 502;
    throw err;
  }
  return draft;
}

// Stage 3: raw draft -> humanized draft, corrected toward the same target +/-50.
// Blog posts also get 2-3 alternate subtitle suggestions; webpage copy doesn't use them.
export async function humanizeContent(draft, targetWords, keywords, contentType) {
  const target = Number(targetWords) || DEFAULT_WORD_COUNT_TARGET;
  const webpage = contentType === "webpage";

  const humanized = await generateWithLengthEnforcement({
    targetWords: target,
    basePrompt: webpage ? buildWebpageHumanizerPrompt(target) : buildHumanizerSystemPrompt(target),
    buildExpandPrompt: webpage ? buildWebpageHumanizerExpandPrompt : buildHumanizerExpandPrompt,
    buildCondensePrompt: webpage ? buildWebpageHumanizerCondensePrompt : buildHumanizerCondensePrompt,
    baseUserMessage: JSON.stringify({ ...draft, keywords: keywords || [] }),
    buildCorrectionUserMessage: (currentDraft) => JSON.stringify({ currentDraft })
  });

  if (!humanized) {
    const err = new Error("Humanizing returned malformed content.");
    err.type = "openai_error";
    err.status = 502;
    throw err;
  }
  if (webpage || !Array.isArray(humanized.subtitles)) humanized.subtitles = [];
  return humanized;
}

// Stage 2 + 3 together
export async function runFullPipeline(brief) {
  const targetWords = Number(brief.wordCountTarget) || DEFAULT_WORD_COUNT_TARGET;
  const keywords = [brief.primaryKeyword, ...(brief.secondaryKeywords || [])].filter(Boolean);
  const draft = await generateContent(brief);
  const humanized = await humanizeContent(draft, targetWords, keywords, brief.contentType);
  return { rawDraft: draft, final: humanized };
}

// Suggests Google search queries (not URLs) for finding backlink opportunities for this brief's
// business — never claims a specific site exists, so no hallucination risk the way a URL list would have.
export async function generateBacklinkQueries(brief) {
  const userMessage = JSON.stringify({
    companyName: brief.companyName,
    productName: brief.productName,
    primaryKeyword: brief.primaryKeyword,
    secondaryKeywords: brief.secondaryKeywords || [],
    targetLocations: brief.targetLocations || []
  });

  const raw = await callLLM({
    systemPrompt: BACKLINK_QUERIES_SYSTEM_PROMPT,
    userMessage,
    jsonMode: true
  });

  const parsed = parseJson(raw);
  if (!parsed || !Array.isArray(parsed.queries)) {
    const err = new Error("Could not generate backlink search queries.");
    err.type = "openai_error";
    err.status = 502;
    throw err;
  }
  return parsed.queries.filter((q) => typeof q === "string" && q.trim().length > 0);
}
