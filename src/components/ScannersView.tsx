import React, { useRef, useState } from 'react';
import jsQR from 'jsqr';
import {
  AlertTriangle,
  FileText,
  Globe,
  Loader2,
  Mail,
  Paperclip,
  QrCode,
  ScanEye,
  Upload,
  X,
} from 'lucide-react';
import {
  DEMO_EMAIL_BENCHMARK,
  DEMO_QR_BENCHMARK,
  DEMO_SCREENSHOT_BENCHMARK,
  DEMO_URL_BENCHMARK,
} from '../data/seedContent';
import { TranslationStrings } from '../i18n/translations';
import { LanguageCode, ScanAnalysisResult } from '../types';
import { parseApiResponse, PreparedUpload, prepareUploadedFile } from '../utils/fileHelpers';
import { ScanResultPanel } from './ScanResultPanel';

interface ScannerProps {
  language: LanguageCode;
  t: TranslationStrings;
  onScanComplete: (result: ScanAnalysisResult) => void;
  onExportPdf: (scan: ScanAnalysisResult) => void;
}

export function UrlScannerView({
  language,
  t,
  onScanComplete,
  onExportPdf,
}: ScannerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [urlInput, setUrlInput] = useState('');
  const [attachedFile, setAttachedFile] = useState<PreparedUpload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<ScanAnalysisResult | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    try {
      const prepared = await prepareUploadedFile(file);
      if (prepared.kind === 'text' && prepared.textContent) {
        const match = prepared.textContent.match(/https?:\/\/[^\s<>"')]+/i);
        if (match) {
          setUrlInput(match[0]);
        } else {
          setUrlInput(prepared.textContent.trim().slice(0, 500));
        }
        setAttachedFile(null);
      } else {
        setAttachedFile(prepared);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to read uploaded file.');
    } finally {
      e.target.value = '';
    }
  };

  const handleAnalyze = async (targetUrl?: string) => {
    const raw = (targetUrl ?? urlInput).trim();
    const extracted = raw.match(/https?:\/\/[^\s<>"')]+/i)?.[0] || raw;
    const urlToScan = extracted.trim();

    if (!urlToScan && !attachedFile) {
      setError('Please enter a URL or domain, or attach a PDF/image containing links.');
      return;
    }
    if (urlToScan) setUrlInput(urlToScan);
    setError('');
    setLoading(true);

    try {
      const resp = await fetch('/api/analyze/url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: urlToScan || undefined,
          fileBase64: attachedFile?.dataUrl,
          mimeType: attachedFile?.mimeType,
          fileName: attachedFile?.fileName,
          language,
        }),
      });
      const data = await parseApiResponse<Record<string, unknown>>(resp);

      const scanResult: ScanAnalysisResult = {
        id: `url_${Date.now()}`,
        scanType: 'url',
        targetSummary: urlToScan || attachedFile?.fileName || 'Uploaded Link Document',
        verdict: (data.verdict as ScanAnalysisResult['verdict']) || 'Suspicious',
        threatLevel: (data.threatLevel as ScanAnalysisResult['threatLevel']) || 'Medium',
        confidenceScore: Number(data.confidenceScore ?? 85),
        riskScore: Number(data.riskScore ?? 50),
        extractedLinks: Array.isArray(data.extractedLinks) ? (data.extractedLinks as string[]) : [],
        featureChecks: Array.isArray(data.featureChecks)
          ? (data.featureChecks as ScanAnalysisResult['featureChecks'])
          : [],
        explainableAI: data.explainableAI as ScanAnalysisResult['explainableAI'],
        recommendations: Array.isArray(data.recommendations)
          ? (data.recommendations as string[])
          : [],
        createdAt: new Date().toISOString(),
        status: 'completed',
      };
      setResult(scanResult);
      onScanComplete(scanResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to analyze URL.');
    } finally {
      setLoading(false);
    }
  };

  const loadDemoBenchmark = () => {
    setUrlInput(DEMO_URL_BENCHMARK.targetSummary);
    setAttachedFile(null);
    setError('');
    setResult({ ...DEMO_URL_BENCHMARK, createdAt: new Date().toISOString() });
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#101722] p-6 space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Globe className="w-5 h-5 text-[#00B0FF]" />
            <div>
              <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                {t.urlScanner}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Checks URL length, domain length, HTTPS, subdomains, keyword analysis, typosquatting, character replacement, redirections, brand impersonation, or links inside PDFs/images.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#161E29] text-xs font-semibold text-slate-800 dark:text-slate-100 hover:border-[#00B0FF] cursor-pointer"
            >
              <Paperclip className="w-3.5 h-3.5" />
              Attach PDF / Image
            </button>
            <button
              type="button"
              onClick={loadDemoBenchmark}
              className="px-3 py-1.5 rounded-lg border border-[#00B0FF]/40 bg-[#00B0FF]/10 text-[#0284C7] dark:text-[#00B0FF] text-xs font-semibold hover:bg-[#00B0FF]/20 cursor-pointer whitespace-nowrap"
            >
              Load Demo: amaz0n-security-login.net
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,application/pdf,.pdf,.txt,.eml,.html"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAnalyze();
          }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://amaz0n-security-login.net"
            className="flex-1 px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0B0F14] font-mono text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#00B0FF]"
          />
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#00E676] text-[#0B0F14] text-sm font-semibold hover:bg-[#00d46c] transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? t.analyzing : t.analyzeButton}
          </button>
        </form>

        {attachedFile && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#00B0FF]/40 bg-[#00B0FF]/10 text-xs text-slate-800 dark:text-slate-100">
            <FileText className="w-3.5 h-3.5 text-[#00B0FF]" />
            <span>Attached: {attachedFile.fileName}</span>
            <button
              type="button"
              onClick={() => setAttachedFile(null)}
              className="text-slate-400 hover:text-red-500 cursor-pointer"
              aria-label="Remove attachment"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-500 dark:text-slate-400">Live AI Presets:</span>
          {[
            { label: 'Amazon Homoglyph', url: 'https://amaz0n-security-login.net' },
            { label: 'PayPal Lookalike', url: 'https://paypal-account-check.net/verify' },
            { label: 'Google Safe', url: 'https://google.com' },
          ].map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => handleAnalyze(preset.url)}
              disabled={loading}
              className="px-3 py-1.5 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0B0F14] text-slate-700 dark:text-slate-300 hover:border-[#00B0FF] transition-colors cursor-pointer"
            >
              {preset.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="p-3.5 rounded-lg border border-red-500/30 bg-red-500/10 text-xs text-red-600 dark:text-[#FF5252] flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {result && <ScanResultPanel result={result} t={t} onExportPdf={onExportPdf} />}
    </div>
  );
}

export function EmailScannerView({
  language,
  t,
  onScanComplete,
  onExportPdf,
}: ScannerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [sender, setSender] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [attachedFile, setAttachedFile] = useState<PreparedUpload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<ScanAnalysisResult | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    try {
      const prepared = await prepareUploadedFile(file);
      if (prepared.kind === 'text' && prepared.textContent) {
        setBody((prev) =>
          prev.trim() ? `${prev}\n\n--- ${prepared.fileName} ---\n${prepared.textContent}` : prepared.textContent!
        );
        if (!subject.trim()) setSubject(prepared.fileName);
        setAttachedFile(null);
      } else {
        setAttachedFile(prepared);
        if (!subject.trim()) setSubject(prepared.fileName);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to process uploaded email/message file.');
    } finally {
      e.target.value = '';
    }
  };

  const handleAnalyze = async (preset?: { sender: string; subject: string; body: string }) => {
    const s = preset ? preset.sender : sender;
    const subj = preset ? preset.subject : subject;
    const b = preset ? preset.body : body;

    if (preset) {
      setSender(s);
      setSubject(subj);
      setBody(b);
      setAttachedFile(null);
    }

    if (!b.trim() && !subj.trim() && !attachedFile) {
      setError('Please paste an email/SMS/chat message or attach a PDF, EML, TXT, or screenshot.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const resp = await fetch('/api/analyze/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: s,
          subject: subj,
          body: b,
          fileBase64: attachedFile?.dataUrl,
          mimeType: attachedFile?.mimeType,
          fileName: attachedFile?.fileName,
          language,
        }),
      });
      const data = await parseApiResponse<Record<string, unknown>>(resp);

      const scanResult: ScanAnalysisResult = {
        id: `email_${Date.now()}`,
        scanType: 'email',
        targetSummary:
          subj.trim() ||
          attachedFile?.fileName ||
          b.trim().slice(0, 100) ||
          'Uploaded Email / Message',
        verdict: (data.verdict as ScanAnalysisResult['verdict']) || 'Suspicious',
        threatLevel: (data.threatLevel as ScanAnalysisResult['threatLevel']) || 'Medium',
        confidenceScore: Number(data.confidenceScore ?? 85),
        riskScore: Number(data.riskScore ?? 50),
        senderTrustScore:
          typeof data.senderTrustScore === 'number' ? data.senderTrustScore : undefined,
        extractedLinks: Array.isArray(data.extractedLinks)
          ? (data.extractedLinks as string[])
          : [],
        featureChecks: Array.isArray(data.featureChecks)
          ? (data.featureChecks as ScanAnalysisResult['featureChecks'])
          : [],
        explainableAI: data.explainableAI as ScanAnalysisResult['explainableAI'],
        recommendations: Array.isArray(data.recommendations)
          ? (data.recommendations as string[])
          : [],
        createdAt: new Date().toISOString(),
        status: 'completed',
      };
      setResult(scanResult);
      onScanComplete(scanResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to analyze email or message.');
    } finally {
      setLoading(false);
    }
  };

  const loadDemoBenchmark = () => {
    setSender('support@bankverify-check.com');
    setSubject('Your Bank Account Will Be Suspended');
    setBody(
      'URGENT: Your Bank Account Will Be Suspended within 24 hours due to incomplete KYC verification. Confirm your net-banking password and debit card PIN immediately at https://bankverify-check.com/restore-access to avoid permanent freeze.'
    );
    setAttachedFile(null);
    setError('');
    setResult({ ...DEMO_EMAIL_BENCHMARK, createdAt: new Date().toISOString() });
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#101722] p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5 text-[#00E676]" />
            <div>
              <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                {t.emailScanner}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Paste emails/SMS/messages or attach PDF, EML, TXT, or screenshot images to detect credential phishing and social engineering.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#161E29] text-xs font-semibold text-slate-800 dark:text-slate-100 hover:border-[#00B0FF] cursor-pointer"
            >
              <Paperclip className="w-3.5 h-3.5" />
              Attach PDF / EML / Image
            </button>
            <button
              type="button"
              onClick={loadDemoBenchmark}
              className="px-3 py-1.5 rounded-lg border border-[#00B0FF]/40 bg-[#00B0FF]/10 text-[#0284C7] dark:text-[#00B0FF] text-xs font-semibold hover:bg-[#00B0FF]/20 cursor-pointer whitespace-nowrap"
            >
              Load Demo: Bank Suspension Email
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.eml,.txt,.msg,.html,application/pdf,image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            type="text"
            value={sender}
            onChange={(e) => setSender(e.target.value)}
            placeholder="Sender (e.g. support@bankverify-check.com)"
            className="px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0B0F14] text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#00B0FF]"
          />
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject (e.g. Your Bank Account Will Be Suspended)"
            className="px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0B0F14] text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#00B0FF]"
          />
        </div>

        <textarea
          rows={6}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Paste the email, SMS, WhatsApp message, or attach a PDF / screenshot above..."
          className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0B0F14] text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#00B0FF]"
        />

        {attachedFile && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#00E676]/40 bg-[#00E676]/10 text-xs text-slate-800 dark:text-slate-100">
            <FileText className="w-3.5 h-3.5 text-[#00E676]" />
            <span>
              Attached ({attachedFile.kind.toUpperCase()}): {attachedFile.fileName}
            </span>
            <button
              type="button"
              onClick={() => setAttachedFile(null)}
              className="text-slate-400 hover:text-red-500 cursor-pointer"
              aria-label="Remove attachment"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-500 dark:text-slate-400">Live AI Samples:</span>
            <button
              type="button"
              onClick={() =>
                handleAnalyze({
                  sender: 'support@bankverify-check.com',
                  subject: 'Your Bank Account Will Be Suspended',
                  body: 'Your Bank Account Will Be Suspended within 24 hours unless you verify your account password, OTP, and card details immediately at https://bankverify-check.com/restore-access.',
                })
              }
              disabled={loading}
              className="px-3 py-1.5 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0B0F14] text-slate-700 dark:text-slate-300 hover:border-[#00B0FF] cursor-pointer"
            >
              Bank Phishing Sample
            </button>
            <button
              type="button"
              onClick={() =>
                handleAnalyze({
                  sender: 'GitHub <noreply@github.com>',
                  subject: 'Your weekly security digest',
                  body: 'Hello, No new Dependabot alerts were opened in your repositories this week. Review repository settings anytime at https://github.com/settings/security.',
                })
              }
              disabled={loading}
              className="px-3 py-1.5 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0B0F14] text-slate-700 dark:text-slate-300 hover:border-[#00B0FF] cursor-pointer"
            >
              Safe Digest Sample
            </button>
          </div>

          <button
            type="button"
            onClick={() => handleAnalyze()}
            disabled={loading}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#00E676] text-[#0B0F14] text-sm font-semibold hover:bg-[#00d46c] transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? t.analyzing : t.analyzeButton}
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-lg border border-red-500/30 bg-red-500/10 text-xs text-red-600 dark:text-[#FF5252] flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {result && <ScanResultPanel result={result} t={t} onExportPdf={onExportPdf} />}
    </div>
  );
}

export function ScreenshotAnalyzerView({
  language,
  t,
  onScanComplete,
  onExportPdf,
}: ScannerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploaded, setUploaded] = useState<PreparedUpload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<ScanAnalysisResult | null>(null);

  const processSelectedFile = async (file: File) => {
    setError('');
    setResult(null);
    try {
      const prepared = await prepareUploadedFile(file);
      setUploaded(prepared);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load uploaded file.');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processSelectedFile(file);
    e.target.value = '';
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) await processSelectedFile(file);
  };

  const generateSampleLoginScreenshot = (withDemoResult: boolean) => {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 500;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(0, 0, 800, 500);

    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(0, 0, 800, 44);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(90, 8, 620, 28);
    ctx.fillStyle = '#dc2626';
    ctx.font = '14px monospace';
    ctx.fillText('Not Secure | http://amaz0n-security-login.net/banking-verify', 104, 27);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(230, 90, 340, 340);
    ctx.strokeStyle = '#cbd5e1';
    ctx.strokeRect(230, 90, 340, 340);

    ctx.fillStyle = '#1d4ed8';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText('Account Verification Portal', 258, 140);

    ctx.fillStyle = '#dc2626';
    ctx.font = '13px sans-serif';
    ctx.fillText('URGENT: Account limited! Enter email & password.', 252, 175);

    ctx.strokeStyle = '#94a3b8';
    ctx.strokeRect(260, 200, 280, 38);
    ctx.fillStyle = '#64748b';
    ctx.font = '13px sans-serif';
    ctx.fillText('Email Address', 272, 224);

    ctx.strokeRect(260, 252, 280, 38);
    ctx.fillText('Password & PIN', 272, 276);

    ctx.fillStyle = '#2563eb';
    ctx.fillRect(260, 315, 280, 42);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('Verify Identity Immediately', 308, 341);

    const dataUrl = canvas.toDataURL('image/png');
    setUploaded({
      kind: 'image',
      fileName: 'sample_spoofed_portal.png',
      mimeType: 'image/png',
      sizeBytes: dataUrl.length,
      dataUrl,
    });
    setError('');
    if (withDemoResult) {
      setResult({ ...DEMO_SCREENSHOT_BENCHMARK, createdAt: new Date().toISOString() });
    }
  };

  const handleAnalyze = async () => {
    if (!uploaded) {
      setError('Please upload a website screenshot, PDF document, or file first.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const resp = await fetch('/api/analyze/screenshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: uploaded.dataUrl,
          mimeType: uploaded.mimeType,
          fileName: uploaded.fileName,
          textContent: uploaded.textContent,
          language,
        }),
      });
      const data = await parseApiResponse<Record<string, unknown>>(resp);

      const scanResult: ScanAnalysisResult = {
        id: `screen_${Date.now()}`,
        scanType: 'screenshot',
        targetSummary: uploaded.fileName || 'Uploaded Visual / PDF Artifact',
        verdict: (data.verdict as ScanAnalysisResult['verdict']) || 'Suspicious',
        threatLevel: (data.threatLevel as ScanAnalysisResult['threatLevel']) || 'Medium',
        confidenceScore: Number(data.confidenceScore ?? 85),
        riskScore: Number(data.riskScore ?? 50),
        extractedLinks: Array.isArray(data.extractedLinks)
          ? (data.extractedLinks as string[])
          : [],
        featureChecks: Array.isArray(data.featureChecks)
          ? (data.featureChecks as ScanAnalysisResult['featureChecks'])
          : [],
        highlightedRiskAreas: Array.isArray(data.highlightedRiskAreas)
          ? (data.highlightedRiskAreas as ScanAnalysisResult['highlightedRiskAreas'])
          : [],
        explainableAI: data.explainableAI as ScanAnalysisResult['explainableAI'],
        recommendations: Array.isArray(data.recommendations)
          ? (data.recommendations as string[])
          : [],
        createdAt: new Date().toISOString(),
        status: 'completed',
      };
      setResult(scanResult);
      onScanComplete(scanResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to inspect uploaded file.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6" onDragOver={(e) => e.preventDefault()} onDrop={handleDrop}>
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#101722] p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <ScanEye className="w-5 h-5 text-[#00B0FF]" />
            <div>
              <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                {t.screenshotAnalyzer} & PDF Inspector
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Upload screenshots (PNG, JPG, WebP, SVG), PDF documents/invoices, or email files to detect fake login forms, brand imitation, and scam traps.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => generateSampleLoginScreenshot(true)}
              className="px-3 py-2 rounded-lg border border-[#00B0FF]/40 bg-[#00B0FF]/10 text-[#0284C7] dark:text-[#00B0FF] text-xs font-semibold hover:bg-[#00B0FF]/20 cursor-pointer"
            >
              Load Demo Result (91% Risk)
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#161E29] text-xs font-semibold text-slate-900 dark:text-white hover:border-[#00B0FF] cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              Upload Image / PDF
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,application/pdf,.pdf,.txt,.eml,.html"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {uploaded ? (
          <div className="space-y-4">
            {uploaded.kind === 'image' && uploaded.dataUrl ? (
              <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-black/40 max-w-3xl">
                <img
                  src={uploaded.dataUrl}
                  alt="Uploaded webpage screenshot"
                  referrerPolicy="no-referrer"
                  className="w-full h-auto block"
                />
                {result?.highlightedRiskAreas?.map((area, idx) => (
                  <div
                    key={idx}
                    style={{
                      left: `${Math.max(0, Math.min(92, area.xPercent))}%`,
                      top: `${Math.max(0, Math.min(92, area.yPercent))}%`,
                      width: `${Math.max(6, Math.min(100 - area.xPercent, area.widthPercent))}%`,
                      height: `${Math.max(6, Math.min(100 - area.yPercent, area.heightPercent))}%`,
                    }}
                    title={area.explanation}
                    className="absolute border-2 border-[#FF5252] bg-[#FF5252]/15 pointer-events-none"
                  >
                    <span className="inline-block px-1.5 py-0.5 bg-[#FF5252] text-white text-[10px] font-semibold">
                      {area.regionLabel}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0B0F14] p-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-lg bg-[#00B0FF]/15 border border-[#00B0FF]/30 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-[#00B0FF]" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                      {uploaded.fileName}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                      {uploaded.mimeType} · {(uploaded.sizeBytes / 1024).toFixed(1)} KB · Ready for AI inspection
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setUploaded(null);
                    setResult(null);
                  }}
                  className="p-2 rounded-lg text-slate-400 hover:text-red-500 cursor-pointer"
                  aria-label="Remove uploaded file"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {result?.highlightedRiskAreas && result.highlightedRiskAreas.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {result.highlightedRiskAreas.map((area, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg border border-red-500/30 bg-red-500/5 text-xs"
                  >
                    <div className="font-semibold text-red-600 dark:text-[#FF5252]">
                      {area.regionLabel} ({area.severity})
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 mt-1">{area.explanation}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-[#00B0FF] cursor-pointer"
              >
                Change File
              </button>
              <button
                type="button"
                onClick={handleAnalyze}
                disabled={loading}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#00E676] text-[#0B0F14] text-sm font-semibold hover:bg-[#00d46c] cursor-pointer disabled:opacity-60"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? t.analyzing : t.analyzeButton}
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-12 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0B0F14] flex flex-col items-center justify-center gap-2 text-slate-500 dark:text-slate-400 hover:border-[#00B0FF] transition-colors cursor-pointer"
          >
            <Upload className="w-6 h-6 text-[#00B0FF]" />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
              Drop or click to upload Screenshot (PNG, JPG, WebP) or PDF Document
            </span>
            <span className="text-xs">Or click &ldquo;Load Demo Result (91% Risk)&rdquo; above</span>
          </button>
        )}

        {error && (
          <div className="p-3.5 rounded-lg border border-red-500/30 bg-red-500/10 text-xs text-red-600 dark:text-[#FF5252] flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {result && <ScanResultPanel result={result} t={t} onExportPdf={onExportPdf} />}
    </div>
  );
}

export function QrScannerView({
  language,
  t,
  onScanComplete,
  onExportPdf,
}: ScannerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploaded, setUploaded] = useState<PreparedUpload | null>(null);
  const [decodedText, setDecodedText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<ScanAnalysisResult | null>(null);

  const decodeQrFromDataUrl = (dataUrl: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve('');
          return;
        }
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        resolve(code?.data || '');
      };
      img.onerror = () => resolve('');
      img.src = dataUrl;
    });
  };

  const processQrFile = async (file: File) => {
    setError('');
    try {
      const prepared = await prepareUploadedFile(file);
      setUploaded(prepared);
      if (prepared.kind === 'image' && prepared.dataUrl) {
        const localDecoded = await decodeQrFromDataUrl(prepared.dataUrl);
        setDecodedText(localDecoded);
      } else if (prepared.kind === 'text' && prepared.textContent) {
        setDecodedText(prepared.textContent.trim().slice(0, 500));
      } else {
        setDecodedText('');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to read QR file.');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processQrFile(file);
    e.target.value = '';
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) await processQrFile(file);
  };

  const handleAnalyze = async (overridePayload?: string) => {
    const payload = (overridePayload ?? decodedText).trim();
    if (!payload && !uploaded?.dataUrl) {
      setError('Upload a QR image / PDF or enter a decoded QR payload / URL to inspect.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const resp = await fetch('/api/analyze/qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decodedPayload: payload,
          imageBase64: uploaded?.dataUrl,
          mimeType: uploaded?.mimeType || 'image/png',
          language,
        }),
      });
      const data = await parseApiResponse<Record<string, unknown>>(resp);

      if (typeof data.destinationAddress === 'string' && data.destinationAddress) {
        setDecodedText(data.destinationAddress);
      }

      const scanResult: ScanAnalysisResult = {
        id: `qr_${Date.now()}`,
        scanType: 'qr',
        targetSummary:
          String(data.destinationAddress || payload || uploaded?.fileName || 'QR Code'),
        destinationAddress: String(data.destinationAddress || payload || ''),
        verdict: (data.verdict as ScanAnalysisResult['verdict']) || 'Suspicious',
        threatLevel: (data.threatLevel as ScanAnalysisResult['threatLevel']) || 'Medium',
        confidenceScore: Number(data.confidenceScore ?? 85),
        riskScore: Number(data.riskScore ?? 50),
        featureChecks: Array.isArray(data.featureChecks)
          ? (data.featureChecks as ScanAnalysisResult['featureChecks'])
          : [],
        explainableAI: data.explainableAI as ScanAnalysisResult['explainableAI'],
        recommendations: Array.isArray(data.recommendations)
          ? (data.recommendations as string[])
          : [],
        createdAt: new Date().toISOString(),
        status: 'completed',
      };
      setResult(scanResult);
      onScanComplete(scanResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to analyze QR code.');
    } finally {
      setLoading(false);
    }
  };

  const loadDemoBenchmark = () => {
    setDecodedText(DEMO_QR_BENCHMARK.destinationAddress || '');
    setUploaded(null);
    setError('');
    setResult({ ...DEMO_QR_BENCHMARK, createdAt: new Date().toISOString() });
  };

  return (
    <div className="space-y-6" onDragOver={(e) => e.preventDefault()} onDrop={handleDrop}>
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#101722] p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <QrCode className="w-5 h-5 text-[#00E676]" />
            <div>
              <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                {t.qrScanner}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Extracts destination URLs or UPI payment strings safely from QR images or PDFs without opening them.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={loadDemoBenchmark}
              className="px-3 py-2 rounded-lg border border-[#00B0FF]/40 bg-[#00B0FF]/10 text-[#0284C7] dark:text-[#00B0FF] text-xs font-semibold hover:bg-[#00B0FF]/20 cursor-pointer"
            >
              Load Demo: Paytm QR Trap
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#161E29] text-xs font-semibold text-slate-900 dark:text-white hover:border-[#00B0FF] cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              Upload QR Image / PDF
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,application/pdf,.pdf"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
          <div className="md:col-span-4">
            {uploaded?.kind === 'image' && uploaded.dataUrl ? (
              <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white p-3 flex items-center justify-center">
                <img
                  src={uploaded.dataUrl}
                  alt="Uploaded QR code"
                  referrerPolicy="no-referrer"
                  className="max-h-44 object-contain"
                />
              </div>
            ) : uploaded ? (
              <div className="h-44 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0B0F14] p-4 flex flex-col items-center justify-center text-center gap-2">
                <FileText className="w-7 h-7 text-[#00B0FF]" />
                <span className="text-xs font-semibold text-slate-800 dark:text-white truncate max-w-full">
                  {uploaded.fileName}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  PDF ready for QR & link extraction
                </span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-44 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0B0F14] flex flex-col items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400 hover:border-[#00B0FF] cursor-pointer"
              >
                <QrCode className="w-7 h-7 text-[#00B0FF]" />
                <span>Upload QR PNG / JPG / PDF</span>
              </button>
            )}
          </div>

          <div className="md:col-span-8 space-y-3">
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
              Extracted Destination Address or Payload (optional if image/PDF attached)
            </label>
            <input
              type="text"
              value={decodedText}
              onChange={(e) => setDecodedText(e.target.value)}
              placeholder="https://secure-paytm-verification.net"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0B0F14] font-mono text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#00B0FF]"
            />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  const sample = 'https://secure-paytm-verification.net';
                  setDecodedText(sample);
                  handleAnalyze(sample);
                }}
                disabled={loading}
                className="px-3 py-1.5 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0B0F14] text-xs text-slate-700 dark:text-slate-300 hover:border-[#00B0FF] cursor-pointer"
              >
                Live AI Scan: Paytm QR URL
              </button>
              <button
                type="button"
                onClick={() => handleAnalyze()}
                disabled={loading}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#00E676] text-[#0B0F14] text-sm font-semibold hover:bg-[#00d46c] cursor-pointer disabled:opacity-60"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? t.analyzing : t.analyzeButton}
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-3.5 rounded-lg border border-red-500/30 bg-red-500/10 text-xs text-red-600 dark:text-[#FF5252] flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {result && <ScanResultPanel result={result} t={t} onExportPdf={onExportPdf} />}
    </div>
  );
}
