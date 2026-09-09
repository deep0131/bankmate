"use client";

import { useState, useMemo } from "react";
import type { SanitizedTransaction } from "@/lib/sanitization/sanitize";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowUpDownIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  FilterIcon,
} from "lucide-react";

interface TransactionTableProps {
  transactions: SanitizedTransaction[];
  accountId: string;
}

type SortField = "date" | "amount";
type SortDirection = "asc" | "desc";
type FilterType = "all" | "credit" | "debit";

const ITEMS_PER_PAGE = 10;

const categoryColors: Record<string, string> = {
  Salary: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  Groceries: "bg-green-500/15 text-green-700 dark:text-green-400",
  Entertainment: "bg-purple-500/15 text-purple-700 dark:text-purple-400",
  Dining: "bg-orange-500/15 text-orange-700 dark:text-orange-400",
  Transportation: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
  Shopping: "bg-pink-500/15 text-pink-700 dark:text-pink-400",
  Utilities: "bg-slate-500/15 text-slate-700 dark:text-slate-400",
  Healthcare: "bg-red-500/15 text-red-700 dark:text-red-400",
  Education: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-400",
  Travel: "bg-cyan-500/15 text-cyan-700 dark:text-cyan-400",
  Rent: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  Transfer: "bg-gray-500/15 text-gray-700 dark:text-gray-400",
  Investment: "bg-teal-500/15 text-teal-700 dark:text-teal-400",
  Insurance: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400",
  Subscription: "bg-violet-500/15 text-violet-700 dark:text-violet-400",
  Other: "bg-muted text-muted-foreground",
};

function formatCurrency(amount: number): string {
  const sign = amount >= 0 ? "+" : "";
  return `${sign}${new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount)}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function TransactionTable({
  transactions,
  accountId,
}: TransactionTableProps) {
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");

  // Client-side filtering (User Story 7)
  const filtered = useMemo(() => {
    let result = [...transactions];

    if (filterType !== "all") {
      result = result.filter((t) => t.type === filterType);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (t) =>
          t.merchant.toLowerCase().includes(term) ||
          t.category.toLowerCase().includes(term),
      );
    }

    return result;
  }, [transactions, filterType, searchTerm]);

  // Client-side sorting (User Story 6)
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let comparison = 0;
      if (sortField === "date") {
        comparison =
          new Date(a.date).getTime() - new Date(b.date).getTime();
      } else {
        comparison = Math.abs(a.amount) - Math.abs(b.amount);
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [filtered, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(sorted.length / ITEMS_PER_PAGE);
  const paginated = sorted.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
    setCurrentPage(1);
  }

  function getSortIcon(field: SortField) {
    if (sortField !== field) return <ArrowUpDownIcon />;
    return sortDirection === "asc" ? <ArrowUpIcon /> : <ArrowDownIcon />;
  }

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Filters Bar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <input
            type="text"
            placeholder="Search merchant or category..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full h-7 rounded-md border border-input bg-background px-2 text-xs outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
          />
        </div>
        <div className="flex items-center gap-1">
          <FilterIcon className="size-3 text-muted-foreground" />
          {(["all", "credit", "debit"] as FilterType[]).map((type) => (
            <Button
              key={type}
              variant={filterType === type ? "default" : "outline"}
              size="xs"
              onClick={() => {
                setFilterType(type);
                setCurrentPage(1);
              }}
            >
              {type === "all"
                ? "All"
                : type === "credit"
                  ? "Credits"
                  : "Debits"}
            </Button>
          ))}
        </div>
      </div>

      {/* Results count */}
      <p className="text-xs text-muted-foreground">
        {sorted.length} transaction{sorted.length !== 1 ? "s" : ""} found
      </p>

      {/* Table */}
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => toggleSort("date")}
                  className="gap-1"
                >
                  Date
                  {getSortIcon("date")}
                </Button>
              </TableHead>
              <TableHead>Merchant</TableHead>
              <TableHead className="hidden sm:table-cell">Category</TableHead>
              <TableHead className="text-right">
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => toggleSort("amount")}
                  className="gap-1 ml-auto"
                >
                  Amount
                  {getSortIcon("amount")}
                </Button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.length > 0 ? (
              paginated.map((txn) => (
                <TableRow key={txn.id}>
                  <TableCell className="text-xs tabular-nums whitespace-nowrap">
                    {formatDate(txn.date)}
                  </TableCell>
                  <TableCell className="text-xs font-medium max-w-[150px] truncate">
                    {txn.merchant}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge
                      variant="secondary"
                      className={`text-[10px] ${categoryColors[txn.category] ?? categoryColors.Other}`}
                    >
                      {txn.category}
                    </Badge>
                  </TableCell>
                  <TableCell
                    className={`text-xs text-right font-medium tabular-nums whitespace-nowrap ${
                      txn.amount >= 0
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {formatCurrency(txn.amount)}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-xs text-muted-foreground py-6">
                  No transactions found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon-xs"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeftIcon />
            </Button>
            <Button
              variant="outline"
              size="icon-xs"
              onClick={() =>
                setCurrentPage((p) => Math.min(totalPages, p + 1))
              }
              disabled={currentPage === totalPages}
            >
              <ChevronRightIcon />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
