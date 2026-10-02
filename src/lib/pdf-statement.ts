import type { Transaction } from "@/types/transaction";
import { formatINR } from "./bank-store";

export interface StatementData {
  statementId: string;
  account: string;
  accountNumber: string;
  accountName: string;
  startDate: string;
  endDate: string;
  periodLabel: string;
  generatedAt: string;
  openingBalance: number;
  closingBalance: number;
  totalCredits: number;
  totalDebits: number;
  netCashflow: number;
  totalCount: number;
  transactions: Transaction[];
}

/**
 * Dynamically re-filters transactions and recalculates statement financials for any custom period
 */
export function filterStatementData({
  allTransactions,
  startDateStr,
  endDateStr,
  account = "all",
  accountName = "Deep Yadav",
  accountNumber,
  statementId,
}: {
  allTransactions: Transaction[];
  startDateStr: string;
  endDateStr: string;
  account?: string;
  accountName?: string;
  accountNumber?: string;
  statementId?: string;
}): StatementData {
  const start = new Date(`${startDateStr}T00:00:00Z`);
  const end = new Date(`${endDateStr}T23:59:59.999Z`);

  // Sort chronologically
  let txs = [...allTransactions].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  if (account && account !== "all") {
    txs = txs.filter(
      (tx) => tx.account.toLowerCase() === account.toLowerCase(),
    );
  }

  const filtered = txs.filter((tx) => {
    const d = new Date(tx.date);
    return d >= start && d <= end;
  });

  const totalCredits = filtered
    .filter((tx) => tx.type === "credit")
    .reduce((sum, tx) => sum + tx.amount, 0);

  const totalDebits = filtered
    .filter((tx) => tx.type === "debit")
    .reduce((sum, tx) => sum + tx.amount, 0);

  const netCashflow = totalCredits - totalDebits;
  const baseBalance =
    account === "checking" ? 124680 : account === "savings" ? 484250 : 608930;
  const openingBalance = Math.max(0, baseBalance - netCashflow);
  const closingBalance = openingBalance + netCashflow;

  const formatLabel = (dateStr: string) => {
    const parts = dateStr.split("-").map(Number);
    if (parts.length === 3) {
      const d = new Date(parts[0], parts[1] - 1, parts[2]);
      return d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    }
    return dateStr;
  };

  const startLabel = formatLabel(startDateStr);
  const endLabel = formatLabel(endDateStr);

  return {
    statementId:
      statementId || `STM-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    account,
    accountNumber:
      accountNumber ||
      (account === "savings"
        ? "4092 •••• 8842"
        : account === "checking"
          ? "4092 •••• 1928"
          : "4092 •••• 8842 (Primary)"),
    accountName: accountName || "Deep Yadav",
    startDate: startDateStr,
    endDate: endDateStr,
    periodLabel: `${startLabel} – ${endLabel}`,
    generatedAt: new Date().toISOString(),
    openingBalance,
    closingBalance,
    totalCredits,
    totalDebits,
    netCashflow,
    totalCount: filtered.length,
    transactions: filtered,
  };
}

function escapePdfText(str: string): string {
  // Replace non-ascii characters (like rupee ₹) with INR or ASCII equivalents
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

/**
 * Generate a clean official BankMate Statement PDF binary bytes
 */
export function generateStatementPdfBytes(
  statement: StatementData,
): Uint8Array {
  const builder = new SimplePdfBuilder();

  // Object 1: Catalog
  builder.addObject("<< /Type /Catalog /Pages 2 0 R >>");
  // Object 2: Pages
  builder.addObject("<< /Type /Pages /Kids [3 0 R] /Count 1 >>");
  // Object 3: Page (A4 is 595.28 x 841.89 points)
  builder.addObject(
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>",
  );

  // Content Stream construction
  const lines: string[] = [];

  // Helper drawing functions
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
  drawText("OFFICIAL ACCOUNT STATEMENT", 350, 805, "/F2", 12, 1, 1, 1);
  drawText(`Ref: ${statement.statementId}`, 350, 788, "/F1", 9, 0.85, 0.92, 1);

  // 2. Customer & Branch Info Box
  drawRect(40, 680, 515.28, 75, 0.96, 0.97, 0.98); // Light gray box
  drawLine(40, 680, 555.28, 680, 0.88, 0.9, 0.92);
  drawLine(40, 755, 555.28, 755, 0.88, 0.9, 0.92);

  drawText("ACCOUNT HOLDER DETAILS", 55, 738, "/F2", 10, 0.15, 0.2, 0.35);
  drawText(`Name: ${statement.accountName}`, 55, 722, "/F1", 9, 0.2, 0.25, 0.3);
  drawText(`CIF Number: CIF-8829104`, 55, 707, "/F1", 9, 0.2, 0.25, 0.3);
  drawText(
    `Account No: ${statement.accountNumber}`,
    55,
    692,
    "/F1",
    9,
    0.2,
    0.25,
    0.3,
  );

  drawText("BRANCH & PERIOD DETAILS", 320, 738, "/F2", 10, 0.15, 0.2, 0.35);
  drawText(
    `Branch: BKC Flagship Branch, Mumbai`,
    320,
    722,
    "/F1",
    9,
    0.2,
    0.25,
    0.3,
  );
  drawText(`IFSC Code: BKMT0001042`, 320, 707, "/F1", 9, 0.2, 0.25, 0.3);
  drawText(
    `Period: ${statement.periodLabel}`,
    320,
    692,
    "/F2",
    9,
    0.11,
    0.31,
    0.85,
  );

  // 3. Statement Summary Ribbon (Opening, Credits, Debits, Closing)
  const summaryY = 620;
  drawRect(40, summaryY, 515.28, 45, 0.93, 0.95, 0.98);
  drawLine(40, summaryY, 555.28, summaryY, 0.8, 0.85, 0.9);
  drawLine(40, summaryY + 45, 555.28, summaryY + 45, 0.8, 0.85, 0.9);

  drawText("OPENING BALANCE", 50, summaryY + 30, "/F1", 8, 0.4, 0.45, 0.5);
  drawText(
    `INR ${statement.openingBalance.toLocaleString("en-IN")}`,
    50,
    summaryY + 12,
    "/F2",
    11,
    0.1,
    0.15,
    0.2,
  );

  drawText("TOTAL CREDITS (+)", 180, summaryY + 30, "/F1", 8, 0.4, 0.45, 0.5);
  drawText(
    `+INR ${statement.totalCredits.toLocaleString("en-IN")}`,
    180,
    summaryY + 12,
    "/F2",
    11,
    0.05,
    0.6,
    0.3,
  );

  drawText("TOTAL DEBITS (-)", 310, summaryY + 30, "/F1", 8, 0.4, 0.45, 0.5);
  drawText(
    `-INR ${statement.totalDebits.toLocaleString("en-IN")}`,
    310,
    summaryY + 12,
    "/F2",
    11,
    0.85,
    0.2,
    0.2,
  );

  drawText("CLOSING BALANCE", 430, summaryY + 30, "/F1", 8, 0.4, 0.45, 0.5);
  drawText(
    `INR ${statement.closingBalance.toLocaleString("en-IN")}`,
    430,
    summaryY + 12,
    "/F2",
    11,
    0.11,
    0.31,
    0.85,
  );

  // 4. Transactions Table Header
  const tableHeaderY = 585;
  drawRect(40, tableHeaderY, 515.28, 22, 0.15, 0.2, 0.3); // Dark header bar
  drawText("DATE", 45, tableHeaderY + 7, "/F2", 8, 1, 1, 1);
  drawText("TRANSACTION DESCRIPTION", 110, tableHeaderY + 7, "/F2", 8, 1, 1, 1);
  drawText("CATEGORY", 320, tableHeaderY + 7, "/F2", 8, 1, 1, 1);
  drawText("TYPE", 410, tableHeaderY + 7, "/F2", 8, 1, 1, 1);
  drawText("AMOUNT (INR)", 475, tableHeaderY + 7, "/F2", 8, 1, 1, 1);

  // 5. Transaction Rows
  let rowY = tableHeaderY - 20;
  const maxRows = Math.min(statement.transactions.length, 16);

  for (let i = 0; i < maxRows; i++) {
    const tx = statement.transactions[i];
    const isEven = i % 2 === 0;

    if (isEven) {
      drawRect(40, rowY - 4, 515.28, 18, 0.98, 0.98, 0.99);
    }
    drawLine(40, rowY - 4, 555.28, rowY - 4, 0.92, 0.93, 0.94, 0.5);

    // Format date string
    const txDate = tx.date.split("T")[0];
    const isCredit = tx.type === "credit";

    drawText(txDate, 45, rowY + 1, "/F1", 8, 0.2, 0.2, 0.2);
    // Truncate long descriptions
    const desc =
      tx.description.length > 34
        ? `${tx.description.substring(0, 32)}...`
        : tx.description;
    drawText(desc, 110, rowY + 1, "/F2", 8, 0.15, 0.15, 0.15);
    drawText(tx.category, 320, rowY + 1, "/F1", 8, 0.35, 0.35, 0.4);

    if (isCredit) {
      drawText("CR", 410, rowY + 1, "/F2", 8, 0.05, 0.6, 0.3);
      drawText(
        `+${tx.amount.toLocaleString("en-IN")}`,
        475,
        rowY + 1,
        "/F2",
        8,
        0.05,
        0.6,
        0.3,
      );
    } else {
      drawText("DR", 410, rowY + 1, "/F2", 8, 0.8, 0.2, 0.2);
      drawText(
        `-${tx.amount.toLocaleString("en-IN")}`,
        475,
        rowY + 1,
        "/F2",
        8,
        0.8,
        0.2,
        0.2,
      );
    }

    rowY -= 19;
  }

  // If there are more rows, add note
  if (statement.transactions.length > maxRows) {
    drawText(
      `...and ${statement.transactions.length - maxRows} additional transactions during this cycle`,
      45,
      rowY - 2,
      "/F1",
      8,
      0.5,
      0.5,
      0.5,
    );
    rowY -= 15;
  }

  // 6. Security Footer
  drawLine(40, 65, 555.28, 65, 0.8, 0.82, 0.85);
  drawText(
    "BANKMATE AI CORE BANKING VERIFICATION SEAL: VALID & AUDITED - BKMT-STMT-SEC-9904",
    40,
    50,
    "/F2",
    7,
    0.3,
    0.35,
    0.45,
  );
  drawText(
    "This is a digitally generated bank statement certified under RBI Section 65B. For queries, contact priya.sharma@bankmate.io",
    40,
    38,
    "/F1",
    7,
    0.5,
    0.55,
    0.6,
  );
  drawText(
    `Page 1 of 1  |  Generated ${statement.generatedAt.split("T")[0]}`,
    430,
    38,
    "/F1",
    7,
    0.5,
    0.55,
    0.6,
  );

  const streamContent = lines.join("\n");
  const streamBytes = new TextEncoder().encode(streamContent);

  // Object 4: Stream
  builder.addObject(
    `<< /Length ${streamBytes.length} >>\nstream\n${streamContent}\nendstream`,
  );
  // Object 5: Standard Helvetica Font
  builder.addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  // Object 6: Standard Helvetica-Bold Font
  builder.addObject(
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
  );

  return builder.build();
}

/**
 * Generate PDF as a standard Web Blob
 */
export function generateStatementPdfBlob(statement: StatementData): Blob {
  const pdfBytes = generateStatementPdfBytes(statement);
  return new Blob([pdfBytes as unknown as BlobPart], {
    type: "application/pdf",
  });
}

/**
 * Generate PDF as a base64 encoded string (compatible with Resend/email attachments)
 */
export function generateStatementPdfBase64(statement: StatementData): string {
  const bytes = generateStatementPdfBytes(statement);
  if (typeof Buffer !== "undefined") {
    return Buffer.from(bytes).toString("base64");
  }
  let binary = "";
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Triggers direct browser download of the statement PDF
 */
export function downloadStatementPdf(statement: StatementData) {
  const blob = generateStatementPdfBlob(statement);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const filename = `BankMate_Statement_${statement.startDate}_to_${statement.endDate}.pdf`;
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/**
 * Printable HTML view in case user desires browser print or high-res preview
 */
export function printStatementHtml(statement: StatementData) {
  if (typeof window === "undefined") return;
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>BankMate Statement - ${statement.periodLabel}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 40px; color: #1e293b; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #1d4ed8; padding-bottom: 20px; }
          .title { color: #1d4ed8; font-size: 24px; font-weight: bold; margin: 0; }
          .subtitle { color: #64748b; font-size: 13px; margin: 4px 0 0 0; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 24px 0; background: #f8fafc; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0; }
          .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
          .summary-card { background: #f1f5f9; padding: 12px; border-radius: 6px; }
          .summary-card span { font-size: 11px; color: #64748b; display: block; }
          .summary-card strong { font-size: 15px; font-family: monospace; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 12px; }
          th { background: #0f172a; color: white; padding: 8px 12px; text-align: left; }
          td { padding: 8px 12px; border-bottom: 1px solid #e2e8f0; }
          .credit { color: #16a34a; font-weight: bold; font-family: monospace; }
          .debit { color: #dc2626; font-weight: bold; font-family: monospace; }
          .footer { margin-top: 40px; border-top: 1px solid #cbd5e1; padding-top: 16px; font-size: 11px; color: #94a3b8; text-align: center; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1 class="title">BankMate</h1>
            <p class="subtitle">Premier Wealth Banking • BKC Flagship Branch, Mumbai</p>
          </div>
          <div style="text-align: right;">
            <h2 style="margin: 0; font-size: 16px; color: #0f172a;">ACCOUNT STATEMENT</h2>
            <p class="subtitle">Period: ${statement.periodLabel}</p>
          </div>
        </div>

        <div class="grid">
          <div>
            <p style="margin: 0; font-size: 12px;"><strong>Account Holder:</strong> ${statement.accountName}</p>
            <p style="margin: 4px 0 0 0; font-size: 12px;"><strong>CIF Number:</strong> CIF-8829104</p>
            <p style="margin: 4px 0 0 0; font-size: 12px;"><strong>Account No:</strong> ${statement.accountNumber}</p>
          </div>
          <div>
            <p style="margin: 0; font-size: 12px;"><strong>IFSC Code:</strong> BKMT0001042</p>
            <p style="margin: 4px 0 0 0; font-size: 12px;"><strong>Statement Ref:</strong> ${statement.statementId}</p>
            <p style="margin: 4px 0 0 0; font-size: 12px;"><strong>Generated:</strong> ${statement.generatedAt.split("T")[0]}</p>
          </div>
        </div>

        <div class="summary">
          <div class="summary-card">
            <span>OPENING BALANCE</span>
            <strong>${formatINR(statement.openingBalance)}</strong>
          </div>
          <div class="summary-card">
            <span>TOTAL CREDITS (+)</span>
            <strong style="color: #16a34a;">+${formatINR(statement.totalCredits)}</strong>
          </div>
          <div class="summary-card">
            <span>TOTAL DEBITS (-)</span>
            <strong style="color: #dc2626;">-${formatINR(statement.totalDebits)}</strong>
          </div>
          <div class="summary-card">
            <span>CLOSING BALANCE</span>
            <strong style="color: #1d4ed8;">${formatINR(statement.closingBalance)}</strong>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Category</th>
              <th>Type</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            ${statement.transactions
              .map(
                (tx) => `
              <tr>
                <td>${tx.date.split("T")[0]}</td>
                <td><strong>${tx.description}</strong></td>
                <td>${tx.category}</td>
                <td>${tx.type === "credit" ? '<span style="color:#16a34a">CR</span>' : '<span style="color:#dc2626">DR</span>'}</td>
                <td class="${tx.type === "credit" ? "credit" : "debit"}">
                  ${tx.type === "credit" ? "+" : "-"}${formatINR(tx.amount)}
                </td>
              </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>

        <div class="footer">
          <p>BankMate Certified Digital Account Statement • Verification Code: BKMT-SEC-9904</p>
          <p>This is a computer-generated bank account statement and does not require a physical signature.</p>
        </div>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => printWindow.print(), 350);
}
