import {
  LearningArticleItem,
  ScanAnalysisResult,
  SecurityTipItem,
  ThreatIntelItem,
} from '../types';

export const HERO_SHIELD_IMAGE = '/src/assets/images/hero_cyber_shield_1795012265828.jpg';
export const THREAT_CONSOLE_IMAGE = '/src/assets/images/threat_analysis_console_1795012266332.jpg';
export const AVATAR_SECURITY_LEAD = '/src/assets/images/avatar_security_lead_1795012266544.jpg';
export const AVATAR_CISO_USER = '/src/assets/images/avatar_ciso_user_1795012266703.jpg';

export const DEFAULT_SECURITY_TIPS: SecurityTipItem[] = [
  {
    id: 'tip_otp',
    title: 'Never Share OTP',
    category: 'Social Engineering',
    content:
      'Legitimate banks, UPI apps, and support teams will never call, SMS, or email requesting your 6-digit OTP or PIN.',
    orderIndex: 0,
  },
  {
    id: 'tip_mfa',
    title: 'Enable MFA',
    category: 'Multi-Factor Authentication',
    content:
      'Enable authenticator apps or FIDO2 passkeys across email, banking, and cloud accounts to block credential stuffing and phishing proxies.',
    orderIndex: 1,
  },
  {
    id: 'tip_sender',
    title: 'Verify Sender Email',
    category: 'Email Security',
    content:
      'Inspect the full sender domain after the @ symbol before replying or clicking links—display names are easily forged.',
    orderIndex: 2,
  },
  {
    id: 'tip_domain',
    title: 'Check Domain Before Clicking',
    category: 'URL Safety',
    content:
      'Look closely for character replacements such as 0 instead of O or 1 instead of l in banking and e-commerce links.',
    orderIndex: 3,
  },
  {
    id: 'tip_updates',
    title: 'Update Software Regularly',
    category: 'Cyber Hygiene',
    content:
      'Keep browsers, mobile OS, and security software patched to close zero-day vulnerabilities targeted by malicious links.',
    orderIndex: 4,
  },
];

export const DEFAULT_THREAT_INTEL: ThreatIntelItem[] = [
  {
    id: 'intel_sbi_portal',
    title: 'Fake SBI Login Portal',
    category: 'Banking Fraud',
    severity: 'Critical',
    summary:
      'Credential-harvesting campaign mimicking State Bank of India net-banking login screens via SMS links warning of KYC suspension.',
    pattern: 'Detected: 2 Hours Ago · https://sbi-kyc-update-portal[.]net/login',
    mitigation: 'Never enter net-banking credentials from SMS links; navigate directly to official bank portals.',
    publishedAt: '2026-11-18T04:55:00Z',
  },
  {
    id: 'intel_amazon_refund',
    title: 'Amazon Refund Scam',
    category: 'Brand Impersonation',
    severity: 'High',
    summary:
      'Spoofed order-cancellation alerts direct shoppers to character-substituted login pages requesting card verification for fake refunds.',
    pattern: 'Detected: 5 Hours Ago · https://amaz0n-security-login[.]net',
    mitigation: 'Inspect sender domain spelling and check order status only inside the official Amazon app.',
    publishedAt: '2026-11-18T01:55:00Z',
  },
  {
    id: 'intel_upi_qr',
    title: 'UPI QR Fraud',
    category: 'QR Code Scams',
    severity: 'Medium',
    summary:
      'Fraudsters send tampered QR codes claiming recipients will receive cashback or refund credits, while the payload actually initiates an outgoing payment or credential lure.',
    pattern: 'Detected: 9 Hours Ago · https://secure-paytm-verification[.]net',
    mitigation: 'Remember: scanning a QR code is never required to receive money. Inspect every QR destination before opening.',
    publishedAt: '2026-11-17T21:55:00Z',
  },
  {
    id: 'intel_aitm_proxy',
    title: 'Adversary-in-the-Middle (AiTM) Reverse-Proxy Login Clones',
    category: 'Credential Harvesting',
    severity: 'Critical',
    summary:
      'Pixel-identical cloned login pages proxy live authentication flows to intercept session cookies even when SMS OTP is entered.',
    pattern: 'Detected: 14 Hours Ago · Cloned SSO subdomain proxy',
    mitigation: 'Upgrade to phishing-resistant FIDO2/WebAuthn passkeys bound strictly to official origin domains.',
    publishedAt: '2026-11-17T16:45:00Z',
  },
];

