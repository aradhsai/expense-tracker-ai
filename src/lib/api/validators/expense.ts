// Zod validation schemas for expense API

import { z } from "zod";
import { CATEGORIES } from "@/types/expense";

// Category enum schema
const categorySchema = z.enum(CATEGORIES as [string, ...string[]]);

// Date string validation (YYYY-MM-DD format)
const dateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
  .refine((date) => !isNaN(Date.parse(date)), "Invalid date");

// Schema for creating an expense
export const createExpenseSchema = z.object({
  amount: z
    .number()
    .positive("Amount must be greater than 0")
    .max(999999.99, "Amount cannot exceed 999,999.99"),
  category: categorySchema,
  description: z
    .string()
    .min(1, "Description is required")
    .max(200, "Description cannot exceed 200 characters"),
  date: dateStringSchema,
});

// Schema for full update (PUT) - all fields required
export const updateExpenseSchema = createExpenseSchema;

// Schema for partial update (PATCH) - all fields optional
export const patchExpenseSchema = z.object({
  amount: z
    .number()
    .positive("Amount must be greater than 0")
    .max(999999.99, "Amount cannot exceed 999,999.99")
    .optional(),
  category: categorySchema.optional(),
  description: z
    .string()
    .min(1, "Description is required")
    .max(200, "Description cannot exceed 200 characters")
    .optional(),
  date: dateStringSchema.optional(),
});

// Schema for query parameters when listing expenses
export const listExpensesQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  category: categorySchema.optional(),
  date_from: dateStringSchema.optional(),
  date_to: dateStringSchema.optional(),
  search: z.string().max(100).optional(),
  sort_by: z.enum(["date", "amount", "category"]).optional().default("date"),
  sort_order: z.enum(["asc", "desc"]).optional().default("desc"),
});

// Schema for stats query parameters
export const statsQuerySchema = z.object({
  date_from: dateStringSchema.optional(),
  date_to: dateStringSchema.optional(),
});

// Type exports
export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
export type PatchExpenseInput = z.infer<typeof patchExpenseSchema>;
export type ListExpensesQuery = z.infer<typeof listExpensesQuerySchema>;
export type StatsQuery = z.infer<typeof statsQuerySchema>;

// Helper to format Zod errors into API error details
export function formatZodErrors(
  error: z.ZodError
): Record<string, string> {
  const details: Record<string, string> = {};
  for (const issue of error.issues) {
    const path = issue.path.join(".");
    details[path || "value"] = issue.message;
  }
  return details;
}
