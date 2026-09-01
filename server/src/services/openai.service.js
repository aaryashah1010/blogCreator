import OpenAI from "openai";

let client;

function getClient() {
  if (!client) {
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return client;
}

export async function callLLM({ systemPrompt, userMessage, jsonMode = false }) {
  try {
    const response = await getClient().chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage }
      ],
      response_format: jsonMode ? { type: "json_object" } : undefined,
      temperature: 0.7
    });
    return response.choices[0].message.content;
  } catch (err) {
    const wrapped = new Error(err.message);
    wrapped.type = "openai_error";
    wrapped.status = err.status;
    throw wrapped;
  }
}
