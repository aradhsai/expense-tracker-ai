"use client";

import { useState, useEffect } from "react";
import { ExpenseFormData, CATEGORIES, Expense } from "@/types/expense";
import { getTodayString, getCategoryEmoji } from "@/lib/utils";
import { CheckCircle } from "lucide-react";

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
      newErrors.amount = "Amount cannot exceed ₹9,99,999.99";
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
    <form onSubmit={handleSubmit} className="bg-surface-secondary rounded-2xl shadow-soft border border-border p-6">
      <h2 className="text-lg font-semibold text-content-primary mb-5">
        {editingExpense ? "Edit Expense" : "Add Expense"}
      </h2>

      <div className="space-y-4">
        {/* Amount */}
        <div>
          <label className="block text-sm font-medium text-content-secondary mb-1.5">
            Amount
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-content-tertiary font-medium">
              ₹
            </span>
            <input
              type="number"
              step="0.01"
              min="0.01"
              max="999999.99"
              placeholder="0.00"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              className={`w-full pl-8 pr-4 py-2.5 border rounded-xl text-content-primary bg-surface-primary placeholder-content-tertiary focus:outline-none focus:ring-2 transition-all ${
                errors.amount
                  ? "border-danger focus:ring-danger/20"
                  : "border-border focus:ring-primary/20 focus:border-primary"
              }`}
            />
          </div>
          {errors.amount && (
            <p className="mt-1 text-sm text-danger">{errors.amount}</p>
          )}
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-content-secondary mb-1.5">
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
                    ? "bg-primary/10 text-primary border-2 border-primary/30 shadow-sm"
                    : "bg-surface-tertiary text-content-secondary border-2 border-transparent hover:bg-surface-tertiary/80"
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
          <label className="block text-sm font-medium text-content-secondary mb-1.5">
            Description
          </label>
          <input
            type="text"
            placeholder="What did you spend on?"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            maxLength={200}
            className={`w-full px-4 py-2.5 border rounded-xl text-content-primary bg-surface-primary placeholder-content-tertiary focus:outline-none focus:ring-2 transition-all ${
              errors.description
                ? "border-danger focus:ring-danger/20"
                : "border-border focus:ring-primary/20 focus:border-primary"
            }`}
          />
          {errors.description && (
            <p className="mt-1 text-sm text-danger">{errors.description}</p>
          )}
        </div>

        {/* Date */}
        <div>
          <label className="block text-sm font-medium text-content-secondary mb-1.5">
            Date
          </label>
          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            max={getTodayString()}
            className={`w-full px-4 py-2.5 border rounded-xl text-content-primary bg-surface-primary focus:outline-none focus:ring-2 transition-all ${
              errors.date
                ? "border-danger focus:ring-danger/20"
                : "border-border focus:ring-primary/20 focus:border-primary"
            }`}
          />
          {errors.date && (
            <p className="mt-1 text-sm text-danger">{errors.date}</p>
          )}
        </div>

        {/* Submit */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            className="flex-1 gradient-primary text-white py-2.5 px-4 rounded-xl font-medium hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-soft hover:shadow-medium"
          >
            {editingExpense ? "Update Expense" : "Add Expense"}
          </button>
          {editingExpense && (
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2.5 border border-border rounded-xl text-content-secondary font-medium hover:bg-surface-tertiary transition-all"
            >
              Cancel
            </button>
          )}
        </div>

        {/* Success Message */}
        {showSuccess && (
          <div className="flex items-center justify-center gap-2 bg-success/10 text-success px-4 py-3 rounded-xl text-sm font-medium animate-fade-in">
            <CheckCircle className="w-4 h-4" />
            Expense added successfully!
          </div>
        )}
      </div>
    </form>
  );
}
