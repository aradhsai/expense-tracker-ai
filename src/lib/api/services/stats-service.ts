// Statistics service for expense analytics

import { getSupabaseClient } from "../middleware/auth";
import type { ExpenseStats, CategoryBreakdown, MonthlyBreakdown } from "@/types/api";
import type { StatsQuery } from "../validators/expense";

export async function getExpenseStats(query: StatsQuery): Promise<ExpenseStats> {
  const supabase = getSupabaseClient();

  // Build query with optional date filters
  let queryBuilder = supabase.from("expenses").select("*");

  if (query.date_from) {
    queryBuilder = queryBuilder.gte("date", query.date_from);
  }

  if (query.date_to) {
    queryBuilder = queryBuilder.lte("date", query.date_to);
  }

  const { data, error } = await queryBuilder;

  if (error) {
    throw new Error(`Failed to fetch expenses for stats: ${error.message}`);
  }

  const expenses = data || [];

  // Calculate statistics
  const totalSpending = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  // Current month spending
  const now = new Date();
  const currentMonthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const monthlyExpenses = expenses.filter((exp) => exp.date >= currentMonthStart);
  const monthlySpending = monthlyExpenses.reduce((sum, exp) => sum + exp.amount, 0);

  // Daily average (for current month)
  const currentDay = now.getDate();
  const dailyAverage = currentDay > 0 ? monthlySpending / currentDay : 0;

  // Category breakdown
  const categoryTotals = new Map<string, { total: number; count: number }>();
  for (const exp of expenses) {
    const current = categoryTotals.get(exp.category) || { total: 0, count: 0 };
    categoryTotals.set(exp.category, {
      total: current.total + exp.amount,
      count: current.count + 1,
    });
  }

  const categoryBreakdown: CategoryBreakdown[] = Array.from(categoryTotals.entries())
    .map(([category, { total, count }]) => ({
      category,
      total: Math.round(total * 100) / 100,
      count,
      percentage: totalSpending > 0 ? Math.round((total / totalSpending) * 10000) / 100 : 0,
    }))
    .sort((a, b) => b.total - a.total);

  // Monthly breakdown (last 6 months)
  const monthlyTotals = new Map<string, { total: number; count: number }>();
  for (const exp of expenses) {
    const month = exp.date.slice(0, 7); // YYYY-MM
    const current = monthlyTotals.get(month) || { total: 0, count: 0 };
    monthlyTotals.set(month, {
      total: current.total + exp.amount,
      count: current.count + 1,
    });
  }

  // Get last 6 months including current
  const monthlyBreakdown: MonthlyBreakdown[] = [];
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const monthData = monthlyTotals.get(monthKey) || { total: 0, count: 0 };
    monthlyBreakdown.push({
      month: monthKey,
      total: Math.round(monthData.total * 100) / 100,
      count: monthData.count,
    });
  }

  return {
    total_spending: Math.round(totalSpending * 100) / 100,
    monthly_spending: Math.round(monthlySpending * 100) / 100,
    daily_average: Math.round(dailyAverage * 100) / 100,
    expense_count: expenses.length,
    category_breakdown: categoryBreakdown,
    monthly_breakdown: monthlyBreakdown,
  };
}
