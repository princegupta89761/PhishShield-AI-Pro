import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Download,
  HelpCircle,
  ListChecks,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import { TranslationStrings } from '../i18n/translations';
import { ScanAnalysisResult } from '../types';
import { ThreatLevelIndicator, VerdictIndicator } from './SeverityBadge';

interface ScanResultPanelProps {
  result: ScanAnalysisResult;
  t: TranslationStrings;
  onExportPdf: (scan: ScanAnalysisResult) => void;
}

export function ScanResultPanel({ result, t, onExportPdf }: ScanResultPanelProps) {
  const risk = Math.max(0, Math.min(100, Math.round(result.riskScore)));
  const confidence = Math.max(0, Math.min(100, Math.round(result.confidenceScore)));

  const meterColor =
    risk >= 75
      ? '#FF5252'
      : risk >= 40
        ? '#FFC107'
        : '#00E676';

  return (
    <div className="space-y-6 mt-6">
      {/* Primary Verdict + Threat Meter */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111720] p-6">
        <div className="flex flex-wrap items-start justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div className="space-y-2 min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <VerdictIndicator verdict={result.verdict} />
              <ThreatLevelIndicator level={result.threatLevel} />
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                {new Date(result.createdAt).toLocaleString()}
              </span>
            </div>
            <p className="font-mono text-sm text-slate-700 dark:text-slate-200 break-all">
              {result.destinationAddress || result.targetSummary}
            </p>
          </div>

          <button
            type="button"
            onClick={() => onExportPdf(result)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#161E29] text-slate-800 dark:text-slate-100 text-xs font-semibold hover:border-[#00B0FF] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Download className="w-4 h-4 text-[#00B0FF]" />
            {t.exportPdf}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
          {/* Visual Threat Meter */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
              <span>{t.riskScore}</span>
              <span className="font-mono text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                {risk}/100
              </span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${risk}%`, backgroundColor: meterColor }}
              />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {risk >= 75
                ? 'High-risk phishing indicators active'
                : risk >= 40
                  ? 'Moderate anomalies require verification'
                  : 'Low threat exposure observed'}
            </p>
          </div>

          {/* AI Confidence Indicator */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
              <span>{t.confidenceScore}</span>
              <span className="font-mono text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                {confidence}%
              </span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-[#00B0FF] transition-all duration-500"
                style={{ width: `${confidence}%` }}
              />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Multi-signal Gemini model certainty
            </p>
          </div>

          {/* Sender Trust Score (Email) or Verification Status */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
              <span>{result.senderTrustScore !== undefined ? 'Sender Trust Score' : 'Classification'}</span>
              <span className="font-mono text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                {result.senderTrustScore !== undefined
                  ? `${Math.round(result.senderTrustScore)}/100`
                  : result.verdict}
              </span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-[#00E676] transition-all duration-500"
                style={{
                  width: `${
                    result.senderTrustScore !== undefined
                      ? Math.max(4, Math.min(100, result.senderTrustScore))
                      : 100 - risk
                  }%`,
                }}
              />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {result.senderTrustScore !== undefined
                ? 'Header & domain authenticity rating'
                : 'Real-time multi-layer inspection'}
            </p>
          </div>
        </div>
      </div>

      {/* Deterministic + AI Feature Checks */}
      {result.featureChecks.length > 0 && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111720] p-6">
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-4">
            Technical Signal Inspection
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {result.featureChecks.map((check, idx) => {
              const Icon =
                check.status === 'pass'
                  ? CheckCircle2
                  : check.status === 'warn'
                    ? AlertTriangle
                    : AlertOctagon;
              const statusColor =
                check.status === 'pass'
                  ? 'text-emerald-600 dark:text-[#00E676]'
                  : check.status === 'warn'
                    ? 'text-amber-600 dark:text-[#FFC107]'
                    : 'text-red-600 dark:text-[#FF5252]';

              return (
                <div
                  key={`${check.feature}-${idx}`}
                  className="flex items-start gap-3 p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0E131B]"
                >
                  <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${statusColor}`} />
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                      {check.feature}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                      {check.detail}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Explainable AI Engine + Recommendation Engine */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111720] p-6 space-y-4">
          <div className="flex items-center gap-2.5">
            <HelpCircle className="w-5 h-5 text-[#00B0FF]" />
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              {t.explainableAiTitle}
            </h3>
          </div>

          <div className="space-y-3 text-sm">
            <div>
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                {t.whyDetected}
              </div>
              <p className="text-slate-700 dark:text-slate-200 leading-relaxed">
                {result.explainableAI.whyDetected}
              </p>
            </div>

            <div>
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                {t.whatMakesSuspicious}
              </div>
              <p className="text-slate-700 dark:text-slate-200 leading-relaxed">
                {result.explainableAI.whatMakesSuspicious}
              </p>
            </div>

            <div>
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
                {t.triggeredFeatures}
              </div>
              <ul className="space-y-1.5">
                {result.explainableAI.triggeredFeatures.map((feat, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300"
                  >
                    <ShieldAlert className="w-3.5 h-3.5 text-[#FFC107] mt-0.5 shrink-0" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111720] p-6 space-y-4">
          <div className="flex items-center gap-2.5">
            <ListChecks className="w-5 h-5 text-[#00E676]" />
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              {t.recommendations}
            </h3>
          </div>

          <ul className="space-y-2.5">
            {(result.recommendations.length > 0
              ? result.recommendations
              : result.explainableAI.nextSteps
            ).map((rec, i) => (
              <li
                key={i}
                className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0E131B] text-xs text-slate-700 dark:text-slate-200 leading-relaxed"
              >
                <ShieldCheck className="w-4 h-4 text-[#00E676] mt-0.5 shrink-0" />
                <span>{rec}</span>
              </li>
            ))}
          </ul>

          {result.extractedLinks && result.extractedLinks.length > 0 && (
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
                Extracted Links Found ({result.extractedLinks.length})
              </div>
              <div className="space-y-1 max-h-28 overflow-y-auto">
                {result.extractedLinks.map((lnk, idx) => (
                  <div
                    key={idx}
                    className="font-mono text-xs text-slate-600 dark:text-slate-300 truncate"
                  >
                    {lnk}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
