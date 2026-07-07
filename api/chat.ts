import type { VercelRequest, VercelResponse } from '@vercel/node';
import Groq from 'groq-sdk';

// Initialize Groq client
let groq: Groq | null = null;
const getGroq = () => {
  if (!groq) {
    if (!process.env.GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY environment variable is required');
    }
    groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return groq;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { messages, model, temperature = 0.7 } = req.body;
    const groqClient = getGroq();

    // Set headers for SSE streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const stream = await groqClient.chat.completions.create({
      messages,
      model,
      temperature,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
        
        // Flush the response if the serverless environment buffers it
        if ((res as any).flush) {
          (res as any).flush();
        }
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error: any) {
    console.error('Groq API Error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message || 'Internal Server Error' });
    } else {
      res.write(`data: ${JSON.stringify({ error: error.message || 'Internal Server Error' })}\n\n`);
      res.end();
    }
  }
}
