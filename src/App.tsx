import { useEffect, useState } from 'react';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import {
  BookOpen,
  Bot,
  Globe,
  History,
  LayoutDashboard,
  Lock,
  LogOut,
  Mail,
  Menu,
  Moon,
  QrCode,
  Radar,
  ScanEye,
  Settings,
  Shield,
  ShieldAlert,
  Sun,
  User as UserIcon,
  X,
} from 'lucide-react';
import {
  AdminDashboardView,
  ProfileView,
  SettingsView,
} from './components/AccountAndAdminViews';
import {
  AiAssistantView,
  LearningHubView,
  ScanHistoryView,
  ThreatIntelView,
} from './components/AssistantAndKnowledgeViews';
import { AuthModal } from './components/AuthModal';
import { DashboardHome } from './components/DashboardHome';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LandingPage } from './components/LandingPage';
import {
  EmailScannerView,
  QrScannerView,
  ScreenshotAnalyzerView,
  UrlScannerView,
} from './components/ScannersView';
import {
  DEFAULT_LEARNING_ARTICLES,
  DEFAULT_SECURITY_TIPS,
  DEFAULT_THREAT_INTEL,
  INITIAL_DEMO_SCANS,
} from './data/seedContent';
import { translations } from './i18n/translations';
import { auth } from './lib/firebase';
import {
  deleteScanRecord,
  ensureUserProfile,
  fetchLearningArticlesFromFirestore,
  fetchSecurityTipsFromFirestore,
  fetchThreatIntelFromFirestore,
  fetchUserScans,
  logPdfReportRecord,
  saveScanToFirestore,
  updateUserProfileSettings,
} from './services/firestoreService';
import {
  AppView,
  LanguageCode,
  LearningArticleItem,
  ScanAnalysisResult,
  SecurityTipItem,
  ThemeMode,
  ThreatIntelItem,
  UserProfileData,
  UserRole,
} from './types';
import { generateThreatReportPdf } from './utils/pdfReport';

