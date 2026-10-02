import type { CashFlowForecastItem, ForeclosureQuote } from "@/types/banking";
import type { Transaction } from "@/types/transaction";

export interface MonthlySpendAnalysis {
  currentMonthName: string;
  previousMonthName: string;
  currentMonthSpend: number;
  previousMonthSpend: number;
  spendDeltaAmount: number;
  spendDeltaPercentage: number;
  isIncrease: boolean;
  totalIncome: number;
  netSavings: number;
  savingsRate: number;
  topIncreaseCategories: Array<{
    category: string;
    currentAmount: number;
    previousAmount: number;
    difference: number;
    percentChange: number;
  }>;
  categoryBreakdown: Array<{
    category: string;
    amount: number;
    percentage: number;
    color: string;
  }>;
}

const CATEGORY_COLORS: Record<string, string> = {
  "Dining & Food Delivery": "#F59E0B",
  Dining: "#F59E0B",
  "Groceries & Household": "#10B981",
  Groceries: "#10B981",
  "Shopping & Retail": "#6366F1",
  Shopping: "#6366F1",
  "Travel & Fuel": "#3B82F6",
  Travel: "#3B82F6",
  "Entertainment & Subscriptions": "#EC4899",
  Subscriptions: "#EC4899",
  Utilities: "#06B6D4",
  Investments: "#8B5CF6",
  Transfer: "#64748B",
  Other: "#94A3B8",
};

export function analyzeMonthlySpending(
  transactions: Transaction[],
): MonthlySpendAnalysis {
  // Current month: September 2026, Previous: August 2026
  const currentMonthTx = transactions.filter((tx) => {
    const d = new Date(tx.date);
    return d.getFullYear() === 2026 && d.getMonth() === 8; // Sep (0-indexed 8)
  });

  const prevMonthTx = transactions.filter((tx) => {
    const d = new Date(tx.date);
    return d.getFullYear() === 2026 && d.getMonth() === 7; // Aug (0-indexed 7)
  });

  const currentMonthSpend = currentMonthTx
    .filter((tx) => tx.type === "debit")
    .reduce((sum, tx) => sum + tx.amount, 0);

  const prevMonthSpend = prevMonthTx
    .filter((tx) => tx.type === "debit")
    .reduce((sum, tx) => sum + tx.amount, 0);

  const currentMonthIncome = currentMonthTx
    .filter((tx) => tx.type === "credit")
    .reduce((sum, tx) => sum + tx.amount, 0);

  const spendDeltaAmount = currentMonthSpend - prevMonthSpend;
  const spendDeltaPercentage =
    prevMonthSpend > 0
      ? Math.round((spendDeltaAmount / prevMonthSpend) * 100 * 10) / 10
      : 0;
  const isIncrease = spendDeltaAmount > 0;

  // Category totals
  const currentCatTotals: Record<string, number> = {};
  for (const tx of currentMonthTx) {
    if (tx.type === "debit") {
      currentCatTotals[tx.category] =
        (currentCatTotals[tx.category] || 0) + tx.amount;
    }
  }

  const prevCatTotals: Record<string, number> = {};
  for (const tx of prevMonthTx) {
    if (tx.type === "debit") {
      prevCatTotals[tx.category] =
        (prevCatTotals[tx.category] || 0) + tx.amount;
    }
  }

  const categoryBreakdown = Object.entries(currentCatTotals)
    .map(([category, amount]) => ({
      category,
      amount,
      percentage:
        currentMonthSpend > 0
          ? Math.round((amount / currentMonthSpend) * 100)
          : 0,
      color: CATEGORY_COLORS[category] || CATEGORY_COLORS.Other,
    }))
    .sort((a, b) => b.amount - a.amount);

  const topIncreaseCategories = Object.keys({
    ...currentCatTotals,
    ...prevCatTotals,
  })
    .map((category) => {
      const cur = currentCatTotals[category] || 0;
      const prev = prevCatTotals[category] || 0;
      const diff = cur - prev;
      const percentChange = prev > 0 ? Math.round((diff / prev) * 100) : 100;
      return {
        category,
        currentAmount: cur,
        previousAmount: prev,
        difference: diff,
        percentChange,
      };
    })
    .filter((item) => item.difference > 0)
    .sort((a, b) => b.difference - a.difference);

  const netSavings = currentMonthIncome - currentMonthSpend;
  const savingsRate =
    currentMonthIncome > 0
      ? Math.round((netSavings / currentMonthIncome) * 100)
      : 0;

  return {
    currentMonthName: "September 2026",
    previousMonthName: "August 2026",
    currentMonthSpend,
    previousMonthSpend: prevMonthSpend,
    spendDeltaAmount,
    spendDeltaPercentage,
    isIncrease,
    totalIncome: currentMonthIncome,
    netSavings,
    savingsRate,
    topIncreaseCategories,
    categoryBreakdown,
  };
}

