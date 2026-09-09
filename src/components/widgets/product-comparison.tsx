"use client";

import type { BankingProduct } from "@/types/product";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckIcon } from "lucide-react";

interface ProductComparisonProps {
  products: BankingProduct[];
  category: string;
}

const categoryLabels: Record<string, string> = {
  home_loan: "Home Loans",
  personal_loan: "Personal Loans",
  credit_card: "Credit Cards",
  savings: "Savings Accounts",
  fixed_deposit: "Fixed Deposits",
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatRate(rate: number): string {
  return `${rate.toFixed(2)}%`;
}

export function ProductComparison({
  products,
  category,
}: ProductComparisonProps) {
  if (products.length === 0) {
    return (
      <div className="text-sm text-muted-foreground p-4 text-center">
        No products found in this category.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 w-full">
      <p className="text-xs text-muted-foreground">
        Comparing {products.length}{" "}
        {categoryLabels[category] ?? category}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {products.map((product) => (
          <Card key={product.id} className="flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-sm leading-tight">
                    {product.name}
                  </CardTitle>
                  <CardDescription className="text-xs mt-1">
                    {product.description}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-3">
              {/* Key Metrics */}
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg bg-muted/50 p-2.5">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    Interest Rate
                  </p>
                  <p className="text-lg font-bold text-primary tabular-nums">
                    {formatRate(product.interestRate)}
                  </p>
                  <p className="text-[10px] text-muted-foreground">p.a.</p>
                </div>
                {product.annualFee !== undefined && (
                  <div className="rounded-lg bg-muted/50 p-2.5">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                      Annual Fee
                    </p>
                    <p className="text-lg font-bold tabular-nums">
                      {product.annualFee === 0
                        ? "Free"
                        : formatCurrency(product.annualFee)}
                    </p>
                  </div>
                )}
              </div>

              {/* Amount Range */}
              {(product.minAmount || product.maxAmount) && (
                <div className="text-xs">
                  <span className="text-muted-foreground">Range: </span>
                  <span className="font-medium">
                    {product.minAmount
                      ? formatCurrency(product.minAmount)
                      : "No min"}{" "}
                    –{" "}
                    {product.maxAmount
                      ? formatCurrency(product.maxAmount)
                      : "No max"}
                  </span>
                </div>
              )}

              {/* Terms */}
              {product.termMonths && product.termMonths.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  <span className="text-xs text-muted-foreground mr-1">
                    Terms:
                  </span>
                  {product.termMonths.map((term) => (
                    <Badge key={term} variant="outline" className="text-[10px]">
                      {term >= 12 ? `${term / 12}yr` : `${term}mo`}
                    </Badge>
                  ))}
                </div>
              )}

              <Separator />

              {/* Features */}
              <div className="flex flex-col gap-1.5">
                <p className="text-xs font-medium">Key Features</p>
                {product.features.map((feature) => (
                  <div
                    key={feature}
                    className="flex items-start gap-1.5 text-xs text-muted-foreground"
                  >
                    <CheckIcon className="size-3 text-primary mt-0.5 shrink-0" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              {/* Eligibility */}
              <div className="mt-auto pt-2">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                  Eligibility
                </p>
                <p className="text-xs text-muted-foreground">
                  {product.eligibility}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
