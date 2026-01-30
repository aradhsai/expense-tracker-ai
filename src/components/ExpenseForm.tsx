"use client";

import { useState, useEffect } from "react";
import { ExpenseFormData, Category, CATEGORIES, Expense } from "@/types/expense";
import { getTodayString, getCategoryEmoji } from "@/lib/utils";

interface Props {
  onSubmit: (data: ExpenseFormData) => void;
  editingExpense?: Expense | null;
  onCancelEdit?: () => void;
}

const emptyForm: ExpenseFormData = {
  amount: "",
  category: "Food",
  description: "",
  date: getTodayString(),
};

export default function ExpenseForm({ onSubmit, editingExpense, onCancelEdit }: Props) {
  const [form, setForm] = useState<ExpenseFormData>(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<keyof ExpenseFormData, string>>>({});
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (editingExpense) {
      setForm({
        amount: editingExpense.amount.toString(),
        category: editingExpense.category,
        description: editingExpense.description,
        date: editingExpense.date,
      });
      setErrors({});
    }
  }, [editingExpense]);

  function validate(): boolean {
    const newErrors: Partial<Record<keyof ExpenseFormData, string>> = {};

    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0) {
      newErrors.amount = "Enter a valid amount greater than 0";
    }
    if (Number(form.amount) > 999999.99) {
      newErrors.amount = "Amount cannot exceed $999,999.99";
    }
    if (!form.description.trim()) {
      newErrors.description = "Description is required";
    }
    if (form.description.trim().length > 200) {
      newErrors.description = "Description must be under 200 characters";
    }
    if (!form.date) {
      newErrors.date = "Date is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    onSubmit(form);

    if (!editingExpense) {
      setForm({ ...emptyForm, date: getTodayString() });
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } else {
      onCancelEdit?.();
    }
    setErrors({});
  }

  function handleCancel() {
    setForm(emptyForm);
    setErrors({});
    onCancelEdit?.();
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-5">
        {editingExpense ? "Edit Expense" : "Add Expense"}
      </h2>

      <div className="space-y-4">
        {/* Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Amount
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">
              $
            </span>
            <input
              type="number"
              step="0.01"
              min="0.01"
              max="999999.99"
              placeholder="0.00"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              className={`w-full pl-8 pr-4 py-2.5 border rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 transition-colors ${
                errors.amount
                  ? "border-red-300 focus:ring-red-200"
                  : "border-gray-200 focus:ring-indigo-200 focus:border-indigo-400"
              }`}
            />
          </div>
          {errors.amount && (
            <p className="mt-1 text-sm text-red-500">{errors.amount}</p>
          )}
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Category
          </label>
          <div className="grid grid-cols-3 gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setForm({ ...form, category: cat })}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                  form.category === cat
                    ? "bg-indigo-50 text-indigo-700 border-2 border-indigo-300 shadow-sm"
                    : "bg-gray-50 text-gray-600 border-2 border-transparent hover:bg-gray-100"
                }`}
              >
                <span>{getCategoryEmoji(cat)}</span>
                <span className="truncate">{cat}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Description
          </label>
          <input
            type="text"
            placeholder="What did you spend on?"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            maxLength={200}
            className={`w-full px-4 py-2.5 border rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 transition-colors ${
              errors.description
                ? "border-red-300 focus:ring-red-200"
                : "border-gray-200 focus:ring-indigo-200 focus:border-indigo-400"
            }`}
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-500">{errors.description}</p>
          )}
        </div>

        {/* Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Date
          </label>
          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            max={getTodayString()}
            className={`w-full px-4 py-2.5 border rounded-xl text-gray-900 focus:outline-none focus:ring-2 transition-colors ${
              errors.date
                ? "border-red-300 focus:ring-red-200"
                : "border-gray-200 focus:ring-indigo-200 focus:border-indigo-400"
            }`}
          />
          {errors.date && (
            <p className="mt-1 text-sm text-red-500">{errors.date}</p>
          )}
        </div>

        {/* Submit */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            className="flex-1 bg-indigo-600 text-white py-2.5 px-4 rounded-xl font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-colors"
          >
            {editingExpense ? "Update Expense" : "Add Expense"}
          </button>
          {editingExpense && (
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2.5 border border-gray-200 rounded-xl text-gray-600 font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>

        {/* Success Message */}
        {showSuccess && (
          <div className="bg-emerald-50 text-emerald-700 px-4 py-3 rounded-xl text-sm font-medium text-center animate-fade-in">
            Expense added successfully!
          </div>
        )}
      </div>
    </form>
  );
}