export const DEFAULT_LEARNING_ARTICLES: LearningArticleItem[] = [
  {
    id: 'learn_phishing',
    topic: 'Phishing',
    title: 'Understanding Phishing',
    summary: 'How attackers craft deceptive links, character-substituted domains, and fake login portals.',
    content:
      'Phishing attacks trick users into revealing passwords, OTPs, or financial details by impersonating trusted brands. Always inspect the root domain for character replacements (such as amaz0n instead of amazon), avoid urgent verification links, and use PhishShield AI Pro to scan suspicious URLs before clicking.',
    readMinutes: 5,
    difficulty: 'Beginner',
  },
  {
    id: 'learn_email_guide',
    topic: 'Email Security',
    title: 'Email Protection Guide',
    summary: 'Spot coercive urgency language, spoofed sender domains, and dangerous email attachments.',
    content:
      'Malicious emails routinely combine threat language ("account suspended within 24 hours") with mismatched sender domains like support@bankverify-check.com. Verify the domain after @, hover over links without clicking, and confirm sensitive financial or credential requests out of band.',
    readMinutes: 6,
    difficulty: 'Beginner',
  },
  {
    id: 'learn_qr_prevention',
    topic: 'QR Code Scams',
    title: 'QR Scam Prevention',
    summary: 'Why attackers hide phishing URLs inside QR codes and how to decode destinations safely.',
    content:
      'QR phishing ("quishing") conceals deceptive URLs behind machine-readable patterns in emails, posters, and payment slips. Never scan unverified QR codes directly into your mobile browser—inspect the decoded destination address first using a QR security scanner.',
    readMinutes: 4,
    difficulty: 'Beginner',
  },
  {
    id: 'learn_password_security',
    topic: 'Password Safety',
    title: 'Password Security',
    summary: 'Build unique passphrases and prevent cross-site credential stuffing attacks.',
    content:
      'Reusing passwords lets a single third-party breach unlock your banking and email accounts. Use 14+ character unique passphrases managed by a reputable password manager that refuses to auto-fill credentials on lookalike phishing domains.',
    readMinutes: 4,
    difficulty: 'Beginner',
  },
  {
    id: 'learn_mfa',
    topic: 'MFA',
    title: 'MFA Best Practices',
    summary: 'Choose authenticator apps and hardware passkeys over vulnerable SMS verification codes.',
    content:
      'Multi-Factor Authentication stops over 99% of automated account takeovers. Prefer app-based TOTP authenticators or FIDO2 passkeys over SMS OTPs, and never approve unexpected MFA push prompts.',
    readMinutes: 6,
    difficulty: 'Intermediate',
  },
  {
    id: 'learn_upi_fraud',
    topic: 'UPI Fraud',
    title: 'UPI Fraud Awareness',
    summary: 'Recognize fake collect requests, refund QR traps, and screen-sharing scams.',
    content:
      'Receiving money via UPI never requires entering your UPI PIN or scanning a QR code. Fraudsters impersonate marketplace buyers or customer support agents and send collect requests disguised as refunds. Always decline unverified PIN prompts.',
    readMinutes: 5,
    difficulty: 'Beginner',
  },
  {
    id: 'learn_social_eng',
    topic: 'Social Engineering',
    title: 'Social Engineering Attacks',
    summary: 'Defend against pretexting, authority manipulation, and urgent OTP harvesting calls.',
    content:
      'Social engineering exploits urgency, fear, or false authority rather than software flaws. Slow down whenever an email, message, or caller demands secrecy or immediate action, and independently verify identity through official channels.',
    readMinutes: 5,
    difficulty: 'Intermediate',
  },
];

