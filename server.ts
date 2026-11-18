import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const PRIMARY_MODEL = 'gemini-4-hydrogen';
const FALLBACK_MODEL = 'gemini-3.1-flash-lite';

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    throw new Error('GEMINI_API_KEY is not configured in environment secrets.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function languageInstruction(lang?: string): string {
  if (lang === 'hi') {
    return 'Respond with all natural-language explanations, summaries, feature details, and recommendations in Hindi (Devanagari script), while keeping verdict/threatLevel enum values strictly in English as defined by the schema.';
  }
  if (lang === 'mr') {
    return 'Respond with all natural-language explanations, summaries, feature details, and recommendations in Marathi (Devanagari script), while keeping verdict/threatLevel enum values strictly in English as defined by the schema.';
  }
  return 'Respond in clear, professional English.';
}

function stripDataUrlPrefix(input: string): { base64: string; detectedMime?: string } {
  const match = input.match(/^data:([^;]+);base64,(.*)$/s);
  if (match) {
    return {
      detectedMime: match[1].trim(),
      base64: match[2].replace(/\s+/g, ''),
    };
  }
  return {
    base64: input.replace(/^data:[^,]*,/, '').replace(/\s+/g, ''),
  };
}

function parseJsonSafe<T>(rawText: string | undefined, fallback: T): T {
  const text = (rawText ?? '').trim();
  if (!text) return fallback;
  const cleaned = text
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1)) as T;
      } catch {
        return fallback;
      }
    }
    return fallback;
  }
}

function isTransientUpstreamError(err: unknown): boolean {
  const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
  return (
    msg.includes('503') ||
    msg.includes('unavailable') ||
    msg.includes('high demand') ||
    msg.includes('429') ||
    msg.includes('resource_exhausted') ||
    msg.includes('500') ||
    msg.includes('internal') ||
    msg.includes('deadline') ||
    msg.includes('timeout') ||
    msg.includes('econnreset') ||
    msg.includes('fetch failed')
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let primaryCooldownUntil = 0;

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`${label} request timeout after ${ms}ms`));
    }, ms);
    promise.then(
      (val) => {
        clearTimeout(timer);
        resolve(val);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}

async function generateWithRetry(
  ai: GoogleGenAI,
  params: {
    contents: unknown;
    config?: Record<string, unknown>;
  }
) {
  const primaryConfig = {
    ...(params.config || {}),
    thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
  };

  let lastError: unknown;
  if (Date.now() >= primaryCooldownUntil) {
    try {
      return await withTimeout(
        ai.models.generateContent({
          model: PRIMARY_MODEL,
          contents: params.contents as never,
          config: primaryConfig as never,
        }),
        12000,
        PRIMARY_MODEL
      );
    } catch (err) {
      lastError = err;
      if (!isTransientUpstreamError(err)) {
        throw err;
      }
      primaryCooldownUntil = Date.now() + 60_000;
    }
  }

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      return await withTimeout(
        ai.models.generateContent({
          model: FALLBACK_MODEL,
          contents: params.contents as never,
          config: (params.config || {}) as never,
        }),
        15000,
        FALLBACK_MODEL
      );
    } catch (fallbackErr) {
      lastError = fallbackErr;
      if (!isTransientUpstreamError(fallbackErr) || attempt === 1) {
        throw fallbackErr;
      }
      await sleep(600);
    }
  }

  throw lastError;
}

interface DeterministicUrlSignals {
  normalizedUrl: string;
  hostname: string;
  urlLength: number;
  domainLength: number;
  usesHttps: boolean;
  subdomainCount: number;
  hasIpAddress: boolean;
  hasAtRedirect: boolean;
  hasDoubleSlashRedirect: boolean;
  hasPunycode: boolean;
  suspiciousKeywords: string[];
  characterReplacements: string[];
  impersonatedBrands: string[];
}

