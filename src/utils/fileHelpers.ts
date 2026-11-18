export interface PreparedUpload {
  kind: 'image' | 'pdf' | 'text';
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  dataUrl?: string;
  textContent?: string;
}

const GEMINI_IMAGE_MIMES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/heic',
  'image/heif',
]);

export async function parseApiResponse<T = Record<string, unknown>>(resp: Response): Promise<T> {
  const raw = await resp.text();
  let parsed: Record<string, unknown> | null = null;
  try {
    parsed = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
  } catch {
    parsed = null;
  }

  if (!resp.ok) {
    const errMsg =
      (parsed && typeof parsed.error === 'string' && parsed.error) ||
      (raw && !raw.trim().startsWith('<') ? raw.slice(0, 240) : `Request failed with status ${resp.status}`);
    throw new Error(errMsg);
  }

  if (!parsed) {
    throw new Error('Server returned a non-JSON response. Please try again.');
  }

  return parsed as T;
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Unable to read file contents.'));
      }
    };
    reader.onerror = () => reject(new Error(`Failed to read ${file.name}.`));
    reader.readAsDataURL(file);
  });
}

function readAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = () => reject(new Error(`Failed to read text from ${file.name}.`));
    reader.readAsText(file);
  });
}

function normalizeImageViaCanvas(dataUrl: string, targetMime: string): Promise<{ dataUrl: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const maxDim = 1920;
      let width = img.naturalWidth || img.width || 1024;
      let height = img.naturalHeight || img.height || 768;
      if (width > maxDim || height > maxDim) {
        const scale = Math.min(maxDim / width, maxDim / height);
        width = Math.max(1, Math.round(width * scale));
        height = Math.max(1, Math.round(height * scale));
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Browser canvas unavailable for image conversion.'));
        return;
      }
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      const outMime = targetMime === 'image/png' ? 'image/png' : 'image/jpeg';
      const outUrl = canvas.toDataURL(outMime, 0.88);
      resolve({ dataUrl: outUrl, mimeType: outMime });
    };
    img.onerror = () => reject(new Error('Could not decode this image file. Try PNG, JPG, WebP, or PDF.'));
    img.src = dataUrl;
  });
}

export async function prepareUploadedFile(file: File): Promise<PreparedUpload> {
  if (file.size > 24 * 1024 * 1024) {
    throw new Error('File is larger than 24 MB. Please upload a file under 24 MB.');
  }

  const lowerName = file.name.toLowerCase();
  const mime = (file.type || '').toLowerCase();

  // PDF files
  if (mime === 'application/pdf' || lowerName.endsWith('.pdf')) {
    const dataUrl = await readAsDataUrl(file);
    return {
      kind: 'pdf',
      fileName: file.name,
      mimeType: 'application/pdf',
      sizeBytes: file.size,
      dataUrl,
    };
  }

  // Image files (normalize non-Gemini formats like SVG/BMP/GIF/AVIF or huge files > 3MB)
  if (
    mime.startsWith('image/') ||
    /\.(png|jpe?g|webp|gif|bmp|svg|avif|ico|tiff?)$/i.test(lowerName)
  ) {
    const rawDataUrl = await readAsDataUrl(file);
    const needsConversion = !GEMINI_IMAGE_MIMES.has(mime) || file.size > 3 * 1024 * 1024;
    if (needsConversion) {
      const converted = await normalizeImageViaCanvas(
        rawDataUrl,
        mime === 'image/png' || mime === 'image/svg+xml' ? 'image/png' : 'image/jpeg'
      );
      return {
        kind: 'image',
        fileName: file.name,
        mimeType: converted.mimeType,
        sizeBytes: file.size,
        dataUrl: converted.dataUrl,
      };
    }
    return {
      kind: 'image',
      fileName: file.name,
      mimeType: mime || 'image/png',
      sizeBytes: file.size,
      dataUrl: rawDataUrl,
    };
  }

  // Text, Email (.eml/.msg), HTML, CSV, JSON, Markdown, Logs, etc.
  const textContent = await readAsText(file);
  if (!textContent.trim()) {
    throw new Error(`No readable content found in "${file.name}".`);
  }
  return {
    kind: 'text',
    fileName: file.name,
    mimeType: mime || 'text/plain',
    sizeBytes: file.size,
    textContent: textContent.slice(0, 30000),
  };
}
