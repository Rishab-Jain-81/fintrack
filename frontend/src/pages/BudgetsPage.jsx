import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus, ReceiptText } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { listBudgets } from "../api/budgets";
import { CategoryIcon } from "../components/category/CategoryIcon";
import { Card } from "../components/budgets/Card";
import { BudgetModal } from "../components/budgets/BudgetModal";

export default function BudgetsPage() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);

  const handleChange = (key) => {
    let month, year;
    if (key == "next") {
      if (selectedMonth == 11) {
        year = new Date(selectedYear, selectedMonth, 15).getFullYear() + 1;
        month = new Date(selectedYear, 0, 15).getMonth();
      } else {
        year = selectedYear;
        month = new Date(selectedYear, selectedMonth, 15).getMonth() + 1;
      }
    } else if (key == "prev") {
      if (selectedMonth == 0) {
        year = new Date(selectedYear, selectedMonth, 15).getFullYear() - 1;
        month = new Date(selectedYear, 11, 15).getMonth();
      } else {
        year = selectedYear;
        month = new Date(selectedYear, selectedMonth, 15).getMonth() - 1;
      }
    } else {
      return;
    }
    setSelectedMonth(month);
    setSelectedYear(year);
  };

  const inputMonthYear = `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}`;

  const handleInputChange = (e) => {
    const val = e.target.value;
    if (!val) return;
    const [year, month] = val.split("-").map(Number);
    setSelectedYear(year);
    setSelectedMonth(month - 1);
  };

  const { data: budgets = [], isLoading } = useQuery({
    queryKey: ["budgets", selectedMonth, { selectedYear, inputMonthYear }],
    queryFn: () =>
      listBudgets({ month: selectedMonth + 1, year: selectedYear }),
  });

  return (
    <div className="min-h-screen bg-slate-950 p-4 sm:p-6 lg:p-8 space-y-8 text-slate-100">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-emerald-400">
          Budgets
        </h1>
        <p className="mt-1 text-slate-400">
          set a budget on a category to limit spendings
        </p>
      </header>
      <div className="flex justify-center  w-full sm:max-w-[80%] lg:max-w-[70%] mx-auto ">
        <div className="flex flex-wrap gap-2.5 bg-slate-600/50 sm:w-[58%] justify-between px-3 py-1 sm:px-5 sm:py-1.5 rounded-full hover:border-slate-700 hover:bg-slate-600/60">
          <button type="button" onClick={() => handleChange("prev")}>
            <ChevronLeft size={22} />
          </button>
          <div>
            <input
              type="month"
              style={{ colorScheme: "dark" }}
              value={inputMonthYear}
              onChange={(e) => handleInputChange(e)}
              className="px-2.5 py-1.5 text-sm md:text-base text-slate-200 focus:border-emerald-500/70 focus:outline-none"
            />
          </div>
          <button type="button" onClick={() => handleChange("next")}>
            <ChevronRight size={22} />
          </button>
        </div>
      </div>
      {isLoading ? (
        <div className="relative overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60 p-6 shadow-sm backdrop-blur-sm transition-all duration-200  hover:bg-slate-900/80 w-full sm:max-w-[80%] lg:max-w-[70%] mx-auto">
          <div className="grid grid-cols-1 gap-4 mb-4">
            {Array.from({ length: 2 }).map((_, index) => (
              <div
                key={index}
                className="h-60 animate-pulse rounded-xl border border-slate-800/60 bg-slate-800/50"
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="relative overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60 p-6 shadow-sm backdrop-blur-sm transition-all duration-200  hover:bg-slate-900/80 w-full sm:max-w-[80%] lg:max-w-[70%] mx-auto">
          <button
            onClick={() => {
              (setIsModalOpen(true), setEditingBudget(null));
            }}
            className="group absolute top-5 right-6 inline-flex items-center justify-center gap-2 rounded-3xl sm:rounded-xl bg-slate-400/50 p-1 sm:px-2 sm:py-1.5 text-xs text-slate-950 transition-colors hover:bg-slate-400 hover:text-black font-bold"
            title="Add Transaction"
          >
            <span className="hidden group-hover:inline group-hover:pl-1 sm:inline">
              Create Budget
            </span>
            <Plus size={28} />
          </button>
          {budgets.length === 0 ? (
            <div>
              <h2 className="text-2xl text-slate-400 font-semibold pb-3">
                Existing Budgets
              </h2>
              <div className="flex min-h-70 w-full flex-col items-center justify-center rounded-lg border border-dashed border-slate-800/80 bg-slate-950/30 p-6 text-center">
                <div className="rounded-full bg-slate-800/60 p-3 text-slate-500">
                  <ReceiptText size={28} />
                </div>
                <h3 className="mt-3 text-sm font-medium text-slate-300">
                  No Budgets are set for this month.
                </h3>
              </div>
            </div>
          ) : (
            <div>
              <h2 className="text-2xl text-slate-400 font-semibold pb-3">
                Existing Budgets
              </h2>
              <div className="grid grid-cols-1 gap-4 mb-4">
                {budgets.map((budget) => {
                  const percentage_left =
                    (budget.remaining_amount / budget.amount) * 100;
                  return (
                    <button
                      key={budget.id}
                      onClick={() => {
                        (setIsModalOpen(true), setEditingBudget(budget));
                      }}
                      className="w-full text-left"
                    >
                      <div className="group relative flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-900/60 p-4 shadow-sm backdrop-blur-sm transition-all duration-200 hover:border-slate-700 hover:bg-slate-900/80">
                        <div className="flex items-start align-middle justify-between gap-3">
                          <div className="flex flex-row items-center gap-2 sm:gap-3 min-w-0">
                            <div
                              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105"
                              style={{
                                backgroundColor: `${budget.category_color || "#10B981"}20`,
                                color: budget.category_color || "#10B981",
                              }}
                            >
                              <CategoryIcon
                                name={budget.category_icon}
                                size={20}
                              />
                            </div>
                            <span className=" font-medium text-slate-200">
                              {budget.category_name}
                            </span>
                          </div>
                        </div>
                        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mt-3">
                          <Card
                            title="Total Budget"
                            amount={budget.amount}
                            colorClass={"text-emerald-400"}
                          ></Card>
                          <Card
                            title="Spent Amount"
                            amount={budget.spent_amount}
                            colorClass={
                              budget.percentage_used < 75
                                ? "text-emerald-400"
                                : budget.percentage_used >= 75 &&
                                    budget.percentage_used < 100
                                  ? "text-amber-200"
                                  : "text-rose-400"
                            }
                          ></Card>
                          <Card
                            title="Remaining Budget"
                            amount={budget.remaining_amount}
                            colorClass={
                              budget.is_over_budget || percentage_left <= 0
                                ? "text-rose-400"
                                : percentage_left <= 25
                                  ? "text-amber-200"
                                  : "text-emerald-400"
                            }
                          ></Card>
                        </div>
                        <div className=" mt-5 rounded-xl border border-slate-800 bg-slate-900/40 p-3 shadow-sm backdrop-blur-sm transition-all duration-200 hover:border-slate-700 hover:bg-slate-900/80">
                          <span className="text-lg font-medium truncate">
                            Budget Spent
                          </span>
                          <div className="flex items-center gap-4 ">
                            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-600/50 mt-5">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  budget.percentage_used < 75
                                    ? "bg-emerald-400"
                                    : budget.percentage_used >= 75 &&
                                        budget.percentage_used < 100
                                      ? "bg-amber-200"
                                      : "bg-rose-400"
                                }`}
                                style={{
                                  width: `${Math.min(Number(budget.percentage_used), 100)}%`,
                                }}
                              />
                            </div>
                            <div>
                              <span
                                className={`${
                                  budget.percentage_used < 25
                                    ? "text-emerald-400"
                                    : 25 < budget.percentage_used < 75
                                      ? "text-amber-200"
                                      : "text-rose-400"
                                }`}
                              >
                                {budget.percentage_used}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
      <BudgetModal
        isOpen={isModalOpen}
        onClose={() => {
          (setIsModalOpen(false), setEditingBudget(null));
        }}
        budgetToEdit={editingBudget}
      />
    </div>
  );
}
