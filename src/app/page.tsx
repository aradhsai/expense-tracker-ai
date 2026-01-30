"use client";

import { useState } from "react";
import { useExpenses } from "@/hooks/useExpenses";
import Header from "@/components/Header";
import Dashboard from "@/components/Dashboard";
import ExpenseForm from "@/components/ExpenseForm";
import ExpenseList from "@/components/ExpenseList";
import { Expense } from "@/types/expense";

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Loading your expenses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        expenses={expenses}
      />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {activeTab === "dashboard" ? (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-500 text-sm mt-1">
                Overview of your spending habits
              </p>
            </div>

            {expenses.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                <div className="text-5xl mb-4">📊</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No data yet
                </h3>
                <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                  Start adding expenses to see your spending dashboard with charts and analytics.
                </p>
                <button
                  onClick={() => setActiveTab("expenses")}
                  className="inline-flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-indigo-700 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Your First Expense
                </button>
              </div>
            ) : (
              <Dashboard stats={stats} />
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Expenses</h1>
              <p className="text-gray-500 text-sm mt-1">
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
