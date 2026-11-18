import { LanguageCode } from '../types';

export interface TranslationStrings {
  brandName: string;
  navScanners: string;
  navIntelligence: string;
  navLearning: string;
  navFaq: string;
  launchConsole: string;
  heroTitle: string;
  heroSubtitle: string;
  startScanning: string;
  tryDemo: string;
  watchOverview: string;
  statUrlsAnalyzed: string;
  statThreatsDetected: string;
  statActiveUsers: string;
  statAccuracy: string;
  dashboard: string;
  urlScanner: string;
  emailScanner: string;
  screenshotAnalyzer: string;
  qrScanner: string;
  aiAssistant: string;
  scanHistory: string;
  threatIntel: string;
  learningHub: string;
  profile: string;
  settings: string;
  adminConsole: string;
  signOut: string;
  signIn: string;
  guestMode: string;
  securityScore: string;
  totalScans: string;
  threatsDetected: string;
  safeUrls: string;
  dangerousUrls: string;
  emailsAnalyzed: string;
  threatLevel: string;
  recentActivity: string;
  todaysTip: string;
  analyzeButton: string;
  analyzing: string;
  confidenceScore: string;
  riskScore: string;
  exportPdf: string;
  explainableAiTitle: string;
  whyDetected: string;
  triggeredFeatures: string;
  whatMakesSuspicious: string;
  whatToDoNext: string;
  recommendations: string;
  darkMode: string;
  lightMode: string;
  languageLabel: string;
  saveChanges: string;
  scoreSafe: string;
  scoreGood: string;
  scoreMedium: string;
  scoreCritical: string;
}

