import {
  Activity,
  Download,
  Globe,
  Lightbulb,
  Lock,
  Mail,
  QrCode,
  ScanEye,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import { TranslationStrings } from '../i18n/translations';
import { AppView, ScanAnalysisResult, SecurityTipItem } from '../types';
import {
  ScanDistributionAndCategories,
  SecurityScoreCard,
  ThreatTrendChart,
} from './AnalyticsCharts';
import { ThreatLevelIndicator, VerdictIndicator } from './SeverityBadge';

interface DashboardHomeProps {
  scans: ScanAnalysisResult[];
  extraStats: {
    totalScans: number;
    threatsDetected: number;
    urlsScanned: number;
    emailsAnalyzed: number;
    qrScans: number;
    screenshotsAnalyzed: number;
  };
  securityScore: number;
  levelLabel?: string;
  isGuest: boolean;
  tips: SecurityTipItem[];
  t: TranslationStrings;
  onNavigate: (view: AppView) => void;
  onExportPdf: (scan: ScanAnalysisResult) => void;
  onOpenAuth: () => void;
}

export function DashboardHome({
  scans,
  extraStats,
  securityScore,
  levelLabel,
  isGuest,
  tips,
  t,
  onNavigate,
  onExportPdf,
  onOpenAuth,
}: DashboardHomeProps) {
  const dayOfYear = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
  const dailyTip = tips.length > 0 ? tips[dayOfYear % tips.length] : null;

  const kpis = [
    { label: t.totalScans, value: extraStats.totalScans, icon: Activity, color: 'text-[#00B0FF]' },
    { label: t.threatsDetected, value: extraStats.threatsDetected, icon: ShieldAlert, color: 'text-[#FF5252]' },
    { label: 'URLs Scanned', value: extraStats.urlsScanned, icon: Globe, color: 'text-[#00E676]' },
    { label: t.emailsAnalyzed, value: extraStats.emailsAnalyzed, icon: Mail, color: 'text-[#00B0FF]' },
    { label: 'QR Scans', value: extraStats.qrScans, icon: QrCode, color: 'text-[#FFC107]' },
    { label: t.securityScore, value: Math.round(securityScore), icon: ShieldCheck, color: 'text-[#00E676]' },
  ];

  return (
    <div className="space-y-6">
      {isGuest && (
        <div className="rounded-xl border border-[#00B0FF]/30 bg-[#00B0FF]/10 px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-xs text-slate-800 dark:text-slate-100">
            <Lock className="w-4 h-4 text-[#00B0FF] shrink-0" />
            <span>
              <strong>Demo Dashboard (Guest Mode)</strong> — Run any scanner freely. Sign in to unlock Saved History, Personal Analytics, Profile, and PDF Threat Reports.
            </span>
          </div>
          <button
            type="button"
            onClick={onOpenAuth}
            className="px-3.5 py-1.5 rounded-lg bg-[#00E676] text-[#0B0F14] text-xs font-semibold hover:bg-[#00d46c] cursor-pointer whitespace-nowrap"
          >
            User Login
          </button>
        </div>
      )}

      {/* Quick Launch Scanners Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: t.urlScanner, view: 'url-scanner' as AppView, icon: Globe },
          { label: t.emailScanner, view: 'email-scanner' as AppView, icon: Mail },
          { label: t.screenshotAnalyzer, view: 'screenshot-analyzer' as AppView, icon: ScanEye },
          { label: t.qrScanner, view: 'qr-scanner' as AppView, icon: QrCode },
        ].map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.view}
              type="button"
              onClick={() => onNavigate(action.view)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#101722] hover:border-[#00E676]/60 transition-colors text-left cursor-pointer"
            >
              <Icon className="w-4 h-4 text-[#00E676] shrink-0" />
              <span className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white truncate">
                {action.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* 6 KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.label}
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#101722] p-4"
            >
              <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span className="truncate">{kpi.label}</span>
                <Icon className={`w-4 h-4 shrink-0 ${kpi.color}`} />
              </div>
              <div className="font-mono text-2xl font-bold tabular-nums text-slate-900 dark:text-white mt-2">
                {kpi.value}
              </div>
            </div>
          );
        })}
      </div>

      {/* Security Score + Today's Security Tip */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7">
          <SecurityScoreCard
            score={securityScore}
            levelLabel={levelLabel}
            scans={scans}
            t={t}
          />
        </div>

        <div className="lg:col-span-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#101722] p-6 flex flex-col justify-between gap-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#FFC107]">
                <Lightbulb className="w-4 h-4" />
                <span>{t.todaysTip}</span>
              </div>
              {dailyTip && (
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {dailyTip.category}
                </span>
              )}
            </div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              {dailyTip?.title || 'Never Share OTP'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {dailyTip?.content}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('learning-hub')}
            className="text-xs font-semibold text-[#0284C7] dark:text-[#00B0FF] hover:underline self-start cursor-pointer"
          >
            Open Security Learning Hub →
          </button>
        </div>
      </div>

      {/* Threat Trend + Weekly Security Score */}
      <ThreatTrendChart scans={scans} securityScore={securityScore} />

      {/* Attack Distribution + Monthly Activity */}
      <ScanDistributionAndCategories
        urlCount={extraStats.urlsScanned}
        emailCount={extraStats.emailsAnalyzed}
        qrCount={extraStats.qrScans}
        screenshotCount={extraStats.screenshotsAnalyzed}
      />

      {/* Recent Scans Widget */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#101722] p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              {t.recentActivity}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Latest threats & verified scans with severity color coding
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('history')}
            className="text-xs font-semibold text-[#0284C7] dark:text-[#00B0FF] hover:underline cursor-pointer"
          >
            View All History
          </button>
        </div>

        <div className="space-y-2.5">
          {scans.slice(0, 5).map((scan) => (
            <div
              key={scan.id}
              className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0B0F14]"
            >
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-mono">
                  <span className="uppercase font-semibold text-slate-700 dark:text-slate-300">
                    {scan.scanType}
                  </span>
                  <span>·</span>
                  <span className="tabular-nums">
                    {new Date(scan.createdAt).toLocaleString()}
                  </span>
                  <span>·</span>
                  <span className="tabular-nums">Confidence {Math.round(scan.confidenceScore)}%</span>
                </div>
                <div className="font-mono text-xs text-slate-900 dark:text-slate-100 truncate">
                  {scan.targetSummary}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <VerdictIndicator verdict={scan.verdict} />
                <ThreatLevelIndicator level={scan.threatLevel} />
                <button
                  type="button"
                  onClick={() => onExportPdf(scan)}
                  className="p-1.5 rounded border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-[#00B0FF] cursor-pointer"
                  title="Export PDF Report"
                  aria-label="Export PDF Report"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
