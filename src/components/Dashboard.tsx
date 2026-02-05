"use client";

import { formatCurrency, getCategoryColor, getCategoryEmoji } from "@/lib/utils";
import { Category, CATEGORIES } from "@/types/expense";
import { Calendar, Wallet, TrendingUp, Trophy } from "lucide-react";

interface Stats {
  totalSpending: number;
  monthlySpending: number;
  totalCount: number;
  monthlyCount: number;
  categoryTotals: Record<string, number>;
  monthlyCategoryTotals: Record<string, number>;
  topCategory: { name: Category; amount: number } | null;
  dailySpending: { date: string; amount: number }[];
  monthlyBreakdown: { month: string; amount: number }[];
  avgDaily: number;
}

interface Props {
  stats: Stats;
}

export default function Dashboard({ stats }: Props) {
  const maxMonthlyAmount = Math.max(...stats.monthlyBreakdown.map((m) => m.amount), 1);
  const maxDailyAmount = Math.max(...stats.dailySpending.map((d) => d.amount), 1);

  const categoryData = CATEGORIES.map((cat) => ({
    name: cat,
    amount: stats.monthlyCategoryTotals[cat] || 0,
    total: stats.categoryTotals[cat] || 0,
  }))
    .filter((c) => c.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  const totalMonthly = stats.monthlySpending || 1;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          label="This Month"
          value={formatCurrency(stats.monthlySpending)}
          sub={`${stats.monthlyCount} expenses`}
          icon={<Calendar className="w-5 h-5" />}
          color="primary"
        />
        <SummaryCard
          label="All Time"
          value={formatCurrency(stats.totalSpending)}
          sub={`${stats.totalCount} expenses`}
          icon={<Wallet className="w-5 h-5" />}
          color="success"
        />
        <SummaryCard
          label="Daily Avg"
          value={formatCurrency(stats.avgDaily)}
          sub="this month"
          icon={<TrendingUp className="w-5 h-5" />}
          color="warning"
        />
        <SummaryCard
          label="Top Category"
          value={stats.topCategory ? stats.topCategory.name : "N/A"}
          sub={stats.topCategory ? formatCurrency(stats.topCategory.amount) : "No data"}
          icon={
            stats.topCategory ? (
              <span className="text-lg">{getCategoryEmoji(stats.topCategory.name)}</span>
            ) : (
              <Trophy className="w-5 h-5" />
            )
          }
          color="accent"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Spending Bar Chart */}
        <div className="bg-surface-secondary rounded-2xl shadow-soft border border-border p-6">
          <h3 className="text-sm font-semibold text-content-primary mb-4">Monthly Spending</h3>
          <div className="flex items-end gap-2 h-40">
            {stats.monthlyBreakdown.map((month) => (
              <div key={month.month} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs text-content-secondary font-medium">
                  {month.amount > 0 ? formatCurrency(month.amount) : ""}
                </span>
                <div
                  className="w-full rounded-t-lg transition-all duration-500 min-h-[4px] gradient-primary"
                  style={{
                    height: `${Math.max((month.amount / maxMonthlyAmount) * 120, 4)}px`,
                    opacity: month.amount > 0 ? 1 : 0.2,
                  }}
                />
                <span className="text-xs text-content-tertiary">{month.month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-surface-secondary rounded-2xl shadow-soft border border-border p-6">
          <h3 className="text-sm font-semibold text-content-primary mb-4">
            This Month by Category
          </h3>
          {categoryData.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-content-tertiary text-sm">
              No expenses this month
            </div>
          ) : (
            <div className="space-y-3">
              {categoryData.map((cat) => {
                const pct = (cat.amount / totalMonthly) * 100;
                return (
                  <div key={cat.name}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="flex items-center gap-2 text-content-secondary font-medium">
                        <span>{getCategoryEmoji(cat.name)}</span>
                        {cat.name}
                      </span>
                      <span className="text-content-primary font-semibold">
                        {formatCurrency(cat.amount)}
                        <span className="text-content-tertiary font-normal ml-1">
                          ({pct.toFixed(0)}%)
                        </span>
                      </span>
                    </div>
                    <div className="w-full bg-surface-tertiary rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all duration-500"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: getCategoryColor(cat.name),
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Daily Spending Sparkline */}
      <div className="bg-surface-secondary rounded-2xl shadow-soft border border-border p-6">
        <h3 className="text-sm font-semibold text-content-primary mb-4">Last 30 Days</h3>
        <div className="flex items-end gap-[3px] h-24">
          {stats.dailySpending.map((day) => (
            <div
              key={day.date}
              className="flex-1 bg-primary/70 rounded-t-sm transition-all duration-300 hover:bg-primary cursor-default group relative"
              style={{
                height: `${Math.max((day.amount / maxDailyAmount) * 100, 2)}%`,
                opacity: day.amount > 0 ? 1 : 0.15,
              }}
              title={`${day.date}: ${formatCurrency(day.amount)}`}
            />
          ))}
        </div>
        <div className="flex justify-between mt-2 text-xs text-content-tertiary">
          <span>30 days ago</span>
          <span>Today</span>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  sub,
  icon,
  color,
}: {
  label: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
  color: "primary" | "success" | "warning" | "accent";
}) {
  const colorClasses = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
    accent: "bg-accent/10 text-accent",
  };

  return (
    <div className="bg-surface-secondary rounded-2xl shadow-soft border border-border p-4 sm:p-5 hover:shadow-medium transition-shadow">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${colorClasses[color]}`}>
          {icon}
        </div>
        <span className="text-xs font-medium text-content-tertiary uppercase tracking-wider">
          {label}
        </span>
      </div>
      <p className="text-xl sm:text-2xl font-bold text-content-primary">{value}</p>
      <p className="text-xs text-content-tertiary mt-1">{sub}</p>
    </div>
  );
}
