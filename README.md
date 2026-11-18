# PhishShield AI Pro

**AI-Powered Multi-Layer Cyber Threat Detection Platform**

PhishShield AI Pro is a full-stack cybersecurity SaaS application designed to detect phishing URLs, malicious emails, fraudulent website screenshots, PDF threat documents, and suspicious QR codes using server-side Google Gemini AI analysis and Firebase persistence.

---

## Core Capabilities

- **URL Phishing Detector**: Inspects URLs for typosquatting, suspicious keywords, subdomain depth, character replacement, brand impersonation, redirections, and HTTPS posture.
- **Email & Message Analyzer**: Analyzes pasted emails, short SMS/chat messages, `.eml`/`.txt` files, and `.pdf` attachments for urgency triggers, credential harvesting, financial lures, and embedded links.
- **Screenshot & Document Analyzer**: Accepts website screenshots (`PNG`, `JPEG`, `WebP`, `SVG`, `BMP`, `GIF`, `AVIF`) and `.pdf` documents, normalizing oversized images client-side and detecting spoofed login UIs and brand impersonation.
- **QR Code Threat Scanner**: Decodes QR codes directly in-browser (`jsQR`) or analyzes uploaded QR images/PDFs and inspects extracted payloads with AI.
- **AI Security Assistant**: Multimodal cybersecurity chat assistant supporting text queries and up to 3 attached files (`.pdf`, images, `.eml`, `.txt`).
- **Explainable AI & PDF Reports**: Provides 0–100 risk scores, confidence metrics, feature-level indicators, security recommendations, and downloadable PDF incident reports (`jsPDF`).
- **Role-Based Access & Security Score**:
  - **Continue As Guest**: Try all scanners, Threat Intelligence Center, Learning Hub, AI Assistant, and demo dashboard.
  - **User Login**: Email/password authentication with scan history, personal analytics, saved PDF reports, and 0–100 Security Score tracking.
  - **Admin Demo Access**: Platform-wide analytics, threat distribution, system health, and live threat intelligence feed management.

---

## Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Motion, Lucide React, `jsQR`, `jsPDF`
- **Backend**: Express + Vite (`server.ts`)
- **AI**: Server-side `@google/genai` SDK
- **Database & Auth**: Firebase Authentication & Cloud Firestore (`firestore.rules` + `firebase-blueprint.json`)

---

## Local Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment variables**:
   Copy `.env.example` to `.env` and fill in your credentials:
   ```bash
   cp .env.example .env
   ```
   - `GEMINI_API_KEY`: Your Google Gemini API key (used exclusively on the Express backend).
   - `APP_URL`: Application base URL (e.g., `http://localhost:3000`).

3. **Run in development**:
   ```bash
   npm run dev
   ```
   The app and API server run together on `http://localhost:3000`.

4. **Build for production**:
   ```bash
   npm run build
   npm start
   ```

5. **Type-check & lint Firestore rules**:
   ```bash
   npm run lint
   npx eslint firestore.rules
   ```

---

## Project Structure

- `server.ts` — Express API server (`/api/analyze/*`, `/api/assistant/chat`, `/api/health`) and Vite middleware integration
- `src/App.tsx` — Main application shell, routing, auth state, and security score orchestration
- `src/components/` — Modular UI views (`LandingPage`, `DashboardView`, `ScannersView`, `AssistantAndKnowledgeViews`, `AccountAndAdminViews`, `AuthModal`, `ThreatGauge`)
- `src/services/firestoreService.ts` — Firestore read/write helpers for user profiles, scans, threat intel, and PDF report logs
- `src/utils/fileHelpers.ts` — Client-side PDF/image/text normalization and safe API response parsing
- `src/utils/pdfReport.ts` — Branded PDF threat report generator
- `firestore.rules` & `firebase-blueprint.json` — Firestore security rules and schema blueprint
