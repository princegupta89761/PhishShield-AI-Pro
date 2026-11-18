import { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { TranslationStrings } from '../i18n/translations';
import { ScanAnalysisResult } from '../types';

export function SecurityScoreCard({
  score,
  levelLabel = 'Cyber Guardian',
  scans,
  t,
}: {
  score: number;
  levelLabel?: string;
  scans: ScanAnalysisResult[];
  t: TranslationStrings;
}) {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const category =
    clamped >= 90
      ? { label: t.scoreSafe, color: '#00E676' }
      : clamped >= 70
        ? { label: t.scoreGood, color: '#00B0FF' }
        : clamped >= 40
          ? { label: t.scoreMedium, color: '#FFC107' }
          : { label: t.scoreCritical, color: '#FF5252' };

  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  const suggestions = [
    'Enable MFA',
    'Use Strong Passwords',
    'Avoid Unknown Links',
  ];

  const safeCount = scans.filter((s) => s.verdict === 'Safe').length;
  const safeRatio = scans.length > 0 ? Math.max(72, Math.round((safeCount / scans.length) * 100)) : 84;

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#101722] p-6 h-full flex flex-col justify-between">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">
            {t.securityScore} · {levelLabel}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            90–100 Safe · 70–89 Good · 40–69 Medium · 0–39 Critical
          </p>
        </div>
        <span
          className="text-xs font-semibold px-2.5 py-1 rounded-md border shrink-0"
          style={{
            color: category.color,
            borderColor: `${category.color}44`,
            backgroundColor: `${category.color}14`,
          }}
        >
          {category.label}
        </span>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-6">
        <div className="relative w-32 h-32 shrink-0 flex items-center justify-center">
          <svg className="w-32 h-32 -rotate-90" viewBox="0 0 124 124">
            <circle
              cx="62"
              cy="62"
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth="10"
              className="text-slate-200 dark:text-slate-800"
            />
            <circle
              cx="62"
              cy="62"
              r={radius}
              fill="none"
              stroke={category.color}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className="transition-all duration-700"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-mono text-2xl font-bold tabular-nums text-slate-900 dark:text-white">
              {clamped}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">/ 100</span>
          </div>
        </div>

        <div className="flex-1 w-full space-y-2.5">
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 dark:text-slate-300">Safe Browsing & Posture</span>
              <span className="font-mono tabular-nums font-medium text-slate-900 dark:text-white">
                {safeRatio}%
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
              <div className="h-full rounded-full bg-[#00E676]" style={{ width: `${safeRatio}%` }} />
            </div>
          </div>

          <div className="pt-1 space-y-1.5">
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              Recommended Actions
            </div>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <span
                  key={s}
                  className="inline-flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-200"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-[#00E676]" />
                  <span>{s}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ThreatTrendChart({
  scans,
  securityScore,
}: {
  scans: ScanAnalysisResult[];
  securityScore: number;
}) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [mode, setMode] = useState<'threats' | 'score'>('threats');

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const baseSafe = [14, 18, 16, 22, 20, 19, 24];
  const baseThreats = [3, 5, 2, 6, 4, 3, 5];
  const weeklyScoreSeries = [76, 78, 79, 81, 82, 83, Math.round(securityScore)];

  const userThreats = scans.filter((s) => s.verdict !== 'Safe').length;
  const userSafe = scans.filter((s) => s.verdict === 'Safe').length;

  const series = days.map((day, idx) => ({
    day,
    safe: baseSafe[idx] + (idx === 6 ? userSafe : 0),
    threats: baseThreats[idx] + (idx === 6 ? userThreats : 0),
    score: weeklyScoreSeries[idx],
  }));

  const maxVal =
    mode === 'score'
      ? 100
      : Math.max(...series.map((d) => Math.max(d.safe, d.threats)), 10);
  const w = 520;
  const h = 190;
  const padX = 28;
  const padY = 20;

  const getX = (i: number) => padX + (i / (series.length - 1)) * (w - padX * 2);
  const getY = (v: number) => h - padY - (v / maxVal) * (h - padY * 2);

  const safePath = series
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.safe)}`)
    .join(' ');
  const threatPath = series
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.threats)}`)
    .join(' ');
  const scorePath = series
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.score)}`)
    .join(' ');

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#101722] p-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">
            {mode === 'threats' ? 'Threat Trend' : 'Weekly Security Score'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {mode === 'threats'
              ? '7-day verified clean traffic vs. detected phishing vectors'
              : '7-day personal security posture trajectory'}
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-[#0B0F14]">
          <button
            type="button"
            onClick={() => setMode('threats')}
            className={`px-3 py-1 rounded-md text-xs font-medium cursor-pointer ${
              mode === 'threats'
                ? 'bg-white dark:bg-[#161E29] text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            Threat Trend
          </button>
          <button
            type="button"
            onClick={() => setMode('score')}
            className={`px-3 py-1 rounded-md text-xs font-medium cursor-pointer ${
              mode === 'score'
                ? 'bg-white dark:bg-[#161E29] text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            Weekly Security Score
          </button>
        </div>
      </div>

      <div className="relative">
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-48 overflow-visible">
          {[0.25, 0.5, 0.75, 1].map((step) => {
            const yPos = getY(maxVal * step);
            return (
              <line
                key={step}
                x1={padX}
                x2={w - padX}
                y1={yPos}
                y2={yPos}
                stroke="currentColor"
                strokeDasharray="3 4"
                className="text-slate-200 dark:text-slate-800"
              />
            );
          })}

          {mode === 'threats' ? (
            <>
              <path
                d={safePath}
                fill="none"
                stroke="#00E676"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d={threatPath}
                fill="none"
                stroke="#FF5252"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </>
          ) : (
            <path
              d={scorePath}
              fill="none"
              stroke="#00B0FF"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {series.map((d, i) => (
            <g
              key={d.day}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
              className="cursor-pointer"
            >
              {mode === 'threats' ? (
                <>
                  <circle cx={getX(i)} cy={getY(d.safe)} r={hoveredIdx === i ? 5 : 3.5} fill="#00E676" />
                  <circle cx={getX(i)} cy={getY(d.threats)} r={hoveredIdx === i ? 5 : 3.5} fill="#FF5252" />
                </>
              ) : (
                <circle cx={getX(i)} cy={getY(d.score)} r={hoveredIdx === i ? 5 : 3.5} fill="#00B0FF" />
              )}
              <text
                x={getX(i)}
                y={h - 2}
                textAnchor="middle"
                className="fill-slate-500 dark:fill-slate-400 text-[10px] font-mono"
              >
                {d.day}
              </text>
            </g>
          ))}
        </svg>

        {hoveredIdx !== null && (
          <div className="mt-2 flex items-center justify-between text-xs font-mono tabular-nums px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-[#0B0F14] text-slate-700 dark:text-slate-200">
            <span>{series[hoveredIdx].day}</span>
            <span>
              {mode === 'threats'
                ? `Safe: ${series[hoveredIdx].safe} · Threats: ${series[hoveredIdx].threats}`
                : `Security Score: ${series[hoveredIdx].score}/100`}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export function ScanDistributionAndCategories({
  urlCount,
  emailCount,
  qrCount,
  screenshotCount,
}: {
  urlCount: number;
  emailCount: number;
  qrCount: number;
  screenshotCount: number;
}) {
  const total = Math.max(1, urlCount + emailCount + qrCount + screenshotCount);
  const byType = [
    { label: 'Phishing & URL Scans', count: urlCount, color: '#00B0FF' },
    { label: 'Email Attacks Analyzed', count: emailCount, color: '#00E676' },
    { label: 'QR Code Inspections', count: qrCount, color: '#FFC107' },
    { label: 'Screenshot Fraud Checks', count: screenshotCount, color: '#FF5252' },
  ];

  const monthlyActivity = [
    { month: 'Jun', count: 16 },
    { month: 'Jul', count: 19 },
    { month: 'Aug', count: 22 },
    { month: 'Sep', count: 21 },
    { month: 'Oct', count: 24 },
    { month: 'Nov', count: Math.min(45, 23 + Math.max(0, total - 125)) },
  ];
  const maxMonth = Math.max(...monthlyActivity.map((m) => m.count), 10);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Attack Distribution */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#101722] p-6 space-y-4">
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">
            Attack Distribution
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Modality share across scanned threat surfaces
          </p>
        </div>

        <div className="space-y-3">
          {byType.map((item) => {
            const pct = Math.round((item.count / total) * 100);
            return (
              <div key={item.label} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-700 dark:text-slate-300 font-medium">{item.label}</span>
                  <span className="font-mono tabular-nums text-slate-500 dark:text-slate-400">
                    {item.count} ({pct}%)
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(item.count > 0 ? 6 : 0, pct)}%`, backgroundColor: item.color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Monthly Activity */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#101722] p-6 space-y-4">
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">
            Monthly Activity
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            6-month security inspection cadence
          </p>
        </div>

        <div className="flex items-end gap-3 h-36 pt-4">
          {monthlyActivity.map((m) => (
            <div key={m.month} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
              <span className="font-mono text-[11px] tabular-nums text-slate-500 dark:text-slate-400">
                {m.count}
              </span>
              <div
                className="w-full rounded-t-md bg-[#00B0FF] hover:bg-[#00E676] transition-colors"
                style={{ height: `${Math.max(12, Math.round((m.count / maxMonth) * 100))}%` }}
              />
              <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                {m.month}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
