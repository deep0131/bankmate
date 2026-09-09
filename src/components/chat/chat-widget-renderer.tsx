import { AccountSummary } from "@/components/widgets/account-summary";
import { TransactionTable } from "@/components/widgets/transaction-table";
import { ProductComparison } from "@/components/widgets/product-comparison";
import { InterestCalculator } from "@/components/widgets/interest-calculator";
import { SpendingChart } from "@/components/widgets/spending-chart";

// Helper type since AI SDK's UIMessagePart is an intersection of types
interface WidgetPartProps {
  part: any; // We'll safely duck-type the tool part
}

export function ChatWidgetRenderer({ part }: WidgetPartProps) {
  const toolName = part.type.replace("tool-", "");
  const state = part.state;

  // Render a loading state while the tool is executing on the server
  if (state !== "output-available") {
    return (
      <div className="flex items-center gap-2 p-3 text-sm text-muted-foreground bg-muted/30 rounded-lg animate-pulse border border-border/50 w-fit">
        <div className="size-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <span>Loading {toolName.replace(/_/g, " ")}...</span>
      </div>
    );
  }

  // The tool execution has completed, render the result widget
  const result = part.output;

  switch (toolName) {
    case "show_account_summary":
      return <AccountSummary accounts={result.accounts} />;
    
    case "show_transactions":
      return (
        <TransactionTable
          transactions={result.transactions}
          accountId={result.accountId}
        />
      );
      
    case "compare_products":
      return (
        <ProductComparison
          products={result.products}
          category={result.category}
        />
      );
      
    case "show_calculator":
      return (
        <InterestCalculator
          principal={result.principal}
          annualRate={result.annualRate}
          termMonths={result.termMonths}
        />
      );
      
    case "show_spending_chart":
      return (
        <SpendingChart
          transactions={result.transactions}
          groupBy={result.groupBy}
          accountId={result.accountId}
        />
      );

    default:
      return null;
  }
}