export function generateCashFlowForecast(
  initialBalance: number,
  monthlyInflow: number = 240000,
  averageMonthlyOutflow: number = 115000,
  monthsCount: number = 6,
): CashFlowForecastItem[] {
  const result: CashFlowForecastItem[] = [];
  const monthNames = [
    "Oct 2026",
    "Nov 2026",
    "Dec 2026",
    "Jan 2027",
    "Feb 2027",
    "Mar 2027",
  ];
  let rollingBalance = initialBalance;

  for (let i = 0; i < monthsCount; i++) {
    // Add seasonal variations (e.g. Diwali in Nov, Year-end bonus in Dec)
    const isNov = i === 1;
    const isDec = i === 2;
    const projectedInflow = isDec ? monthlyInflow + 150000 : monthlyInflow;
    const projectedOutflow = isNov
      ? averageMonthlyOutflow + 45000
      : averageMonthlyOutflow;
    const netSurplus = projectedInflow - projectedOutflow;
    rollingBalance += netSurplus;

    result.push({
      month: monthNames[i] || `Month ${i + 1}`,
      projectedInflow,
      projectedOutflow,
      netSurplus,
      estimatedClosingBalance: rollingBalance,
    });
  }

  return result;
}

export function calculateForeclosureQuote(
  loanAccount: string,
  principalOutstanding: number,
  interestRate: number,
  isFloatingRate: boolean = true,
): ForeclosureQuote {
  const now = new Date();
  const dayOfMonth = now.getDate();
  // Accrued interest for the current broken month period
  const dailyRate = interestRate / 100 / 365;
  const accruedInterest = Math.round(
    principalOutstanding * dailyRate * dayOfMonth,
  );

  // RBI rules mandate zero foreclosure penalty on floating rate individual retail loans
  const foreclosureCharges = isFloatingRate
    ? 0
    : Math.round(principalOutstanding * 0.02);
  const gstOnCharges = Math.round(foreclosureCharges * 0.18);
  const totalForeclosureAmount =
    principalOutstanding + accruedInterest + foreclosureCharges + gstOnCharges;

  const validDate = new Date(now);
  validDate.setDate(now.getDate() + 15);

  return {
    quoteId: `FC-QUOTE-${Date.now().toString().slice(-6)}`,
    loanAccount,
    loanType: "Auto Loan (Luxury Sedan)",
    principalOutstanding,
    accruedInterest,
    foreclosureCharges,
    gstOnCharges,
    totalForeclosureAmount,
    validUntil: validDate.toISOString().split("T")[0],
  };
}

