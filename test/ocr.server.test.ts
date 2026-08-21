import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GEMINI_API_URL, OCR_PROMPT, GEMINI_TIMEOUT_MS } from '../src/lib/ocrBackend';
import http from 'node:http';

// Mock Node.js built-ins before importing server
vi.mock('node:fs', () => ({
  default: {
    existsSync: vi.fn(() => true),
    statSync: vi.fn(() => ({ isDirectory: () => false })),
    readFileSync: vi.fn(() => Buffer.from('<html><body>Mock Dist Index</body></html>')),
  },
}));

vi.mock('node:path', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:path')>();
  return {
    ...actual,
    default: {
      ...actual,
      join: vi.fn((...args) => args.join('/')),
      extname: vi.fn((p) => p.endsWith('.css') ? '.css' : '.html'),
      dirname: vi.fn(p => p),
      resolve: vi.fn((...args) => args.join('/')),
    }
  };
});

vi.mock('node:url', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:url')>();
  return {
    ...actual,
    pathToFileURL: vi.fn((p) => new URL(`file://${p}`)),
    fileURLToPath: vi.fn((url) => url.replace('file://', '')),
  };
});

import { handleOcrRequest, requestHandler, serveStaticRes, collectBody, sendJson } from '../server';

describe('handleOcrRequest (Production Server OCR Endpoint)', () => {
  let mockReq: Partial<http.IncomingMessage>;
  let mockRes: Partial<http.ServerResponse>;
  let mockFetch: ReturnType<typeof vi.fn>;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = process.env;
    process.env = { ...originalEnv, GEMINI_API_KEY: 'TEST_API_KEY' };

    mockReq = { method: 'POST', url: '/api/gemini/ocr' };
    mockRes = { end: vi.fn(), writeHead: vi.fn() };
    mockFetch = vi.fn();

    vi.stubGlobal('fetch', mockFetch);
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    process.env = originalEnv;
  });

  it('should return 405 for non-POST requests', async () => {
    mockReq.method = 'GET';
    await handleOcrRequest(mockReq as http.IncomingMessage, mockRes as http.ServerResponse);
    expect(mockRes.writeHead).toHaveBeenCalledWith(405, expect.any(Object));
  });

  it('should return 400 if API key is missing', async () => {
    process.env.GEMINI_API_KEY = '';
    const mockReqWithData = {
      method: 'POST',
      url: '/api/gemini/ocr',
      on: vi.fn((event, cb) => {
        if (event === 'data') cb(Buffer.from(JSON.stringify({ imageBase64: 'base64data', mimeType: 'image/png' })));
        if (event === 'end') cb();
      }),
    };
    await handleOcrRequest(mockReqWithData as unknown as http.IncomingMessage, mockRes as http.ServerResponse);
    expect(mockRes.writeHead).toHaveBeenCalledWith(400, expect.any(Object));
  });

  it('should return 200 with extracted text on successful Gemini response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ candidates: [{ content: { parts: [{ text: 'OCR Result' }] } }] }),
    });

    const mockReqWithData = {
      method: 'POST',
      url: '/api/gemini/ocr',
      on: vi.fn((event, cb) => {
        if (event === 'data') cb(Buffer.from(JSON.stringify({ imageBase64: 'base64data', mimeType: 'image/png' })));
        if (event === 'end') cb();
      }),
    };

    await handleOcrRequest(mockReqWithData as unknown as http.IncomingMessage, mockRes as http.ServerResponse);

    expect(mockFetch).toHaveBeenCalledWith(
      `${GEMINI_API_URL}?key=TEST_API_KEY`,
      expect.objectContaining({ method: 'POST' })
    );
    expect(mockRes.writeHead).toHaveBeenCalledWith(200, expect.any(Object));
    expect(mockRes.end).toHaveBeenCalledWith(JSON.stringify({ text: 'OCR Result' }));
  });

  it('should handle Gemini API error responses', async () => {
    const mockReqWithData = {
      method: 'POST',
      url: '/api/gemini/ocr',
      on: vi.fn((event, cb) => {
        if (event === 'data') cb(Buffer.from(JSON.stringify({ imageBase64: 'base64data', mimeType: 'image/png' })));
        if (event === 'end') cb();
      }),
    };

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 502,
      text: async () => 'Bad Gateway',
    });

    await handleOcrRequest(mockReqWithData as unknown as http.IncomingMessage, mockRes as http.ServerResponse);

    expect(mockRes.writeHead).toHaveBeenCalledWith(502, expect.any(Object));
  });

  it('should handle timeout during Gemini API call', async () => {
    const mockReqWithData = {
      method: 'POST',
      url: '/api/gemini/ocr',
      on: vi.fn((event, cb) => {
        if (event === 'data') cb(Buffer.from(JSON.stringify({ imageBase64: 'base64data', mimeType: 'image/png' })));
        if (event === 'end') cb();
      }),
    };

    const abortError = new DOMException('The operation was aborted', 'AbortError');
    mockFetch.mockRejectedValueOnce(abortError);

    await handleOcrRequest(mockReqWithData as unknown as http.IncomingMessage, mockRes as http.ServerResponse);

    expect(mockRes.writeHead).toHaveBeenCalledWith(504, expect.any(Object));
    expect(mockRes.end).toHaveBeenCalledWith(JSON.stringify({
      error: 'timeout',
      message: `Gemini API request timed out after ${GEMINI_TIMEOUT_MS / 1000} seconds.`,
    }));
  });

  it('should handle malformed Gemini API response', async () => {
    const mockReqWithData = {
      method: 'POST',
      url: '/api/gemini/ocr',
      on: vi.fn((event, cb) => {
        if (event === 'data') cb(Buffer.from(JSON.stringify({ imageBase64: 'base64data', mimeType: 'image/png' })));
        if (event === 'end') cb();
      }),
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ unexpected: 'structure' }),
    });

    await handleOcrRequest(mockReqWithData as unknown as http.IncomingMessage, mockRes as http.ServerResponse);

    expect(mockRes.writeHead).toHaveBeenCalledWith(200, expect.any(Object));
    expect(mockRes.end).toHaveBeenCalledWith(JSON.stringify({ text: '' }));
  });

  it('should handle network failure during Gemini API call', async () => {
    const mockReqWithData = {
      method: 'POST',
      url: '/api/gemini/ocr',
      on: vi.fn((event, cb) => {
        if (event === 'data') cb(Buffer.from(JSON.stringify({ imageBase64: 'base64data', mimeType: 'image/png' })));
        if (event === 'end') cb();
      }),
    };

    mockFetch.mockRejectedValueOnce(new Error('Connection refused'));

    await handleOcrRequest(mockReqWithData as unknown as http.IncomingMessage, mockRes as http.ServerResponse);

    expect(mockRes.writeHead).toHaveBeenCalledWith(500, expect.any(Object));
  });

  it('should handle unsupported MIME type', async () => {
    const mockReqWithData = {
      method: 'POST',
      url: '/api/gemini/ocr',
      on: vi.fn((event, cb) => {
        if (event === 'data') cb(Buffer.from(JSON.stringify({ imageBase64: 'base64data', mimeType: 'application/pdf' })));
        if (event === 'end') cb();
      }),
    };

    await handleOcrRequest(mockReqWithData as unknown as http.IncomingMessage, mockRes as http.ServerResponse);

    expect(mockRes.writeHead).toHaveBeenCalledWith(400, expect.any(Object));
  });
});

