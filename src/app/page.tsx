"use client";

import { useState } from "react";
import { useExpenses } from "@/hooks/useExpenses";
import Header from "@/components/Header";
import Dashboard from "@/components/Dashboard";
import ExpenseForm from "@/components/ExpenseForm";
import ExpenseList from "@/components/ExpenseList";
import { Expense } from "@/types/expense";
import { Plus } from "lucide-react";

export default function Home() {
  const {
    expenses,
    filteredExpenses,
    filters,
    setFilters,
    addExpense,
    updateExpense,
    deleteExpense,
    stats,
    isLoaded,
  } = useExpenses();

  const [activeTab, setActiveTab] = useState<"dashboard" | "expenses">("dashboard");
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  function handleEdit(expense: Expense) {
    setEditingExpense(expense);
    setActiveTab("expenses");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleCancelEdit() {
    setEditingExpense(null);
  }

  function handleSubmit(data: Parameters<typeof addExpense>[0]) {
    if (editingExpense) {
      updateExpense(editingExpense.id, data);
      setEditingExpense(null);
    } else {
      addExpense(data);
    }
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-surface-primary flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-content-secondary">Loading your expenses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-primary">
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        expenses={expenses}
      />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {activeTab === "dashboard" ? (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h1 className="text-2xl font-bold text-content-primary">Dashboard</h1>
              <p className="text-content-secondary text-sm mt-1">
                Overview of your spending habits
              </p>
            </div>

            {expenses.length === 0 ? (
              <div className="bg-surface-secondary rounded-2xl shadow-soft border border-border p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-surface-tertiary flex items-center justify-center">
                  <span className="text-4xl">📊</span>
                </div>
                <h3 className="text-lg font-semibold text-content-primary mb-2">
                  No data yet
                </h3>
                <p className="text-content-secondary mb-6 max-w-sm mx-auto">
                  Start adding expenses to see your spending dashboard with charts and analytics.
                </p>
                <button
                  onClick={() => setActiveTab("expenses")}
                  className="inline-flex items-center gap-2 gradient-primary text-white px-5 py-2.5 rounded-xl font-medium hover:opacity-90 transition-all shadow-soft hover:shadow-medium"
                >
                  <Plus className="w-4 h-4" />
                  Add Your First Expense
                </button>
              </div>
            ) : (
              <Dashboard stats={stats} />
            )}
          </div>
        ) : (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h1 className="text-2xl font-bold text-content-primary">Expenses</h1>
              <p className="text-content-secondary text-sm mt-1">
                Manage and track your expenses
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Form */}
              <div className="lg:col-span-1">
                <div className="lg:sticky lg:top-24">
                  <ExpenseForm
                    onSubmit={handleSubmit}
                    editingExpense={editingExpense}
                    onCancelEdit={handleCancelEdit}
                  />
                </div>
              </div>

              {/* List */}
              <div className="lg:col-span-2">
                <ExpenseList
                  expenses={filteredExpenses}
                  filters={filters}
                  onFiltersChange={setFilters}
                  onEdit={handleEdit}
                  onDelete={deleteExpense}
                />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
