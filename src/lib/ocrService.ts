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

export async function performOcr(file: File): Promise<OcrResult> {
  const { base64, mimeType } = await fileToBase64(file);

  const res = await fetch(OCR_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageBase64: base64, mimeType }),
  });

  const data = await res.json();

  if (!res.ok) {
    const errData = data as OcrError;
    if (errData.error === 'missing_api_key') {
      throw new Error(errData.message);
    }
    if (errData.error === 'gemini_api_error') {
      throw new Error(`Gemini API error (${errData.message}). Check your API key and try again.`);
    }
    if (errData.error === 'invalid_request') {
      throw new Error(errData.message);
    }
    throw new Error(errData.message || `Request failed with status ${res.status}`);
  }

  const result = data as OcrResult;
  return { text: result.text ?? '' };
}
