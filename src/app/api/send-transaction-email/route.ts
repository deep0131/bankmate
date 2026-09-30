import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      type,
      recipientEmail,
      data,
    }: {
      type: "transfer" | "fixed-deposit" | "loan-application";
      recipientEmail?: string;
      data: any;
    } = body;

    const targetEmail = (recipientEmail || "mitulshah3107@gmail.com").trim();

    const apiKey = process.env.RESEND_API_KEY?.trim();
    if (!apiKey || apiKey === "your_resend_api_key_here" || apiKey.length < 5) {
      return NextResponse.json(
        {
          ok: false,
          error: "CONFIG_REQUIRED",
          message: "RESEND_API_KEY is not configured.",
        },
        { status: 400 }
      );
    }

    const fromAddress =
      process.env.RESEND_FROM_EMAIL || "BankMate Alerts <onboarding@resend.dev>";

    let subject = "";
    let textContent = "";

    const now = new Date();
    const formattedDate = now.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    if (type === "transfer") {
      const {
        recipientName,
        recipientAccount,
        amount,
        note,
        referenceId,
        sourceAccount,
        newBalance,
      } = data;

      subject = `BankMate Alert: INR ${Number(amount).toLocaleString("en-IN")} Debited - ${referenceId}`;
      textContent =
`Dear Deep Yadav,

Your account has been debited for the following fund transfer:

TRANSACTION DETAILS
------------------------------------------------------------
Transaction Type:      Instant Funds Transfer (IMPS / UPI)
Reference / UTR ID:    ${referenceId}
Date & Time:           ${data.date || formattedDate}
Debited From:          ${sourceAccount || "Savings A/C 4092 •••• 8842"}
Beneficiary Name:      ${recipientName}
Beneficiary Account:   ${recipientAccount}
Transfer Amount:       INR ${Number(amount).toLocaleString("en-IN")}
Payment Remark / Note: ${note || "Transfer via BankMate AI"}

ACCOUNT BALANCE
------------------------------------------------------------
Remaining Balance:     INR ${Number(newBalance).toLocaleString("en-IN")}
------------------------------------------------------------

SECURITY NOTICE:
If you did not authorize this fund transfer, please immediately lock your net banking access by contacting our 24x7 emergency helpline at +91 22 6123 4567 or email emergency@bankmate.io. BankMate will never ask for your confidential PIN, OTP, or CVV.

Sincerely,
BankMate Premier Wealth Banking
BKC Flagship Branch, Bandra Kurla Complex, Mumbai, MH - 400051, India
`;
    } else if (type === "fixed-deposit") {
      const {
        fdNumber,
        principalAmount,
        tenureYears,
        interestRate,
        maturityAmount,
        payoutType,
        sourceAccount,
        newBalance,
      } = data;

      subject = `BankMate Confirmation: Fixed Deposit ${fdNumber} Booked Successfully`;
      textContent =
`Dear Deep Yadav,

We are pleased to confirm that your new Fixed Deposit has been booked successfully under your Premier Wealth account.

FIXED DEPOSIT DETAILS
------------------------------------------------------------
Deposit Account No:    ${fdNumber}
Booking Date & Time:   ${data.date || formattedDate}
Principal Amount:      INR ${Number(principalAmount).toLocaleString("en-IN")}
Tenure:                ${tenureYears} Years
Interest Rate:         ${interestRate}% p.a.
Maturity Value:        INR ${Number(maturityAmount).toLocaleString("en-IN")}
Payout Scheme:         ${payoutType || "Cumulative (At Maturity)"}
Debited From:          ${sourceAccount || "Savings A/C 4092 •••• 8842"}

ACCOUNT BALANCE
------------------------------------------------------------
Remaining Balance:     INR ${Number(newBalance).toLocaleString("en-IN")}
------------------------------------------------------------

Your electronic deposit certificate has been digitally certified. You can monitor accruals or manage premature renewal options anytime through the BankMate executive portal.

SECURITY NOTICE:
BankMate will never request your banking password, OTP, or PIN. For any wealth management advisory, contact your Senior Wealth Director Priya Sharma at +91 22 6123 4567.

Sincerely,
BankMate Premier Wealth Banking
BKC Flagship Branch, Bandra Kurla Complex, Mumbai, MH - 400051, India
`;
    } else if (type === "loan-application") {
      const {
        applicationId,
        loanName,
        category,
        requestedAmount,
        tenureYears,
        interestRate,
        estimatedEmi,
        rmName,
        rmEmail,
      } = data;

      subject = `BankMate Loan Application Received: ${applicationId} (${loanName})`;
      textContent =
`Dear Deep Yadav,

Your loan application has been successfully submitted and forwarded to your dedicated Relationship Manager and Credit Committee for human review and final verification.

LOAN APPLICATION SUMMARY
------------------------------------------------------------
Application Ref ID:    ${applicationId}
Loan Product:          ${loanName}
Facility Category:     ${category}
Applied Amount:        INR ${Number(requestedAmount).toLocaleString("en-IN")}
Requested Tenure:      ${tenureYears} Years
Annual Interest Rate:  ${interestRate}% p.a.
Estimated Monthly EMI: INR ${Number(estimatedEmi).toLocaleString("en-IN")}
Application Date:      ${data.date || formattedDate}
Current Status:        Under Review (Human Approval Required)

ASSIGNED RELATIONSHIP MANAGER
------------------------------------------------------------
Name:                  ${rmName || "Priya Sharma"} (Senior Wealth Director)
Email:                 ${rmEmail || "priya.sharma@bankmate.io"}
Phone:                 +91 22 6123 4567
Branch:                BKC Flagship Lounge, Mumbai
------------------------------------------------------------

Next Steps:
Your Relationship Manager will inspect your pre-approved CIBIL credit profile (Score: 795) and contact you within 24 business hours to finalize the loan agreement and disbursement schedule.

SECURITY NOTICE:
BankMate does not charge any upfront cash commissions or fees via personal accounts. All communications originate exclusively from official @bankmate.io channels.

Sincerely,
BankMate Premier Wealth Banking
BKC Flagship Branch, Bandra Kurla Complex, Mumbai, MH - 400051, India
`;
    } else {
      return NextResponse.json(
        { ok: false, error: "INVALID_TYPE", message: "Unsupported transaction type" },
        { status: 400 }
      );
    }

    // Dispatch to Resend as pure plain text (no HTML, no colors)
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromAddress,
        to: [targetEmail],
        subject,
        text: textContent,
      }),
    });

    const resData = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error("Resend transaction alert failed:", resData);
      return NextResponse.json(
        {
          ok: false,
          error: "RESEND_ERROR",
          message: resData.message || "Failed to deliver transaction alert email.",
          details: resData,
        },
        { status: resendResponse.status }
      );
    }

    return NextResponse.json({
      ok: true,
      id: resData.id,
      recipient: targetEmail,
      type,
    });
  } catch (error: any) {
    console.error("Transaction email API error:", error);
    return NextResponse.json(
      { ok: false, error: "INTERNAL_ERROR", message: error.message },
      { status: 500 }
    );
  }
}
