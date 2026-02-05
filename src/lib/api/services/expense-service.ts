// Expense service for API CRUD operations

import { getSupabaseClient } from "../middleware/auth";
import type { Expense, Category } from "@/types/expense";
import type { PaginatedResponse } from "@/types/api";
import type {
  CreateExpenseInput,
  UpdateExpenseInput,
  PatchExpenseInput,
  ListExpensesQuery,
} from "../validators/expense";
import { calculateOffset, calculatePaginationMeta } from "../utils/pagination";

// Database row type (snake_case from Supabase)
interface ExpenseRow {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  created_at: string;
}

// Convert database row to API response format
function rowToExpense(row: ExpenseRow): Expense {
  return {
    id: row.id,
    amount: row.amount,
    category: row.category as Category,
    description: row.description,
    date: row.date,
    createdAt: row.created_at,
  };
}

export async function listExpenses(
  query: ListExpensesQuery
): Promise<PaginatedResponse<Expense>> {
  const supabase = getSupabaseClient();
  const { page, limit, category, date_from, date_to, search, sort_by, sort_order } = query;

  // Build the query
  let queryBuilder = supabase.from("expenses").select("*", { count: "exact" });

  // Apply filters
  if (category) {
    queryBuilder = queryBuilder.eq("category", category);
  }

  if (date_from) {
    queryBuilder = queryBuilder.gte("date", date_from);
  }

  if (date_to) {
    queryBuilder = queryBuilder.lte("date", date_to);
  }

  if (search) {
    queryBuilder = queryBuilder.ilike("description", `%${search}%`);
  }

  // Apply sorting
  const sortColumn = sort_by === "category" ? "category" : sort_by;
  queryBuilder = queryBuilder.order(sortColumn, { ascending: sort_order === "asc" });

  // Apply pagination
  const offset = calculateOffset(page, limit);
  queryBuilder = queryBuilder.range(offset, offset + limit - 1);

  const { data, error, count } = await queryBuilder;

  if (error) {
    throw new Error(`Failed to fetch expenses: ${error.message}`);
  }

  const total = count || 0;
  const items = (data || []).map(rowToExpense);
  const pagination = calculatePaginationMeta(page, limit, total);

  return { items, pagination };
}

export async function getExpenseById(id: string): Promise<Expense | null> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      // Not found
      return null;
    }
    throw new Error(`Failed to fetch expense: ${error.message}`);
  }

  return rowToExpense(data);
}

export async function createExpense(input: CreateExpenseInput): Promise<Expense> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from("expenses")
    .insert({
      amount: input.amount,
      category: input.category,
      description: input.description,
      date: input.date,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create expense: ${error.message}`);
  }

  return rowToExpense(data);
}

export async function updateExpense(
  id: string,
  input: UpdateExpenseInput
): Promise<Expense | null> {
  const supabase = getSupabaseClient();

  // First check if expense exists
  const existing = await getExpenseById(id);
  if (!existing) {
    return null;
  }

  const { data, error } = await supabase
    .from("expenses")
    .update({
      amount: input.amount,
      category: input.category,
      description: input.description,
      date: input.date,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update expense: ${error.message}`);
  }

  return rowToExpense(data);
}

export async function patchExpense(
  id: string,
  input: PatchExpenseInput
): Promise<Expense | null> {
  const supabase = getSupabaseClient();

  // First check if expense exists
  const existing = await getExpenseById(id);
  if (!existing) {
    return null;
  }

  // Build update object with only provided fields
  const updateData: Partial<ExpenseRow> = {};
  if (input.amount !== undefined) updateData.amount = input.amount;
  if (input.category !== undefined) updateData.category = input.category;
  if (input.description !== undefined) updateData.description = input.description;
  if (input.date !== undefined) updateData.date = input.date;

  // If no fields to update, return existing
  if (Object.keys(updateData).length === 0) {
    return existing;
  }

  const { data, error } = await supabase
    .from("expenses")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to patch expense: ${error.message}`);
  }

  return rowToExpense(data);
}

export async function deleteExpense(id: string): Promise<boolean> {
  const supabase = getSupabaseClient();

  // First check if expense exists
  const existing = await getExpenseById(id);
  if (!existing) {
    return false;
  }

  const { error } = await supabase.from("expenses").delete().eq("id", id);

  if (error) {
    throw new Error(`Failed to delete expense: ${error.message}`);
  }

  return true;
}
