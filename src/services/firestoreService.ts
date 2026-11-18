import { User } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import {
  LanguageCode,
  LearningArticleItem,
  ScanAnalysisResult,
  SecurityTipItem,
  ThemeMode,
  ThreatIntelItem,
  ThreatReportRecord,
  UserProfileData,
} from '../types';

const ADMIN_EMAIL = 'prince89761@gmail.com';

function sanitizeId(raw: string): string {
  const cleaned = raw.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 120);
  return cleaned || `id_${Date.now()}`;
}

function truncate(val: string, maxLen: number): string {
  return val.trim().slice(0, maxLen) || '-';
}

export async function ensureUserProfile(
  authUser: User,
  defaults?: { language?: LanguageCode; theme?: ThemeMode }
): Promise<UserProfileData> {
  const userPath = `users/${authUser.uid}`;
  const privatePath = `users/${authUser.uid}/private/info`;

  let existingSnap;
  try {
    existingSnap = await getDoc(doc(db, 'users', authUser.uid));
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, userPath);
  }

  let privateEmail = authUser.email || '';
  try {
    const privSnap = await getDoc(doc(db, 'users', authUser.uid, 'private', 'info'));
    if (privSnap.exists()) {
      privateEmail = String(privSnap.data().email || privateEmail);
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, privatePath);
  }

  const isBootstrappedAdmin =
    authUser.emailVerified && authUser.email?.toLowerCase() === ADMIN_EMAIL;

  if (existingSnap.exists()) {
    const data = existingSnap.data();
    const resolvedRole = isBootstrappedAdmin || data.role === 'admin' ? 'admin' : 'user';
    if (authUser.emailVerified) {
      if (isBootstrappedAdmin && data.role !== 'admin') {
        try {
          await updateDoc(doc(db, 'users', authUser.uid), {
            role: 'admin',
            updatedAt: serverTimestamp(),
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, userPath);
        }
      }
      try {
        await setDoc(
          doc(db, 'users', authUser.uid, 'private', 'info'),
          {
            uid: authUser.uid,
            email: truncate(authUser.email || 'user@phishshield.local', 254),
            emailVerified: authUser.emailVerified,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, privatePath);
      }
    }

    return {
      uid: authUser.uid,
      displayName: String(data.displayName || authUser.displayName || 'Security Analyst'),
      email: privateEmail,
      emailVerified: authUser.emailVerified,
      role: resolvedRole,
      securityScore: typeof data.securityScore === 'number' ? data.securityScore : 88,
      language: (data.language as LanguageCode) || 'en',
      theme: (data.theme as ThemeMode) || 'dark',
      notificationsEnabled: data.notificationsEnabled ?? true,
      weeklyDigest: data.weeklyDigest ?? true,
      privacyStrictMode: data.privacyStrictMode ?? true,
      totalScans: typeof data.totalScans === 'number' ? data.totalScans : 0,
      threatsDetected: typeof data.threatsDetected === 'number' ? data.threatsDetected : 0,
      createdAt: data.createdAt?.toDate?.()?.toISOString?.() || new Date().toISOString(),
      updatedAt: data.updatedAt?.toDate?.()?.toISOString?.() || new Date().toISOString(),
    };
  }

  const profilePayload = {
    uid: authUser.uid,
    displayName: truncate(authUser.displayName || authUser.email?.split('@')[0] || 'Security Analyst', 100),
    role: isBootstrappedAdmin ? 'admin' : 'user',
    securityScore: 90,
    language: defaults?.language || 'en',
    theme: defaults?.theme || 'dark',
    notificationsEnabled: true,
    weeklyDigest: true,
    privacyStrictMode: true,
    totalScans: 0,
    threatsDetected: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  if (authUser.emailVerified) {
    try {
      await setDoc(doc(db, 'users', authUser.uid), profilePayload);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, userPath);
    }

    try {
      await setDoc(doc(db, 'users', authUser.uid, 'private', 'info'), {
        uid: authUser.uid,
        email: truncate(authUser.email || 'user@phishshield.local', 254),
        emailVerified: true,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, privatePath);
    }
  }

  return {
    uid: authUser.uid,
    displayName: profilePayload.displayName,
    email: authUser.email || '',
    emailVerified: authUser.emailVerified,
    role: isBootstrappedAdmin ? 'admin' : 'user',
    securityScore: 90,
    language: profilePayload.language,
    theme: profilePayload.theme,
    notificationsEnabled: true,
    weeklyDigest: true,
    privacyStrictMode: true,
    totalScans: 0,
    threatsDetected: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export async function updateUserProfileSettings(
  uid: string,
  updates: Partial<
    Pick<
      UserProfileData,
      | 'displayName'
      | 'securityScore'
      | 'language'
      | 'theme'
      | 'notificationsEnabled'
      | 'weeklyDigest'
      | 'privacyStrictMode'
      | 'totalScans'
      | 'threatsDetected'
    >
  >
): Promise<void> {
  const userPath = `users/${uid}`;
  const cleanUpdates: Record<string, unknown> = {
    updatedAt: serverTimestamp(),
  };

  if (updates.displayName !== undefined) {
    cleanUpdates.displayName = truncate(updates.displayName, 100);
  }
  if (updates.securityScore !== undefined) {
    cleanUpdates.securityScore = Math.max(0, Math.min(100, Math.round(updates.securityScore)));
  }
  if (updates.language !== undefined) {
    cleanUpdates.language = updates.language;
  }
  if (updates.theme !== undefined) {
    cleanUpdates.theme = updates.theme;
  }
  if (updates.notificationsEnabled !== undefined) {
    cleanUpdates.notificationsEnabled = Boolean(updates.notificationsEnabled);
  }
  if (updates.weeklyDigest !== undefined) {
    cleanUpdates.weeklyDigest = Boolean(updates.weeklyDigest);
  }
  if (updates.privacyStrictMode !== undefined) {
    cleanUpdates.privacyStrictMode = Boolean(updates.privacyStrictMode);
  }
  if (updates.totalScans !== undefined) {
    cleanUpdates.totalScans = Math.max(0, Math.floor(updates.totalScans));
  }
  if (updates.threatsDetected !== undefined) {
    cleanUpdates.threatsDetected = Math.max(0, Math.floor(updates.threatsDetected));
  }

  try {
    await updateDoc(doc(db, 'users', uid), cleanUpdates);
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, userPath);
  }
}

export async function saveScanToFirestore(
  uid: string,
  scan: ScanAnalysisResult
): Promise<string> {
  const scanId = sanitizeId(scan.id);
  const scanPath = `scans/${scanId}`;

  const triggered = (scan.explainableAI?.triggeredFeatures || [])
    .slice(0, 20)
    .map((s) => truncate(String(s), 200));
  const recs = (scan.recommendations || [])
    .slice(0, 10)
    .map((s) => truncate(String(s), 300));

  const payload = {
    id: scanId,
    userId: uid,
    scanType: scan.scanType,
    targetSummary: truncate(scan.targetSummary || 'Analyzed artifact', 500),
    verdict: scan.verdict,
    threatLevel: scan.threatLevel,
    confidenceScore: Math.max(0, Math.min(100, Number(scan.confidenceScore) || 0)),
    riskScore: Math.max(0, Math.min(100, Number(scan.riskScore) || 0)),
    explainableSummary: truncate(scan.explainableAI?.whyDetected || 'Analysis complete.', 4000),
    triggeredFeatures: triggered,
    recommendations: recs,
    status: 'completed',
    createdAt: serverTimestamp(),
  };

  try {
    await setDoc(doc(db, 'scans', scanId), payload);
    return scanId;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, scanPath);
  }
}

export async function fetchUserScans(uid: string): Promise<ScanAnalysisResult[]> {
  const path = 'scans';
  try {
    const q = query(
      collection(db, 'scans'),
      where('userId', '==', uid),
      limit(100)
    );
    const snap = await getDocs(q);
    const results = snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        scanType: data.scanType,
        targetSummary: data.targetSummary,
        verdict: data.verdict,
        threatLevel: data.threatLevel,
        confidenceScore: Number(data.confidenceScore || 0),
        riskScore: Number(data.riskScore || 0),
        featureChecks: [],
        explainableAI: {
          whyDetected: String(data.explainableSummary || ''),
          triggeredFeatures: Array.isArray(data.triggeredFeatures) ? data.triggeredFeatures : [],
          whatMakesSuspicious: String(data.explainableSummary || ''),
          nextSteps: Array.isArray(data.recommendations) ? data.recommendations : [],
        },
        recommendations: Array.isArray(data.recommendations) ? data.recommendations : [],
        createdAt: data.createdAt?.toDate?.()?.toISOString?.() || new Date().toISOString(),
        status: (data.status === 'archived' ? 'archived' : 'completed') as 'completed' | 'archived',
      };
    });
    return results.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
  }
}

