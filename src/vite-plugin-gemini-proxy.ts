import type { Plugin, Connect } from 'vite';
import type { IncomingMessage } from 'http';

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

const OCR_PROMPT = [
  'Extract all visible text from this image.',
  'The image may contain Chinese characters (Hanzi), Yao/Dao script, or mixed Vietnamese/Chinese text.',
  'Return ONLY the extracted text, nothing else.',
  'Preserve the reading order (top-to-bottom for vertical text, left-to-right for horizontal).',
  'Do not add explanations, labels, or formatting.',
  'If no text is found, return an empty string.',
  'For handwritten characters, make your best recognition attempt.',
].join('\n');

function collectBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks).toString()));
    req.on('error', reject);
  });
}

function createOcrHandler(): Connect.NextHandleFunction {
  return async (req, res) => {
    if (req.method !== 'POST') {
      res.writeHead(405, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Method not allowed' }));
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim() === '') {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          error: 'missing_api_key',
          message:
            'GEMINI_API_KEY is not configured. Add it to your .env file or environment variables.',
        }),
      );
      return;
    }

    try {
      const body = await collectBody(req);
      const parsed = JSON.parse(body);
      const { imageBase64, mimeType = 'image/jpeg' } = parsed;

      if (!imageBase64 || typeof imageBase64 !== 'string') {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            error: 'invalid_request',
            message: 'imageBase64 is required.',
          }),
        );
        return;
      }

      const geminiPayload = {
        contents: [
          {
            parts: [
              { text: OCR_PROMPT },
              {
                inline_data: {
                  mime_type: mimeType,
                  data: imageBase64,
                },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 2048,
        },
      };

      const geminiRes = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(geminiPayload),
      });

      if (!geminiRes.ok) {
        const errorText = await geminiRes.text();
        console.error('[Gemini OCR] API error:', geminiRes.status, errorText);
        const status =
          geminiRes.status >= 400 && geminiRes.status < 600 ? geminiRes.status : 502;
        res.writeHead(status, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            error: 'gemini_api_error',
            status: geminiRes.status,
            message: `Gemini API returned ${geminiRes.status}`,
          }),
        );
        return;
      }

      const geminiData = await geminiRes.json();
      const text = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ text: text.trim() }));
    } catch (err) {
      console.error('[Gemini OCR] Server error:', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          error: 'server_error',
          message: err instanceof Error ? err.message : 'Internal server error',
        }),
      );
    }
  };
}

export function geminiProxyPlugin(): Plugin {
  return {
    name: 'gemini-proxy',
    configureServer(server) {
      server.middlewares.use('/api/gemini/ocr', createOcrHandler());
    },
  };
}
