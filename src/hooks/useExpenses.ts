"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Expense, ExpenseFormData, FilterState, Category } from "@/types/expense";
import { getTodayString } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

interface ExpenseRow {
  id: string;
  amount: number;
  category: Category;
  description: string;
  date: string;
  created_at: string;
}

function toExpense(row: ExpenseRow): Expense {
  return {
    id: row.id,
    amount: Number(row.amount),
    category: row.category,
    description: row.description,
    date: row.date,
    createdAt: row.created_at,
  };
}

export function useExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    category: "All",
    dateFrom: "",
    dateTo: "",
    sortBy: "date",
    sortOrder: "desc",
  });

  useEffect(() => {
    async function fetchExpenses() {
      const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Failed to fetch expenses:", error);
      } else {
        setExpenses((data as ExpenseRow[]).map(toExpense));
      }
      setIsLoaded(true);
    }
    fetchExpenses();
  }, []);

  const addExpense = useCallback(async (data: ExpenseFormData) => {
    const row = {
      amount: parseFloat(data.amount),
      category: data.category,
      description: data.description.trim(),
      date: data.date,
    };

    const { data: inserted, error } = await supabase
      .from("expenses")
      .insert(row)
      .select()
      .single();

    if (error) {
      console.error("Failed to add expense:", error);
      return null;
    }

    const expense = toExpense(inserted as ExpenseRow);
    setExpenses((prev) => [expense, ...prev]);
    return expense;
  }, []);

  const updateExpense = useCallback(async (id: string, data: ExpenseFormData) => {
    const updates = {
      amount: parseFloat(data.amount),
      category: data.category,
      description: data.description.trim(),
      date: data.date,
    };

    const { data: updated, error } = await supabase
      .from("expenses")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Failed to update expense:", error);
      return;
    }

    const expense = toExpense(updated as ExpenseRow);
    setExpenses((prev) => prev.map((e) => (e.id === id ? expense : e)));
  }, []);

  const deleteExpense = useCallback(async (id: string) => {
    const { error } = await supabase.from("expenses").delete().eq("id", id);

    if (error) {
      console.error("Failed to delete expense:", error);
      return;
    }

    setExpenses((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const filteredExpenses = useMemo(() => {
    let result = [...expenses];

    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (e) =>
          e.description.toLowerCase().includes(q) ||
          e.category.toLowerCase().includes(q)
      );
    }

    if (filters.category !== "All") {
      result = result.filter((e) => e.category === filters.category);
    }

    if (filters.dateFrom) {
      result = result.filter((e) => e.date >= filters.dateFrom);
    }

    if (filters.dateTo) {
      result = result.filter((e) => e.date <= filters.dateTo);
    }

    result.sort((a, b) => {
      let cmp = 0;
      switch (filters.sortBy) {
        case "date":
          cmp = a.date.localeCompare(b.date);
          break;
        case "amount":
          cmp = a.amount - b.amount;
          break;
        case "category":
          cmp = a.category.localeCompare(b.category);
          break;
      }
      return filters.sortOrder === "desc" ? -cmp : cmp;
    });

    return result;
  }, [expenses, filters]);

  const stats = useMemo(() => {
    const today = getTodayString();
    const currentMonth = today.substring(0, 7);

    const totalSpending = expenses.reduce((sum, e) => sum + e.amount, 0);
    const monthlyExpenses = expenses.filter(
      (e) => e.date.substring(0, 7) === currentMonth
    );
    const monthlySpending = monthlyExpenses.reduce(
      (sum, e) => sum + e.amount,
      0
    );

    const categoryTotals: Record<string, number> = {};
    expenses.forEach((e) => {
      categoryTotals[e.category] =
        (categoryTotals[e.category] || 0) + e.amount;
    });

    const monthlyCategoryTotals: Record<string, number> = {};
    monthlyExpenses.forEach((e) => {
      monthlyCategoryTotals[e.category] =
        (monthlyCategoryTotals[e.category] || 0) + e.amount;
    });

    const topCategory = Object.entries(categoryTotals).sort(
      ([, a], [, b]) => b - a
    )[0];

    // Daily spending for the last 30 days
    const dailySpending: { date: string; amount: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const dayTotal = expenses
        .filter((e) => e.date === dateStr)
        .reduce((sum, e) => sum + e.amount, 0);
      dailySpending.push({
        date: dateStr,
        amount: dayTotal,
      });
    }

    // Monthly spending for the last 6 months
    const monthlyBreakdown: { month: string; amount: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthStr = d.toISOString().substring(0, 7);
      const monthLabel = d.toLocaleDateString("en-US", {
        month: "short",
        year: "2-digit",
      });
      const monthTotal = expenses
        .filter((e) => e.date.substring(0, 7) === monthStr)
        .reduce((sum, e) => sum + e.amount, 0);
      monthlyBreakdown.push({ month: monthLabel, amount: monthTotal });
    }

    const avgDaily = monthlySpending / new Date().getDate();

    return {
      totalSpending,
      monthlySpending,
      totalCount: expenses.length,
      monthlyCount: monthlyExpenses.length,
      categoryTotals,
      monthlyCategoryTotals,
      topCategory: topCategory
        ? { name: topCategory[0] as Category, amount: topCategory[1] }
        : null,
      dailySpending,
      monthlyBreakdown,
      avgDaily,
    };
  }, [expenses]);

  return {
    expenses,
    filteredExpenses,
    filters,
    setFilters,
    addExpense,
    updateExpense,
    deleteExpense,
    stats,
    isLoaded,
  };
}
