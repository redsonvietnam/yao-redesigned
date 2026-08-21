export interface OcrResult {
  text: string;
}

export interface OcrError {
  error: string;
  message: string;
}

const OCR_ENDPOINT = '/api/gemini/ocr';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const FETCH_TIMEOUT_MS = 60_000;

function fileToBase64(file: File): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      reject(new Error(`Unsupported file type: ${file.type}. Use JPG, PNG, or WEBP.`));
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      reject(new Error(`File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB. Maximum is 10MB.`));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(',')[1];
      resolve({ base64, mimeType: file.type });
    };
    reader.onerror = () => reject(new Error('Failed to read file.'));
    reader.readAsDataURL(file);
  });
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

export async function performOcr(file: File): Promise<OcrResult> {
  const { base64, mimeType } = await fileToBase64(file);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(OCR_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64: base64, mimeType }),
      signal: controller.signal,
    });
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error(`OCR request timed out after ${FETCH_TIMEOUT_MS / 1000} seconds. The image may be too large or the server is unreachable.`);
    }
    throw new Error(err instanceof Error ? err.message : 'Network error. Check your connection and try again.');
  } finally {
    clearTimeout(timeoutId);
  }

  let data: unknown;
  try {
    data = await res.json();
  } catch {
    throw new Error('Invalid response from server.');
  }

  if (!res.ok) {
    if (!isRecord(data)) {
      throw new Error(`Request failed with status ${res.status}`);
    }
    const errData = data as unknown as OcrError;
    if (errData.error === 'missing_api_key') {
      throw new Error(errData.message);
    }
    if (errData.error === 'gemini_api_error') {
      throw new Error(`Gemini API error (${errData.message}). Check your API key and try again.`);
    }
    if (errData.error === 'invalid_request') {
      throw new Error(errData.message);
    }
    if (errData.error === 'timeout') {
      throw new Error(errData.message);
    }
    throw new Error(errData.message || `Request failed with status ${res.status}`);
  }

  if (!isRecord(data)) {
    return { text: '' };
  }
  const text = typeof data.text === 'string' ? data.text : '';
  return { text: text.trim() };
}