export function calculatePartPrepayment(
  principalOutstanding: number,
  interestRate: number,
  tenureRemainingMonths: number,
  prepaymentAmount: number,
) {
  const currentR = interestRate / 100 / 12;
  const currentN = tenureRemainingMonths;
  const currentEmi =
    currentR === 0
      ? principalOutstanding / currentN
      : (principalOutstanding * (currentR * (1 + currentR) ** currentN)) /
        ((1 + currentR) ** currentN - 1);

  const newPrincipal = Math.max(0, principalOutstanding - prepaymentAmount);

  // Option A: Keep EMI same, reduce tenure
  let reducedTenureMonths = currentN;
  if (currentR > 0 && newPrincipal > 0) {
    const num = Math.log(currentEmi / (currentEmi - newPrincipal * currentR));
    const den = Math.log(1 + currentR);
    reducedTenureMonths = Math.ceil(num / den);
  }
  const tenureSavedMonths = Math.max(0, currentN - reducedTenureMonths);
  const interestSavedOptionA = Math.round(
    currentEmi * currentN -
      principalOutstanding -
      (currentEmi * reducedTenureMonths - newPrincipal),
  );

  // Option B: Keep tenure same, reduce EMI
  const newReducedEmi =
    currentR === 0
      ? newPrincipal / currentN
      : Math.round(
          (newPrincipal * (currentR * (1 + currentR) ** currentN)) /
            ((1 + currentR) ** currentN - 1),
        );
  const monthlyEmiReduction = Math.round(currentEmi - newReducedEmi);

  return {
    prepaymentAmount,
    originalOutstanding: principalOutstanding,
    newOutstanding: newPrincipal,
    optionA_tenureReduction: {
      newTenureMonths: reducedTenureMonths,
      monthsSaved: tenureSavedMonths,
      estimatedInterestSaved: Math.max(0, interestSavedOptionA),
      sameEmi: Math.round(currentEmi),
    },
    optionB_emiReduction: {
      newMonthlyEmi: newReducedEmi,
      monthlySavings: Math.max(0, monthlyEmiReduction),
      sameTenureMonths: currentN,
    },
  };
}

export function calculateFDPrematureClosure(
  principal: number,
  contractualRate: number,
  tenureYears: number,
  elapsedMonths: number,
) {
  // Banking standard penalty: 1% deduction from applicable interest rate
  const penalizedRate = Math.max(0.5, contractualRate - 1.0);
  const elapsedYears = elapsedMonths / 12;
  // Compounded quarterly: A = P * (1 + r/400)^(4*t)
  const actualPayable = Math.round(
    principal * (1 + penalizedRate / 400) ** (4 * elapsedYears),
  );
  const fullMaturityExpected = Math.round(
    principal * (1 + contractualRate / 400) ** (4 * tenureYears),
  );
  const interestEarned = actualPayable - principal;
  const potentialInterestLost = fullMaturityExpected - actualPayable;

  return {
    principal,
    contractualRate,
    penalizedRate,
    elapsedMonths,
    actualPayable,
    interestEarned,
    potentialInterestLost,
    penaltyDescription:
      "1.00% p.a. standard premature penalty as per RBI guidelines",
  };
}

export function calculateFxTransfer(
  inrAmount: number,
  targetCurrency: "USD" | "EUR" | "GBP" | "AED" | "SGD" = "USD",
) {
  const FX_RATES: Record<
    string,
    { rate: number; name: string; symbol: string }
  > = {
    USD: { rate: 86.5, name: "US Dollar", symbol: "$" },
    EUR: { rate: 93.2, name: "Euro", symbol: "€" },
    GBP: { rate: 112.4, name: "British Pound", symbol: "£" },
    AED: { rate: 23.55, name: "UAE Dirham", symbol: "AED" },
    SGD: { rate: 64.8, name: "Singapore Dollar", symbol: "S$" },
  };

  const currencyInfo = FX_RATES[targetCurrency] || FX_RATES.USD;
  const transferFeeInr = 500;
  const gstOnFee = Math.round(transferFeeInr * 0.18);
  const totalInrPayable = inrAmount + transferFeeInr + gstOnFee;
  const foreignAmount = Math.round((inrAmount / currencyInfo.rate) * 100) / 100;

  return {
    inrAmount,
    targetCurrency,
    currencyName: currencyInfo.name,
    currencySymbol: currencyInfo.symbol,
    exchangeRate: currencyInfo.rate,
    foreignAmount,
    transferFeeInr,
    gstOnFee,
    totalInrPayable,
    estimatedDeliveryDays: "1 - 2 Business Days",
    complianceRequirement:
      "RBI Liberalised Remittance Scheme (LRS) Form A2 Declaration required",
  };
}
