import type { BankingDocument } from "@/types/banking";
import { formatINR } from "./user-profile";

function escapePdfText(str: string): string {
  const safeStr = str.replace(/₹/g, "INR ").replace(/[^\x20-\x7E]/g, " ");
  return safeStr
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

class SimplePdfBuilder {
  private objects: string[] = [];

  addObject(content: string): number {
    this.objects.push(content);
    return this.objects.length;
  }

  build(): Uint8Array {
    let out = "%PDF-1.4\n%\xE2\xE3\xCF\xD3\n";
    const offsets: number[] = [];
    const encoder = new TextEncoder();

    for (let i = 0; i < this.objects.length; i++) {
      offsets.push(encoder.encode(out).length);
      out += `${i + 1} 0 obj\n${this.objects[i]}\nendobj\n`;
    }

    const startXref = encoder.encode(out).length;
    out += `xref\n0 ${this.objects.length + 1}\n0000000000 65535 f \n`;
    for (const offset of offsets) {
      out += `${offset.toString().padStart(10, "0")} 00000 n \n`;
    }

    out += `trailer\n<< /Size ${this.objects.length + 1} /Root 1 0 R >>\nstartxref\n${startXref}\n%%EOF\n`;
    return encoder.encode(out);
  }
}

export function generateGenericDocumentPdfBytes(
  doc: BankingDocument,
): Uint8Array {
  const builder = new SimplePdfBuilder();

  // Object 1: Catalog
  builder.addObject("<< /Type /Catalog /Pages 2 0 R >>");
  // Object 2: Pages
  builder.addObject("<< /Type /Pages /Kids [3 0 R] /Count 1 >>");
  // Object 3: Page (A4)
  builder.addObject(
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>",
  );

  const lines: string[] = [];

  const drawRect = (
    x: number,
    y: number,
    w: number,
    h: number,
    r: number,
    g: number,
    b: number,
  ) => {
    lines.push(`${r} ${g} ${b} rg ${x} ${y} ${w} ${h} re f`);
  };

  const drawLine = (
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    r: number,
    g: number,
    b: number,
    width = 1,
  ) => {
    lines.push(`${width} w ${r} ${g} ${b} RG ${x1} ${y1} m ${x2} ${y2} l S`);
  };

  const drawText = (
    text: string,
    x: number,
    y: number,
    font: "/F1" | "/F2",
    size: number,
    r: number,
    g: number,
    b: number,
  ) => {
    const escaped = escapePdfText(text);
    lines.push(
      `BT ${r} ${g} ${b} rg ${font} ${size} Tf ${x} ${y} Td (${escaped}) Tj ET`,
    );
  };

  // 1. Top Header Banner
  drawRect(0, 770, 595.28, 72, 0.11, 0.31, 0.85); // Blue primary #1D4ED8
  drawText("BANKMATE", 40, 805, "/F2", 20, 1, 1, 1);
  drawText("PREMIER WEALTH BANKING", 40, 788, "/F1", 9, 0.85, 0.92, 1);
  drawText("OFFICIAL BANK CERTIFICATE", 330, 805, "/F2", 11, 1, 1, 1);
  drawText(`Ref: ${doc.documentRefNumber}`, 330, 788, "/F1", 9, 0.85, 0.92, 1);

  // 2. Document Title Box
  drawRect(40, 715, 515.28, 40, 0.95, 0.97, 1.0);
  drawLine(40, 715, 555.28, 715, 0.8, 0.86, 0.95);
  drawText(doc.title.toUpperCase(), 55, 730, "/F2", 13, 0.11, 0.25, 0.65);

  // 3. Customer & Reference Box
  drawRect(40, 625, 515.28, 75, 0.97, 0.98, 0.99);
  drawLine(40, 625, 555.28, 625, 0.88, 0.9, 0.92);
  drawLine(40, 700, 555.28, 700, 0.88, 0.9, 0.92);

  drawText("CUSTOMER PARTICULARS", 55, 683, "/F2", 10, 0.15, 0.2, 0.35);
  drawText(`Name: ${doc.customerName}`, 55, 667, "/F1", 9, 0.2, 0.25, 0.3);
  drawText(`CIF Number: ${doc.cifNumber}`, 55, 652, "/F1", 9, 0.2, 0.25, 0.3);
  drawText(
    `Account/Loan Ref: ${doc.accountOrLoanReference}`,
    55,
    637,
    "/F1",
    9,
    0.2,
    0.25,
    0.3,
  );

  drawText("CERTIFICATE DETAILS", 320, 683, "/F2", 10, 0.15, 0.2, 0.35);
  drawText(
    `Branch: BKC Flagship Branch, Mumbai`,
    320,
    667,
    "/F1",
    9,
    0.2,
    0.25,
    0.3,
  );
  drawText(
    `Financial Year: ${doc.financialYear}`,
    320,
    652,
    "/F1",
    9,
    0.2,
    0.25,
    0.3,
  );
  drawText(
    `Issued On: ${doc.generatedDate}`,
    320,
    637,
    "/F1",
    9,
    0.2,
    0.25,
    0.3,
  );

  // 4. Particulars Table
  const tableTopY = 590;
  drawRect(40, tableTopY, 515.28, 22, 0.15, 0.2, 0.3);
  drawText("DESCRIPTION / PARTICULAR", 55, tableTopY + 7, "/F2", 9, 1, 1, 1);
  drawText("DETAILS / AMOUNT", 380, tableTopY + 7, "/F2", 9, 1, 1, 1);

  let currentY = tableTopY - 22;
  const entries = Object.entries(doc.particulars);
  for (let i = 0; i < entries.length; i++) {
    const [key, val] = entries[i];
    const isAlt = i % 2 === 1;
    if (isAlt) {
      drawRect(40, currentY, 515.28, 20, 0.98, 0.98, 0.99);
    }
    drawLine(40, currentY, 555.28, currentY, 0.9, 0.92, 0.94);
    drawText(key, 55, currentY + 6, "/F1", 9, 0.2, 0.25, 0.3);
    const displayVal =
      typeof val === "number"
        ? formatINR(val).replace(/₹/g, "INR ")
        : String(val);
    drawText(displayVal, 380, currentY + 6, "/F2", 9, 0.1, 0.15, 0.2);
    currentY -= 20;
  }

  // 5. Official Verification Stamp & Summary Box
  const summaryBoxY = Math.max(160, currentY - 30);
  drawRect(40, summaryBoxY - 70, 515.28, 65, 0.95, 0.97, 0.98);
  drawLine(40, summaryBoxY - 70, 555.28, summaryBoxY - 70, 0.85, 0.88, 0.92);
  drawText(
    "OFFICIAL CERTIFICATION & DECLARATION",
    55,
    summaryBoxY - 20,
    "/F2",
    9,
    0.15,
    0.2,
    0.35,
  );
  drawText(
    doc.summaryText.length > 95
      ? `${doc.summaryText.slice(0, 92)}...`
      : doc.summaryText,
    55,
    summaryBoxY - 38,
    "/F1",
    8.5,
    0.3,
    0.35,
    0.4,
  );
  drawText(
    `Digital Verification Code: ${doc.verificationCode} • Bank Seal Verified`,
    55,
    summaryBoxY - 56,
    "/F2",
    8,
    0.11,
    0.31,
    0.85,
  );

  // 6. Signatory
  drawText("For BankMate Limited", 400, 110, "/F2", 9, 0.2, 0.25, 0.3);
  drawText("Authorized Signatory (Digital)", 400, 85, "/F1", 8, 0.4, 0.45, 0.5);
  drawText("BKC Flagship Branch, Mumbai", 400, 72, "/F1", 8, 0.4, 0.45, 0.5);

  // 7. Footer
  drawLine(40, 50, 555.28, 50, 0.85, 0.88, 0.9);
  drawText(
    "This is an authenticated computer-generated certificate issued by BankMate Ltd. and does not require a physical signature.",
    60,
    35,
    "/F1",
    7.5,
    0.5,
    0.55,
    0.6,
  );

  const contentStream = lines.join("\n");
  const streamEncoder = new TextEncoder();
  const streamBytes = streamEncoder.encode(contentStream);

  // Object 4: Content Stream
  builder.addObject(
    `<< /Length ${streamBytes.length} >>\nstream\n${contentStream}\nendstream`,
  );
  // Object 5: Font F1 (Helvetica)
  builder.addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  // Object 6: Font F2 (Helvetica-Bold)
  builder.addObject(
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
  );

  return builder.build();
}

export function downloadGenericDocumentPdf(doc: BankingDocument) {
  try {
    const bytes = generateGenericDocumentPdfBytes(doc);
    const blob = new Blob([bytes as any], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download =
      doc.fileName || `${doc.documentType}_${doc.documentRefNumber}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    return true;
  } catch (err) {
    console.error("PDF download failed:", err);
    return false;
  }
}

export function printGenericDocumentHtml(doc: BankingDocument) {
  const printWindow = window.open("", "_blank", "width=850,height=950");
  if (!printWindow) return;

  const entriesHtml = Object.entries(doc.particulars)
    .map(
      ([key, val]) => `
      <tr>
        <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #334155;"><strong>${key}</strong></td>
        <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #0f172a; text-align: right;">${typeof val === "number" ? formatINR(val) : val}</td>
      </tr>
    `,
    )
    .join("");

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${doc.title} - ${doc.documentRefNumber}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #0f172a; margin: 40px; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 20px; border-bottom: 2px solid #1d4ed8; }
          .brand-title { font-size: 24px; font-weight: 800; color: #1d4ed8; margin: 0; }
          .brand-sub { font-size: 12px; color: #64748b; margin: 4px 0 0 0; }
          .doc-badge { background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 700; display: inline-block; margin-top: 15px; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 24px 0; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; }
          table { width: 100%; border-collapse: collapse; margin-top: 24px; }
          th { background: #0f172a; color: white; padding: 10px 14px; text-align: left; font-size: 12px; text-transform: uppercase; }
          .summary-box { margin-top: 30px; background: #f1f5f9; border-left: 4px solid #1d4ed8; padding: 16px; border-radius: 4px; font-size: 13px; line-height: 1.6; }
          .footer { margin-top: 40px; border-top: 1px solid #cbd5e1; padding-top: 16px; font-size: 11px; color: #94a3b8; text-align: center; }
          @media print { body { margin: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1 class="brand-title">BankMate</h1>
            <p class="brand-sub">Premier Wealth Banking • BKC Flagship Branch, Mumbai</p>
            <div class="doc-badge">${doc.title.toUpperCase()}</div>
          </div>
          <div style="text-align: right;">
            <p style="margin: 0; font-size: 12px; color: #64748b;">Reference No.</p>
            <p style="margin: 2px 0 0 0; font-size: 14px; font-weight: 700; color: #0f172a;">${doc.documentRefNumber}</p>
            <p style="margin: 4px 0 0 0; font-size: 12px; color: #64748b;">Issued: ${doc.generatedDate}</p>
          </div>
        </div>

        <div class="grid">
          <div>
            <p style="margin: 0; font-size: 12px; color: #64748b;">Customer Name</p>
            <p style="margin: 2px 0 10px 0; font-size: 14px; font-weight: 700;">${doc.customerName}</p>
            <p style="margin: 0; font-size: 12px; color: #64748b;">CIF Number</p>
            <p style="margin: 2px 0 0 0; font-size: 13px; font-weight: 600;">${doc.cifNumber}</p>
          </div>
          <div>
            <p style="margin: 0; font-size: 12px; color: #64748b;">Account / Loan Reference</p>
            <p style="margin: 2px 0 10px 0; font-size: 14px; font-weight: 700;">${doc.accountOrLoanReference}</p>
            <p style="margin: 0; font-size: 12px; color: #64748b;">Financial Year / Period</p>
            <p style="margin: 2px 0 0 0; font-size: 13px; font-weight: 600;">${doc.financialYear}</p>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Particulars</th>
              <th style="text-align: right;">Value / Details</th>
            </tr>
          </thead>
          <tbody>
            ${entriesHtml}
          </tbody>
        </table>

        <div class="summary-box">
          <strong>Official Certification:</strong>
          <p style="margin: 4px 0 0 0;">${doc.summaryText}</p>
          <p style="margin: 8px 0 0 0; font-size: 11px; color: #1d4ed8; font-weight: 700;">Verification Code: ${doc.verificationCode} • Bank Seal Validated</p>
        </div>

        <div style="margin-top: 50px; display: flex; justify-content: flex-end;">
          <div style="text-align: center; border-top: 1px solid #94a3b8; width: 220px; padding-top: 8px;">
            <p style="margin: 0; font-size: 12px; font-weight: 700;">Authorized Signatory</p>
            <p style="margin: 2px 0 0 0; font-size: 11px; color: #64748b;">BankMate Ltd, BKC Branch</p>
          </div>
        </div>

        <div class="footer">
          <p>This is a certified digital bank certificate. BankMate Ltd, Registered Office: Bandra Kurla Complex, Mumbai 400051.</p>
        </div>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => printWindow.print(), 350);
}
