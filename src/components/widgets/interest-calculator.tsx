"use client";

import { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";

interface InterestCalculatorProps {
  principal: number;
  annualRate: number;
  termMonths: number;
}

/**
 * EMI Calculator Widget — all math is client-side per ADR-0003.
 * Formula: EMI = P × r × (1 + r)^n / ((1 + r)^n - 1)
 * where P = principal, r = monthly rate, n = number of months
 */
function calculateEMI(
  principal: number,
  annualRate: number,
  termMonths: number,
): { emi: number; totalPayment: number; totalInterest: number } {
  const monthlyRate = annualRate / 100 / 12;

  if (monthlyRate === 0) {
    const emi = principal / termMonths;
    return { emi, totalPayment: principal, totalInterest: 0 };
  }

  const factor = Math.pow(1 + monthlyRate, termMonths);
  const emi = (principal * monthlyRate * factor) / (factor - 1);
  const totalPayment = emi * termMonths;
  const totalInterest = totalPayment - principal;

  return { emi, totalPayment, totalInterest };
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatLargeAmount(amount: number): string {
  if (amount >= 10000000) return `${(amount / 10000000).toFixed(1)} Cr`;
  if (amount >= 100000) return `${(amount / 100000).toFixed(1)} L`;
  if (amount >= 1000) return `${(amount / 1000).toFixed(0)}K`;
  return amount.toFixed(0);
}

export function InterestCalculator({
  principal: initialPrincipal,
  annualRate: initialRate,
  termMonths: initialTerm,
}: InterestCalculatorProps) {
  const [principal, setPrincipal] = useState(initialPrincipal);
  const [annualRate, setAnnualRate] = useState(initialRate);
  const [termMonths, setTermMonths] = useState(initialTerm);

  const result = useMemo(
    () => calculateEMI(principal, annualRate, termMonths),
    [principal, annualRate, termMonths],
  );

  // Calculate proportions for visual bar
  const principalRatio = principal / result.totalPayment;
  const interestRatio = result.totalInterest / result.totalPayment;

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">EMI Calculator</CardTitle>
        <CardDescription className="text-xs">
          Adjust the sliders to calculate your monthly payment
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {/* EMI Result */}
        <div className="rounded-xl bg-gradient-to-r from-primary/15 to-primary/5 border border-primary/20 p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">
            Monthly EMI
          </p>
          <p className="text-3xl font-bold tracking-tight text-primary tabular-nums">
            {formatCurrency(result.emi)}
          </p>
        </div>

        {/* Sliders */}
        <div className="flex flex-col gap-4">
          {/* Principal */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium">Loan Amount</label>
              <span className="text-xs font-semibold tabular-nums text-primary">
                {formatCurrency(principal)}
              </span>
            </div>
            <Slider
              value={[principal]}
              onValueChange={(v) => setPrincipal((v as number[])[0])}
              min={100000}
              max={100000000}
              step={100000}
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>₹1L</span>
              <span>₹10Cr</span>
            </div>
          </div>

          {/* Interest Rate */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium">Interest Rate</label>
              <span className="text-xs font-semibold tabular-nums text-primary">
                {annualRate.toFixed(2)}% p.a.
              </span>
            </div>
            <Slider
              value={[annualRate]}
              onValueChange={(v) => setAnnualRate((v as number[])[0])}
              min={1}
              max={30}
              step={0.25}
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>1%</span>
              <span>30%</span>
            </div>
          </div>

          {/* Tenure */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium">Loan Tenure</label>
              <span className="text-xs font-semibold tabular-nums text-primary">
                {termMonths >= 12
                  ? `${Math.floor(termMonths / 12)} yr ${termMonths % 12 > 0 ? `${termMonths % 12} mo` : ""}`
                  : `${termMonths} months`}
              </span>
            </div>
            <Slider
              value={[termMonths]}
              onValueChange={(v) => setTermMonths((v as number[])[0])}
              min={6}
              max={360}
              step={6}
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>6 mo</span>
              <span>30 yr</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Payment Breakdown */}
        <div className="flex flex-col gap-3">
          {/* Visual Bar */}
          <div className="flex h-3 rounded-full overflow-hidden">
            <div
              className="bg-primary transition-all duration-300"
              style={{ width: `${principalRatio * 100}%` }}
            />
            <div
              className="bg-primary/30 transition-all duration-300"
              style={{ width: `${interestRatio * 100}%` }}
            />
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                Principal
              </p>
              <p className="text-sm font-semibold tabular-nums">
                {formatLargeAmount(principal)}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                Interest
              </p>
              <p className="text-sm font-semibold tabular-nums text-primary/70">
                {formatLargeAmount(result.totalInterest)}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                Total
              </p>
              <p className="text-sm font-semibold tabular-nums">
                {formatLargeAmount(result.totalPayment)}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
