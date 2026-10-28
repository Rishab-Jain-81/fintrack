import { useAuth } from "../hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Card } from "../components/dashboard/MetricCard";
import { CategoryChartCard } from "../components/dashboard/CategoryChartCard";
import { RecentTransactionsCard } from "../components/dashboard/RecentTransactionsCard";
import { getSummary } from "../api/reports";
import { getTransactions } from "../api/transactions";
import { TrendingUp, TrendingDown, Wallet } from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();

  const summary = useQuery({
    queryKey: ["reports", "summary"],
    queryFn: () => getSummary(),
  });

  const recentTransactions = useQuery({
    queryKey: ["transactions", "recent"],
    queryFn: () => getTransactions(),
  });

  return (
    <div className="min-h-screen bg-slate-950 p-4 sm:p-6 lg:p-8 space-y-8 text-slate-100">
      <header className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-emerald-400">
            Dashboard
          </h1>
          <p className="mt-4 text-slate-400">
            Welcome back,{" "}
            <span className="font-semibold text-slate-100">
              {user?.full_name || "user"}
            </span>
          </p>
        </div>
      </header>

      <section>
        {summary?.isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 sm:gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-32 animate-pulse rounded-xl border border-slate-800/60 bg-slate-900/50"
              />
            ))}
          </div>
        ) : summary?.isError ? (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-400">
            Failed to load dashboard metrics.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 sm:gap-6">
            <Card
              title={"Total Income"}
              amount={summary?.data?.total_income}
              subtitle={"Lifetime Earnings"}
              icon={TrendingUp}
              colorClass={"text-emerald-400"}
            ></Card>
            <Card
              title={"Total Expense"}
              amount={summary?.data?.total_expense}
              subtitle={"Lifetime Spendings"}
              icon={TrendingDown}
              colorClass={"text-rose-500"}
            ></Card>
            <Card
              title={"Current Balance"}
              amount={summary?.data?.net_savings}
              subtitle={"Net Savings"}
              icon={Wallet}
              colorClass={
                summary?.data?.net_savings >= 0
                  ? "text-emerald-400"
                  : "text-rose-500"
              }
            ></Card>
          </div>
        )}
      </section>
      <section>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 xl:col-span-8">
            {summary?.isLoading ? (
              <div className="h-95 animate-pulse rounded-xl border border-slate-800/60 bg-slate-900/50" />
            ) : (
              <CategoryChartCard data={summary?.data?.breakdown_by_category} />
            )}
          </div>
          <div className="lg:col-span-5 xl:col-span-4">
            {recentTransactions?.isLoading ? (
              <div className="h-95 animate-pulse rounded-xl border border-slate-800/60 bg-slate-800/50" />
            ) : (
              <RecentTransactionsCard data={recentTransactions?.data} />
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