export async function deleteScanRecord(scanId: string): Promise<void> {
  const cleanId = sanitizeId(scanId);
  try {
    await deleteDoc(doc(db, 'scans', cleanId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `scans/${cleanId}`);
  }
}

export async function logPdfReportRecord(
  uid: string,
  scan: ScanAnalysisResult
): Promise<void> {
  const reportId = sanitizeId(`rep_${scan.id}_${Date.now()}`);
  const scanId = sanitizeId(scan.id);
  const path = `reports/${reportId}`;

  try {
    await setDoc(doc(db, 'reports', reportId), {
      id: reportId,
      userId: uid,
      scanId,
      title: truncate(`${scan.scanType.toUpperCase()} Threat Report: ${scan.targetSummary}`, 200),
      scanType: scan.scanType,
      verdict: scan.verdict,
      threatLevel: scan.threatLevel,
      confidenceScore: Math.max(0, Math.min(100, Number(scan.confidenceScore) || 0)),
      riskScore: Math.max(0, Math.min(100, Number(scan.riskScore) || 0)),
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export async function fetchThreatIntelFromFirestore(): Promise<ThreatIntelItem[]> {
  try {
    const snap = await getDocs(query(collection(db, 'threatIntelligence'), limit(30)));
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        title: String(data.title || ''),
        category: String(data.category || ''),
        severity: data.severity || 'Medium',
        summary: String(data.summary || ''),
        pattern: String(data.pattern || ''),
        mitigation: String(data.mitigation || ''),
        publishedAt: data.publishedAt?.toDate?.()?.toISOString?.() || new Date().toISOString(),
      };
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'threatIntelligence');
  }
}

export async function publishThreatIntel(item: Omit<ThreatIntelItem, 'publishedAt'>): Promise<void> {
  const cleanId = sanitizeId(item.id);
  try {
    await setDoc(doc(db, 'threatIntelligence', cleanId), {
      id: cleanId,
      title: truncate(item.title, 200),
      category: truncate(item.category, 80),
      severity: item.severity,
      summary: truncate(item.summary, 2000),
      pattern: truncate(item.pattern, 500),
      mitigation: truncate(item.mitigation, 1000),
      publishedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `threatIntelligence/${cleanId}`);
  }
}

export async function fetchSecurityTipsFromFirestore(): Promise<SecurityTipItem[]> {
  try {
    const snap = await getDocs(query(collection(db, 'securityTips'), limit(20)));
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        title: String(data.title || ''),
        category: String(data.category || ''),
        content: String(data.content || ''),
        orderIndex: Number(data.orderIndex || 0),
      };
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'securityTips');
  }
}

export async function fetchLearningArticlesFromFirestore(): Promise<LearningArticleItem[]> {
  try {
    const snap = await getDocs(query(collection(db, 'learningArticles'), limit(30)));
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        topic: String(data.topic || ''),
        title: String(data.title || ''),
        summary: String(data.summary || ''),
        content: String(data.content || ''),
        readMinutes: Number(data.readMinutes || 5),
        difficulty: data.difficulty || 'Beginner',
      };
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'learningArticles');
  }
}

