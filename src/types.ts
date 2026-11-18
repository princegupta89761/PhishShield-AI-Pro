export type LanguageCode = 'en' | 'hi' | 'mr';
export type ThemeMode = 'dark' | 'light';
export type UserRole = 'guest' | 'user' | 'admin';
export type ScanType = 'url' | 'email' | 'screenshot' | 'qr';
export type VerdictType = 'Safe' | 'Suspicious' | 'Phishing';
export type ThreatLevel = 'Safe' | 'Low' | 'Medium' | 'High' | 'Critical';

export type AppView =
  | 'landing'
  | 'dashboard'
  | 'url-scanner'
  | 'email-scanner'
  | 'screenshot-analyzer'
  | 'qr-scanner'
  | 'ai-assistant'
  | 'history'
  | 'threat-intel'
  | 'learning-hub'
  | 'profile'
  | 'settings'
  | 'admin';

export interface FeatureCheckItem {
  feature: string;
  status: 'pass' | 'warn' | 'fail';
  detail: string;
}

export interface ExplainableAIReport {
  whyDetected: string;
  triggeredFeatures: string[];
  whatMakesSuspicious: string;
  nextSteps: string[];
}

export interface HighlightedRiskArea {
  regionLabel: string;
  xPercent: number;
  yPercent: number;
  widthPercent: number;
  heightPercent: number;
  severity: ThreatLevel;
  explanation: string;
}

export interface ScanAnalysisResult {
  id: string;
  scanType: ScanType;
  targetSummary: string;
  verdict: VerdictType;
  threatLevel: ThreatLevel;
  confidenceScore: number;
  riskScore: number;
  senderTrustScore?: number;
  destinationAddress?: string;
  extractedLinks?: string[];
  featureChecks: FeatureCheckItem[];
  highlightedRiskAreas?: HighlightedRiskArea[];
  explainableAI: ExplainableAIReport;
  recommendations: string[];
  createdAt: string;
  status: 'completed' | 'archived';
}

export interface UserProfileData {
  uid: string;
  displayName: string;
  email: string;
  emailVerified: boolean;
  role: 'user' | 'admin';
  level?: string;
  membership?: string;
  savedReports?: number;
  securityScore: number;
  language: LanguageCode;
  theme: ThemeMode;
  notificationsEnabled: boolean;
  weeklyDigest: boolean;
  privacyStrictMode: boolean;
  totalScans: number;
  threatsDetected: number;
  createdAt: string;
  updatedAt: string;
}

export interface ThreatIntelItem {
  id: string;
  title: string;
  category: string;
  severity: ThreatLevel;
  summary: string;
  pattern: string;
  mitigation: string;
  publishedAt: string;
}

export interface SecurityTipItem {
  id: string;
  title: string;
  category: string;
  content: string;
  orderIndex: number;
}

export interface LearningArticleItem {
  id: string;
  topic: string;
  title: string;
  summary: string;
  content: string;
  readMinutes: number;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
}

export interface ThreatReportRecord {
  id: string;
  userId: string;
  scanId: string;
  title: string;
  scanType: ScanType;
  verdict: VerdictType;
  threatLevel: ThreatLevel;
  confidenceScore: number;
  riskScore: number;
  createdAt: string;
}

export interface AssistantMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}
