import { generateNewChunkList } from '@/utils/splitChunks';
 
export async function POST(request: Request) {
  try {
    const req = await request.json()
    const { sentenceList } = req;
    if (!sentenceList) {
      return new Response('Error', { status: 400 });
    }
    const chunkList = generateNewChunkList(sentenceList);
    return Response.json({chunkList})
  } catch (error) {
    console.error(error);
    return new Response('Error', { status: 500 });
  }
}