import { supabaseClient } from "@/utils/supabaseClient";
import { openai as openaisdk } from "@ai-sdk/openai";
import OpenAI from "openai";
import { streamText } from "ai";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(request: Request) {
  const req = await request.json();
  const { messages } = await req;

  // get query from the last messages
  const { query } = messages[messages.length - 1];

  const input = query.replace(/\n/g, " ");
  const openai = new OpenAI({
    organization: process.env.OPENAI_ORG_ID,
    project: process.env.OPENAI_PROJECT_ID,
    apiKey: process.env.OPENAI_API_KEY,
  });

  const embeddingResponse = await openai.embeddings.create({
    model: "text-embedding-ada-002",
    input: input,
  });

  const [{ embedding }] = embeddingResponse.data;

  const { data: chunks, error } = await supabaseClient.rpc("chatgpt_search", {
    query_embedding: embedding,
    similarity_threshold: 0.01,
    match_count: 5,
  });

  const prompt = `
  Use the following text to provide an answer to the query: "${query}"

  ${chunks.map((d: any) => d.content).join("\n\n")}
  `;
  // replace last element of messages with query by creating a new array copy
  const newMessages = [...messages, { role: "user", content: query }];

  if (error || !chunks) {
    console.error(error);
    return new Response("Error", { status: 500 });
  }

  const result = await streamText({
    model: openaisdk("gpt-3.5-turbo"),
    messages: [
      {
        role: "system",
        content:
          "You are a helpful assistant that accurately answers queries using GitHub Privacy Statement. Use the text provided to form your answer, but avoid copying word-for-word from the context. Try to use your own words when possible. Keep your answer under 5 sentences. Be accurate, helpful, concise, and clear.",
      },
      ...newMessages,
    ],
  });

  return result.toAIStreamResponse();
}
