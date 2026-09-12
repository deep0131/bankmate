"use client";

import {
  columnVisibilityFeature,
  createColumnHelper,
  createPaginatedRowModel,
  createSortedRowModel,
  rowPaginationFeature,
  rowSortingFeature,
  type SortingState,
  sortFn_alphanumeric,
  sortFn_text,
  tableFeatures,
  useTable,
} from "@tanstack/react-table";
import {
  ArrowDownLeft,
  ArrowUpDown,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  ReceiptText,
} from "lucide-react";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Marker, MarkerContent, MarkerIcon } from "@/components/ui/marker";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Transaction } from "@/types/transaction";

const features = tableFeatures({
  columnVisibilityFeature,
  rowPaginationFeature,
  rowSortingFeature,
  paginatedRowModel: createPaginatedRowModel(),
  sortedRowModel: createSortedRowModel(),
  sortFns: { alphanumeric: sortFn_alphanumeric, text: sortFn_text },
});

type DataTableFeatures = typeof features;

const columnHelper = createColumnHelper<DataTableFeatures, Transaction>();

export interface TransactionTableOutput {
  account?: string;
  category?: string;
  totalCount: number;
  transactions: Transaction[];
}

export interface TransactionTableProps {
  output?: TransactionTableOutput;
  state?:
    | "input-streaming"
    | "input-available"
    | "approval-requested"
    | "approval-responded"
    | "output-available"
    | "output-error"
    | "output-denied";
  errorText?: string;
}

const columns = columnHelper.columns([
  columnHelper.accessor("date", {
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          size="xs"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-2 h-7 px-2 font-medium"
        >
          Date
          <ArrowUpDown className="size-3" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const dateStr = row.original.date;
      const date = new Date(dateStr);
      const formatted = !Number.isNaN(date.getTime())
        ? date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })
        : dateStr;

      return (
        <div className="text-xs text-muted-foreground whitespace-nowrap">
          {formatted}
        </div>
      );
    },
  }),
  columnHelper.accessor("description", {
    header: "Description",
    cell: ({ row }) => {
      const tx = row.original;
      return (
        <div className="flex flex-col gap-0.5">
          <span className="font-medium text-foreground text-xs leading-none">
            {tx.description}
          </span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[10px] text-muted-foreground capitalize">
              {tx.account}
            </span>
          </div>
        </div>
      );
    },
  }),
  columnHelper.accessor("category", {
    header: "Category",
    cell: ({ row }) => (
      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
        {row.original.category}
      </Badge>
    ),
  }),
  columnHelper.accessor("amount", {
    header: ({ column }) => {
      return (
        <div className="text-right">
          <Button
            variant="ghost"
            size="xs"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="-mr-2 ml-auto h-7 px-2 font-medium"
          >
            Amount
            <ArrowUpDown className="size-3" />
          </Button>
        </div>
      );
    },
    cell: ({ row }) => {
      const tx = row.original;
      const isCredit = tx.type === "credit";
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(tx.amount);

      return (
        <div
          className={`flex items-center justify-end gap-1 text-right font-medium tabular-nums text-xs ${
            isCredit
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-foreground"
          }`}
        >
          {isCredit ? (
            <ArrowDownLeft className="size-3 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <ArrowUpRight className="size-3 text-muted-foreground" />
          )}
          <span>{isCredit ? `+${formatted}` : `-${formatted}`}</span>
        </div>
      );
    },
  }),
  columnHelper.accessor("status", {
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status;
      return (
        <Badge
          variant={status === "completed" ? "secondary" : "outline"}
          className="capitalize text-[10px] px-1.5 py-0"
        >
          {status}
        </Badge>
      );
    },
  }),
]);

export function TransactionTable({
  output,
  state,
  errorText,
}: TransactionTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const transactions = React.useMemo(
    () => output?.transactions ?? [],
    [output?.transactions],
  );

  const table = useTable({
    features,
    data: transactions,
    columns,
    onSortingChange: setSorting,
    state: {
      sorting,
      pagination: {
        pageIndex: 0,
        pageSize: 5,
      },
    },
  });

  if (state === "input-streaming" || state === "input-available") {
    return (
      <Marker role="status" className="my-2">
        <MarkerIcon>
          <Spinner />
        </MarkerIcon>
        <MarkerContent className="shimmer">
          Fetching transaction records...
        </MarkerContent>
      </Marker>
    );
  }

  if (state === "output-error" || errorText) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
        Failed to load transactions: {errorText ?? "Unknown error occurred"}
      </div>
    );
  }

  if (!output || transactions.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card/50 p-4 text-center text-xs text-muted-foreground">
        No transactions found matching your criteria.
      </div>
    );
  }

  const currentPage = (table.state?.pagination?.pageIndex ?? 0) + 1;
  const totalPages = table.getPageCount();

  return (
    <div className="w-full max-w-full space-y-2.5 my-2">
      <div className="flex items-center justify-between text-xs text-muted-foreground px-0.5">
        <div className="flex items-center gap-1.5 font-medium text-foreground">
          <ReceiptText className="size-3.5 text-primary" />
          <span>Recent Transactions</span>
        </div>
        <span>
          Showing {transactions.length} of {output.totalCount} records
        </span>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card shadow-xs">
        <Table>
          <TableHeader className="bg-muted/40">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : (
                      <table.FlexRender header={header} />
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      <table.FlexRender cell={cell} />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-16 text-center text-muted-foreground"
                >
                  No transactions found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {transactions.length > 5 && (
        <div className="flex items-center justify-between px-1 text-xs text-muted-foreground">
          <div>
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon-xs"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className="size-3" />
              <span className="sr-only">Previous Page</span>
            </Button>
            <Button
              variant="outline"
              size="icon-xs"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <ChevronRight className="size-3" />
              <span className="sr-only">Next Page</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
