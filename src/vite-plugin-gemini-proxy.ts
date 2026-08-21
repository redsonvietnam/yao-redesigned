/**
 * Vite dev-server plugin that proxies OCR requests to the Gemini API.
 *
 * SECURITY: The GEMINI_API_KEY is read from process.env server-side only.
 * This plugin runs exclusively inside the Vite dev server middleware.
 * It is NOT included in the client bundle — Vite tree-shakes configureServer.
 *
 * For production deployments, a separate server-side proxy is required.
 */
import type { Plugin, Connect } from 'vite';
import type { IncomingMessage, ServerResponse } from 'http';

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

const GEMINI_TIMEOUT_MS = 30_000;

const OCR_PROMPT = [
  'Extract all visible text from this image.',
  'The image may contain Chinese characters (Hanzi), Yao/Dao script, or mixed Vietnamese/Chinese text.',
  'Return ONLY the extracted text, nothing else.',
  'Preserve the reading order (top-to-bottom for vertical text, left-to-right for horizontal).',
  'Do not add explanations, labels, or formatting.',
  'If no text is found, return an empty string.',
  'For handwritten characters, make your best recognition attempt.',
].join('\n');

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

function collectBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks).toString()));
    req.on('error', reject);
  });
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** Extract text from a Gemini API response, safely handling all malformed shapes. */
export function extractGeminiText(data: unknown): string {
  if (!isRecord(data)) return '';
  const candidates = data.candidates;
  if (!Array.isArray(candidates) || candidates.length === 0) return '';
  const first = candidates[0];
  if (!isRecord(first)) return '';
  const content = first.content;
  if (!isRecord(content)) return '';
  const parts = content.parts;
  if (!Array.isArray(parts) || parts.length === 0) return '';
  const firstPart = parts[0];
  if (!isRecord(firstPart)) return '';
  const text = firstPart.text;
  return typeof text === 'string' ? text : '';
}

function sendJson(res: ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
}

function createOcrHandler(): Connect.NextHandleFunction {
  return async (req, res) => {
    if (req.method !== 'POST') {
      sendJson(res, 405, { error: 'Method not allowed' });
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim() === '') {
      sendJson(res, 400, {
        error: 'missing_api_key',
        message:
          'GEMINI_API_KEY is not configured. Add it to your .env file or environment variables.',
      });
      return;
    }

    let parsed: unknown;
    try {
      const body = await collectBody(req);
      parsed = JSON.parse(body);
    } catch {
      sendJson(res, 400, { error: 'invalid_request', message: 'Request body must be valid JSON.' });
      return;
    }

    if (!isRecord(parsed)) {
      sendJson(res, 400, { error: 'invalid_request', message: 'Request body must be a JSON object.' });
      return;
    }

    const { imageBase64, mimeType = 'image/jpeg' } = parsed as Record<string, unknown>;

    if (typeof imageBase64 !== 'string' || imageBase64.length === 0) {
      sendJson(res, 400, { error: 'invalid_request', message: 'imageBase64 is required and must be a non-empty string.' });
      return;
    }

    if (typeof mimeType !== 'string' || !ALLOWED_MIME_TYPES.has(mimeType)) {
      sendJson(res, 400, {
        error: 'invalid_request',
        message: `mimeType must be one of: ${[...ALLOWED_MIME_TYPES].join(', ')}.`,
      });
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

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);

      let geminiRes: Response;
      try {
        geminiRes = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(geminiPayload),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeoutId);
      }

      if (!geminiRes.ok) {
        const errorText = await geminiRes.text().catch(() => '');
        console.error('[Gemini OCR] API error:', geminiRes.status, errorText);
        const status =
          geminiRes.status >= 400 && geminiRes.status < 600 ? geminiRes.status : 502;
        sendJson(res, status, {
          error: 'gemini_api_error',
          status: geminiRes.status,
          message: `Gemini API returned ${geminiRes.status}`,
        });
        return;
      }

      const geminiData: unknown = await geminiRes.json();
      const text = extractGeminiText(geminiData);

      sendJson(res, 200, { text: text.trim() });
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        console.error('[Gemini OCR] Request timed out after', GEMINI_TIMEOUT_MS, 'ms');
        sendJson(res, 504, {
          error: 'timeout',
          message: `Gemini API request timed out after ${GEMINI_TIMEOUT_MS / 1000} seconds.`,
        });
        return;
      }
      console.error('[Gemini OCR] Server error:', err);
      sendJson(res, 500, {
        error: 'server_error',
        message: err instanceof Error ? err.message : 'Internal server error',
      });
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
