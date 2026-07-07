import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import Groq from 'groq-sdk';
import dotenv from 'dotenv';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize Groq client conditionally to avoid crashing if key is missing on startup
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

  app.post('/api/chat', async (req, res) => {
    try {
      const { messages, model, temperature = 0.7 } = req.body;
      const groqClient = getGroq();

      // Ensure proper formatting for SSE
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
          // Send formatted SSE
          res.write(`data: ${JSON.stringify({ content })}\n\n`);
        }
      }

      res.write('data: [DONE]\n\n');
      res.end();
    } catch (error: any) {
      console.error('Groq API Error:', error);
      // Send error as SSE event if headers are already sent, otherwise standard JSON
      if (!res.headersSent) {
        res.status(500).json({ error: error.message || 'Internal Server Error' });
      } else {
        res.write(`data: ${JSON.stringify({ error: error.message || 'Internal Server Error' })}\n\n`);
        res.end();
      }
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
