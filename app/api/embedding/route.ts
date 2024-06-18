import OpenAI from 'openai';
import { supabaseClient } from '../../../utils/supabaseClient';

export async function POST(request: Request ) {
  try {
    const req = await request.json();
    const { sentenceList } = req;
    const openai = new OpenAI({
      organization: process.env.OPENAI_ORG_ID,
      project: process.env.OPENAI_PROJECT_ID,
      apiKey: process.env.OPENAI_API_KEY,
  });

    for (let i = 0; i < sentenceList.length; i++) {
      const chunk = sentenceList[i];
      const { content, content_length, content_tokens, page_num } = chunk;

      const embeddingResponse = await openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: content
      });

      const [{ embedding }] = embeddingResponse.data;

      const { error } = await supabaseClient
        .from('chatgpt')
        .insert({
          content,
          content_length,
          content_tokens,
          page_num,
          embedding
        })
        .select('*');

      if (error) {
        console.log('error', error);
      } else {
        console.log('saved', i);
      }

      // 防止触发openai的每分钟限制
      await new Promise(resolve => setTimeout(resolve, 1500));
    }

    return new Response('ok');
  } catch (error) {
    console.error(error);
    return new Response('Error', { status: 500 });
  }
};
