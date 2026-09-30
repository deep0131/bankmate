import { NextResponse } from "next/server";
import {
  generateStatementPdfBase64,
  type StatementData,
} from "@/lib/pdf-statement";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, statement }: { email?: string; statement?: StatementData } = body;

    const targetEmail = (email || "mitulshah3107@gmail.com").trim();

    if (!statement || !statement.accountNumber) {
      return NextResponse.json(
        {
          ok: false,
          error: "INVALID_PAYLOAD",
          message: "Statement data is missing or incomplete.",
        },
        { status: 400 }
      );
    }

    const apiKey = process.env.RESEND_API_KEY?.trim();

    // Check if RESEND_API_KEY is configured
    if (!apiKey || apiKey === "your_resend_api_key_here" || apiKey.length < 5) {
      return NextResponse.json(
        {
          ok: false,
          error: "CONFIG_REQUIRED",
          message:
            `RESEND_API_KEY is not configured in .env.local. To dispatch real emails to ${targetEmail}, add your free API key from https://resend.com to your .env.local file.`,
        },
        { status: 400 }
      );
    }

    // 1. Generate PDF base64 binary
    const pdfBase64 = generateStatementPdfBase64(statement);
    const filename = `BankMate_Statement_${statement.startDate}_to_${statement.endDate}.pdf`;

    // 2. Build Executive HTML Email
    const fromAddress =
      process.env.RESEND_FROM_EMAIL || "BankMate Statements <onboarding@resend.dev>";

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>BankMate Official Statement</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f172a; margin: 0; padding: 24px; color: #f1f5f9; }
          .container { max-width: 600px; margin: 0 auto; background: #1e293b; border-radius: 16px; border: 1px solid #334155; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.5); }
          .header { background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%); color: #ffffff; padding: 32px 28px; }
          .header h1 { margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
          .header p { margin: 6px 0 0 0; font-size: 13px; color: #bfdbfe; font-weight: 500; }
          .content { padding: 28px; }
          .greeting { font-size: 16px; color: #f8fafc; font-weight: 600; margin-bottom: 12px; }
          .subtext { font-size: 14px; color: #94a3b8; line-height: 1.6; margin-bottom: 24px; }
          .info-box { background: #0f172a; border-radius: 12px; padding: 18px; border: 1px solid #334155; margin-bottom: 24px; font-size: 13px; line-height: 1.8; color: #cbd5e1; }
          .summary-grid { width: 100%; border-collapse: separate; border-spacing: 12px; margin: 16px 0 24px -12px; }
          .summary-card { background: #0f172a; border: 1px solid #334155; border-radius: 10px; padding: 14px; text-align: left; }
          .summary-label { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 600; letter-spacing: 0.5px; }
          .summary-val { font-size: 18px; font-weight: 700; color: #f8fafc; margin-top: 4px; }
          .credits { color: #22c55e; }
          .debits { color: #ef4444; }
          .closing { color: #60a5fa; }
          .attachment-callout { background: rgba(30, 64, 175, 0.25); border: 1px solid #2563eb; border-radius: 12px; padding: 16px; display: flex; align-items: center; margin-bottom: 24px; }
          .badge { display: inline-block; background: rgba(34, 197, 94, 0.2); color: #4ade80; border: 1px solid rgba(34, 197, 94, 0.4); font-size: 11px; font-weight: 600; padding: 3px 8px; border-radius: 9999px; }
          .footer { background: #0f172a; border-top: 1px solid #334155; padding: 20px 28px; font-size: 11px; color: #64748b; text-align: center; line-height: 1.6; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>BANKMATE</h1>
            <p>PREMIER WEALTH BANKING • OFFICIAL DIGITAL STATEMENT</p>
          </div>
          <div class="content">
            <div class="greeting">Dear ${statement.accountName},</div>
            <div class="subtext">
              Your requested bank account statement for <strong>${statement.periodLabel}</strong> has been generated and digitally certified. The official PDF document is attached to this email.
            </div>

            <div class="info-box">
              <strong>Account:</strong> ${statement.accountNumber}<br/>
              <strong>Branch:</strong> BKC Flagship Branch, Mumbai • IFSC: BKMT0001042<br/>
              <strong>Statement Ref ID:</strong> <span style="font-family: monospace; color: #93c5fd;">${statement.statementId}</span><br/>
              <strong>Certification:</strong> <span class="badge">RBI Certified Digital Seal</span>
            </div>

            <table class="summary-grid" style="width: 100%;">
              <tr>
                <td class="summary-card" style="width: 50%;">
                  <div class="summary-label">Opening Balance</div>
                  <div class="summary-val">₹${statement.openingBalance.toLocaleString("en-IN")}</div>
                </td>
                <td class="summary-card" style="width: 50%;">
                  <div class="summary-label">Closing Balance</div>
                  <div class="summary-val closing">₹${statement.closingBalance.toLocaleString("en-IN")}</div>
                </td>
              </tr>
              <tr>
                <td class="summary-card">
                  <div class="summary-label">Total Inflow (+)</div>
                  <div class="summary-val credits">+₹${statement.totalCredits.toLocaleString("en-IN")}</div>
                </td>
                <td class="summary-card">
                  <div class="summary-label">Total Outflow (-)</div>
                  <div class="summary-val debits">-₹${statement.totalDebits.toLocaleString("en-IN")}</div>
                </td>
              </tr>
            </table>

            <div style="font-size: 12px; color: #94a3b8; line-height: 1.5; margin-top: 20px;">
              Please find the attached file: <strong>${filename}</strong>.<br/>
              If you have any questions or did not initiate this request, please contact your Senior Wealth Director <strong>Priya Sharma</strong> at +91 22 6123 4567.
            </div>
          </div>
          <div class="footer">
            BankMate Core Banking Systems • 24x7 Concierge • Mumbai, India<br/>
            Ref: ${statement.statementId} • Digitally encrypted under Information Technology Act 2000
          </div>
        </div>
      </body>
      </html>
    `;

    // 3. Dispatch to Resend REST API
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromAddress,
        to: [targetEmail],
        subject: `BankMate Official Account Statement (${statement.periodLabel})`,
        html: htmlContent,
        attachments: [
          {
            filename,
            content: pdfBase64,
          },
        ],
      }),
    });

    const resData = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error("Resend API error:", resData);
      return NextResponse.json(
        {
          ok: false,
          error: "RESEND_ERROR",
          message:
            resData.message ||
            "Resend could not deliver the email. Please check your Resend domain or recipient settings.",
          details: resData,
        },
        { status: resendResponse.status }
      );
    }

    return NextResponse.json({
      ok: true,
      id: resData.id,
      recipient: targetEmail,
      message: `Statement PDF successfully dispatched to ${targetEmail} via Resend.`,
    });
  } catch (error: any) {
    console.error("Statement email dispatch failed:", error);
    return NextResponse.json(
      {
        ok: false,
        error: "INTERNAL_ERROR",
        message: error.message || "Failed to process statement email dispatch.",
      },
      { status: 500 }
    );
  }
}
