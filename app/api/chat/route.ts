import { supabaseClient } from "@/utils/supabaseClient";
import { openai as openaisdk } from "@ai-sdk/openai";
import OpenAI from "openai";
import { streamText } from "ai";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(request: Request) {
  const req = await request.json();
  const { messages } = req;

  
  // get query from the last messages
  const query = messages[messages.length - 1];
  console.log(query);

  const input = query.content.replace(/\n/g, " ");
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
  Use the following text to provide an answer to the query: "${query.content}"

  ${chunks.map((d: any) => d.content).join("\n\n")}
  `;
  // replace last element of messages with query by creating a new array copy
  const newMessages = messages.slice(0, -1).concat({
    role: "system",
    content: prompt,
  });

  console.log([
    {
      role: "system",
      content:
        "You are a helpful assistant that accurately answers queries using a provided PDF, the context will beprovided in each question. Use the text provided to form your answer, but avoid copying word-for-word from the context. Try to use your own words when possible. Max answer of 10 sentences, you can use markdown. Be accurate, helpful, concise, and clear. If you don't know say you don't know.",
    },
    ...newMessages,
  ])

  if (error || !chunks) {
    console.error(error);
    return new Response("Error", { status: 500 });
  }

  const result = await streamText({
    model: openaisdk("gpt-4-turbo"),
    messages: [
      {
        role: "system",
        content:
          "You are a helpful assistant that accurately answers queries using a provided PDF, the context will beprovided in each question. Use the text provided to form your answer, but avoid copying word-for-word from the context. Try to use your own words when possible. Max answer of 10 sentences, you can use markdown. Be accurate, helpful, concise, and clear. If you don't know say you don't know.",
      },
      ...newMessages,
    ],
  });

  return result.toAIStreamResponse();
}
