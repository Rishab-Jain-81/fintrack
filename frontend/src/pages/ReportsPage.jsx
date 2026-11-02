import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  getSummary,
  triggerExportCsv,
  checkExportStatus,
} from "../api/reports";
import { Card as MetricCard } from "../components/dashboard/MetricCard";
import { Card } from "../components/report/ReportCard";
import { formatPercent, formatCurrency } from "../utility/formatFunctions";
import {
  PiggyBank,
  TrendingDown,
  TrendingUp,
  Wallet,
  AlertCircle,
} from "lucide-react";
import { CategoryIcon } from "../components/category/CategoryIcon";

export default function ReportsPage() {
  const pad = (n) => String(n).padStart(2, "0");
  const formatDateOnly = (d) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  const today = new Date();
  const defaultStart = formatDateOnly(
    new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const defaultEnd = formatDateOnly(
    new Date(today.getFullYear(), today.getMonth() + 1, 0),
  );

  const [activePreset, setActivePreset] = useState("thisMonth");
  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);

  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState("Export Statement (.CSV)");
  const [exportError, setExportError] = useState("");

  const handleSelectPreset = (presetKey) => {
    setActivePreset(presetKey);
    const now = new Date();

    if (presetKey === "thisMonth") {
      setStartDate(
        formatDateOnly(new Date(now.getFullYear(), now.getMonth(), 1)),
      );
      setEndDate(
        formatDateOnly(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
      );
    } else if (presetKey === "lastMonth") {
      setStartDate(
        formatDateOnly(new Date(now.getFullYear(), now.getMonth() - 1, 1)),
      );
      setEndDate(
        formatDateOnly(new Date(now.getFullYear(), now.getMonth(), 0)),
      );
    } else if (presetKey === "thisYear") {
      setStartDate(formatDateOnly(new Date(now.getFullYear(), 0, 1)));
      setEndDate(formatDateOnly(new Date(now.getFullYear(), 11, 31)));
    } else if (presetKey === "allTime") {
      setStartDate("2020-01-01");
      setEndDate(formatDateOnly(now));
    }
  };

  const isoStart = startDate
    ? new Date(`${startDate}T00:00:00.000Z`).toISOString()
    : "";
  const isoEnd = endDate
    ? new Date(`${endDate}T23:59:59.999Z`).toISOString()
    : "";

  const { data } = useQuery({
    queryKey: ["reports", "summary", isoStart, isoEnd],
    queryFn: () => getSummary(isoStart, isoEnd),
    enabled: Boolean(isoStart && isoEnd),
  });

  const exportMutation = useMutation({
    mutationFn: ({ start_date, end_date }) =>
      triggerExportCsv({ start_date, end_date }),
  });

  const income = Number(data?.total_income || 0);
  const expense = Number(data?.total_expense || 0);
  const savings = Number(data?.net_savings || 0);

  const savings_rate = useMemo(
    () => (income > 0 ? savings / income : 0),
    [income, savings],
  );

  const burn_rate = useMemo(
    () => (income > 0 ? expense / income : 0),
    [income, expense],
  );

  const days = useMemo(() => {
    if (!startDate || !endDate) return 1;
    const diffTime = Math.abs(new Date(endDate) - new Date(startDate));
    return Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);
  }, [startDate, endDate]);

  const daily_average_burn = useMemo(
    () => (days > 0 ? expense / days : 0),
    [expense, days],
  );

  const handleExportCsv = async () => {
    if (!startDate || !endDate) {
      setExportError("Please select both a start date and an end date.");
      return;
    }

    setIsExporting(true);
    setExportError("");
    setExportStatus("Initiating...");

    let intervalId = null;

    try {
      const { task_id } = await exportMutation.mutateAsync({
        start_date: isoStart,
        end_date: isoEnd,
      });

      setExportStatus("Processing...");
      let attempts = 0;
      const maxAttempts = 20;

      intervalId = setInterval(async () => {
        attempts += 1;
        try {
          const result = await checkExportStatus(task_id);

          if (result.isReady) {
            clearInterval(intervalId);
            setExportStatus("Completed");

            const blobUrl = window.URL.createObjectURL(result.blob);
            const link = document.createElement("a");
            link.href = blobUrl;
            link.setAttribute(
              "download",
              result.filename || `statement_${startDate}_to_${endDate}.csv`,
            );
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(blobUrl);

            setTimeout(() => {
              setExportStatus("Export Statement (.CSV)");
              setIsExporting(false);
            }, 1500);
          } else if (attempts >= maxAttempts) {
            clearInterval(intervalId);
            setExportError("Export timed out. Please try again.");
            setExportStatus("Export Statement (.CSV)");
            setIsExporting(false);
          } else {
            setExportStatus(`Processing (${result.status || "PENDING"})...`);
          }
        } catch (pollErr) {
          clearInterval(intervalId);
          setExportError(
            pollErr.response?.data?.detail || "Export check failed",
          );
          setExportStatus("Export Statement (.CSV)");
          setIsExporting(false);
        }
      }, 1500);
    } catch (err) {
      if (intervalId) clearInterval(intervalId);
      setExportError(
        err.response?.data?.detail || "Failed to start export task",
      );
      setExportStatus("Export Statement (.CSV)");
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 p-4 sm:p-6 lg:p-8 space-y-8 text-slate-100">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-emerald-400">
            Financial Reports
          </h1>
          <p className="mt-1 text-slate-400">
            Deep dive into spending distributions & statement history
          </p>
        </div>
        <div>
          <button
            type="button"
            disabled={isExporting}
            onClick={handleExportCsv}
            className="rounded-lg bg-emerald-500 px-5 py-2.5 text-xs font-semibold text-slate-950 transition-colors hover:bg-emerald-400 disabled:opacity-50"
          >
            {exportStatus}
          </button>
        </div>
      </header>

      {exportError && (
        <div className="flex items-center justify-between rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400 w-full sm:max-w-[80%] lg:max-w-[70%] mx-auto">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{exportError}</span>
          </div>
          <button
            onClick={() => setExportError("")}
            className="font-semibold hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="flex flex-wrap gap-2.5 w-full sm:max-w-[80%] lg:max-w-[70%] mx-auto">
        {[
          { label: "This Month", key: "thisMonth" },
          { label: "Last Month", key: "lastMonth" },
          { label: "This Year", key: "thisYear" },
          { label: "All Time", key: "allTime" },
        ].map((preset) => {
          const isActive = activePreset === preset.key;
          return (
            <button
              key={preset.key}
              type="button"
              onClick={() => handleSelectPreset(preset.key)}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
                isActive
                  ? "bg-slate-200 text-slate-900 shadow-sm"
                  : "border border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700 hover:text-slate-200"
              }`}
            >
              {preset.label}
            </button>
          );
        })}
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 sm:p-5 backdrop-blur-sm shadow-sm w-full sm:max-w-[80%] lg:max-w-[70%] mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
          <div className="flex flex-wrap gap-3 items-center">
            <label className="text-xs font-medium tracking-wider text-slate-400 uppercase">
              Date Range
            </label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setActivePreset("custom");
                }}
                style={{ colorScheme: "dark" }}
                className="rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs text-slate-200 focus:border-emerald-500/70 focus:outline-none"
              />
              <span className="text-xs text-slate-500">to</span>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setActivePreset("custom");
                }}
                style={{ colorScheme: "dark" }}
                className="rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs text-slate-200 focus:border-emerald-500/70 focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 sm:gap-6 w-full sm:max-w-[80%] lg:max-w-[70%] mx-auto">
        <MetricCard
          title="Total Income"
          amount={data?.total_income}
          subtitle="Window Earnings"
          icon={TrendingUp}
          colorClass="text-emerald-400"
        />
        <MetricCard
          title="Total Expense"
          amount={data?.total_expense}
          subtitle="Window Spendings"
          icon={TrendingDown}
          colorClass="text-rose-500"
        />
        <MetricCard
          title="Current Balance"
          amount={data?.net_savings}
          subtitle="Net Savings"
          icon={Wallet}
          colorClass={
            data?.net_savings >= 0 ? "text-emerald-400" : "text-rose-500"
          }
        />
        <Card
          title="Savings Rate"
          value={formatPercent(savings_rate)}
          icon={PiggyBank}
          colorClass={
            savings_rate > 0.2
              ? "text-emerald-400"
              : savings_rate > 0 && savings_rate <= 0.2
                ? "text-amber-300"
                : "text-rose-400"
          }
        />
        <Card
          title="Burn Rate"
          value={formatPercent(burn_rate)}
          icon={burn_rate > 0.8 ? TrendingUp : TrendingDown}
          colorClass={
            burn_rate > 0.8
              ? "text-rose-400"
              : burn_rate >= 0.5 && burn_rate <= 0.8
                ? "text-amber-300"
                : "text-emerald-400"
          }
        />
        <Card
          title="Daily Avg. Burn"
          value={`${formatCurrency(daily_average_burn)} / day`}
          colorClass="text-slate-200"
        />
      </div>
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 shadow-sm backdrop-blur-sm">
        <div className="mb-6 flex flex-col gap-1">
          <h2 className="text-xl font-bold tracking-tight text-slate-100">
            Expense Distribution Ledger
          </h2>
          <p className="text-xs text-slate-400">
            Ranked category breakdown and proportion of total expenditures for
            the selected window.
          </p>
        </div>

        {!data?.breakdown_by_category ||
        data.breakdown_by_category.length === 0 ? (
          <div className="flex min-h-45 flex-col items-center justify-center rounded-lg border border-dashed border-slate-800/80 bg-slate-950/30 p-6 text-center">
            <p className="text-sm font-medium text-slate-300">
              No Expense Records
            </p>
            <p className="mt-1 text-xs text-slate-500">
              No categorized expenses found in this date window.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-800 bg-slate-950/40 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-4 py-3 text-center">Rank</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Allocation Share</th>
                  <th className="px-4 py-3 text-right">Proportion</th>
                  <th className="px-4 py-3 text-right">Total Spent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {data.breakdown_by_category.map((item, index) => {
                  const pct = Number(item.percentage || 0);
                  return (
                    <tr
                      key={item.category_id}
                      className="transition-colors hover:bg-slate-800/30"
                    >
                      <td className="px-4 py-4 text-center font-mono text-xs font-semibold text-slate-500">
                        #{index + 1}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                            style={{
                              backgroundColor: `${item.category_color || "#64748B"}20`,
                              color: item.category_color || "#64748B",
                            }}
                          >
                            <CategoryIcon
                              name={item.category_icon || "Tag"}
                              size={18}
                            />
                          </div>
                          <span className="font-medium text-slate-200">
                            {item.category_name}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-4 min-w-35 max-w-xs">
                        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-950">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${Math.min(pct, 100)}%`,
                              backgroundColor: item.category_color || "#10B981",
                            }}
                          />
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right font-mono text-xs text-slate-300">
                        {pct.toFixed(1)}%
                      </td>
                      <td className="px-4 py-4 text-right font-semibold text-rose-400">
                        {formatCurrency(item.amount)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