function extractUrlSignals(rawUrl: string): DeterministicUrlSignals {
  const trimmed = rawUrl.trim();
  const normalizedUrl = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;
  let parsed: URL | null = null;
  try {
    parsed = new URL(normalizedUrl);
  } catch {
    parsed = null;
  }

  const hostname = parsed ? parsed.hostname.toLowerCase() : trimmed.split('/')[0].toLowerCase();
  const usesHttps =
    /^https:\/\//i.test(trimmed) ||
    (parsed?.protocol === 'https:' && !/^http:\/\//i.test(trimmed));
  const parts = hostname.split('.').filter(Boolean);
  const subdomainCount = Math.max(0, parts.length - 2);
  const hasIpAddress = /^(?:\d{1,3}\.){3}\d{1,3}$/.test(hostname) || hostname.includes(':');
  const hasAtRedirect = trimmed.includes('@');
  const pathAndQuery = (parsed ? parsed.pathname + parsed.search : trimmed).toLowerCase();
  const hasDoubleSlashRedirect =
    pathAndQuery.includes('//') || /[?&](redirect|url|next|return|dest)=/i.test(trimmed);
  const hasPunycode = hostname.includes('xn--');

  const keywordList = [
    'login', 'verify', 'secure', 'account', 'update', 'confirm', 'wallet',
    'billing', 'suspended', 'urgent', 'password', 'signin', 'webscr', 'auth',
    'unlock', 'reward', 'claim', 'otp', 'kyc', 'paytm', 'upi',
  ];
  const lowerAll = trimmed.toLowerCase();
  const suspiciousKeywords = keywordList.filter((kw) => lowerAll.includes(kw));

  const replacementPatterns: Array<{ pattern: RegExp; label: string }> = [
    { pattern: /paypa1|payp@l/i, label: 'PayPal homoglyph (1/@ substitution)' },
    { pattern: /micros0ft|micr0soft|rnicrosoft/i, label: 'Microsoft character replacement (0/rn)' },
    { pattern: /g00gle|goog1e/i, label: 'Google digit substitution (0/1)' },
    { pattern: /app1e|appl3/i, label: 'Apple homoglyph substitution' },
    { pattern: /amaz0n|arnazon/i, label: 'Amazon character spoofing (0/rn)' },
    { pattern: /netf1ix|netfl1x/i, label: 'Netflix digit substitution' },
    { pattern: /[0-9]/g, label: 'Numeric characters in domain name' },
  ];

  const characterReplacements = replacementPatterns
    .filter((entry) => entry.pattern.test(hostname))
    .map((entry) => entry.label);

  const knownBrands = [
    { brand: 'PayPal', official: 'paypal.com' },
    { brand: 'Microsoft', official: 'microsoft.com' },
    { brand: 'Google', official: 'google.com' },
    { brand: 'Apple', official: 'apple.com' },
    { brand: 'Amazon', official: 'amazon.com' },
    { brand: 'Netflix', official: 'netflix.com' },
    { brand: 'Chase', official: 'chase.com' },
    { brand: 'HDFC Bank', official: 'hdfcbank.com' },
    { brand: 'SBI', official: 'onlinesbi.sbi' },
    { brand: 'Paytm', official: 'paytm.com' },
    { brand: 'Dropbox', official: 'dropbox.com' },
  ];

  const impersonatedBrands = knownBrands
    .filter((b) => {
      const token = b.brand.toLowerCase().replace(/\s+/g, '');
      const mentionsBrand =
        lowerAll.includes(token) ||
        (token === 'paypal' && /paypa1/i.test(lowerAll)) ||
        (token === 'amazon' && /amaz0n|arnazon/i.test(lowerAll)) ||
        (token === 'microsoft' && /micros0ft|rnicrosoft/i.test(lowerAll));
      const isOfficial = hostname === b.official || hostname.endsWith(`.${b.official}`);
      return mentionsBrand && !isOfficial;
    })
    .map((b) => b.brand);

  return {
    normalizedUrl,
    hostname,
    urlLength: trimmed.length,
    domainLength: hostname.length,
    usesHttps,
    subdomainCount,
    hasIpAddress,
    hasAtRedirect,
    hasDoubleSlashRedirect,
    hasPunycode,
    suspiciousKeywords,
    characterReplacements,
    impersonatedBrands,
  };
}

const analysisResponseSchema = {
  type: Type.OBJECT,
  properties: {
    verdict: { type: Type.STRING, enum: ['Safe', 'Suspicious', 'Phishing'] },
    threatLevel: { type: Type.STRING, enum: ['Safe', 'Low', 'Medium', 'High', 'Critical'] },
    confidenceScore: { type: Type.NUMBER },
    riskScore: { type: Type.NUMBER },
    senderTrustScore: { type: Type.NUMBER },
    extractedLinks: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    featureChecks: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          feature: { type: Type.STRING },
          status: { type: Type.STRING, enum: ['pass', 'warn', 'fail'] },
          detail: { type: Type.STRING },
        },
        required: ['feature', 'status', 'detail'],
      },
    },
    explainableAI: {
      type: Type.OBJECT,
      properties: {
        whyDetected: { type: Type.STRING },
        triggeredFeatures: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
        whatMakesSuspicious: { type: Type.STRING },
        nextSteps: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
      },
      required: ['whyDetected', 'triggeredFeatures', 'whatMakesSuspicious', 'nextSteps'],
    },
    recommendations: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
  },
  required: [
    'verdict',
    'threatLevel',
    'confidenceScore',
    'riskScore',
    'featureChecks',
    'explainableAI',
    'recommendations',
  ],
};