const GUEST_PROFILE: UserProfileData = {
  uid: 'guest_session',
  displayName: 'Guest Analyst',
  email: '',
  emailVerified: false,
  role: 'user',
  level: 'Guest',
  membership: 'Demo',
  savedReports: 0,
  securityScore: 84,
  language: 'en',
  theme: 'dark',
  notificationsEnabled: true,
  weeklyDigest: true,
  privacyStrictMode: true,
  totalScans: 125,
  threatsDetected: 21,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const DEMO_USER_PROFILE: UserProfileData = {
  uid: 'demo_vedant_dalvi',
  displayName: 'Vedant Dalvi',
  email: 'vedant@example.com',
  emailVerified: true,
  role: 'user',
  level: 'Cyber Guardian',
  membership: 'Free',
  savedReports: 24,
  securityScore: 84,
  language: 'en',
  theme: 'dark',
  notificationsEnabled: true,
  weeklyDigest: true,
  privacyStrictMode: true,
  totalScans: 125,
  threatsDetected: 21,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

type SessionMode = 'guest' | 'user-demo' | 'firebase-user' | 'admin-demo';

function PhishShieldApp() {
  const [view, setView] = useState<AppView>('landing');
  const [theme, setTheme] = useState<ThemeMode>('dark');
  const [language, setLanguage] = useState<LanguageCode>('en');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [sessionMode, setSessionMode] = useState<SessionMode>('guest');
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [profile, setProfile] = useState<UserProfileData>(GUEST_PROFILE);
  const [scans, setScans] = useState<ScanAnalysisResult[]>(INITIAL_DEMO_SCANS);
  const [threatIntel, setThreatIntel] = useState<ThreatIntelItem[]>(DEFAULT_THREAT_INTEL);
  const [securityTips] = useState<SecurityTipItem[]>(DEFAULT_SECURITY_TIPS);
  const [learningArticles] = useState<LearningArticleItem[]>(DEFAULT_LEARNING_ARTICLES);

  const [scanCounters, setScanCounters] = useState({
    totalScans: 125,
    threatsDetected: 21,
    urlsScanned: 79,
    emailsAnalyzed: 31,
    qrScans: 15,
    screenshotsAnalyzed: 12,
  });

  const t = translations[language];
  const isGuest = sessionMode === 'guest';
  const role: UserRole =
    sessionMode === 'admin-demo' || (sessionMode === 'firebase-user' && profile.role === 'admin')
      ? 'admin'
      : isGuest
        ? 'guest'
        : 'user';

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      setAuthReady(true);

      if (!user) {
        setSessionMode((prev) => (prev === 'firebase-user' ? 'guest' : prev));
        return;
      }

      try {
        const userProf = await ensureUserProfile(user, { language, theme });
        setSessionMode('firebase-user');
        setProfile({
          ...userProf,
          level: userProf.level || 'Cyber Guardian',
          membership: userProf.membership || 'Free',
          savedReports: userProf.savedReports ?? 24,
        });
        setTheme(userProf.theme);
        setLanguage(userProf.language);
        setView((prev) => (prev === 'landing' ? 'dashboard' : prev));

        const [cloudScans, cloudIntel] = await Promise.all([
          fetchUserScans(user.uid).catch(() => []),
          fetchThreatIntelFromFirestore().catch(() => []),
        ]);

        if (cloudScans.length > 0) {
          setScans(cloudScans);
        } else {
          setScans(INITIAL_DEMO_SCANS);
        }

        if (cloudIntel.length > 0) {
          const merged = [
            ...cloudIntel,
            ...DEFAULT_THREAT_INTEL.filter(
              (d) => !cloudIntel.some((c) => c.id === d.id)
            ),
          ];
          setThreatIntel(merged);
        }

        fetchSecurityTipsFromFirestore().catch(() => []);
        fetchLearningArticlesFromFirestore().catch(() => []);
      } catch (err) {
        console.error('Failed to initialize user workspace:', err);
      }
    });

    return () => unsubscribe();
  }, []);

  const computeUpdatedScore = (scanList: ScanAnalysisResult[]): number => {
    if (scanList.length === 0) return 84;
    const recent = scanList.slice(0, 12);
    const phishingCount = recent.filter((s) => s.verdict === 'Phishing').length;
    const suspiciousCount = recent.filter((s) => s.verdict === 'Suspicious').length;
    const safeCount = recent.filter((s) => s.verdict === 'Safe').length;
    const raw = 84 + safeCount * 2 - suspiciousCount * 3 - phishingCount * 2;
    return Math.max(20, Math.min(99, raw));
  };

  const handleScanComplete = async (newScan: ScanAnalysisResult) => {
    const nextScans = [newScan, ...scans];
    setScans(nextScans);
    const nextScore = computeUpdatedScore(nextScans);
    const isThreat = newScan.verdict !== 'Safe' ? 1 : 0;
    const nextTotalScans = profile.totalScans + 1;
    const nextThreatsDetected = profile.threatsDetected + isThreat;

    setScanCounters((prev) => ({
      totalScans: prev.totalScans + 1,
      threatsDetected: prev.threatsDetected + isThreat,
      urlsScanned: prev.urlsScanned + (newScan.scanType === 'url' ? 1 : 0),
      emailsAnalyzed: prev.emailsAnalyzed + (newScan.scanType === 'email' ? 1 : 0),
      qrScans: prev.qrScans + (newScan.scanType === 'qr' ? 1 : 0),
      screenshotsAnalyzed:
        prev.screenshotsAnalyzed + (newScan.scanType === 'screenshot' ? 1 : 0),
    }));

    setProfile((prev) => ({
      ...prev,
      securityScore: nextScore,
      totalScans: prev.totalScans + 1,
      threatsDetected: prev.threatsDetected + isThreat,
    }));

    if (firebaseUser && firebaseUser.emailVerified) {
      try {
        await ensureUserProfile(firebaseUser, { language, theme });
        await saveScanToFirestore(firebaseUser.uid, newScan);
        await updateUserProfileSettings(firebaseUser.uid, {
          securityScore: nextScore,
          totalScans: nextTotalScans,
          threatsDetected: nextThreatsDetected,
        });
      } catch (err) {
        console.error('Could not persist scan to Firestore:', err);
      }
    }
  };

  const handleDeleteScan = async (scanId: string) => {
    setScans((prev) => prev.filter((s) => s.id !== scanId));
    if (firebaseUser && firebaseUser.emailVerified && !scanId.startsWith('demo_')) {
      try {
        await deleteScanRecord(scanId);
      } catch (err) {
        console.error('Could not delete scan from Firestore:', err);
      }
    }
  };

  const handleExportPdf = async (scan: ScanAnalysisResult) => {
    if (isGuest) {
      setAuthModalOpen(true);
      return;
    }
    generateThreatReportPdf(scan, profile.displayName);
    setProfile((prev) => ({ ...prev, savedReports: (prev.savedReports ?? 24) + 1 }));
    if (firebaseUser && firebaseUser.emailVerified && !scan.id.startsWith('demo_')) {
      try {
        await ensureUserProfile(firebaseUser, { language, theme });
        await saveScanToFirestore(firebaseUser.uid, scan);
        await logPdfReportRecord(firebaseUser.uid, scan);
      } catch (err) {
        console.error('Could not log PDF report to Firestore:', err);
      }
    }
  };

  const handleRefreshVerification = async (): Promise<boolean> => {
    if (!auth.currentUser) return false;
    await auth.currentUser.reload();
    const refreshedUser = auth.currentUser;
    setFirebaseUser(refreshedUser);
    if (refreshedUser.emailVerified) {
      const userProf = await ensureUserProfile(refreshedUser, { language, theme });
      setProfile({
        ...userProf,
        level: userProf.level || 'Cyber Guardian',
        membership: userProf.membership || 'Free',
        savedReports: userProf.savedReports ?? 24,
      });
      return true;
    }
    return false;
  };

  const handleSaveProfileOrSettings = async (updates: Partial<UserProfileData>) => {
    setProfile((prev) => ({ ...prev, ...updates }));
    if (updates.theme) setTheme(updates.theme);
    if (updates.language) setLanguage(updates.language);

    if (firebaseUser && firebaseUser.emailVerified) {
      await ensureUserProfile(firebaseUser, { language, theme });
      await updateUserProfileSettings(firebaseUser.uid, updates);
    }
  };

  const handleThemeChange = (nextTheme: ThemeMode) => {
    setTheme(nextTheme);
    setProfile((prev) => ({ ...prev, theme: nextTheme }));
    if (firebaseUser && firebaseUser.emailVerified) {
      updateUserProfileSettings(firebaseUser.uid, { theme: nextTheme }).catch(() => {});
    }
  };

  const handleLanguageChange = (nextLang: LanguageCode) => {
    setLanguage(nextLang);
    setProfile((prev) => ({ ...prev, language: nextLang }));
    if (firebaseUser && firebaseUser.emailVerified) {
      updateUserProfileSettings(firebaseUser.uid, { language: nextLang }).catch(() => {});
    }
  };

  const enterUserDemo = () => {
    setSessionMode('user-demo');
    setProfile(DEMO_USER_PROFILE);
    setScans(INITIAL_DEMO_SCANS);
    setView('dashboard');
  };

  const enterAdminDemo = () => {
    setSessionMode('admin-demo');
    setProfile({
      ...DEMO_USER_PROFILE,
      displayName: 'Admin Demo',
      email: 'admin@phishshield.ai',
      role: 'admin',
      level: 'Platform Administrator',
    });
    setView('admin');
  };

  const enterGuestMode = () => {
    setSessionMode('guest');
    setProfile(GUEST_PROFILE);
    setView('dashboard');
  };

  const handleLogout = async () => {
    if (firebaseUser) {
      await signOut(auth);
    }
    setSessionMode('guest');
    setProfile(GUEST_PROFILE);
    setScans(INITIAL_DEMO_SCANS);
    setView('landing');
  };

  const navigateTo = (target: AppView) => {
    setView(target);
    setMobileMenuOpen(false);
  };

  if (view === 'landing') {
    return (
      <>
        <LandingPage
          t={t}
          onStartScanning={() => {
            setSessionMode((prev) => (prev === 'guest' ? 'guest' : prev));
            navigateTo('url-scanner');
          }}
          onTryDemo={enterGuestMode}
          onOpenAuth={() => {
            if (sessionMode === 'firebase-user' || sessionMode === 'user-demo') {
              navigateTo('dashboard');
            } else {
              setAuthModalOpen(true);
            }
          }}
          onEnterAdminDemo={enterAdminDemo}
          onNavigateView={(target) => navigateTo(target)}
        />
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          onContinueAsGuest={enterGuestMode}
          onEnterUserDemo={enterUserDemo}
          onEnterAdminDemo={enterAdminDemo}
        />
      </>
    );
  }

  const navGroups = [
    {
      heading: 'Operations',
      items: [
        { id: 'dashboard' as AppView, label: t.dashboard, icon: LayoutDashboard, locked: false },
        { id: 'url-scanner' as AppView, label: t.urlScanner, icon: Globe, locked: false },
        { id: 'email-scanner' as AppView, label: t.emailScanner, icon: Mail, locked: false },
        { id: 'screenshot-analyzer' as AppView, label: t.screenshotAnalyzer, icon: ScanEye, locked: false },
        { id: 'qr-scanner' as AppView, label: t.qrScanner, icon: QrCode, locked: false },
      ],
    },
    {
      heading: 'Intelligence & Guidance',
      items: [
        { id: 'ai-assistant' as AppView, label: t.aiAssistant, icon: Bot, locked: false },
        { id: 'history' as AppView, label: t.scanHistory, icon: History, locked: isGuest },
        { id: 'threat-intel' as AppView, label: t.threatIntel, icon: Radar, locked: false },
        { id: 'learning-hub' as AppView, label: t.learningHub, icon: BookOpen, locked: false },
      ],
    },
    {
      heading: 'Account',
      items: [
        { id: 'profile' as AppView, label: t.profile, icon: UserIcon, locked: isGuest },
        { id: 'settings' as AppView, label: t.settings, icon: Settings, locked: false },
        ...(role === 'admin'
          ? [{ id: 'admin' as AppView, label: t.adminConsole, icon: ShieldAlert, locked: false }]
          : []),
      ],
    },
  ];

  const activeNavLabel =
    navGroups.flatMap((g) => g.items).find((i) => i.id === view)?.label ||
    t.dashboard;

  return (
    <div className="min-h-screen flex bg-[#F8FAFC] dark:bg-[#0B0F14] text-slate-900 dark:text-slate-100">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-[#101722]">
        <div className="h-16 px-5 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => navigateTo('landing')}
            className="font-display text-base font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap cursor-pointer"
          >
            {t.brandName}
          </button>
          <Shield className="w-4 h-4 text-[#00E676] shrink-0" />
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {navGroups.map((group) => (
            <div key={group.heading} className="space-y-1">
              <div className="px-3 text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                {group.heading}
              </div>
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = view === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => navigateTo(item.id)}
                    className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                      active
                        ? 'bg-[#00E676]/15 text-emerald-700 dark:text-[#00E676] font-semibold'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#161E29]'
                    }`}
                  >
                    <span className="flex items-center gap-3 min-w-0">
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </span>
                    {item.locked && <Lock className="w-3 h-3 text-slate-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
          <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
            {profile.displayName} · <span className="capitalize">{role}</span>
          </div>
          {isGuest ? (
            <button
              type="button"
              onClick={() => setAuthModalOpen(true)}
              className="w-full py-2 px-3 rounded-lg bg-[#00E676] text-[#0B0F14] text-xs font-semibold hover:bg-[#00d46c] cursor-pointer"
            >
              User Login / Admin Demo
            </button>
          ) : (
            <button
              type="button"
              onClick={handleLogout}
              className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-[#FF5252] cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              {t.signOut}
            </button>
          )}
        </div>
      </aside>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/60"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="relative w-72 max-w-[82vw] bg-white dark:bg-[#101722] border-r border-slate-200 dark:border-slate-800 flex flex-col z-10">
            <div className="h-16 px-5 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
              <span className="font-display text-base font-bold text-slate-900 dark:text-white">
                {t.brandName}
              </span>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 text-slate-500"
                aria-label="Close navigation menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
              {navGroups.map((group) => (
                <div key={group.heading} className="space-y-1">
                  <div className="px-3 text-[11px] font-semibold text-slate-400">
                    {group.heading}
                  </div>
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const active = view === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => navigateTo(item.id)}
                        className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-xs font-medium ${
                          active
                            ? 'bg-[#00E676]/15 text-emerald-700 dark:text-[#00E676] font-semibold'
                            : 'text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        <span className="flex items-center gap-3">
                          <Icon className="w-4 h-4 shrink-0" />
                          <span>{item.label}</span>
                        </span>
                        {item.locked && <Lock className="w-3 h-3 text-slate-400" />}
                      </button>
                    );
                  })}
                </div>
              ))}
            </nav>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 h-16 px-4 sm:px-6 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-[#0B0F14]/90 backdrop-blur-md flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200"
              aria-label="Open navigation menu"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2 text-xs sm:text-sm min-w-0">
              <button
                type="button"
                onClick={() => navigateTo('dashboard')}
                className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white whitespace-nowrap cursor-pointer hidden sm:inline"
              >
                Console
              </button>
              <span className="text-slate-400 hidden sm:inline">/</span>
              <h1 className="font-display font-semibold text-slate-900 dark:text-white truncate">
                {activeNavLabel}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <select
              aria-label="Select Language"
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value as LanguageCode)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#101722] text-xs font-medium text-slate-700 dark:text-slate-200 cursor-pointer"
            >
              <option value="en">EN</option>
              <option value="hi">HI</option>
              <option value="mr">MR</option>
            </select>

            <button
              type="button"
              onClick={() => handleThemeChange(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#101722] text-slate-700 dark:text-slate-200 hover:border-[#00B0FF] cursor-pointer"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {authReady && isGuest && (
              <button
                type="button"
                onClick={() => setAuthModalOpen(true)}
                className="px-3.5 py-1.5 rounded-lg bg-[#00E676] text-[#0B0F14] text-xs font-semibold hover:bg-[#00d46c] whitespace-nowrap cursor-pointer"
              >
                {t.signIn}
              </button>
            )}
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {view === 'dashboard' && (
            <DashboardHome
              scans={scans}
              extraStats={scanCounters}
              securityScore={profile.securityScore}
              levelLabel={profile.level}
              isGuest={isGuest}
              tips={securityTips}
              t={t}
              onNavigate={navigateTo}
              onExportPdf={handleExportPdf}
              onOpenAuth={() => setAuthModalOpen(true)}
            />
          )}

          {view === 'url-scanner' && (
            <UrlScannerView
              language={language}
              t={t}
              onScanComplete={handleScanComplete}
              onExportPdf={handleExportPdf}
            />
          )}

          {view === 'email-scanner' && (
            <EmailScannerView
              language={language}
              t={t}
              onScanComplete={handleScanComplete}
              onExportPdf={handleExportPdf}
            />
          )}

          {view === 'screenshot-analyzer' && (
            <ScreenshotAnalyzerView
              language={language}
              t={t}
              onScanComplete={handleScanComplete}
              onExportPdf={handleExportPdf}
            />
          )}

          {view === 'qr-scanner' && (
            <QrScannerView
              language={language}
              t={t}
              onScanComplete={handleScanComplete}
              onExportPdf={handleExportPdf}
            />
          )}

          {view === 'ai-assistant' && (
            <AiAssistantView language={language} t={t} />
          )}

          {view === 'history' && (
            <ScanHistoryView
              scans={scans}
              isGuest={isGuest}
              onOpenAuth={() => setAuthModalOpen(true)}
              onStartScan={() => navigateTo('url-scanner')}
              t={t}
              onExportPdf={handleExportPdf}
              onDeleteScan={handleDeleteScan}
            />
          )}

          {view === 'threat-intel' && (
            <ThreatIntelView items={threatIntel} t={t} />
          )}

          {view === 'learning-hub' && (
            <LearningHubView articles={learningArticles} t={t} />
          )}

          {view === 'profile' && (
            <ProfileView
              profile={profile}
              role={role}
              isGuest={isGuest}
              scans={scans}
              language={language}
              onLanguageChange={handleLanguageChange}
              onSaveProfile={handleSaveProfileOrSettings}
              onRefreshVerification={handleRefreshVerification}
              onOpenAuth={() => setAuthModalOpen(true)}
              t={t}
            />
          )}

          {view === 'settings' && (
            <SettingsView
              theme={theme}
              onThemeChange={handleThemeChange}
              language={language}
              onLanguageChange={handleLanguageChange}
              profile={profile}
              onSaveSettings={handleSaveProfileOrSettings}
              onLogout={handleLogout}
              role={role}
              t={t}
            />
          )}

          {view === 'admin' && role === 'admin' && (
            <AdminDashboardView
              isDemoAdmin={sessionMode === 'admin-demo'}
              threatIntel={threatIntel}
              onIntelPublished={(item) =>
                setThreatIntel((prev) => [item, ...prev])
              }
            />
          )}
        </main>
      </div>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onContinueAsGuest={enterGuestMode}
        onEnterUserDemo={enterUserDemo}
        onEnterAdminDemo={enterAdminDemo}
      />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <PhishShieldApp />
    </ErrorBoundary>
  );
}
