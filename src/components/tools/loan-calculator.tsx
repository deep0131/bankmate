"use client";

import type { UIToolInvocation } from "ai";
import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldTitle,
} from "@/components/ui/field";
import { Marker, MarkerContent, MarkerIcon } from "@/components/ui/marker";
import { Slider } from "@/components/ui/slider";
import { Spinner } from "@/components/ui/spinner";
import type { loanCalculatorTool } from "@/lib/ai/tools";

export type LoanCalculatorProps = UIToolInvocation<typeof loanCalculatorTool>;

function calculateLoan(amount: number, ratePercent: number, years: number) {
  const r = ratePercent / 100 / 12;
  const n = years * 12;
  if (r === 0) {
    const monthly = amount / n;
    return {
      monthlyPayment: monthly,
      totalPayment: amount,
      totalInterest: 0,
    };
  }
  const monthly = (amount * (r * (1 + r) ** n)) / ((1 + r) ** n - 1);
  const total = monthly * n;
  const interest = total - amount;

  return {
    monthlyPayment: Math.round(monthly * 100) / 100,
    totalPayment: Math.round(total * 100) / 100,
    totalInterest: Math.round(interest * 100) / 100,
  };
}

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const detailedCurrencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

export function LoanCalculator(props: LoanCalculatorProps) {
  const output = "output" in props ? props.output : undefined;
  const state = props.state;
  const errorText = "errorText" in props ? props.errorText : undefined;

  const initialAmount = output?.loanAmount ?? 350000;
  const initialRate = output?.interestRate ?? 6.5;
  const initialYears = output?.loanTermYears ?? 30;

  const [principal, setPrincipal] = React.useState<number>(initialAmount);
  const [interestRate, setInterestRate] = React.useState<number>(initialRate);
  const [tenureYears, setTenureYears] = React.useState<number>(initialYears);

  React.useEffect(() => {
    if (output?.loanAmount) setPrincipal(output.loanAmount);
    if (output?.interestRate) setInterestRate(output.interestRate);
    if (output?.loanTermYears) setTenureYears(output.loanTermYears);
  }, [output?.loanAmount, output?.interestRate, output?.loanTermYears]);

  const calc = React.useMemo(
    () => calculateLoan(principal, interestRate, tenureYears),
    [principal, interestRate, tenureYears],
  );

  if (state === "input-streaming" || state === "input-available") {
    return (
      <Marker role="status">
        <MarkerIcon>
          <Spinner />
        </MarkerIcon>
        <MarkerContent className="shimmer">
          Calculating loan estimate...
        </MarkerContent>
      </Marker>
    );
  }

  if (state === "output-error" || errorText) {
    return (
      <Card size="sm" className="w-full max-w-sm">
        <CardContent className="text-destructive">
          Failed to calculate loan: {errorText ?? "Unknown error occurred"}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card size="sm" className="w-full min-w-sm">
      <CardHeader>
        <CardTitle>Loan Calculator</CardTitle>
        <CardDescription>
          Estimate monthly EMI and total interest breakdown
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        {/* EMI Summary Display */}
        <div className="space-y-1">
          <div className="text-2xl font-semibold tracking-tight">
            {detailedCurrencyFormatter.format(calc.monthlyPayment)}
            <span className="text-xs font-normal text-muted-foreground">
              /mo
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Total {currencyFormatter.format(calc.totalPayment)} · Interest{" "}
            {currencyFormatter.format(calc.totalInterest)}
          </p>
        </div>

        {/* 3 Form Fields using shadcn FieldGroup + Field */}
        <FieldGroup>
          {/* Principal Field */}
          <Field>
            <div className="flex items-center justify-between">
              <FieldTitle>Principal Amount</FieldTitle>
              <FieldDescription>
                {currencyFormatter.format(principal)}
              </FieldDescription>
            </div>
            <Slider
              value={[principal]}
              min={10000}
              max={1000000}
              step={5000}
              onValueChange={(val) => {
                const nextVal = Array.isArray(val) ? val[0] : val;
                if (typeof nextVal === "number") setPrincipal(nextVal);
              }}
              aria-label="Principal Amount"
            />
          </Field>

          {/* Interest Rate Field */}
          <Field>
            <div className="flex items-center justify-between">
              <FieldTitle>Interest Rate</FieldTitle>
              <FieldDescription>{interestRate.toFixed(1)}%</FieldDescription>
            </div>
            <Slider
              value={[Math.round(interestRate * 10)]}
              min={10}
              max={150}
              step={1}
              onValueChange={(val) => {
                const nextVal = Array.isArray(val) ? val[0] : val;
                if (typeof nextVal === "number") setInterestRate(nextVal / 10);
              }}
              aria-label="Interest Rate"
            />
          </Field>

          {/* Tenure Field */}
          <Field>
            <div className="flex items-center justify-between">
              <FieldTitle>Tenure</FieldTitle>
              <FieldDescription>
                {tenureYears} {tenureYears === 1 ? "Year" : "Years"}
              </FieldDescription>
            </div>
            <Slider
              value={[tenureYears]}
              min={1}
              max={30}
              step={1}
              onValueChange={(val) => {
                const nextVal = Array.isArray(val) ? val[0] : val;
                if (typeof nextVal === "number") setTenureYears(nextVal);
              }}
              aria-label="Tenure in Years"
            />
          </Field>
        </FieldGroup>
      </CardContent>
    </Card>
  );
}
