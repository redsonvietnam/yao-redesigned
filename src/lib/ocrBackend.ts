/**
 * Shared OCR backend logic for both dev-server proxy and production server.
 */

export const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

export const GEMINI_TIMEOUT_MS = 30_000;

export const OCR_PROMPT = [
  'Extract all visible text from this image.',
  'The image may contain Chinese characters (Hanzi), Yao/Dao script, or mixed Vietnamese/Chinese text.',
  'Return ONLY the extracted text, nothing else.',
  'Preserve the reading order (top-to-bottom for vertical text, left-to-right for horizontal).',
  'Do not add explanations, labels, or formatting.',
  'If no text is found, return an empty string.',
  'For handwritten characters, make your best recognition attempt.',
].join('\n');

export const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

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

export function validateOcrRequest(parsed: unknown) {
  if (!isRecord(parsed)) {
    return { error: 'invalid_request', message: 'Request body must be a JSON object.' };
  }
  const { imageBase64, mimeType = 'image/jpeg' } = parsed;

  if (typeof imageBase64 !== 'string' || imageBase64.length === 0) {
    return { error: 'invalid_request', message: 'imageBase64 is required and must be a non-empty string.' };
  }

  if (typeof mimeType !== 'string' || !ALLOWED_MIME_TYPES.has(mimeType)) {
    return {
      error: 'invalid_request',
      message: `mimeType must be one of: ${[...ALLOWED_MIME_TYPES].join(', ')}.`,
    };
  }

  return { data: { imageBase64: imageBase64 as string, mimeType: mimeType as string } };
}
