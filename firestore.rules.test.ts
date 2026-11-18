/**
 * Payload-First Security TDD Test Suite for PhishShield AI Pro Firestore Rules
 * Verifies all "Dirty Dozen" adversarial payloads are rejected with PERMISSION_DENIED.
 */

export interface SecurityTestCase {
  id: number;
  name: string;
  collectionPath: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  expectedResult: 'PERMISSION_DENIED';
  payload: Record<string, unknown>;
}

export const dirtyDozenSecurityPayloads: SecurityTestCase[] = [
  {
    id: 1,
    name: 'Shadow Update on users profile',
    collectionPath: '/users/user_alice',
    operation: 'update',
    expectedResult: 'PERMISSION_DENIED',
    payload: { displayName: 'Alice', isVerifiedAdmin: true }
  },
  {
    id: 2,
    name: 'Self-Assigned Admin Role on user creation',
    collectionPath: '/users/user_mallory',
    operation: 'create',
    expectedResult: 'PERMISSION_DENIED',
    payload: { uid: 'user_mallory', displayName: 'Mallory', role: 'admin', securityScore: 100, language: 'en', theme: 'dark' }
  },
  {
    id: 3,
    name: 'Privilege Escalation via role update',
    collectionPath: '/users/user_mallory',
    operation: 'update',
    expectedResult: 'PERMISSION_DENIED',
    payload: { role: 'admin' }
  },
  {
    id: 4,
    name: 'Unverified Email Spoofing of Admin Email',
    collectionPath: '/threatIntelligence/intel_fake',
    operation: 'create',
    expectedResult: 'PERMISSION_DENIED',
    payload: { authEmail: 'prince89761@gmail.com', email_verified: false, title: 'Spoofed Intel' }
  },
  {
    id: 5,
    name: 'Cross-User Scan Forgery',
    collectionPath: '/scans/scan_forged',
    operation: 'create',
    expectedResult: 'PERMISSION_DENIED',
    payload: { id: 'scan_forged', userId: 'user_victim', scanType: 'url', targetSummary: 'https://example.com', verdict: 'Safe', threatLevel: 'Low', confidenceScore: 95, riskScore: 5, explainableSummary: 'Clean', status: 'completed' }
  },
  {
    id: 6,
    name: 'Orphaned Report Creation referencing nonexistent scan',
    collectionPath: '/reports/rep_orphan',
    operation: 'create',
    expectedResult: 'PERMISSION_DENIED',
    payload: { id: 'rep_orphan', userId: 'user_alice', scanId: 'nonexistent_scan_999', title: 'Orphan Report', scanType: 'url', verdict: 'Phishing', threatLevel: 'High', confidenceScore: 90, riskScore: 85 }
  },
  {
    id: 7,
    name: 'Unbounded Array Poisoning on triggeredFeatures',
    collectionPath: '/scans/scan_array_dos',
    operation: 'create',
    expectedResult: 'PERMISSION_DENIED',
    payload: { id: 'scan_array_dos', userId: 'user_alice', triggeredFeatures: Array(50).fill('overflow') }
  },
  {
    id: 8,
    name: 'Document ID Poisoning with invalid characters',
    collectionPath: '/scans/bad$id*injection',
    operation: 'create',
    expectedResult: 'PERMISSION_DENIED',
    payload: { id: 'bad$id*injection', userId: 'user_alice' }
  },
  {
    id: 9,
    name: 'Client Timestamp Tampering on createdAt',
    collectionPath: '/scans/scan_backdated',
    operation: 'create',
    expectedResult: 'PERMISSION_DENIED',
    payload: { id: 'scan_backdated', userId: 'user_alice', createdAt: '1999-01-01T00:00:00Z' }
  },
  {
    id: 10,
    name: 'Cross-User PII Read on private info subcollection',
    collectionPath: '/users/user_bob/private/info',
    operation: 'get',
    expectedResult: 'PERMISSION_DENIED',
    payload: { requesterUid: 'user_alice' }
  },
  {
    id: 11,
    name: 'Blanket Query Scraping on scans without userId filter',
    collectionPath: '/scans',
    operation: 'list',
    expectedResult: 'PERMISSION_DENIED',
    payload: { requesterUid: 'user_alice', queryFilter: 'none' }
  },
  {
    id: 12,
    name: 'Terminal State Bypass on archived scan',
    collectionPath: '/scans/scan_archived_1',
    operation: 'update',
    expectedResult: 'PERMISSION_DENIED',
    payload: { status: 'completed', riskScore: 0 }
  }
];
