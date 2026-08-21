import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GEMINI_API_URL, OCR_PROMPT } from '../src/lib/ocrBackend';
import http from 'node:http';

// Mock dependencies before importing server
vi.mock('node:fs', () => ({
  default: {
    existsSync: vi.fn(() => true),
    statSync: vi.fn(() => ({ isDirectory: () => false })),
    readFileSync: vi.fn(() => Buffer.from('static file content')),
  },
}));
vi.mock('node:path', () => ({
  default: {
    join: vi.fn((...args) => args.join('/')),
    extname: vi.fn(p => '.html'),
    dirname: vi.fn(p => p),
    resolve: vi.fn((...args) => args.join('/')),
  },
}));
vi.mock('node:url', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:url')>();
  return {
    ...actual,
    pathToFileURL: vi.fn((p) => new URL(`file://${p}`)),
    fileURLToPath: vi.fn((url) => url.replace('file://', '')),
  };
});

import { handleOcrRequest, collectBody, sendJson } from '../server';

describe('handleOcrRequest (Production Server OCR Endpoint)', () => {
  let mockReq: Partial<http.IncomingMessage>;
  let mockRes: Partial<http.ServerResponse>;
  let mockSendJson: ReturnType<typeof vi.fn>;
  let mockFetch: ReturnType<typeof vi.fn>;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = process.env;
    process.env = { ...originalEnv, GEMINI_API_KEY: 'TEST_API_KEY' };

    mockReq = { method: 'POST', url: '/api/gemini/ocr' };
    mockRes = { end: vi.fn(), writeHead: vi.fn() };
    mockSendJson = vi.fn();
    mockFetch = vi.fn();

    vi.spyOn({ sendJson }, 'sendJson').mockImplementation(mockSendJson);
    vi.stubGlobal('fetch', mockFetch);
    vi.spyOn({ collectBody }, 'collectBody').mockResolvedValue(
      JSON.stringify({ imageBase64: 'test_base64', mimeType: 'image/png' })
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
    process.env = originalEnv;
  });

  it('should return 405 for non-POST requests', async () => {
    mockReq.method = 'GET';
    // We can test requestHandler or handleOcrRequest directly
    // Since handleOcrRequest checks method, let's call it:
    await handleOcrRequest(mockReq as http.IncomingMessage, mockRes as http.ServerResponse);
    // Note: sendJson is called internally via closure, let's verify res.writeHead / res.end instead if direct spy fails
    expect(mockRes.writeHead).toHaveBeenCalledWith(405, expect.any(Object));
  });

  it('should return 400 if API key is missing', async () => {
    process.env.GEMINI_API_KEY = '';
    await handleOcrRequest(mockReq as http.IncomingMessage, mockRes as http.ServerResponse);
    expect(mockRes.writeHead).toHaveBeenCalledWith(400, expect.any(Object));
  });

  it('should return 200 with extracted text on successful Gemini response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ candidates: [{ content: { parts: [{ text: '盤王天地' }] } }] }),
    });

    // Mock collectBody by stubbing the request stream if needed, but since it reads req.on('data'),
    // let's create a readable mock stream for req:
    const mockReqWithData = {
      method: 'POST',
      url: '/api/gemini/ocr',
      on: vi.fn((event, cb) => {
        if (event === 'data') {
          cb(Buffer.from(JSON.stringify({ imageBase64: 'base64data', mimeType: 'image/png' })));
        }
        if (event === 'end') {
          cb();
        }
      }),
    };

    await handleOcrRequest(mockReqWithData as unknown as http.IncomingMessage, mockRes as http.ServerResponse);

    expect(mockFetch).toHaveBeenCalledWith(
      `${GEMINI_API_URL}?key=TEST_API_KEY`,
      expect.objectContaining({ method: 'POST' })
    );
    expect(mockRes.writeHead).toHaveBeenCalledWith(200, expect.any(Object));
  });

  it('should handle Gemini API error responses', async () => {
    const mockReqWithData = {
      method: 'POST',
      url: '/api/gemini/ocr',
      on: vi.fn((event, cb) => {
        if (event === 'data') {
          cb(Buffer.from(JSON.stringify({ imageBase64: 'base64data', mimeType: 'image/png' })));
        }
        if (event === 'end') {
          cb();
        }
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
        if (event === 'data') {
          cb(Buffer.from(JSON.stringify({ imageBase64: 'base64data', mimeType: 'image/png' })));
        }
        if (event === 'end') {
          cb();
        }
      }),
    };

    // Simulate an AbortError (triggered by the upstream timeout)
    const abortError = new DOMException('The operation was aborted', 'AbortError');
    mockFetch.mockRejectedValueOnce(abortError);

    await handleOcrRequest(mockReqWithData as unknown as http.IncomingMessage, mockRes as http.ServerResponse);

    expect(mockRes.writeHead).toHaveBeenCalledWith(504, expect.any(Object));
  });

  it('should handle malformed Gemini API response', async () => {
    const mockReqWithData = {
      method: 'POST',
      url: '/api/gemini/ocr',
      on: vi.fn((event, cb) => {
        if (event === 'data') {
          cb(Buffer.from(JSON.stringify({ imageBase64: 'base64data', mimeType: 'image/png' })));
        }
        if (event === 'end') {
          cb();
        }
      }),
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ unexpected: 'structure' }),
    });

    await handleOcrRequest(mockReqWithData as unknown as http.IncomingMessage, mockRes as http.ServerResponse);

    expect(mockRes.writeHead).toHaveBeenCalledWith(200, expect.any(Object));
  });

  it('should handle network failure during Gemini API call', async () => {
    const mockReqWithData = {
      method: 'POST',
      url: '/api/gemini/ocr',
      on: vi.fn((event, cb) => {
        if (event === 'data') {
          cb(Buffer.from(JSON.stringify({ imageBase64: 'base64data', mimeType: 'image/png' })));
        }
        if (event === 'end') {
          cb();
        }
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
        if (event === 'data') {
          cb(Buffer.from(JSON.stringify({ imageBase64: 'base64data', mimeType: 'application/pdf' })));
        }
        if (event === 'end') {
          cb();
        }
      }),
    };

    await handleOcrRequest(mockReqWithData as unknown as http.IncomingMessage, mockRes as http.ServerResponse);

    expect(mockRes.writeHead).toHaveBeenCalledWith(400, expect.any(Object));
  });
});