export const DEMO_URL_BENCHMARK: ScanAnalysisResult = {
  id: 'demo_url_amaz0n',
  scanType: 'url',
  targetSummary: 'https://amaz0n-security-login.net',
  verdict: 'Phishing',
  threatLevel: 'Critical',
  confidenceScore: 98,
  riskScore: 96,
  featureChecks: [
    { feature: 'Keyword Analysis', status: 'fail', detail: 'Detected Keyword: security · Detected Keyword: login' },
    { feature: 'Brand Impersonation', status: 'fail', detail: 'Amazon Brand Imitation on unofficial .net domain' },
    { feature: 'Character Replacement', status: 'fail', detail: 'Character Replacement: 0 instead of O (amaz0n)' },
    { feature: 'Domain Reputation', status: 'fail', detail: 'Unverified lookalike domain outside amazon.com' },
    { feature: 'HTTPS', status: 'warn', detail: 'TLS certificate present on deceptive domain — HTTPS alone does not guarantee safety' },
  ],
  explainableAI: {
    whyDetected:
      'The URL impersonates Amazon using character replacement ("0" instead of "o") combined with high-risk credential keywords ("security", "login").',
    triggeredFeatures: [
      'Detected Keyword: security',
      'Detected Keyword: login',
      'Amazon Brand Imitation',
      'Character Replacement: 0 instead of O',
    ],
    whatMakesSuspicious:
      'Legitimate Amazon authentication occurs strictly on official amazon.com / amazon.in domains, never on hyphenated lookalike domains.',
    nextSteps: [
      'Avoid this website.',
      'Do not enter your Amazon email, password, or OTP.',
      'Access your account directly by typing amazon.com in a fresh browser tab.',
    ],
  },
  recommendations: ['Avoid this website.', 'Enable MFA on your shopping and payment accounts', 'Change password if previously entered'],
  createdAt: '2026-11-18T06:40:00Z',
  status: 'completed',
};

export const DEMO_EMAIL_BENCHMARK: ScanAnalysisResult = {
  id: 'demo_email_bankverify',
  scanType: 'email',
  targetSummary: 'Your Bank Account Will Be Suspended (support@bankverify-check.com)',
  verdict: 'Phishing',
  threatLevel: 'Critical',
  confidenceScore: 97,
  riskScore: 94,
  senderTrustScore: 14,
  extractedLinks: ['https://bankverify-check.com/restore-access'],
  featureChecks: [
    { feature: 'Urgency Language', status: 'fail', detail: 'Threatens immediate bank account suspension to pressure hasty action.' },
    { feature: 'Credential Requests', status: 'fail', detail: 'Credential Collection Attempt detected in message body.' },
    { feature: 'Suspicious Sender', status: 'fail', detail: 'Suspicious Domain: support@bankverify-check.com' },
    { feature: 'Financial Triggers', status: 'fail', detail: 'Financial Keywords paired with account lockout threat.' },
  ],
  explainableAI: {
    whyDetected:
      'This email exhibits classic banking phishing indicators: urgency language, credential collection attempt, suspicious domain, and financial triggers.',
    triggeredFeatures: [
      'Urgency Language',
      'Credential Collection Attempt',
      'Suspicious Domain (bankverify-check.com)',
      'Financial Keywords',
    ],
    whatMakesSuspicious:
      'Banks never threaten sudden suspension via third-party domains like bankverify-check.com or ask users to verify passwords through email links.',
    nextSteps: [
      'Do not reply or click any links inside the email.',
      'Report Sender as phishing in your email client.',
      'Contact your bank directly using the official number on the back of your card.',
    ],
  },
  recommendations: ['Report Sender', 'Avoid Website', 'Enable MFA on your banking profile'],
  createdAt: '2026-11-18T06:35:00Z',
  status: 'completed',
};

