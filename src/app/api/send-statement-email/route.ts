import { NextResponse } from "next/server";
import {
  generateStatementPdfBase64,
  type StatementData,
} from "@/lib/pdf-statement";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, statement }: { email?: string; statement?: StatementData } =
      body;

    const targetEmail = (email || "mitulshah3107@gmail.com").trim();

    if (!statement || !statement.accountNumber) {
      return NextResponse.json(
        {
          ok: false,
          error: "INVALID_PAYLOAD",
          message: "Statement data is missing or incomplete.",
        },
        { status: 400 },
      );
    }

    const apiKey = process.env.RESEND_API_KEY?.trim();

    // Check if RESEND_API_KEY is configured
    if (!apiKey || apiKey === "your_resend_api_key_here" || apiKey.length < 5) {
      return NextResponse.json(
        {
          ok: false,
          error: "CONFIG_REQUIRED",
          message: `RESEND_API_KEY is not configured in .env.local. To dispatch real emails to ${targetEmail}, add your free API key from https://resend.com to your .env.local file.`,
        },
        { status: 400 },
      );
    }

    // 1. Generate PDF base64 binary attachment
    const pdfBase64 = generateStatementPdfBase64(statement);
    const filename = `BankMate_Statement_${statement.startDate}_to_${statement.endDate}.pdf`;

    // 2. Build Professional Plain-Text Banking Email Body (No HTML, no colors, pure clean text)
    const fromAddress =
      process.env.RESEND_FROM_EMAIL ||
      "BankMate Statements <onboarding@resend.dev>";

    const textContent = `Dear ${statement.accountName},

Please find attached your official BankMate Account Statement for the period ${statement.periodLabel}.

ACCOUNT STATEMENT SUMMARY
------------------------------------------------------------
Account Holder:       ${statement.accountName}
Account Number:       ${statement.accountNumber}
Statement Period:     ${statement.periodLabel}
Statement Reference:  ${statement.statementId}
Generated Date:       ${statement.generatedAt.split("T")[0]}

Opening Balance:      INR ${statement.openingBalance.toLocaleString("en-IN")}
Total Credits (+):    INR ${statement.totalCredits.toLocaleString("en-IN")}
Total Debits (-):     INR ${statement.totalDebits.toLocaleString("en-IN")}
Closing Balance:      INR ${statement.closingBalance.toLocaleString("en-IN")}
Total Transactions:   ${statement.totalCount}
------------------------------------------------------------

The official digitally verified statement is attached to this email as:
${filename}

SECURITY & CONFIDENTIALITY NOTICE:
This is an automated banking notification. BankMate will never ask you for your PIN, OTP, CVV, or passwords via email or phone. If you did not request this statement or notice any discrepancy in your account transactions, please immediately contact your Senior Wealth Director Priya Sharma at +91 22 6123 4567 or email priya.sharma@bankmate.io.

Sincerely,
BankMate Premier Wealth Banking
BKC Flagship Branch, Bandra Kurla Complex, Mumbai, MH - 400051, India
`;

    // 3. Dispatch to Resend REST API as pure plain text
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
        text: textContent,
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
        { status: resendResponse.status },
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
      { status: 500 },
    );
  }
}
