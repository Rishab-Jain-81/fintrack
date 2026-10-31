import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Plus,
  AlertCircle,
  ReceiptText,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { getTransactions } from "../api/transactions";
import { listCategories } from "../api/category";
import { CategoryIcon } from "../components/category/CategoryIcon";
import { TransactionModal } from "../components/transactions/TransactionModal";
import { formatCurrency, formatDate } from "../utility/formatFunctions";

const ITEMS_PER_PAGE = 20;

export default function TransactionsPage() {
  const [selectedType, setSelectedType] = useState("expense");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionError, setActionError] = useState("");
  const [editingTransaction, setEditingTransaction] = useState(null);

  const { data: categories = [] } = useQuery({
    queryKey: ["categories", selectedType],
    queryFn: () => listCategories(selectedType),
  });

  const offset = (page - 1) * ITEMS_PER_PAGE;

  const { data: rawTransactions = [], isLoading } = useQuery({
    queryKey: [
      "transactions",
      {
        type: selectedType || null,
        category_id: selectedCategoryId || null,
        start_date: startDate ? new Date(startDate).toISOString() : null,
        end_date: endDate ? new Date(endDate).toISOString() : null,
        limit: ITEMS_PER_PAGE + 1,
        offset,
      },
    ],
    queryFn: () =>
      getTransactions({
        type: selectedType,
        category_id: selectedCategoryId || null,
        start_date: startDate ? new Date(startDate).toISOString() : null,
        end_date: endDate ? new Date(endDate).toISOString() : null,
        limit: ITEMS_PER_PAGE + 1,
        offset: offset,
      }),
  });

  // Check if a 21st item came back
  const hasNextPage = rawTransactions.length > ITEMS_PER_PAGE;

  // Only display up to the actual page size (20 items)
  const transactions = hasNextPage
    ? rawTransactions.slice(0, ITEMS_PER_PAGE)
    : rawTransactions;

  const handleResetFilters = () => {
    setSelectedCategoryId("");
    setStartDate("");
    setEndDate("");
    setPage(1);
  };

  const hasActiveFilters =
    Boolean(selectedCategoryId) || Boolean(startDate) || Boolean(endDate);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 md:p-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex flex-col gap-0.5">
          <h1 className="text-3xl font-bold tracking-tight text-slate-100">
            Transactions
          </h1>
          <p className=" text-slate-500">
            Create, filter, and track all your transactions.
          </p>
        </div>
      </div>

      {actionError && (
        <div className="flex items-center justify-between rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400 sm:max-w-[80%] lg:max-w-[70%] mx-auto">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{actionError}</span>
          </div>
          <button
            onClick={() => setActionError("")}
            className="text-xs font-semibold hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}
      <div className="relative grid grid-cols-2 w-full items-center gap-1.5 rounded-3xl border border-slate-800 bg-slate-900/60 p-1 sm:max-w-[80%] lg:max-w-[70%] mx-auto">
        <div className="absolute left-1/2 top-1/2  -translate-x-1/2 -translate-y-1/2 h-8 w-px bg-slate-600" />
        {["expense", "income"].map((type) => {
          const isActive = selectedType === type;
          return (
            <button
              key={type}
              onClick={() => {
                setSelectedType(type);
              }}
              className={`rounded-lg w-full mx-auto col-span-1 px-5 py-2 text-sm font-medium capitalize transition-all  ${type == "expense" ? "rounded-l-3xl" : "rounded-r-3xl"} ${
                isActive
                  ? selectedType == "expense"
                    ? "border border-rose-500/30 bg-rose-500/20 text-rose-400 shadow-sm"
                    : "border border-emerald-500/30 bg-emerald-500/20 text-emerald-400 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              } `}
            >
              {type}
            </button>
          );
        })}
      </div>
      <div className="rounded-xl w-full border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-sm sm:max-w-[80%] lg:max-w-[70%] mx-auto">
        <h3 className="text-lg text-slate-400 font-semibold">
          Filter Transactions
        </h3>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex flex-row gap-1.5 items-center">
              <label className="text-xs font-medium  tracking-wider text-slate-400">
                By Category
              </label>
              <select
                value={selectedCategoryId}
                onChange={(e) => {
                  setSelectedCategoryId(e.target.value);
                  setPage(1);
                }}
                className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-emerald-500/70 focus:outline-none"
              >
                <option value="">Select Category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id} className="bg-slate-900">
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex flex-row gap-1.5 items-center">
                <label className="text-xs font-medium  tracking-wider text-slate-400">
                  Date Range
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setPage(1);
                  }}
                  style={{ colorScheme: "dark" }}
                  className="rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs text-slate-200 focus:border-emerald-500/70 focus:outline-none"
                  title="Start Date"
                />
                <span className="text-xs text-slate-500">to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setPage(1);
                  }}
                  style={{ colorScheme: "dark" }}
                  className="rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs text-slate-200 focus:border-emerald-500/70 focus:outline-none"
                  title="End Date"
                />
              </div>
            </div>
            <div>
              {hasActiveFilters && (
                <button
                  onClick={handleResetFilters}
                  className="inline-flex items-center gap-1.5 self-start lg:self-center text-xs font-medium text-slate-400 transition-colors hover:text-rose-400"
                >
                  <RotateCcw size={14} />
                  <span>Reset Filters</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      {isLoading ? (
        <div className="relative overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60 p-6 shadow-sm backdrop-blur-sm transition-all duration-200  hover:bg-slate-900/80 w-full sm:max-w-[80%] lg:max-w-[70%] mx-auto">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-20 animate-pulse rounded-xl border border-slate-800/60 bg-slate-800/50"
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="relative overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60 p-6 shadow-sm backdrop-blur-sm transition-all duration-200  hover:bg-slate-900/80 w-full sm:max-w-[80%] lg:max-w-[70%] mx-auto">
          <button
            onClick={() => {
              (setIsModalOpen(true), setEditingTransaction(null));
            }}
            className="group absolute top-5 right-6 inline-flex items-center justify-center gap-2 rounded-3xl sm:rounded-xl bg-slate-400/50 p-1 sm:px-2 sm:py-1.5 text-xs text-slate-950 transition-colors hover:bg-slate-400 hover:text-black font-bold"
            title="Add Transaction"
          >
            <span className="hidden group-hover:inline group-hover:pl-1 sm:inline">
              Record a Transaction
            </span>
            <Plus size={28} />
          </button>
          {transactions.length === 0 && page === 1 ? (
            <div>
              <h2 className="text-2xl text-slate-400 font-semibold pb-3">
                Existing Records
              </h2>
              <div className="flex min-h-70 w-full flex-col items-center justify-center rounded-lg border border-dashed border-slate-800/80 bg-slate-950/30 p-6 text-center">
                <div className="rounded-full bg-slate-800/60 p-3 text-slate-500">
                  <ReceiptText size={28} />
                </div>
                <h3 className="mt-3 text-sm font-medium text-slate-300">
                  No Transactions Yet
                </h3>
                <p className="mt-1 max-w-xs text-xs text-slate-500">
                  Transactions you add will appear chronologically here.
                </p>
              </div>
            </div>
          ) : (
            <div>
              <h2 className="text-2xl text-slate-400 font-semibold pb-3">
                Existing Records
              </h2>
              {transactions.length === 0 ? (
                <div className="py-12 text-center text-sm text-slate-400">
                  No more records on this page.
                </div>
              ) : (
                <div>
                  <div className="grid grid-cols-1 gap-4 mb-4">
                    {transactions.map((transaction) => {
                      return (
                        <button
                          key={transaction.id}
                          onClick={() => {
                            (setIsModalOpen(true),
                              setEditingTransaction(transaction));
                          }}
                          className="w-full text-left"
                        >
                          <div className="group relative flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-900/60 p-4 shadow-sm backdrop-blur-sm transition-all duration-200 hover:border-slate-700 hover:bg-slate-900/80">
                            <div className="flex items-start align-middle justify-between gap-3">
                              <div className="flex items-center gap-3 min-w-0">
                                <div
                                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105"
                                  style={{
                                    backgroundColor: `${transaction.category.color || "#10B981"}20`,
                                    color:
                                      transaction.category.color || "#10B981",
                                  }}
                                >
                                  <CategoryIcon
                                    name={transaction.category.icon}
                                    size={20}
                                  />
                                </div>
                                <div className="flex flex-col min-w-0">
                                  <span className="truncate font-medium text-slate-200">
                                    {transaction.category.name}
                                  </span>
                                  <span className="text-sm text-slate-500">
                                    {transaction.description || ""}
                                  </span>
                                </div>
                              </div>
                              <div className="ml-4 shrink-0 text-right flex flex-col">
                                <span
                                  className={`text-lg font-semibold tracking-tight ${
                                    transaction.type == "income"
                                      ? "text-emerald-400"
                                      : "text-rose-400"
                                  }`}
                                >
                                  {transaction.type == "income" ? "+" : "-"}
                                  {formatCurrency(transaction.amount)}
                                </span>
                                <span className="text-xs text-slate-500">
                                  {formatDate(transaction.transaction_date)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between border-t border-slate-800 px-6 py-3.5 bg-slate-950/20">
                <span className="text-xs text-slate-400">
                  Page{" "}
                  <span className="font-semibold text-slate-200">{page}</span>
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                    disabled={page === 1}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-slate-900"
                  >
                    <ChevronLeft size={14} />
                    <span>Previous</span>
                  </button>
                  <button
                    onClick={() => setPage((prev) => prev + 1)}
                    disabled={!hasNextPage}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-slate-900"
                  >
                    <span>Next</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => {
          (setIsModalOpen(false), setEditingTransaction(null));
        }}
        transactiontoEdit={editingTransaction}
      ></TransactionModal>
    </div>
  );
}