describe('requestHandler (Production Server Routing)', () => {
  let mockReq: Partial<http.IncomingMessage>;
  let mockRes: Partial<http.ServerResponse>;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = process.env;
    process.env = { ...originalEnv, GEMINI_API_KEY: 'TEST_API_KEY' };
    mockRes = { end: vi.fn(), writeHead: vi.fn() };
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    process.env = originalEnv;
  });

  it('should serve index.html for root path', async () => {
    mockReq = { method: 'GET', url: '/' };
    await requestHandler(mockReq as http.IncomingMessage, mockRes as http.ServerResponse);
    expect(mockRes.writeHead).toHaveBeenCalledWith(200, expect.objectContaining({ 'Content-Type': 'text/html; charset=utf-8' }));
  });

  it('should return 404 for other /api/ paths', async () => {
    mockReq = { method: 'GET', url: '/api/some-other-endpoint' };
    await requestHandler(mockReq as http.IncomingMessage, mockRes as http.ServerResponse);
    expect(mockRes.writeHead).toHaveBeenCalledWith(404, expect.any(Object));
    expect(mockRes.end).toHaveBeenCalledWith(JSON.stringify({ error: 'not_found' }));
  });

  it('should handle file not found during static file serving', async () => {
    mockReq = { method: 'GET', url: '/non-existent.html' };
    const fs = await import('node:fs');
    vi.mocked(fs.default.existsSync).mockReturnValueOnce(false);

    await requestHandler(mockReq as http.IncomingMessage, mockRes as http.ServerResponse);
    expect(mockRes.writeHead).toHaveBeenCalledWith(404, expect.any(Object));
    expect(mockRes.end).toHaveBeenCalledWith('Not Found');
  });
});