export const translations: Record<LanguageCode, TranslationStrings> = {
  en: {
    brandName: 'PhishShield AI Pro',
    navScanners: 'Scanners',
    navIntelligence: 'Intelligence',
    navLearning: 'Learning',
    navFaq: 'FAQ',
    launchConsole: 'Launch Console',
    heroTitle: 'Protect Yourself From Online Threats Using AI',
    heroSubtitle:
      'Detect phishing links, scam emails, dangerous QR codes, and fraudulent websites with intelligent AI-powered protection.',
    startScanning: 'Start Scanning',
    tryDemo: 'Try Demo',
    watchOverview: 'View Features',
    statUrlsAnalyzed: 'URLs Scanned',
    statThreatsDetected: 'Threats Detected',
    statActiveUsers: 'Active Users',
    statAccuracy: 'Detection Accuracy',
    dashboard: 'Security Dashboard',
    urlScanner: 'URL Scanner',
    emailScanner: 'Email Scanner',
    screenshotAnalyzer: 'Screenshot Analyzer',
    qrScanner: 'QR Scanner',
    aiAssistant: 'AI Security Assistant',
    scanHistory: 'Scan History',
    threatIntel: 'Threat Intelligence',
    learningHub: 'Learning Hub',
    profile: 'Profile',
    settings: 'Settings',
    adminConsole: 'Admin Console',
    signOut: 'Sign Out',
    signIn: 'Sign In',
    guestMode: 'Guest Mode',
    securityScore: 'Security Score',
    totalScans: 'Total Scans',
    threatsDetected: 'Threats Detected',
    safeUrls: 'Safe URLs',
    dangerousUrls: 'Dangerous URLs',
    emailsAnalyzed: 'Emails Analyzed',
    threatLevel: 'Threat Level',
    recentActivity: 'Recent Activity',
    todaysTip: "Today's Security Tip",
    analyzeButton: 'Analyze Threat',
    analyzing: 'Analyzing...',
    confidenceScore: 'Confidence Score',
    riskScore: 'Risk Score',
    exportPdf: 'Export PDF',
    explainableAiTitle: 'Explainable AI Analysis',
    whyDetected: 'Why was it classified this way?',
    triggeredFeatures: 'Triggered Risk Features',
    whatMakesSuspicious: 'What makes it suspicious?',
    whatToDoNext: 'What should you do next?',
    recommendations: 'Actionable Recommendations',
    darkMode: 'Dark Mode',
    lightMode: 'Light Mode',
    languageLabel: 'Interface & AI Language',
    saveChanges: 'Save Changes',
    scoreSafe: 'Safe',
    scoreGood: 'Good',
    scoreMedium: 'Medium',
    scoreCritical: 'Critical',
  },
  hi: {
    brandName: 'PhishShield AI Pro',
    navScanners: 'स्कैनर',
    navIntelligence: 'थ्रेट इंटेलिजेंस',
    navLearning: 'लर्निंग हब',
    navFaq: 'सवाल-जवाब',
    launchConsole: 'कंसोल खोलें',
    heroTitle: 'AI की मदद से ऑनलाइन खतरों से खुद को सुरक्षित रखें',
    heroSubtitle:
      'फ़िशिंग वेबसाइटों का पता लगाएं, ईमेल का विश्लेषण करें, स्क्रीनशॉट स्कैन करें, QR कोड जांचें और स्मार्ट सुरक्षा सुझाव प्राप्त करें।',
    startScanning: 'स्कैन शुरू करें',
    tryDemo: 'डेमो आज़माएं',
    watchOverview: 'अवलोकन देखें',
    statUrlsAnalyzed: 'विश्लेषित URL',
    statThreatsDetected: 'पता लगाए गए खतरे',
    statActiveUsers: 'सक्रिय उपयोगकर्ता',
    statAccuracy: 'सुरक्षा सटीकता',
    dashboard: 'सुरक्षा डैशबोर्ड',
    urlScanner: 'URL स्कैनर',
    emailScanner: 'ईमेल स्कैनर',
    screenshotAnalyzer: 'स्क्रीनशॉट विश्लेषक',
    qrScanner: 'QR स्कैनर',
    aiAssistant: 'AI सुरक्षा सहायक',
    scanHistory: 'स्कैन इतिहास',
    threatIntel: 'थ्रेट इंटेलिजेंस',
    learningHub: 'सुरक्षा लर्निंग हब',
    profile: 'प्रोफ़ाइल',
    settings: 'सेटिंग्स',
    adminConsole: 'एडमिन कंसोल',
    signOut: 'लॉग आउट',
    signIn: 'साइन इन',
    guestMode: 'गेस्ट मोड',
    securityScore: 'सुरक्षा स्कोर',
    totalScans: 'कुल स्कैन',
    threatsDetected: 'पहचाने गए खतरे',
    safeUrls: 'सुरक्षित URL',
    dangerousUrls: 'खतरनाक URL',
    emailsAnalyzed: 'विश्लेषित ईमेल',
    threatLevel: 'खतरे का स्तर',
    recentActivity: 'हाल की गतिविधि',
    todaysTip: 'आज का सुरक्षा सुझाव',
    analyzeButton: 'खतरे का विश्लेषण करें',
    analyzing: 'विश्लेषण जारी है...',
    confidenceScore: 'विश्वास स्कोर',
    riskScore: 'जोखिम स्कोर',
    exportPdf: 'PDF निर्यात करें',
    explainableAiTitle: 'व्याख्यात्मक AI विश्लेषण',
    whyDetected: 'यह परिणाम क्यों मिला?',
    triggeredFeatures: 'ट्रिगर किए गए जोखिम संकेत',
    whatMakesSuspicious: 'इसे संदिग्ध क्या बनाता है?',
    whatToDoNext: 'आगे क्या करना चाहिए?',
    recommendations: 'कार्रवाई योग्य सुझाव',
    darkMode: 'डार्क मोड',
    lightMode: 'लाइट मोड',
    languageLabel: 'इंटरफ़ेस और AI भाषा',
    saveChanges: 'परिवर्तन सहेजें',
    scoreSafe: 'सुरक्षित',
    scoreGood: 'अच्छा',
    scoreMedium: 'मध्यम',
    scoreCritical: 'गंभीर',
  },
  mr: {
    brandName: 'PhishShield AI Pro',
    navScanners: 'स्कॅनर्स',
    navIntelligence: 'थ्रेट इंटेलिजन्स',
    navLearning: 'लर्निंग हब',
    navFaq: 'FAQ',
    launchConsole: 'कन्सोल उघडा',
    heroTitle: 'AI च्या मदतीने ऑनलाइन धोक्यांपासून स्वतःचे संरक्षण करा',
    heroSubtitle:
      'फिशिंग वेबसाइट्स ओळखा, ईमेल तपासा, स्क्रीनशॉट स्कॅन करा, QR कोड तपासा आणि बुद्धिमान सुरक्षा शिफारसी मिळवा.',
    startScanning: 'स्कॅनिंग सुरू करा',
    tryDemo: 'डेमो पहा',
    watchOverview: 'आढावा पहा',
    statUrlsAnalyzed: 'तपासलेले URL',
    statThreatsDetected: 'ओळखलेले धोके',
    statActiveUsers: 'सक्रिय वापरकर्ते',
    statAccuracy: 'संरक्षण अचूकता',
    dashboard: 'सुरक्षा डॅशबोर्ड',
    urlScanner: 'URL स्कॅनर',
    emailScanner: 'ईमेल स्कॅनर',
    screenshotAnalyzer: 'स्क्रीनशॉट विश्लेषक',
    qrScanner: 'QR स्कॅनर',
    aiAssistant: 'AI सुरक्षा सहाय्यक',
    scanHistory: 'स्कॅन इतिहास',
    threatIntel: 'थ्रेट इंटेलिजन्स',
    learningHub: 'सुरक्षा लर्निंग हब',
    profile: 'प्रोफाइल',
    settings: 'सेटिंग्ज',
    adminConsole: 'ॲडमिन कन्सोल',
    signOut: 'बाहेर पडा',
    signIn: 'साइन इन',
    guestMode: 'गेस्ट मोड',
    securityScore: 'सुरक्षा स्कोअर',
    totalScans: 'एकूण स्कॅन',
    threatsDetected: 'ओळखलेले धोके',
    safeUrls: 'सुरक्षित URL',
    dangerousUrls: 'धोकादायक URL',
    emailsAnalyzed: 'तपासलेले ईमेल',
    threatLevel: 'धोक्याची पातळी',
    recentActivity: 'अलीकडील क्रियाकलाप',
    todaysTip: 'आजची सुरक्षा टीप',
    analyzeButton: 'धोका तपासा',
    analyzing: 'तपासणी सुरू आहे...',
    confidenceScore: 'विश्वास स्कोअर',
    riskScore: 'जोखीम स्कोअर',
    exportPdf: 'PDF निर्यात करा',
    explainableAiTitle: 'स्पष्टीकरणात्मक AI विश्लेषण',
    whyDetected: 'हा निष्कर्ष का निघाला?',
    triggeredFeatures: 'ट्रिगर झालेले धोका घटक',
    whatMakesSuspicious: 'संशयास्पद काय आहे?',
    whatToDoNext: 'पुढे काय करावे?',
    recommendations: 'सुरक्षा शिफारसी',
    darkMode: 'डार्क मोड',
    lightMode: 'लाईट मोड',
    languageLabel: 'इंटरफेस आणि AI भाषा',
    saveChanges: 'बदल जतन करा',
    scoreSafe: 'सुरक्षित',
    scoreGood: 'चांगला',
    scoreMedium: 'मध्यम',
    scoreCritical: 'गंभीर',
  },
};
