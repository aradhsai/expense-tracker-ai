"use client";

import { exportToCSV } from "@/lib/utils";
import { Expense } from "@/types/expense";
import { LayoutDashboard, Receipt, Download, Wallet } from "lucide-react";

interface Props {
  activeTab: "dashboard" | "expenses";
  onTabChange: (tab: "dashboard" | "expenses") => void;
  expenses: Expense[];
}

export default function Header({ activeTab, onTabChange, expenses }: Props) {
  return (
    <header className="glass-strong sticky top-0 z-30 border-b border-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 gradient-primary rounded-xl flex items-center justify-center shadow-soft">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-content-primary">
              Expense<span className="text-primary">Tracker</span>
            </span>
          </div>

          {/* Navigation */}
          <nav className="flex items-center gap-1">
            <button
              onClick={() => onTabChange("dashboard")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                activeTab === "dashboard"
                  ? "bg-primary/10 text-primary shadow-sm"
                  : "text-content-secondary hover:text-content-primary hover:bg-surface-tertiary"
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </button>
            <button
              onClick={() => onTabChange("expenses")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                activeTab === "expenses"
                  ? "bg-primary/10 text-primary shadow-sm"
                  : "text-content-secondary hover:text-content-primary hover:bg-surface-tertiary"
              }`}
            >
              <Receipt className="w-4 h-4" />
              <span className="hidden sm:inline">Expenses</span>
            </button>
            {expenses.length > 0 && (
              <button
                onClick={() => exportToCSV(expenses)}
                className="ml-2 flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-content-secondary hover:text-content-primary hover:bg-surface-tertiary rounded-xl transition-all"
                title="Export as CSV"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export</span>
              </button>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
