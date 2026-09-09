import type { BankingProduct, ProductCategory } from "@/types/product";
import productsData from "@/data/products.json";

/**
 * Server-side data access for Banking Products.
 * No PII concerns — product data is public catalog information.
 */

const products = productsData as BankingProduct[];

/** Get all banking products. */
export function getAllProducts(): BankingProduct[] {
  return products;
}

/** Get products filtered by category. */
export function getProductsByCategory(
  category: ProductCategory,
): BankingProduct[] {
  return products.filter((p) => p.category === category);
}

/** Get a specific product by ID. */
export function getProductById(id: string): BankingProduct | undefined {
  return products.find((p) => p.id === id);
}

/** Get products by a list of IDs. */
export function getProductsByIds(ids: string[]): BankingProduct[] {
  return products.filter((p) => ids.includes(p.id));
}

/** Get all unique product categories available. */
export function getProductCategories(): ProductCategory[] {
  const categories = new Set(products.map((p) => p.category));
  return Array.from(categories);
}

/** Format a product category for display. */
export function formatCategoryName(category: ProductCategory): string {
  const names: Record<ProductCategory, string> = {
    home_loan: "Home Loans",
    personal_loan: "Personal Loans",
    credit_card: "Credit Cards",
    savings: "Savings Accounts",
    fixed_deposit: "Fixed Deposits",
  };
  return names[category] ?? category;
}
