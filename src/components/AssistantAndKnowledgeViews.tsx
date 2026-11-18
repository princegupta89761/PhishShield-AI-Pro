import React, { useRef, useState } from 'react';
import {
  ArrowUpDown,
  BookOpen,
  Bot,
  Clock,
  Download,
  ExternalLink,
  FileText,
  Loader2,
  Lock,
  Paperclip,
  Radar,
  Search,
  Send,
  Trash2,
  X,
} from 'lucide-react';
import { TranslationStrings } from '../i18n/translations';
import {
  AssistantMessage,
  LanguageCode,
  LearningArticleItem,
  ScanAnalysisResult,
  ScanType,
  ThreatIntelItem,
} from '../types';
import { parseApiResponse, PreparedUpload, prepareUploadedFile } from '../utils/fileHelpers';
import { ThreatLevelIndicator, VerdictIndicator } from './SeverityBadge';

export function AiAssistantView({
  language,
  t,
}: {
  language: LanguageCode;
  t: TranslationStrings;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [messages, setMessages] = useState<AssistantMessage[]>([
    {
      id: 'welcome_1',
      role: 'assistant',
      content:
        'Ask me anything or attach a PDF, screenshot, image, or email/text file. I can inspect suspicious messages, explain phishing tactics, or help harden your accounts.',
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<PreparedUpload[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const starterQuestions = [
    'How do phishing attacks work?',
    'How do scammers steal OTPs?',
    'What is QR phishing?',
    'Is this email safe?',
    'How do I protect my Gmail Account?',
  ];

  const handleAttachFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError('');
    try {
      const preparedList: PreparedUpload[] = [];
      for (const file of Array.from(files).slice(0, 3)) {
        preparedList.push(await prepareUploadedFile(file));
      }
      setAttachments((prev) => [...prev, ...preparedList].slice(0, 3));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to attach file.');
    }
  };

  const sendMessage = async (textOverride?: string) => {
    const text = (textOverride ?? input).trim();
    const currentAttachments = textOverride ? [] : attachments;
    if ((!text && currentAttachments.length === 0) || loading) return;

    const attachmentLabel =
      currentAttachments.length > 0
        ? `[Attached: ${currentAttachments.map((a) => a.fileName).join(', ')}]`
        : '';

    const displayContent = [text, attachmentLabel].filter(Boolean).join('\n');

    const userMsg: AssistantMessage = {
      id: `u_${Date.now()}`,
      role: 'user',
      content: displayContent,
      timestamp: new Date().toISOString(),
    };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    if (!textOverride) {
      setInput('');
      setAttachments([]);
    }
    setError('');
    setLoading(true);

    try {
      const resp = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: nextMessages.slice(-8).map((m) => ({ role: m.role, content: m.content })),
          attachments: currentAttachments.map((a) => ({
            name: a.fileName,
            mimeType: a.mimeType,
            dataBase64: a.dataUrl,
            textContent: a.textContent,
          })),
          language,
        }),
      });
      const data = await parseApiResponse<{ reply?: string }>(resp);

      setMessages((prev) => [
        ...prev,
        {
          id: `a_${Date.now()}`,
          role: 'assistant',
          content: data.reply || 'Inspection completed.',
          timestamp: new Date().toISOString(),
        },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Assistant error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#101722] flex flex-col h-[calc(100vh-11rem)] min-h-[520px]"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        handleAttachFiles(e.dataTransfer.files);
      }}
    >
      <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Bot className="w-5 h-5 text-[#00E676]" />
          <div>
            <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
              {t.aiAssistant}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Powered by Gemini API · Accepts text messages, PDFs, screenshots, and email files
            </p>
          </div>
        </div>
      </div>

      <div className="px-6 py-3 border-b border-slate-200 dark:border-slate-800 flex flex-wrap gap-2 bg-slate-50 dark:bg-[#0B0F14]">
        {starterQuestions.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => sendMessage(q)}
            disabled={loading}
            className="text-xs px-3 py-1.5 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#101722] text-slate-700 dark:text-slate-300 hover:border-[#00B0FF] transition-colors cursor-pointer"
          >
            {q}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-2xl rounded-xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-[#00B0FF]/15 border border-[#00B0FF]/30 text-slate-900 dark:text-slate-100'
                  : 'bg-slate-50 dark:bg-[#0B0F14] border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <Loader2 className="w-4 h-4 animate-spin text-[#00E676]" />
            <span>Analyzing message and attachments...</span>
          </div>
        )}
        {error && (
          <div className="p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-xs text-red-600 dark:text-[#FF5252]">
            {error}
          </div>
        )}
      </div>

      {attachments.length > 0 && (
        <div className="px-4 py-2 border-t border-slate-200 dark:border-slate-800 flex flex-wrap gap-2 bg-slate-50 dark:bg-[#0B0F14]">
          {attachments.map((att, idx) => (
            <span
              key={`${att.fileName}-${idx}`}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-[#00B0FF]/40 bg-[#00B0FF]/10 text-xs text-slate-800 dark:text-slate-100"
            >
              <FileText className="w-3.5 h-3.5 text-[#00B0FF]" />
              <span className="max-w-[180px] truncate">{att.fileName}</span>
              <button
                type="button"
                onClick={() =>
                  setAttachments((prev) => prev.filter((_, i) => i !== idx))
                }
                className="text-slate-400 hover:text-red-500 cursor-pointer"
                aria-label="Remove attachment"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage();
        }}
        className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2.5"
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,application/pdf,.pdf,.txt,.eml,.msg,.html"
          onChange={(e) => {
            handleAttachFiles(e.target.files);
            e.target.value = '';
          }}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={loading}
          className="p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0B0F14] text-slate-600 dark:text-slate-300 hover:border-[#00B0FF] cursor-pointer"
          title="Attach PDF, image, or text/email file"
          aria-label="Attach PDF, image, or text file"
        >
          <Paperclip className="w-4 h-4" />
        </button>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question or attach a PDF, image, or suspicious message..."
          className="flex-1 px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0B0F14] text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#00B0FF]"
        />
        <button
          type="submit"
          disabled={loading || (!input.trim() && attachments.length === 0)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#00E676] text-[#0B0F14] text-sm font-semibold hover:bg-[#00d46c] cursor-pointer disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
          Send
        </button>
      </form>
    </div>
  );
}

export function ScanHistoryView({
  scans,
  isGuest,
  onOpenAuth,
  onStartScan,
  t,
  onExportPdf,
  onDeleteScan,
}: {
  scans: ScanAnalysisResult[];
  isGuest: boolean;
  onOpenAuth: () => void;
  onStartScan: () => void;
  t: TranslationStrings;
  onExportPdf: (scan: ScanAnalysisResult) => void;
  onDeleteScan: (scanId: string) => void;
}) {
  const [filter, setFilter] = useState<'all' | ScanType>('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'confidence' | 'threat'>('date');
  const [sortAsc, setSortAsc] = useState(false);
  const [selectedScan, setSelectedScan] = useState<ScanAnalysisResult | null>(null);

  if (isGuest) {
    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#101722] p-10 text-center max-w-xl mx-auto space-y-4">
        <div className="w-12 h-12 rounded-xl bg-[#00B0FF]/15 border border-[#00B0FF]/30 flex items-center justify-center mx-auto">
          <Lock className="w-6 h-6 text-[#00B0FF]" />
        </div>
        <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
          Scan History & PDF Reports Require User Login
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          Guest users can run all live AI scanners, Threat Intelligence, and the Learning Hub. Sign in to save scan history, view personal analytics, and export PDF threat reports.
        </p>
        <button
          type="button"
          onClick={onOpenAuth}
          className="px-5 py-2.5 rounded-lg bg-[#00E676] text-[#0B0F14] text-xs font-semibold hover:bg-[#00d46c] cursor-pointer"
        >
          Sign In to Unlock Scan History
        </button>
      </div>
    );
  }

  const threatRank: Record<string, number> = {
    Safe: 0,
    Low: 1,
    Medium: 2,
    High: 3,
    Critical: 4,
  };

  const filtered = scans
    .filter((s) => {
      const matchesType = filter === 'all' || s.scanType === filter;
      const q = search.trim().toLowerCase();
      const matchesQuery =
        !q ||
        s.targetSummary.toLowerCase().includes(q) ||
        s.verdict.toLowerCase().includes(q) ||
        s.threatLevel.toLowerCase().includes(q);
      return matchesType && matchesQuery;
    })
    .sort((a, b) => {
      let diff = 0;
      if (sortBy === 'date') {
        diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (sortBy === 'confidence') {
        diff = a.confidenceScore - b.confidenceScore;
      } else {
        diff = (threatRank[a.threatLevel] ?? 0) - (threatRank[b.threatLevel] ?? 0);
      }
      return sortAsc ? diff : -diff;
    });

  const toggleSort = (col: 'date' | 'confidence' | 'threat') => {
    if (sortBy === col) {
      setSortAsc(!sortAsc);
    } else {
      setSortBy(col);
      setSortAsc(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#101722] p-6 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
              {t.scanHistory}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Complete log of analyzed artifacts with search, filtering, sorting, and PDF export
            </p>
          </div>

          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search domain, email, or verdict..."
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0B0F14] text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#00B0FF]"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-[#0B0F14] w-fit">
            {(
              [
                { id: 'all', label: 'All' },
                { id: 'url', label: 'URL' },
                { id: 'email', label: 'Email' },
                { id: 'screenshot', label: 'Screenshot' },
                { id: 'qr', label: 'QR' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                  filter === tab.id
                    ? 'bg-white dark:bg-[#161E29] text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span>Sort:</span>
            <button
              type="button"
              onClick={() => toggleSort('date')}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded border cursor-pointer ${
                sortBy === 'date'
                  ? 'border-[#00B0FF] text-[#0284C7] dark:text-[#00B0FF]'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              Date <ArrowUpDown className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={() => toggleSort('threat')}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded border cursor-pointer ${
                sortBy === 'threat'
                  ? 'border-[#00B0FF] text-[#0284C7] dark:text-[#00B0FF]'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              Threat Level <ArrowUpDown className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={() => toggleSort('confidence')}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded border cursor-pointer ${
                sortBy === 'confidence'
                  ? 'border-[#00B0FF] text-[#0284C7] dark:text-[#00B0FF]'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              Confidence <ArrowUpDown className="w-3 h-3" />
            </button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              No scans match your filter. Start your first scan to generate cybersecurity insights.
            </p>
            <button
              type="button"
              onClick={onStartScan}
              className="px-4 py-2 rounded-lg bg-[#00E676] text-[#0B0F14] text-xs font-semibold cursor-pointer"
            >
              Start Scanning
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                  <th className="py-3 pr-4 font-medium">Date</th>
                  <th className="py-3 pr-4 font-medium">Type</th>
                  <th className="py-3 pr-4 font-medium">Target</th>
                  <th className="py-3 pr-4 font-medium">Threat Level</th>
                  <th className="py-3 pr-4 font-medium">Result</th>
                  <th className="py-3 pr-4 font-medium">Confidence</th>
                  <th className="py-3 pr-4 font-medium">Status</th>
                  <th className="py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/70 text-xs">
                {filtered.map((scan) => (
                  <tr
                    key={scan.id}
                    className="hover:bg-slate-50 dark:hover:bg-[#161E29]/60 transition-colors"
                  >
                    <td className="py-3 pr-4 font-mono tabular-nums text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {new Date(scan.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 pr-4 uppercase font-mono text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      {scan.scanType}
                    </td>
                    <td className="py-3 pr-4 max-w-xs truncate font-mono text-slate-800 dark:text-slate-200">
                      {scan.targetSummary}
                    </td>
                    <td className="py-3 pr-4 whitespace-nowrap">
                      <ThreatLevelIndicator level={scan.threatLevel} />
                    </td>
                    <td className="py-3 pr-4 whitespace-nowrap">
                      <VerdictIndicator verdict={scan.verdict} />
                    </td>
                    <td className="py-3 pr-4 font-mono tabular-nums font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                      {Math.round(scan.confidenceScore)}%
                    </td>
                    <td className="py-3 pr-4 capitalize text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {scan.status}
                    </td>
                    <td className="py-3 text-right whitespace-nowrap space-x-2">
                      <button
                        type="button"
                        onClick={() => setSelectedScan(scan)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-[#00B0FF] cursor-pointer"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Inspect
                      </button>
                      <button
                        type="button"
                        onClick={() => onExportPdf(scan)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-[#00E676] cursor-pointer"
                      >
                        <Download className="w-3 h-3" />
                        PDF
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteScan(scan.id)}
                        className="inline-flex items-center p-1.5 rounded text-slate-400 hover:text-[#FF5252] cursor-pointer"
                        aria-label="Delete scan"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedScan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="max-w-2xl w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#101722] p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <VerdictIndicator verdict={selectedScan.verdict} />
                <ThreatLevelIndicator level={selectedScan.threatLevel} />
              </div>
              <button
                type="button"
                onClick={() => setSelectedScan(null)}
                className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                aria-label="Close scan details"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="font-mono text-xs text-slate-700 dark:text-slate-200 break-all p-3 rounded-lg bg-slate-50 dark:bg-[#0B0F14] border border-slate-200 dark:border-slate-800">
              {selectedScan.targetSummary}
            </div>
            <div className="space-y-3 text-sm">
              <div>
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Explainable AI Summary
                </div>
                <p className="text-slate-700 dark:text-slate-200 mt-1">
                  {selectedScan.explainableAI.whyDetected}
                </p>
              </div>
              {selectedScan.recommendations.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Recommendations
                  </div>
                  <ul className="list-disc pl-5 mt-1 text-xs text-slate-700 dark:text-slate-300 space-y-1">
                    {selectedScan.recommendations.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => onExportPdf(selectedScan)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#00E676] text-[#0B0F14] text-xs font-semibold hover:bg-[#00d46c] cursor-pointer"
              >
                <Download className="w-4 h-4" />
                {t.exportPdf}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function ThreatIntelView({
  items,
  t,
}: {
  items: ThreatIntelItem[];
  t: TranslationStrings;
}) {
  const [search, setSearch] = useState('');
  const filtered = items.filter(
    (item) =>
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.category.toLowerCase().includes(search.toLowerCase()) ||
      item.summary.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#101722] p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Radar className="w-5 h-5 text-[#FF5252]" />
          <div>
            <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
              {t.threatIntel}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Latest threats, trending scams, threat categories, and attack insights
            </p>
          </div>
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter threat advisories..."
          className="px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0B0F14] text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#00B0FF] w-full md:w-64"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#101722] p-6 space-y-3"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {item.category} · {new Date(item.publishedAt).toLocaleDateString()}
              </span>
              <ThreatLevelIndicator level={item.severity} />
            </div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              {item.title}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {item.summary}
            </p>
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#0B0F14] border border-slate-200 dark:border-slate-800 font-mono text-xs text-amber-700 dark:text-[#FFC107] break-all">
              {item.pattern}
            </div>
            <div className="text-xs text-emerald-700 dark:text-[#00E676]">
              Mitigation: {item.mitigation}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function LearningHubView({
  articles,
  t,
}: {
  articles: LearningArticleItem[];
  t: TranslationStrings;
}) {
  const [selectedTopic, setSelectedTopic] = useState('All');
  const [activeArticle, setActiveArticle] = useState<LearningArticleItem | null>(null);

  const topics = ['All', ...Array.from(new Set(articles.map((a) => a.topic)))];
  const visible =
    selectedTopic === 'All'
      ? articles
      : articles.filter((a) => a.topic === selectedTopic);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#101722] p-6 space-y-4">
        <div className="flex items-center gap-3">
          <BookOpen className="w-5 h-5 text-[#00B0FF]" />
          <div>
            <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
              {t.learningHub}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Interactive guides covering Phishing, Email Protection, QR Scam Prevention, Passwords, MFA, UPI Fraud, and Social Engineering.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {topics.map((topic) => (
            <button
              key={topic}
              type="button"
              onClick={() => setSelectedTopic(topic)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                selectedTopic === topic
                  ? 'bg-[#00B0FF] text-[#0B0F14] font-semibold'
                  : 'bg-slate-100 dark:bg-[#0B0F14] text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {topic}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {visible.map((article) => (
          <button
            key={article.id}
            type="button"
            onClick={() => setActiveArticle(article)}
            className="text-left rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#101722] p-6 hover:border-[#00B0FF] transition-colors flex flex-col justify-between gap-4 cursor-pointer"
          >
            <div className="space-y-2">
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {article.topic} · {article.difficulty} · {article.readMinutes} min read
              </div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                {article.title}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {article.summary}
              </p>
            </div>
            <div className="text-xs font-semibold text-[#0284C7] dark:text-[#00B0FF] inline-flex items-center gap-1.5">
              <span>Read Module</span>
              <Clock className="w-3.5 h-3.5" />
            </div>
          </button>
        ))}
      </div>

      {activeArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="max-w-2xl w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#101722] p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs text-[#00B0FF] font-medium mb-1">
                  {activeArticle.topic} · {activeArticle.difficulty} · {activeArticle.readMinutes} min read
                </div>
                <h3 className="font-display text-xl font-bold text-slate-900 dark:text-white">
                  {activeArticle.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveArticle(null)}
                className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                aria-label="Close article"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
              {activeArticle.content}
            </p>
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveArticle(null)}
                className="px-4 py-2 rounded-lg bg-[#00E676] text-[#0B0F14] text-xs font-semibold cursor-pointer"
              >
                Done Reading
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
