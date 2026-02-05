import { Expense, Category } from "@/types/expense";

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(amount);
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

export function getTodayString(): string {
  return new Date().toISOString().split("T")[0];
}

export function getMonthStart(): string {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split("T")[0];
}

export function getMonthEnd(): string {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth() + 1, 0)
    .toISOString()
    .split("T")[0];
}

export function getCategoryColor(category: Category): string {
  const colors: Record<Category, string> = {
    Food: "#f97316",
    Transportation: "#3b82f6",
    Entertainment: "#a855f7",
    Shopping: "#ec4899",
    Bills: "#ef4444",
    Other: "#6b7280",
  };
  return colors[category];
}

export function getCategoryEmoji(category: Category): string {
  const emojis: Record<Category, string> = {
    Food: "🍔",
    Transportation: "🚗",
    Entertainment: "🎬",
    Shopping: "🛍️",
    Bills: "📄",
    Other: "📦",
  };
  return emojis[category];
}

export function exportToCSV(expenses: Expense[]): void {
  const headers = ["Date", "Category", "Description", "Amount"];
  const rows = expenses.map((e) => [
    e.date,
    e.category,
    `"${e.description.replace(/"/g, '""')}"`,
    e.amount.toFixed(2),
  ]);

  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `expenses-${getTodayString()}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export function cn(...classes: (string | boolean | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}
