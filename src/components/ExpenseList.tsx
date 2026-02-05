"use client";

import { Expense, FilterState, CATEGORIES, Category } from "@/types/expense";
import { formatCurrency, formatDate, getCategoryEmoji, getCategoryColor } from "@/lib/utils";
import { Search, ChevronDown, ChevronUp, Pencil, Trash2, X } from "lucide-react";

interface Props {
  expenses: Expense[];
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onEdit: (expense: Expense) => void;
  onDelete: (id: string) => void;
}

export default function ExpenseList({
  expenses,
  filters,
  onFiltersChange,
  onEdit,
  onDelete,
}: Props) {
  function handleDeleteClick(id: string) {
    if (window.confirm("Are you sure you want to delete this expense?")) {
      onDelete(id);
    }
  }

  return (
    <div className="bg-surface-secondary rounded-2xl shadow-soft border border-border">
      {/* Filters */}
      <div className="p-4 sm:p-6 border-b border-border">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h2 className="text-lg font-semibold text-content-primary">
            Expenses
            <span className="ml-2 text-sm font-normal text-content-tertiary">
              ({expenses.length} {expenses.length === 1 ? "item" : "items"})
            </span>
          </h2>
          <div className="flex items-center gap-2">
            <select
              value={filters.sortBy}
              onChange={(e) =>
                onFiltersChange({ ...filters, sortBy: e.target.value as FilterState["sortBy"] })
              }
              className="text-sm border border-border rounded-lg px-3 py-1.5 text-content-secondary bg-surface-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="date">Sort by Date</option>
              <option value="amount">Sort by Amount</option>
              <option value="category">Sort by Category</option>
            </select>
            <button
              onClick={() =>
                onFiltersChange({
                  ...filters,
                  sortOrder: filters.sortOrder === "desc" ? "asc" : "desc",
                })
              }
              className="p-1.5 border border-border rounded-lg text-content-tertiary hover:bg-surface-tertiary hover:text-content-secondary transition-all"
              title={filters.sortOrder === "desc" ? "Descending" : "Ascending"}
            >
              {filters.sortOrder === "desc" ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronUp className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-tertiary" />
            <input
              type="text"
              placeholder="Search expenses..."
              value={filters.search}
              onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
              className="w-full pl-10 pr-4 py-2 border border-border rounded-xl text-sm text-content-primary bg-surface-primary placeholder-content-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          {/* Category Filter */}
          <select
            value={filters.category}
            onChange={(e) =>
              onFiltersChange({ ...filters, category: e.target.value as Category | "All" })
            }
            className="w-full px-4 py-2 border border-border rounded-xl text-sm text-content-secondary bg-surface-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="All">All Categories</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* Date From */}
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => onFiltersChange({ ...filters, dateFrom: e.target.value })}
            placeholder="From date"
            className="w-full px-4 py-2 border border-border rounded-xl text-sm text-content-secondary bg-surface-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />

          {/* Date To */}
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => onFiltersChange({ ...filters, dateTo: e.target.value })}
            placeholder="To date"
            className="w-full px-4 py-2 border border-border rounded-xl text-sm text-content-secondary bg-surface-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Active Filters */}
        {(filters.search || filters.category !== "All" || filters.dateFrom || filters.dateTo) && (
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <span className="text-xs text-content-tertiary">Active filters:</span>
            {filters.search && (
              <FilterBadge label={`"${filters.search}"`} onRemove={() => onFiltersChange({ ...filters, search: "" })} />
            )}
            {filters.category !== "All" && (
              <FilterBadge label={filters.category} onRemove={() => onFiltersChange({ ...filters, category: "All" })} />
            )}
            {filters.dateFrom && (
              <FilterBadge label={`From: ${filters.dateFrom}`} onRemove={() => onFiltersChange({ ...filters, dateFrom: "" })} />
            )}
            {filters.dateTo && (
              <FilterBadge label={`To: ${filters.dateTo}`} onRemove={() => onFiltersChange({ ...filters, dateTo: "" })} />
            )}
            <button
              onClick={() =>
                onFiltersChange({
                  search: "",
                  category: "All",
                  dateFrom: "",
                  dateTo: "",
                  sortBy: "date",
                  sortOrder: "desc",
                })
              }
              className="text-xs text-primary hover:text-primary-dark font-medium transition-colors"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* List */}
      <div className="divide-y divide-border-light">
        {expenses.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-surface-tertiary flex items-center justify-center">
              <span className="text-3xl">
                {filters.search || filters.category !== "All" || filters.dateFrom || filters.dateTo
                  ? "🔍"
                  : "💸"}
              </span>
            </div>
            <p className="text-content-secondary font-medium">
              {filters.search || filters.category !== "All" || filters.dateFrom || filters.dateTo
                ? "No expenses match your filters"
                : "No expenses yet"}
            </p>
            <p className="text-content-tertiary text-sm mt-1">
              {filters.search || filters.category !== "All" || filters.dateFrom || filters.dateTo
                ? "Try adjusting your filters"
                : "Add your first expense to get started"}
            </p>
          </div>
        ) : (
          expenses.map((expense) => (
            <div
              key={expense.id}
              className="flex items-center gap-4 px-4 sm:px-6 py-4 hover:bg-surface-tertiary/50 transition-colors group"
            >
              {/* Category Icon */}
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                style={{ backgroundColor: getCategoryColor(expense.category) + "15" }}
              >
                {getCategoryEmoji(expense.category)}
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-content-primary truncate">
                  {expense.description}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span
                    className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium"
                    style={{
                      backgroundColor: getCategoryColor(expense.category) + "15",
                      color: getCategoryColor(expense.category),
                    }}
                  >
                    {expense.category}
                  </span>
                  <span className="text-xs text-content-tertiary">
                    {formatDate(expense.date)}
                  </span>
                </div>
              </div>

              {/* Amount */}
              <div className="text-right shrink-0">
                <p className="text-sm font-semibold text-content-primary">
                  {formatCurrency(expense.amount)}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <button
                  onClick={() => onEdit(expense)}
                  className="p-1.5 rounded-lg text-content-tertiary hover:text-primary hover:bg-primary/10 transition-all"
                  title="Edit"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteClick(expense.id)}
                  className="p-1.5 rounded-lg text-content-tertiary hover:text-danger hover:bg-danger/10 transition-all"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function FilterBadge({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-lg text-xs font-medium">
      {label}
      <button onClick={onRemove} className="hover:text-primary-dark transition-colors">
        <X className="w-3 h-3" />
      </button>
    </span>
  );
}