export const DEMO_SCREENSHOT_BENCHMARK: ScanAnalysisResult = {
  id: 'demo_screenshot_portal',
  scanType: 'screenshot',
  targetSummary: 'Captured Spoofed Banking & Login Portal Screen',
  verdict: 'Phishing',
  threatLevel: 'Critical',
  confidenceScore: 95,
  riskScore: 91,
  featureChecks: [
    { feature: 'Credential Fields', status: 'fail', detail: 'Password Field and Email Field requesting sensitive banking PIN.' },
    { feature: 'Brand Imitation', status: 'fail', detail: 'Brand Replication of well-known payment portal logo & palette.' },
    { feature: 'Scam Interfaces', status: 'fail', detail: 'Suspicious Interface paired with unencrypted HTTP lookalike address bar.' },
  ],
  highlightedRiskAreas: [
    {
      regionLabel: 'Spoofed Address Bar',
      xPercent: 11,
      yPercent: 2,
      widthPercent: 78,
      heightPercent: 8,
      severity: 'Critical',
      explanation: 'Non-HTTPS lookalike URL in browser bar.',
    },
    {
      regionLabel: 'Email & Password Fields',
      xPercent: 31,
      yPercent: 39,
      widthPercent: 38,
      heightPercent: 24,
      severity: 'High',
      explanation: 'Sensitive credential and ATM PIN harvesting fields.',
    },
  ],
  explainableAI: {
    whyDetected:
      'Computer vision inspection detected Password Field, Email Field, Brand Replication, and a Suspicious Interface hosted on an untrusted origin.',
    triggeredFeatures: [
      'Password Field',
      'Email Field',
      'Brand Replication',
      'Suspicious Interface',
    ],
    whatMakesSuspicious:
      'The login layout replicates official branding while collecting both passwords and PINs over an unofficial address bar.',
    nextSteps: [
      'Close the page immediately without submitting form data.',
      'Run a security check if any credentials were typed.',
    ],
  },
  recommendations: ['Avoid Website', 'Change Password if exposed', 'Use a password manager to enforce domain matching'],
  createdAt: '2026-11-18T06:20:00Z',
  status: 'completed',
};

export const DEMO_QR_BENCHMARK: ScanAnalysisResult = {
  id: 'demo_qr_paytm',
  scanType: 'qr',
  targetSummary: 'https://secure-paytm-verification.net',
  destinationAddress: 'https://secure-paytm-verification.net',
  verdict: 'Phishing',
  threatLevel: 'High',
  confidenceScore: 96,
  riskScore: 95,
  featureChecks: [
    { feature: 'Brand Impersonation', status: 'fail', detail: 'Impersonates Paytm on unofficial secure-paytm-verification.net domain.' },
    { feature: 'Keyword Analysis', status: 'fail', detail: 'Contains lure keywords "secure" and "verification".' },
    { feature: 'QR Payload Safety', status: 'fail', detail: 'Redirects mobile users to credential/UPI harvesting form.' },
  ],
  explainableAI: {
    whyDetected:
      'The QR code resolves to https://secure-paytm-verification.net, an unofficial brand-impersonation domain targeting mobile wallet users.',
    triggeredFeatures: [
      'Paytm Brand Impersonation',
      'Deceptive keywords: secure, verification',
      'Unofficial .net destination domain',
    ],
    whatMakesSuspicious:
      'Official Paytm verification never happens via third-party .net QR destinations.',
    nextSteps: [
      'Do not open the extracted QR destination.',
      'Delete or report the source message or flyer.',
    ],
  },
  recommendations: ['Avoid Website', 'Never scan unverified QR codes to receive payments', 'Enable app lock & MFA'],
  createdAt: '2026-11-18T06:10:00Z',
  status: 'completed',
};

