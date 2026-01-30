"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Expense, ExpenseFormData, FilterState, Category } from "@/types/expense";
import { generateId, getTodayString } from "@/lib/utils";

const STORAGE_KEY = "expense-tracker-data";

function loadExpenses(): Expense[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveExpenses(expenses: Expense[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
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
    setExpenses(loadExpenses());
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      saveExpenses(expenses);
    }
  }, [expenses, isLoaded]);

  const addExpense = useCallback((data: ExpenseFormData) => {
    const expense: Expense = {
      id: generateId(),
      amount: parseFloat(data.amount),
      category: data.category,
      description: data.description.trim(),
      date: data.date,
      createdAt: new Date().toISOString(),
    };
    setExpenses((prev) => [expense, ...prev]);
    return expense;
  }, []);

  const updateExpense = useCallback((id: string, data: ExpenseFormData) => {
    setExpenses((prev) =>
      prev.map((e) =>
        e.id === id
          ? {
              ...e,
              amount: parseFloat(data.amount),
              category: data.category,
              description: data.description.trim(),
              date: data.date,
            }
          : e
      )
    );
  }, []);

  const deleteExpense = useCallback((id: string) => {
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
