"use client";

import { Expense, FilterState, CATEGORIES, Category } from "@/types/expense";
import { formatCurrency, formatDate, getCategoryEmoji, getCategoryColor } from "@/lib/utils";

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
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
      {/* Filters */}
      <div className="p-4 sm:p-6 border-b border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Expenses
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({expenses.length} {expenses.length === 1 ? "item" : "items"})
            </span>
          </h2>
          <div className="flex items-center gap-2">
            <select
              value={filters.sortBy}
              onChange={(e) =>
                onFiltersChange({ ...filters, sortBy: e.target.value as FilterState["sortBy"] })
              }
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-200"
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
              className="p-1.5 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 transition-colors"
              title={filters.sortOrder === "desc" ? "Descending" : "Ascending"}
            >
              {filters.sortOrder === "desc" ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Search expenses..."
              value={filters.search}
              onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
            />
          </div>

          {/* Category Filter */}
          <select
            value={filters.category}
            onChange={(e) =>
              onFiltersChange({ ...filters, category: e.target.value as Category | "All" })
            }
            className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-200"
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
            className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />

          {/* Date To */}
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => onFiltersChange({ ...filters, dateTo: e.target.value })}
            placeholder="To date"
            className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
        </div>

        {/* Active Filters */}
        {(filters.search || filters.category !== "All" || filters.dateFrom || filters.dateTo) && (
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs text-gray-500">Active filters:</span>
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
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* List */}
      <div className="divide-y divide-gray-50">
        {expenses.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-4xl mb-3">
              {filters.search || filters.category !== "All" || filters.dateFrom || filters.dateTo
                ? "🔍"
                : "💸"}
            </div>
            <p className="text-gray-500 font-medium">
              {filters.search || filters.category !== "All" || filters.dateFrom || filters.dateTo
                ? "No expenses match your filters"
                : "No expenses yet"}
            </p>
            <p className="text-gray-400 text-sm mt-1">
              {filters.search || filters.category !== "All" || filters.dateFrom || filters.dateTo
                ? "Try adjusting your filters"
                : "Add your first expense to get started"}
            </p>
          </div>
        ) : (
          expenses.map((expense) => (
            <div
              key={expense.id}
              className="flex items-center gap-4 px-4 sm:px-6 py-4 hover:bg-gray-50/50 transition-colors group"
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
                <p className="text-sm font-medium text-gray-900 truncate">
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
                  <span className="text-xs text-gray-400">
                    {formatDate(expense.date)}
                  </span>
                </div>
              </div>

              {/* Amount */}
              <div className="text-right shrink-0">
                <p className="text-sm font-semibold text-gray-900">
                  {formatCurrency(expense.amount)}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <button
                  onClick={() => onEdit(expense)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                  title="Edit"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                </button>
                <button
                  onClick={() => handleDeleteClick(expense.id)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  title="Delete"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
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
    <span className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-medium">
      {label}
      <button onClick={onRemove} className="hover:text-indigo-900">
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </span>
  );
}
