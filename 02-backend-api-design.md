# Backend API Design (Node + Express)

## Folder structure

```
server/
  src/
    routes/
      content.routes.js
    services/
      openai.service.js       # wraps OpenAI calls
      pipeline.service.js     # orchestrates the 3 stages
      normalizer.prompt.js
      generator.prompt.js
      humanizer.prompt.js
    models/
      Draft.js                # DB schema for a generated post
    middleware/
      errorHandler.js
      validateRequest.js
    app.js
    server.js
  .env
  package.json
```

## Environment variables (`.env`)

```
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o
PORT=4000
DATABASE_URL=...
```

Never expose `OPENAI_API_KEY` to the frontend. All OpenAI calls happen server-side only.

## Endpoints

### `POST /api/content/brief`
Runs **only Stage 1** (normalizer). Lets the frontend show the cleaned brief for manager review/edit before committing to a full generation.

**Request body:**
```json
{
  "websiteInfo": "we sell handmade leather bags, mid-range price, based in India",
  "keywords": ["handmade leather bags", "genuine leather India"],
  "rawDescription": "want blog for our new bag collection focus on quality and craft pls make it good for google"
}
```

**Response body:**
```json
{
  "briefId": "abc123",
  "brief": {
    "topic": "Introducing our new handmade leather bag collection",
    "audience": "Shoppers looking for quality, handcrafted leather goods",
    "tone": "warm, confident, craftsmanship-focused",
    "primaryKeyword": "handmade leather bags",
    "secondaryKeywords": ["genuine leather India"],
    "mustInclude": ["quality of materials", "craftsmanship", "new collection"],
    "wordCountTarget": 800,
    "assumptions": ["Assumed the post should be promotional/announcement style since no specific angle was given"]
  }
}
```

### `POST /api/content/generate`
Runs **Stage 2 + Stage 3** using a (possibly user-edited) brief from Stage 1. This is the main "generate the post" call.

**Request body:**
```json
{
  "briefId": "abc123",
  "brief": { "...": "edited brief object, same shape as above" }
}
```

**Response body:**
```json
{
  "draftId": "xyz789",
  "title": "Crafted by Hand, Built to Last: Our New Leather Bag Collection",
  "metaDescription": "Discover our new handmade leather bag collection...",
  "content": "<full humanized blog post, markdown or HTML>",
  "wordCount": 812,
  "stages": {
    "rawDraft": "... pre-humanized version, stored for debugging ...",
    "humanizedDraft": "... same as content above ..."
  }
}
```

Storing `rawDraft` alongside the final `content` is deliberate — it lets you compare before/after the humanizer and tune that prompt over time.

### `POST /api/content/:draftId/publish`
Marks a draft as published and (optionally) pushes it to your actual CMS/website. Implementation depends on how your site is built (headless CMS, static site rebuild, direct DB write, etc.) — flag this to me once you know, and I can help wire it up specifically.

### `GET /api/content/:draftId`
Fetch a saved draft (for re-editing or re-viewing).

## Error handling

Wrap every OpenAI call in try/catch. Common failure modes to handle explicitly:

- **Stage 1 doesn't return valid JSON** → retry once with a stricter "output JSON only, no prose" instruction appended. If it fails twice, return a 502 with a clear error so the frontend can show "couldn't understand the brief, please rephrase."
- **OpenAI rate limit / timeout** → return 503, let frontend show a retry button. Don't silently swallow errors.
- **Stage 2 output far under/over word count target** → not a hard error, but worth logging/flagging for review.

```js
// middleware/errorHandler.js (sketch)
function errorHandler(err, req, res, next) {
  console.error(err);
  if (err.type === 'openai_error') {
    return res.status(502).json({ error: 'LLM generation failed', detail: err.message });
  }
  res.status(500).json({ error: 'Internal server error' });
}
```

## Draft model (example, DB-agnostic)

```js
{
  _id: ObjectId,
  websiteInfo: String,
  keywords: [String],
  rawDescription: String,
  brief: Object,          // Stage 1 output
  rawDraft: String,       // Stage 2 output
  humanizedDraft: String, // Stage 3 output (= final content)
  title: String,
  metaDescription: String,
  status: 'draft' | 'published',
  createdAt: Date,
  publishedAt: Date
}
```