export const INITIAL_DEMO_SCANS: ScanAnalysisResult[] = [
  {
    id: 'demo_scan_amazon',
    scanType: 'url',
    targetSummary: 'amazon-secure.net',
    verdict: 'Phishing',
    threatLevel: 'Critical',
    confidenceScore: 97,
    riskScore: 97,
    featureChecks: [
      { feature: 'Brand Impersonation', status: 'fail', detail: 'Impersonates Amazon on unofficial .net domain.' },
      { feature: 'Keyword Analysis', status: 'fail', detail: 'Contains deceptive keyword "secure".' },
    ],
    explainableAI: {
      whyDetected: 'Unofficial domain impersonating Amazon brand with security keyword lure.',
      triggeredFeatures: ['Amazon Brand Imitation', 'Detected Keyword: secure'],
      whatMakesSuspicious: 'Amazon does not host customer login pages on amazon-secure.net.',
      nextSteps: ['Avoid this website', 'Enable MFA on official Amazon account'],
    },
    recommendations: ['Avoid Website', 'Enable MFA'],
    createdAt: '2026-11-18T05:30:00Z',
    status: 'completed',
  },
  {
    id: 'demo_scan_paypal',
    scanType: 'url',
    targetSummary: 'paypal-account-check.net',
    verdict: 'Phishing',
    threatLevel: 'High',
    confidenceScore: 91,
    riskScore: 91,
    featureChecks: [
      { feature: 'Brand Impersonation', status: 'fail', detail: 'Impersonates PayPal outside official paypal.com.' },
      { feature: 'Keyword Analysis', status: 'warn', detail: 'Contains "account" and "check".' },
    ],
    explainableAI: {
      whyDetected: 'High-risk credential verification domain mimicking PayPal.',
      triggeredFeatures: ['PayPal Brand Imitation', 'Credential verification keywords'],
      whatMakesSuspicious: 'Legitimate PayPal alerts never redirect to hyphenated .net domains.',
      nextSteps: ['Avoid clicking', 'Verify directly inside paypal.com'],
    },
    recommendations: ['Avoid Website', 'Change Password if entered'],
    createdAt: '2026-11-17T19:15:00Z',
    status: 'completed',
  },
  {
    id: 'demo_scan_google',
    scanType: 'url',
    targetSummary: 'google.com',
    verdict: 'Safe',
    threatLevel: 'Safe',
    confidenceScore: 99,
    riskScore: 1,
    featureChecks: [
      { feature: 'Domain Reputation', status: 'pass', detail: 'Verified official root domain.' },
      { feature: 'HTTPS', status: 'pass', detail: 'Trusted HTTPS transport enforced.' },
    ],
    explainableAI: {
      whyDetected: 'Official verified domain with zero phishing or obfuscation signals.',
      triggeredFeatures: ['Verified Root Domain'],
      whatMakesSuspicious: 'No malicious indicators observed.',
      nextSteps: ['Safe to browse normally'],
    },
    recommendations: ['Keep browser updated'],
    createdAt: '2026-11-17T14:22:00Z',
    status: 'completed',
  },
  {
    ...DEMO_EMAIL_BENCHMARK,
    id: 'demo_scan_email_bank',
    createdAt: '2026-11-16T16:10:00Z',
  },
  {
    ...DEMO_QR_BENCHMARK,
    id: 'demo_scan_qr_paytm',
    createdAt: '2026-11-15T11:45:00Z',
  },
];

export const LANDING_FAQ_ITEMS = [
  {
    q: 'How does PhishShield AI Pro detect zero-day phishing links?',
    a: 'Every URL undergoes dual-layer inspection: deterministic lexical extraction (homoglyphs, subdomains, redirects, character replacement, brand distance) combined with Gemini multi-factor reasoning to explain exactly why a link is safe or malicious.',
  },
  {
    q: 'What can Guest Users access vs. Logged-In Users?',
    a: 'Guests can run live URL, Email, Screenshot, and QR scanners, chat with the AI Security Assistant, and browse Threat Intelligence and the Learning Hub. Logged-in users unlock persistent Scan History, Security Score tracking, Personal Analytics, Profile settings, and PDF Threat Reports.',
  },
  {
    q: 'How does the Screenshot Analyzer inspect fake portals?',
    a: 'Upload any login page or suspicious pop-up screenshot. The vision engine inspects password/email fields, brand replication, fake address bars, and highlights risky visual zones directly over the image.',
  },
  {
    q: 'Can I scan QR codes without opening the link on my phone?',
    a: 'Yes. Upload a QR code image and PhishShield AI Pro decodes the destination address locally first, then runs full phishing inspection before you ever visit the target.',
  },
  {
    q: 'Are scan reports exportable for compliance or incident response?',
    a: 'Yes. Logged-in users can export any completed URL, Email, Screenshot, or QR scan into a structured PDF Threat Report containing confidence scores, risk scores, findings, and recommendations.',
  },
];
