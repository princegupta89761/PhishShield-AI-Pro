import { useEffect, useState } from 'react';
import {
  ArrowRight,
  Bot,
  ChevronDown,
  FileSearch,
  FileText,
  Globe,
  LayoutDashboard,
  Mail,
  QrCode,
  ScanEye,
  Shield,
  ShieldAlert,
  ShieldCheck,
  User,
} from 'lucide-react';
import {
  AVATAR_CISO_USER,
  AVATAR_SECURITY_LEAD,
  HERO_SHIELD_IMAGE,
  LANDING_FAQ_ITEMS,
  THREAT_CONSOLE_IMAGE,
} from '../data/seedContent';
import { TranslationStrings } from '../i18n/translations';
import { AppView } from '../types';

interface LandingPageProps {
  t: TranslationStrings;
  onStartScanning: () => void;
  onTryDemo: () => void;
  onOpenAuth: () => void;
  onEnterAdminDemo: () => void;
  onNavigateView: (view: AppView) => void;
}

function AnimatedStatValue({
  target,
  decimals = 0,
  suffix = '',
}: {
  target: number;
  decimals?: number;
  suffix?: string;
}) {
  const [val, setVal] = useState(0);

  useEffect(() => {
    let rafId = 0;
    const duration = 900;
    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setVal(target * eased);
      if (progress < 1) {
        rafId = requestAnimationFrame(tick);
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [target]);

  const formatted =
    decimals > 0
      ? val.toFixed(decimals)
      : Math.round(val).toLocaleString('en-US');

  return (
    <span>
      {formatted}
      {suffix}
    </span>
  );
}

export function LandingPage({
  t,
  onStartScanning,
  onTryDemo,
  onOpenAuth,
  onEnterAdminDemo,
  onNavigateView,
}: LandingPageProps) {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const stats = [
    { label: t.statUrlsAnalyzed, target: 128901, decimals: 0, suffix: '', detail: 'Inspected across web & email' },
    { label: t.statThreatsDetected, target: 18721, decimals: 0, suffix: '', detail: 'Zero-day & credential traps blocked' },
    { label: t.statAccuracy, target: 97.8, decimals: 1, suffix: '%', detail: 'Multi-layer verification rate' },
    { label: t.statActiveUsers, target: 4562, decimals: 0, suffix: '', detail: 'Analysts & enterprise teams' },
  ];

  const capabilities = [
    {
      num: '01',
      title: 'URL Threat Detection',
      desc: 'Inspects URL length, HTTPS, subdomains, keyword analysis, typosquatting, character replacement, redirections, and brand impersonation.',
      icon: Globe,
      view: 'url-scanner' as AppView,
    },
    {
      num: '02',
      title: 'Email Phishing Detection',
      desc: 'Evaluates financial triggers, credential requests, threat & urgency language, suspicious senders, links, and attachments.',
      icon: Mail,
      view: 'email-scanner' as AppView,
    },
    {
      num: '03',
      title: 'Screenshot Analysis',
      desc: 'AI vision inspects fake login forms, banking login pages, credential fields, brand imitation, and scam interfaces.',
      icon: ScanEye,
      view: 'screenshot-analyzer' as AppView,
    },
    {
      num: '04',
      title: 'QR Scanner',
      desc: 'Extracts destination URLs safely from QR images and analyzes them before your device ever opens the target.',
      icon: QrCode,
      view: 'qr-scanner' as AppView,
    },
    {
      num: '05',
      title: 'Explainable AI',
      desc: 'Explains why an artifact is dangerous, which indicators triggered detection, what risk level means, and next actions.',
      icon: FileSearch,
      view: 'url-scanner' as AppView,
    },
    {
      num: '06',
      title: 'Threat Dashboard',
      desc: 'Real-time threat trends, attack distributions, monthly activity, and weekly Security Score posture analytics.',
      icon: LayoutDashboard,
      view: 'dashboard' as AppView,
    },
    {
      num: '07',
      title: 'AI Security Assistant',
      desc: 'Gemini-powered advisor answering phishing, OTP scam, QR phishing, email triage, and Gmail protection questions.',
      icon: Bot,
      view: 'ai-assistant' as AppView,
    },
    {
      num: '08',
      title: 'PDF Reporting',
      desc: 'Exports complete threat reports with scan details, confidence scores, risk scores, timestamps, and recommendations.',
      icon: FileText,
      view: 'history' as AppView,
    },
  ];

  const testimonials = [
    {
      name: 'Elena Rostova',
      role: 'Director of Security Operations',
      org: 'Nordic FinTech Group',
      avatar: AVATAR_SECURITY_LEAD,
      quote:
        'Before deploying PhishShield AI Pro, analysts spent 18 minutes triaging suspicious vendor PDFs and QR invoices. Explainable threat breakdowns cut triage time by 74% in Q3.',
    },
    {
      name: 'Marcus Chen',
      role: 'Chief Information Security Officer',
      org: 'Meridian Cloud Logistics',
      avatar: AVATAR_CISO_USER,
      quote:
        'Our employees routinely faced cloned banking and SSO login screens. Screenshot risk overlays and PDF incident exports made user reporting immediate and auditable.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F14] text-slate-900 dark:text-slate-100">
      {/* Top Bar Contract: 3 zones separated by gap-8 */}
      <header className="sticky top-0 z-40 border-b border-slate-200 dark:border-slate-800/80 bg-white/90 dark:bg-[#0B0F14]/85 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-8">
          <a
            href="#top"
            className="font-display text-lg font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0"
          >
            {t.brandName}
          </a>

          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600 dark:text-slate-300">
            <a
              href="#scanners"
              className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              {t.navScanners}
            </a>
            <a
              href="#intelligence"
              className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              {t.navIntelligence}
            </a>
            <a
              href="#why-us"
              className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              {t.navLearning}
            </a>
            <a
              href="#faq"
              className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              {t.navFaq}
            </a>
          </nav>

          <div className="shrink-0">
            <button
              type="button"
              onClick={onOpenAuth}
              className="px-4 py-2 rounded-lg bg-[#00E676] text-[#0B0F14] text-xs font-semibold hover:bg-[#00d46c] hover:shadow-[0_0_20px_-4px_rgba(0,230,118,0.5)] transition-all whitespace-nowrap shrink-0 cursor-pointer"
            >
              {t.launchConsole}
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main id="top">
        <section className="max-w-7xl mx-auto px-6 pt-12 pb-14 lg:pt-16 lg:pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
            <div className="lg:col-span-6 flex flex-col justify-center space-y-6">
              <div className="text-xs font-medium text-[#0284C7] dark:text-[#00B0FF] tracking-wide">
                AI-Powered Multi-Layer Cyber Threat Detection Platform
              </div>
              <h1
                className="font-display font-bold tracking-tight text-balance text-slate-900 dark:text-white leading-[1.1]"
                style={{ fontSize: 'clamp(2.25rem, 4vw, 3.6rem)' }}
              >
                {t.heroTitle}
              </h1>
              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl">
                {t.heroSubtitle}
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={onStartScanning}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-[#00E676] text-[#0B0F14] text-sm font-semibold hover:bg-[#00d46c] hover:shadow-[0_0_24px_-4px_rgba(0,230,118,0.5)] transition-all whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <span>{t.startScanning}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={onTryDemo}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#101722]/90 backdrop-blur-sm text-slate-800 dark:text-slate-100 text-sm font-semibold hover:border-[#00B0FF] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {t.tryDemo}
                </button>
                <a
                  href="#scanners"
                  className="inline-flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
                >
                  {t.watchOverview}
                </a>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="h-full min-h-[280px] rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-[#101722] relative shadow-xl">
                <img
                  src={HERO_SHIELD_IMAGE}
                  alt="PhishShield AI Pro geometric defense core"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F14]/85 via-transparent to-transparent pointer-events-none" />
                <div className="absolute bottom-5 left-5 right-5 flex items-center justify-between text-xs text-slate-200 font-mono">
                  <span>URL · Email · Vision · QR Inspection</span>
                  <span className="text-[#00E676]">Real-time AI Reasoning</span>
                </div>
              </div>
            </div>
          </div>

          {/* 4-column Animated KPI strip */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-10">
            {stats.map((item) => (
              <div
                key={item.label}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#101722]/85 backdrop-blur-sm p-5 hover:border-[#00B0FF]/40 transition-colors"
              >
                <div className="font-mono text-2xl sm:text-3xl font-bold tabular-nums text-slate-900 dark:text-white">
                  <AnimatedStatValue
                    target={item.target}
                    decimals={item.decimals}
                    suffix={item.suffix}
                  />
                </div>
                <div className="text-sm font-semibold text-slate-700 dark:text-slate-200 mt-1">
                  {item.label}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {item.detail}
                </div>
              </div>
            ))}
          </div>

          {/* 3-Option Access System Strip */}
          <div className="mt-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#101722]/90 backdrop-blur-md p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-slate-900 dark:text-white">
                Platform Access Modes
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Explore as a Guest, sign in via Email for personal analytics & PDF reports, or inspect the Admin Demo.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={onTryDemo}
                className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0B0F14] text-xs font-semibold text-slate-800 dark:text-slate-100 hover:border-[#00B0FF] transition-colors whitespace-nowrap cursor-pointer"
              >
                Continue As Guest
              </button>
              <button
                type="button"
                onClick={onOpenAuth}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#00E676] text-[#0B0F14] text-xs font-semibold hover:bg-[#00d46c] transition-colors whitespace-nowrap cursor-pointer"
              >
                <User className="w-3.5 h-3.5" />
                User Login
              </button>
              <button
                type="button"
                onClick={onEnterAdminDemo}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[#00B0FF]/40 bg-[#00B0FF]/10 text-[#0284C7] dark:text-[#00B0FF] text-xs font-semibold hover:bg-[#00B0FF]/20 transition-colors whitespace-nowrap cursor-pointer"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                View Admin Demo
              </button>
            </div>
          </div>
        </section>

        {/* 8-Card Features Section */}
        <section id="scanners" className="max-w-7xl mx-auto px-6 py-14 border-t border-slate-200 dark:border-slate-800/80">
          <div className="max-w-2xl mb-10">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white text-balance">
              Eight integrated modules for complete anti-phishing defense
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mt-2">
              Every module pairs deterministic signal checks with explainable Gemini AI reasoning and exportable incident reports.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {capabilities.map((cap) => {
              const Icon = cap.icon;
              return (
                <button
                  key={cap.num}
                  type="button"
                  onClick={() => onNavigateView(cap.view)}
                  className="text-left rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#101722]/85 backdrop-blur-sm p-5 hover:border-[#00E676]/60 hover:shadow-[0_0_24px_-8px_rgba(0,230,118,0.22)] transition-all group cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
                        {cap.num}.
                      </span>
                      <Icon className="w-5 h-5 text-[#00B0FF] group-hover:text-[#00E676] transition-colors" />
                    </div>
                    <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                      {cap.title}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                      {cap.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Architecture & Explainability Showcase */}
        <section id="intelligence" className="max-w-7xl mx-auto px-6 py-14 border-t border-slate-200 dark:border-slate-800/80">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
            <div className="lg:col-span-6">
              <div className="h-full min-h-[260px] rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-[#101722]">
                <img
                  src={THREAT_CONSOLE_IMAGE}
                  alt="Layered packet and URL threat inspection pipeline"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <div id="why-us" className="lg:col-span-6 flex flex-col justify-center space-y-6">
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white text-balance">
                Why security teams choose PhishShield AI Pro
              </h2>
              <div className="space-y-4">
                {[
                  {
                    title: 'Transparent Explainable AI',
                    desc: 'Shows the exact URL, header, or visual features triggered instead of an unexplained black-box score.',
                    icon: FileSearch,
                  },
                  {
                    title: 'Instant PDF Audit Reports',
                    desc: 'Export complete threat summaries, confidence scores, and mitigation steps for compliance or SOC handoffs.',
                    icon: ShieldCheck,
                  },
                  {
                    title: 'Multilingual Protection (EN · HI · MR)',
                    desc: 'Switch seamlessly across English, Hindi, and Marathi for both the dashboard interface and AI threat guidance.',
                    icon: Shield,
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.title}
                      className="flex items-start gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#101722]/85"
                    >
                      <Icon className="w-5 h-5 text-[#00E676] mt-0.5 shrink-0" />
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                          {item.title}
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="max-w-7xl mx-auto px-6 py-14 border-t border-slate-200 dark:border-slate-800/80">
          <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white mb-8">
            Trusted by security leaders
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {testimonials.map((item) => (
              <div
                key={item.name}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#101722]/85 p-6 space-y-4"
              >
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  &ldquo;{item.quote}&rdquo;
                </p>
                <div className="flex items-center gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <img
                    src={item.avatar}
                    alt={item.name}
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 rounded-full object-cover border border-slate-300 dark:border-slate-700"
                  />
                  <div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-white">
                      {item.name}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {item.role} · {item.org}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="max-w-4xl mx-auto px-6 py-14 border-t border-slate-200 dark:border-slate-800/80">
          <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white mb-6">
            Frequently Asked Questions
          </h2>
          <div className="space-y-3">
            {LANDING_FAQ_ITEMS.map((item, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={item.q}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#101722]/85 overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full px-5 py-4 flex items-center justify-between gap-4 text-left text-sm font-semibold text-slate-900 dark:text-white cursor-pointer"
                  >
                    <span>{item.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-500 transition-transform duration-200 shrink-0 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-4 text-sm text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800/80 pt-3">
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {/* Quiet Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B0F14]">
        <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <div className="font-semibold text-slate-700 dark:text-slate-200">
            {t.brandName} · Multi-Layer Cyber Threat Detection
          </div>
          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={onTryDemo}
              className="hover:text-slate-900 dark:hover:text-white cursor-pointer"
            >
              Continue As Guest
            </button>
            <button
              type="button"
              onClick={onOpenAuth}
              className="hover:text-slate-900 dark:hover:text-white cursor-pointer"
            >
              User Login
            </button>
            <button
              type="button"
              onClick={onEnterAdminDemo}
              className="hover:text-slate-900 dark:hover:text-white cursor-pointer"
            >
              View Admin Demo
            </button>
            <span>© {new Date().getFullYear()} PhishShield AI Pro</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
