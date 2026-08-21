/**
 * Minimal production server for yao-redesigned.
 *
 * - Serves static files from dist/
 * - Proxies /api/gemini/ocr to the Gemini API via shared ocrBackend logic
 *
 * Built with native Node.js only — no framework dependencies.
 * Compiled to server.js via: esbuild server.ts --bundle --platform=node --outfile=server.js
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { GEMINI_API_URL, GEMINI_TIMEOUT_MS, OCR_PROMPT, extractGeminiText, validateOcrRequest } from './src/lib/ocrBackend';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.join(__dirname, 'dist');

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.map': 'application/json; charset=utf-8',
};

const MAX_UPLOAD_SIZE = 20 * 1024 * 1024; // 20MB

function sendJson(res: http.ServerResponse, status: number, body: unknown) {
  const json = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(json),
  });
  res.end(json);
}

function serveStaticRes(res: http.ServerResponse, filePath: string) {
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';
  const content = fs.readFileSync(filePath);

  res.writeHead(200, {
    'Content-Type': contentType,
    'Content-Length': content.length,
    'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=31536000, immutable',
    'Accept-Ranges': 'bytes',
  });
  res.end(content);
}

async function collectBody(req: http.IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let total = 0;
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => {
      total += chunk.length;
      if (total > MAX_UPLOAD_SIZE) {
        reject(new Error('Payload too large'));
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString()));
    req.on('error', reject);
  });
}

async function handleOcrRequest(req: http.IncomingMessage, res: http.ServerResponse) {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method not allowed' });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim() === '') {
    sendJson(res, 400, {
      error: 'missing_api_key',
      message: 'GEMINI_API_KEY is not configured.',
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

  const validation = validateOcrRequest(parsed);
  if (validation.error) {
    sendJson(res, 400, validation);
    return;
  }

  const { imageBase64, mimeType } = validation.data!;

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
      const status = geminiRes.status >= 400 && geminiRes.status < 600 ? geminiRes.status : 502;
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
}

function requestHandler(req: http.IncomingMessage, res: http.ServerResponse) {
  const url = req.url || '/';

  if (url.startsWith('/api/gemini/ocr')) {
    handleOcrRequest(req, res).catch((err) => {
      console.error('[Server] Unhandled OCR error:', err);
      if (!res.headersSent) {
        sendJson(res, 500, { error: 'server_error', message: 'Internal server error' });
      }
    });
    return;
  }

  if (url.startsWith('/api/')) {
    sendJson(res, 404, { error: 'not_found' });
    return;
  }

  let safePath = decodeURIComponent(url.split('?')[0]);
  if (safePath === '/') safePath = '/index.html';
  if (safePath.startsWith('/')) safePath = safePath.slice(1);

  const filePath = path.join(DIST_DIR, safePath);

  try {
    serveStaticRes(res, filePath);
  } catch (err) {
    console.error('[Server] Static file error:', err);
    if (!res.headersSent) {
      sendJson(res, 500, { error: 'server_error', message: 'Internal server error' });
    }
  }
}

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 8080;
const server = http.createServer(requestHandler);

const isMainModule = process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url;

if (isMainModule) {
  server.listen(PORT, () => {
    console.log(`[Server] Production server running at http://localhost:${PORT}`);
    console.log(`[Server] Serving static /dist and proxying /api/gemini/ocr`);
  });
}

export { requestHandler, serveStaticRes, collectBody, sendJson, handleOcrRequest, server };