const screenshotResponseSchema = {
  type: Type.OBJECT,
  properties: {
    verdict: { type: Type.STRING, enum: ['Safe', 'Suspicious', 'Phishing'] },
    threatLevel: { type: Type.STRING, enum: ['Safe', 'Low', 'Medium', 'High', 'Critical'] },
    confidenceScore: { type: Type.NUMBER },
    riskScore: { type: Type.NUMBER },
    extractedLinks: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    featureChecks: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          feature: { type: Type.STRING },
          status: { type: Type.STRING, enum: ['pass', 'warn', 'fail'] },
          detail: { type: Type.STRING },
        },
        required: ['feature', 'status', 'detail'],
      },
    },
    highlightedRiskAreas: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          regionLabel: { type: Type.STRING },
          xPercent: { type: Type.NUMBER },
          yPercent: { type: Type.NUMBER },
          widthPercent: { type: Type.NUMBER },
          heightPercent: { type: Type.NUMBER },
          severity: { type: Type.STRING, enum: ['Safe', 'Low', 'Medium', 'High', 'Critical'] },
          explanation: { type: Type.STRING },
        },
        required: ['regionLabel', 'xPercent', 'yPercent', 'widthPercent', 'heightPercent', 'severity', 'explanation'],
      },
    },
    explainableAI: {
      type: Type.OBJECT,
      properties: {
        whyDetected: { type: Type.STRING },
        triggeredFeatures: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
        whatMakesSuspicious: { type: Type.STRING },
        nextSteps: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
      },
      required: ['whyDetected', 'triggeredFeatures', 'whatMakesSuspicious', 'nextSteps'],
    },
    recommendations: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
  },
  required: [
    'verdict',
    'threatLevel',
    'confidenceScore',
    'riskScore',
    'featureChecks',
    'highlightedRiskAreas',
    'explainableAI',
    'recommendations',
  ],
};

function normalizeAnalysisPayload(raw: Record<string, unknown>) {
  const verdict = ['Safe', 'Suspicious', 'Phishing'].includes(String(raw.verdict))
    ? (raw.verdict as 'Safe' | 'Suspicious' | 'Phishing')
    : 'Suspicious';
  const threatLevel = ['Safe', 'Low', 'Medium', 'High', 'Critical'].includes(String(raw.threatLevel))
    ? (raw.threatLevel as 'Safe' | 'Low' | 'Medium' | 'High' | 'Critical')
    : verdict === 'Safe'
      ? 'Safe'
      : 'Medium';
  const confidenceScore = Math.max(0, Math.min(100, Number(raw.confidenceScore ?? 85)));
  const riskScore = Math.max(0, Math.min(100, Number(raw.riskScore ?? (verdict === 'Safe' ? 5 : 65))));
  const exp = (raw.explainableAI as Record<string, unknown>) || {};

  return {
    ...raw,
    verdict,
    threatLevel,
    confidenceScore,
    riskScore,
    featureChecks: Array.isArray(raw.featureChecks) ? raw.featureChecks : [],
    highlightedRiskAreas: Array.isArray(raw.highlightedRiskAreas) ? raw.highlightedRiskAreas : [],
    extractedLinks: Array.isArray(raw.extractedLinks) ? raw.extractedLinks : [],
    explainableAI: {
      whyDetected: String(exp.whyDetected || 'Multi-signal security analysis completed.'),
      triggeredFeatures: Array.isArray(exp.triggeredFeatures) ? exp.triggeredFeatures.map(String) : [],
      whatMakesSuspicious: String(exp.whatMakesSuspicious || 'Inspect domain, sender, and requested credentials carefully.'),
      nextSteps: Array.isArray(exp.nextSteps) ? exp.nextSteps.map(String) : [],
    },
    recommendations: Array.isArray(raw.recommendations) ? raw.recommendations.map(String) : [],
  };
}

