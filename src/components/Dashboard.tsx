"use client";

import { formatCurrency, getCategoryColor, getCategoryEmoji } from "@/lib/utils";
import { Category, CATEGORIES } from "@/types/expense";

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
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
          color="indigo"
        />
        <SummaryCard
          label="All Time"
          value={formatCurrency(stats.totalSpending)}
          sub={`${stats.totalCount} expenses`}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          color="emerald"
        />
        <SummaryCard
          label="Daily Avg"
          value={formatCurrency(stats.avgDaily)}
          sub="this month"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          }
          color="amber"
        />
        <SummaryCard
          label="Top Category"
          value={stats.topCategory ? stats.topCategory.name : "N/A"}
          sub={stats.topCategory ? formatCurrency(stats.topCategory.amount) : "No data"}
          icon={
            stats.topCategory ? (
              <span className="text-lg">{getCategoryEmoji(stats.topCategory.name)}</span>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            )
          }
          color="rose"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Spending Bar Chart */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Monthly Spending</h3>
          <div className="flex items-end gap-2 h-40">
            {stats.monthlyBreakdown.map((month) => (
              <div key={month.month} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs text-gray-500 font-medium">
                  {month.amount > 0 ? formatCurrency(month.amount) : ""}
                </span>
                <div
                  className="w-full bg-indigo-500 rounded-t-lg transition-all duration-500 min-h-[4px]"
                  style={{
                    height: `${Math.max((month.amount / maxMonthlyAmount) * 120, 4)}px`,
                    opacity: month.amount > 0 ? 1 : 0.2,
                  }}
                />
                <span className="text-xs text-gray-400">{month.month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">
            This Month by Category
          </h3>
          {categoryData.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-gray-400 text-sm">
              No expenses this month
            </div>
          ) : (
            <div className="space-y-3">
              {categoryData.map((cat) => {
                const pct = (cat.amount / totalMonthly) * 100;
                return (
                  <div key={cat.name}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="flex items-center gap-2 text-gray-700 font-medium">
                        <span>{getCategoryEmoji(cat.name)}</span>
                        {cat.name}
                      </span>
                      <span className="text-gray-900 font-semibold">
                        {formatCurrency(cat.amount)}
                        <span className="text-gray-400 font-normal ml-1">
                          ({pct.toFixed(0)}%)
                        </span>
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
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
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Last 30 Days</h3>
        <div className="flex items-end gap-[3px] h-24">
          {stats.dailySpending.map((day) => (
            <div
              key={day.date}
              className="flex-1 bg-indigo-400 rounded-t-sm transition-all duration-300 hover:bg-indigo-600 cursor-default group relative"
              style={{
                height: `${Math.max((day.amount / maxDailyAmount) * 100, 2)}%`,
                opacity: day.amount > 0 ? 1 : 0.15,
              }}
              title={`${day.date}: ${formatCurrency(day.amount)}`}
            />
          ))}
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-400">
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
  color: "indigo" | "emerald" | "amber" | "rose";
}) {
  const colorClasses = {
    indigo: "bg-indigo-50 text-indigo-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    rose: "bg-rose-50 text-rose-600",
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${colorClasses[color]}`}>
          {icon}
        </div>
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
          {label}
        </span>
      </div>
      <p className="text-xl sm:text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-400 mt-1">{sub}</p>
    </div>
  );
}
