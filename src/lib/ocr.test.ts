import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { extractGeminiText } from '../vite-plugin-gemini-proxy';
import { performOcr } from './ocrService';

// ── extractGeminiText ──────────────────────────────────────────────

describe('extractGeminiText', () => {
  it('returns text from a valid Gemini response', () => {
    const data = {
      candidates: [
        {
          content: {
            parts: [{ text: '盤王天地' }],
          },
        },
      ],
    };
    expect(extractGeminiText(data)).toBe('盤王天地');
  });

  it('returns empty string for null', () => {
    expect(extractGeminiText(null)).toBe('');
  });

  it('returns empty string for undefined', () => {
    expect(extractGeminiText(undefined)).toBe('');
  });

  it('returns empty string for a string', () => {
    expect(extractGeminiText('hello')).toBe('');
  });

  it('returns empty string for an array', () => {
    expect(extractGeminiText([1, 2, 3])).toBe('');
  });

  it('returns empty string when candidates is missing', () => {
    expect(extractGeminiText({})).toBe('');
  });

  it('returns empty string when candidates is empty', () => {
    expect(extractGeminiText({ candidates: [] })).toBe('');
  });

  it('returns empty string when first candidate has no content', () => {
    expect(extractGeminiText({ candidates: [{}] })).toBe('');
  });

  it('returns empty string when content has no parts', () => {
    expect(extractGeminiText({ candidates: [{ content: {} }] })).toBe('');
  });

  it('returns empty string when parts is empty', () => {
    expect(extractGeminiText({ candidates: [{ content: { parts: [] } }] })).toBe('');
  });

  it('returns empty string when first part has no text', () => {
    expect(extractGeminiText({ candidates: [{ content: { parts: [{}] } }] })).toBe('');
  });

  it('returns empty string when text is a number', () => {
    const data = {
      candidates: [{ content: { parts: [{ text: 42 }] } }],
    };
    expect(extractGeminiText(data)).toBe('');
  });

  it('returns empty string when text is a boolean', () => {
    const data = {
      candidates: [{ content: { parts: [{ text: true }] } }],
    };
    expect(extractGeminiText(data)).toBe('');
  });

  it('returns empty string when candidates contains non-objects', () => {
    expect(extractGeminiText({ candidates: ['bad'] })).toBe('');
  });

  it('returns empty string when content is an array', () => {
    expect(extractGeminiText({ candidates: [{ content: [] }] })).toBe('');
  });

  it('returns raw text including whitespace (trimming is done at call site)', () => {
    const data = {
      candidates: [{ content: { parts: [{ text: '  盤王  ' }] } }],
    };
    expect(extractGeminiText(data)).toBe('  盤王  ');
  });
});

// ── performOcr client service ──────────────────────────────────────

describe('performOcr', () => {
  const fakeFile = new File(['fake'], 'test.png', { type: 'image/png' });

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    // Mock FileReader for base64 conversion
    vi.stubGlobal('FileReader', class {
      result: string | null = null;
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      readAsDataURL() {
        this.result = 'data:image/png;base64,YmFzZTY0';
        setTimeout(() => this.onload?.(), 0);
      }
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sends correct payload and returns text on success', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ text: '盤王' }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const result = await performOcr(fakeFile);

    expect(result.text).toBe('盤王');
    expect(mockFetch).toHaveBeenCalledOnce();
    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toBe('/api/gemini/ocr');
    expect(opts.method).toBe('POST');
    const body = JSON.parse(opts.body);
    expect(body.imageBase64).toBe('YmFzZTY0');
    expect(body.mimeType).toBe('image/png');
  });

  it('returns empty text when server returns empty string', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ text: '' }),
    }));

    const result = await performOcr(fakeFile);
    expect(result.text).toBe('');
  });

  it('returns empty text when response has no text field', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ something: 'else' }),
    }));

    const result = await performOcr(fakeFile);
    expect(result.text).toBe('');
  });

  it('throws on missing_api_key error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ error: 'missing_api_key', message: 'Key not configured' }),
    }));

    await expect(performOcr(fakeFile)).rejects.toThrow('Key not configured');
  });

  it('throws on gemini_api_error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 502,
      json: async () => ({ error: 'gemini_api_error', message: 'Gemini API returned 502' }),
    }));

    await expect(performOcr(fakeFile)).rejects.toThrow('Gemini API error');
  });

  it('throws on timeout error from server', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 504,
      json: async () => ({ error: 'timeout', message: 'Request timed out' }),
    }));

    await expect(performOcr(fakeFile)).rejects.toThrow('timed out');
  });

  it('throws on invalid JSON response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => { throw new Error('Unexpected token'); },
    }));

    await expect(performOcr(fakeFile)).rejects.toThrow('Invalid response');
  });

  it('throws on network error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network failure')));

    await expect(performOcr(fakeFile)).rejects.toThrow('Network failure');
  });

  it('throws on AbortError with timeout message', async () => {
    const abortError = new DOMException('The operation was aborted', 'AbortError');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(abortError));

    await expect(performOcr(fakeFile)).rejects.toThrow('timed out');
  });
});