function unwrapUpstreamErrorMessage(raw: string): string {
  try {
    const parsed = JSON.parse(raw);
    if (parsed?.error?.message) return String(parsed.error.message);
    if (parsed?.message) return String(parsed.message);
  } catch {
    // not JSON
  }
  return raw;
}

function handleApiError(res: express.Response, err: unknown) {
  const rawMessage = err instanceof Error ? err.message : 'Unexpected analysis error';
  const message = unwrapUpstreamErrorMessage(rawMessage);
  const lower = message.toLowerCase();
  let status = 500;
  if (lower.includes('api_key') || lower.includes('permission_denied') || lower.includes('403')) {
    status = 403;
  } else if (lower.includes('429') || lower.includes('resource_exhausted')) {
    status = 429;
  } else if (lower.includes('503') || lower.includes('high demand') || lower.includes('unavailable')) {
    status = 503;
  } else if (lower.includes('400') || lower.includes('invalid')) {
    status = 400;
  }
  res.status(status).json({ error: message });
}

async function runUrlOrPayloadAnalysis(target: string, language?: string) {
  const signals = extractUrlSignals(target);
  const ai = getGeminiClient();

  const prompt = `Analyze the following URL or QR/link destination payload for phishing, typosquatting, brand impersonation, UPI/payment traps, redirect abuse, and credential harvesting risk.

Target Payload: ${target}
Extracted Deterministic Telemetry:
- Hostname: ${signals.hostname}
- Payload Length: ${signals.urlLength} chars
- Domain Length: ${signals.domainLength} chars
- Uses HTTPS: ${signals.usesHttps}
- Subdomain Depth: ${signals.subdomainCount}
- Raw IP Address Host: ${signals.hasIpAddress}
- Contains @ Redirect Operator: ${signals.hasAtRedirect}
- Redirect Query/Double-Slash Pattern: ${signals.hasDoubleSlashRedirect}
- Punycode / IDN Homograph: ${signals.hasPunycode}
- Suspicious Keywords Found: ${signals.suspiciousKeywords.join(', ') || 'None'}
- Character Replacements Detected: ${signals.characterReplacements.join(', ') || 'None'}
- Possible Brand Impersonation: ${signals.impersonatedBrands.join(', ') || 'None'}

Evaluate these 11 security dimensions in featureChecks:
1. URL Length
2. Domain Length
3. HTTPS & Transport Security
4. Suspicious Keywords
5. Subdomain Depth
6. Redirects & Obfuscation
7. Typosquatting & Homoglyphs
8. Domain Reputation
9. Brand Impersonation
10. Character Replacement
11. Overall Risk Indicators

Provide accurate confidenceScore (0-100) and riskScore (0-100), clear Explainable AI breakdown, and actionable recommendations. ${languageInstruction(language)}`;

  const response = await generateWithRetry(ai, {
    contents: prompt,
    config: {
      systemInstruction:
        'You are a Principal Threat Intelligence & Anti-Phishing Analyst. Classify URLs and QR payloads objectively without false alarms on legitimate domains like google.com, github.com, microsoft.com, or wikipedia.org, while rigorously flagging deceptive subdomains, typosquatting, UPI/QR payment traps, credential lures, and insecure HTTP login links.',
      responseMimeType: 'application/json',
      responseSchema: analysisResponseSchema,
    },
  });

  const parsed = normalizeAnalysisPayload(parseJsonSafe<Record<string, unknown>>(response.text, {}));
  return {
    ...parsed,
    signals,
  };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '35mb' }));

  app.use((err: unknown, _req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (err && typeof err === 'object' && 'type' in err && (err as { type?: string }).type === 'entity.too.large') {
      res.status(413).json({ error: 'Uploaded file exceeds the 35MB request limit. Please upload a smaller image or PDF.' });
      return;
    }
    if (err instanceof SyntaxError) {
      res.status(400).json({ error: 'Invalid JSON request payload.' });
      return;
    }
    next(err);
  });

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.post('/api/analyze/url', async (req, res) => {
    try {
      const { url, fileBase64, mimeType, fileName, language } = req.body as {
        url?: string;
        fileBase64?: string;
        mimeType?: string;
        fileName?: string;
        language?: string;
      };

      const trimmedUrl = (url || '').trim();
      if (!trimmedUrl && !fileBase64) {
        res.status(400).json({ error: 'Please enter a URL/domain or attach a file containing links to analyze.' });
        return;
      }

      if (trimmedUrl && !fileBase64) {
        if (trimmedUrl.length < 3 || trimmedUrl.length > 4096) {
          res.status(400).json({ error: 'Please provide a valid URL (3 to 4096 characters).' });
          return;
        }
        const result = await runUrlOrPayloadAnalysis(trimmedUrl, language);
        res.json(result);
        return;
      }

      // Multimodal URL extraction + inspection from uploaded PDF/image
      const ai = getGeminiClient();
      const { base64, detectedMime } = stripDataUrlPrefix(fileBase64!);
      const resolvedMime = mimeType || detectedMime || 'application/pdf';
      const response = await generateWithRetry(ai, {
        contents: {
          parts: [
            { inlineData: { mimeType: resolvedMime, data: base64 } },
            {
              text: `Extract any URLs, hyperlinks, or domains visible inside this uploaded file (${fileName || 'document'}) ${trimmedUrl ? `alongside user target "${trimmedUrl}"` : ''}. Analyze all found links for phishing, brand impersonation, typosquatting, and credential theft. Include the extracted URLs in extractedLinks. ${languageInstruction(language)}`,
            },
          ],
        },
        config: {
          systemInstruction:
            'You are a Principal Threat Intelligence & Anti-Phishing Analyst inspecting links embedded inside uploaded files and screenshots.',
          responseMimeType: 'application/json',
          responseSchema: analysisResponseSchema,
        },
      });
      const parsed = normalizeAnalysisPayload(parseJsonSafe<Record<string, unknown>>(response.text, {}));
      res.json(parsed);
    } catch (err) {
      handleApiError(res, err);
    }
  });

  app.post('/api/analyze/email', async (req, res) => {
    try {
      const { sender, subject, body, fileBase64, mimeType, fileName, language } = req.body as {
        sender?: string;
        subject?: string;
        body?: string;
        fileBase64?: string;
        mimeType?: string;
        fileName?: string;
        language?: string;
      };

      const trimmedBody = (body || '').trim();
      if (!trimmedBody && !subject?.trim() && !fileBase64) {
        res.status(400).json({ error: 'Please paste a message/email or attach a PDF, EML, TXT, or image file to analyze.' });
        return;
      }

      const combined = `Sender: ${sender || 'Unknown'}\nSubject: ${subject || 'No Subject'}\n\n${trimmedBody.slice(0, 20000)}`;
      const extractedLinks = Array.from(
        new Set(combined.match(/https?:\/\/[^\s<>"')]+/gi) || [])
      ).slice(0, 20);

      const ai = getGeminiClient();
      const promptText = `Analyze this email, message, or attached document for phishing, BEC (Business Email Compromise), SMS/WhatsApp smishing, social engineering, credential harvesting, and malicious attachments or links.

${combined}
${fileName ? `\nAttached File: ${fileName}` : ''}
Extracted Links (${extractedLinks.length}): ${extractedLinks.join(', ') || 'None'}

Evaluate these 7 checks in featureChecks:
1. Urgency Language
2. Threat or Coercion Language
3. Financial / Payment Keywords
4. Credential or OTP Requests
5. Malicious or Mismatched Links
6. Sender Trust & Spoofing Signals
7. Attachment & Payload Risk

Also output senderTrustScore (0-100, where 100 is highly trustworthy and 0 is spoofed/malicious), any links found inside extractedLinks, verdict, threatLevel, confidenceScore (0-100), riskScore (0-100), complete Explainable AI breakdown, and actionable recommendations. ${languageInstruction(language)}`;

      const contents = fileBase64
        ? (() => {
            const { base64, detectedMime } = stripDataUrlPrefix(fileBase64);
            return {
              parts: [
                {
                  inlineData: {
                    mimeType: mimeType || detectedMime || 'application/pdf',
                    data: base64,
                  },
                },
                { text: promptText },
              ],
            };
          })()
        : promptText;

      const response = await generateWithRetry(ai, {
        contents,
        config: {
          systemInstruction:
            'You are a Senior Email & Message Security Analyst. Perform deep forensic analysis on emails, SMS/chat messages, and attached PDFs or screenshots for urgency manipulation, sender spoofing, credential lures, and embedded URLs.',
          responseMimeType: 'application/json',
          responseSchema: analysisResponseSchema,
        },
      });

      const parsed = normalizeAnalysisPayload(parseJsonSafe<Record<string, unknown>>(response.text, {}));
      const mergedLinks = Array.from(
        new Set([...extractedLinks, ...(parsed.extractedLinks || [])])
      );
      res.json({
        ...parsed,
        extractedLinks: mergedLinks,
      });
    } catch (err) {
      handleApiError(res, err);
    }
  });

  app.post('/api/analyze/screenshot', async (req, res) => {
    try {
      const { imageBase64, mimeType, fileName, textContent, language } = req.body as {
        imageBase64?: string;
        mimeType?: string;
        fileName?: string;
        textContent?: string;
        language?: string;
      };
      if ((!imageBase64 || typeof imageBase64 !== 'string') && !textContent) {
        res.status(400).json({ error: 'Please upload a valid PNG, JPEG, WebP screenshot or PDF document.' });
        return;
      }

      const ai = getGeminiClient();
      const parts: Array<Record<string, unknown>> = [];

      if (imageBase64) {
        const { base64, detectedMime } = stripDataUrlPrefix(imageBase64);
        const resolvedMime = mimeType || detectedMime || 'image/png';
        parts.push({
          inlineData: {
            mimeType: resolvedMime,
            data: base64,
          },
        });
      }

      const isPdf = (mimeType || '').includes('pdf') || (imageBase64 || '').startsWith('data:application/pdf');
      parts.push({
        text: `${textContent ? `Document Text (${fileName || 'file'}):\n${textContent.slice(0, 20000)}\n\n` : ''}Inspect this ${isPdf ? 'PDF document' : 'webpage or application screenshot'} (${fileName || 'uploaded artifact'}) for visual phishing, fake login portals, fraudulent invoices/notices, brand imitation, suspicious credential harvesting forms, malicious links/QR codes, deceptive layouts, and scam indicators.

Check these 6 dimensions in featureChecks:
1. Login & Password Forms
2. Suspicious or Cloned Layouts
3. Sensitive Credential / Payment Fields
4. Brand Imitation & Logo Mismatch
5. Fake Security / Portal Warnings
6. Social Engineering & Fraud Patterns

In extractedLinks, list any URLs or domains detected inside the image or PDF.
In highlightedRiskAreas, identify up to 4 specific suspicious elements or sections ${isPdf ? '(use approximate page region percentages or 10,10,80,15 for document-wide indicators)' : 'using bounding coordinates in percentages (0 to 100 for xPercent, yPercent, widthPercent, heightPercent)'}. If safe, return an empty array. ${languageInstruction(language)}`,
      });

      const response = await generateWithRetry(ai, {
        contents: { parts },
        config: {
          systemInstruction:
            'You are a Computer Vision & Document Fraud Protection Specialist. Detect spoofed portals, cloned login pages, fraudulent PDF invoices/notices, mismatched URL bars, and deceptive UI patterns.',
          responseMimeType: 'application/json',
          responseSchema: screenshotResponseSchema,
        },
      });

      const parsed = normalizeAnalysisPayload(parseJsonSafe<Record<string, unknown>>(response.text, {}));
      res.json(parsed);
    } catch (err) {
      handleApiError(res, err);
    }
  });

  app.post('/api/analyze/qr', async (req, res) => {
    try {
      const { decodedPayload, imageBase64, mimeType, language } = req.body as {
        decodedPayload?: string;
        imageBase64?: string;
        mimeType?: string;
        language?: string;
      };

      let targetAddress = (decodedPayload || '').trim();
      const ai = getGeminiClient();

      if (!targetAddress && imageBase64) {
        const { base64, detectedMime } = stripDataUrlPrefix(imageBase64);
        const resolvedMime = mimeType || detectedMime || 'image/png';
        const extractResp = await generateWithRetry(ai, {
          contents: {
            parts: [
              {
                inlineData: {
                  mimeType: resolvedMime,
                  data: base64,
                },
              },
              {
                text: 'Inspect this image or PDF. Extract the QR code payload, UPI payment URI, or visible destination URL/address. Return ONLY the exact decoded payload string or URL (nothing else), or "UNREADABLE" if no QR code, UPI string, or URL is present.',
              },
            ],
          },
        });
        targetAddress = (extractResp.text ?? '').trim();
      }

      if (!targetAddress || targetAddress === 'UNREADABLE') {
        res.status(400).json({
          error: 'Could not extract a QR code, URL, or payment URI from this file. You can also paste the QR text/URL manually below.',
        });
        return;
      }

      const analysis = await runUrlOrPayloadAnalysis(targetAddress, language);
      res.json({
        ...analysis,
        destinationAddress: targetAddress,
      });
    } catch (err) {
      handleApiError(res, err);
    }
  });

  app.post('/api/assistant/chat', async (req, res) => {
    try {
      const { message, history, attachments, language } = req.body as {
        message?: string;
        history?: Array<{ role: 'user' | 'assistant'; content: string }>;
        attachments?: Array<{ name: string; mimeType: string; dataBase64?: string; textContent?: string }>;
        language?: string;
      };

      const hasAttachments = Array.isArray(attachments) && attachments.length > 0;
      if ((!message || typeof message !== 'string' || !message.trim()) && !hasAttachments) {
        res.status(400).json({ error: 'Please enter a message or attach a PDF, image, or text file.' });
        return;
      }

      const ai = getGeminiClient();
      const formattedHistory = (history || [])
        .slice(-8)
        .map((m) => `${m.role === 'user' ? 'User' : 'Analyst'}: ${m.content}`)
        .join('\n');

      const textAttachments = (attachments || [])
        .filter((a) => a.textContent)
        .map((a) => `--- Attached File (${a.name}) ---\n${a.textContent?.slice(0, 15000)}`)
        .join('\n\n');

      const promptText = [
        formattedHistory ? `Conversation Context:\n${formattedHistory}` : '',
        textAttachments,
        `Current User Request: ${(message || '').trim() || 'Please inspect the attached file(s) for phishing, scams, malicious links, or security risks and explain your verdict.'}`,
      ]
        .filter(Boolean)
        .join('\n\n');

      const parts: Array<Record<string, unknown>> = [];
      for (const att of attachments || []) {
        if (att.dataBase64) {
          const { base64, detectedMime } = stripDataUrlPrefix(att.dataBase64);
          parts.push({
            inlineData: {
              mimeType: att.mimeType || detectedMime || 'application/pdf',
              data: base64,
            },
          });
        }
      }
      parts.push({ text: promptText });

      const response = await generateWithRetry(ai, {
        contents: parts.length > 1 ? { parts } : promptText,
        config: {
          systemInstruction: `You are PhishShield AI Assistant, an enterprise cybersecurity advisor. Analyze any user messages, URLs, emails, images, or PDFs provided. Give clear, structured, practical guidance on phishing verdict, risk indicators, URL safety, Gmail/account hardening, Multi-Factor Authentication (MFA), QR code scams, and incident response. Keep responses concise, scannable with bullet points, and directly actionable. ${languageInstruction(language)}`,
        },
      });

      res.json({ reply: response.text ?? 'Unable to generate guidance at this moment.' });
    } catch (err) {
      handleApiError(res, err);
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`PhishShield AI Pro server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
