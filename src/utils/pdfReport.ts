import { jsPDF } from 'jspdf';
import { ScanAnalysisResult } from '../types';

export function generateThreatReportPdf(scan: ScanAnalysisResult, userName?: string): void {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const margin = 44;
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - margin * 2;
  let y = 48;

  // Header Banner
  doc.setFillColor(11, 15, 20);
  doc.rect(0, 0, pageWidth, 88, 'F');
  doc.setTextColor(0, 230, 118);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('PhishShield AI Pro', margin, 40);

  doc.setTextColor(226, 232, 240);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('AI-Powered Multi-Layer Cyber Threat Report', margin, 58);
  doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth - margin, 40, { align: 'right' });
  if (userName) {
    doc.text(`Analyst / Account: ${userName}`, pageWidth - margin, 58, { align: 'right' });
  }

  y = 114;

  // Verdict Summary Strip
  const verdictColor: [number, number, number] =
    scan.verdict === 'Phishing'
      ? [255, 82, 82]
      : scan.verdict === 'Suspicious'
        ? [245, 158, 11]
        : [0, 190, 100];

  doc.setDrawColor(210, 218, 226);
  doc.setFillColor(246, 248, 250);
  doc.roundedRect(margin, y, contentWidth, 74, 4, 4, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(`Scan Type: ${scan.scanType.toUpperCase()}`, margin + 16, y + 24);

  doc.setTextColor(...verdictColor);
  doc.setFontSize(14);
  doc.text(`Verdict: ${scan.verdict} (${scan.threatLevel} Severity)`, margin + 16, y + 46);

  doc.setTextColor(51, 65, 85);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(
    `Risk Score: ${Math.round(scan.riskScore)}/100   |   AI Confidence: ${Math.round(scan.confidenceScore)}%   |   Scan Date: ${new Date(scan.createdAt).toLocaleString()}`,
    margin + 16,
    y + 64
  );

  y += 96;

  // Target Artifact
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Analyzed Artifact', margin, y);
  y += 16;

  doc.setFont('courier', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(51, 65, 85);
  const targetLines = doc.splitTextToSize(
    String(scan.destinationAddress || scan.targetSummary || 'Analyzed Artifact'),
    contentWidth
  );
  doc.text(targetLines, margin, y);
  y += targetLines.length * 13 + 16;

  // Explainable AI Section
  const addSection = (title: string, body: string) => {
    const safeBody = String(body || '').trim();
    if (!safeBody) return;
    if (y > 720) {
      doc.addPage();
      y = 48;
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11.5);
    doc.setTextColor(15, 23, 42);
    doc.text(title, margin, y);
    y += 15;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(51, 65, 85);
    const wrapped = doc.splitTextToSize(safeBody, contentWidth);
    doc.text(wrapped, margin, y);
    y += wrapped.length * 13 + 14;
  };

  addSection('Explainable AI — Why Detected', scan.explainableAI?.whyDetected || 'Multi-signal analysis completed.');
  addSection('Suspicious Indicators Analysis', scan.explainableAI?.whatMakesSuspicious || '');

  const triggered = scan.explainableAI?.triggeredFeatures || [];
  if (triggered.length > 0) {
    addSection(
      'Triggered Risk Features',
      triggered.map((f, i) => `${i + 1}. ${f}`).join('\n')
    );
  }

  const recs = scan.recommendations || [];
  if (recs.length > 0) {
    addSection(
      'Actionable Recommendations',
      recs.map((r, i) => `${i + 1}. ${r}`).join('\n')
    );
  }

  // Footer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(120, 130, 145);
  doc.text(
    `PhishShield AI Pro Threat Report · Scan ID: ${scan.id}`,
    margin,
    doc.internal.pageSize.getHeight() - 28
  );

  doc.save(`PhishShield-Report-${scan.scanType}-${scan.id.slice(0, 10)}.pdf`);
}