export async function fetchAdminAnalytics(): Promise<{
  users: UserProfileData[];
  scans: ScanAnalysisResult[];
  reports: ThreatReportRecord[];
}> {
  const [usersSnap, scansSnap, reportsSnap] = await Promise.all([
    getDocs(query(collection(db, 'users'), limit(100))).catch((err) =>
      handleFirestoreError(err, OperationType.LIST, 'users')
    ),
    getDocs(query(collection(db, 'scans'), orderBy('createdAt', 'desc'), limit(100))).catch((err) =>
      handleFirestoreError(err, OperationType.LIST, 'scans')
    ),
    getDocs(query(collection(db, 'reports'), orderBy('createdAt', 'desc'), limit(100))).catch((err) =>
      handleFirestoreError(err, OperationType.LIST, 'reports')
    ),
  ]);

  const users: UserProfileData[] = usersSnap.docs.map((d) => {
    const data = d.data();
    return {
      uid: d.id,
      displayName: String(data.displayName || 'User'),
      email: '',
      emailVerified: true,
      role: data.role === 'admin' ? 'admin' : 'user',
      securityScore: Number(data.securityScore || 85),
      language: data.language || 'en',
      theme: data.theme || 'dark',
      notificationsEnabled: data.notificationsEnabled ?? true,
      weeklyDigest: data.weeklyDigest ?? true,
      privacyStrictMode: data.privacyStrictMode ?? true,
      totalScans: Number(data.totalScans || 0),
      threatsDetected: Number(data.threatsDetected || 0),
      createdAt: data.createdAt?.toDate?.()?.toISOString?.() || new Date().toISOString(),
      updatedAt: data.updatedAt?.toDate?.()?.toISOString?.() || new Date().toISOString(),
    };
  });

  const scans: ScanAnalysisResult[] = scansSnap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      scanType: data.scanType,
      targetSummary: String(data.targetSummary || ''),
      verdict: data.verdict,
      threatLevel: data.threatLevel,
      confidenceScore: Number(data.confidenceScore || 0),
      riskScore: Number(data.riskScore || 0),
      featureChecks: [],
      explainableAI: {
        whyDetected: String(data.explainableSummary || ''),
        triggeredFeatures: Array.isArray(data.triggeredFeatures) ? data.triggeredFeatures : [],
        whatMakesSuspicious: String(data.explainableSummary || ''),
        nextSteps: Array.isArray(data.recommendations) ? data.recommendations : [],
      },
      recommendations: Array.isArray(data.recommendations) ? data.recommendations : [],
      createdAt: data.createdAt?.toDate?.()?.toISOString?.() || new Date().toISOString(),
      status: data.status === 'archived' ? 'archived' : 'completed',
    };
  });

  const reports: ThreatReportRecord[] = reportsSnap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      userId: String(data.userId || ''),
      scanId: String(data.scanId || ''),
      title: String(data.title || ''),
      scanType: data.scanType,
      verdict: data.verdict,
      threatLevel: data.threatLevel,
      confidenceScore: Number(data.confidenceScore || 0),
      riskScore: Number(data.riskScore || 0),
      createdAt: data.createdAt?.toDate?.()?.toISOString?.() || new Date().toISOString(),
    };
  });

  return { users, scans, reports };
}
