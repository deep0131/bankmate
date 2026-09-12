export type Transaction = {
  id: string;
  date: string;
  description: string;
  category: string;
  account: "checking" | "savings" | "credit";
  type: "debit" | "credit";
  amount: number;
  status: "completed" | "pending" | "declined";
};
