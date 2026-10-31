import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listCategories } from "../../api/category";
import {
  X,
  AlertCircle,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  IndianRupeeIcon,
  Tag,
  FileText,
} from "lucide-react";
import { CategoryIcon } from "../category/CategoryIcon";
import {
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from "../../api/transactions";

export const TransactionModal = ({
  isOpen,
  onClose,
  transactiontoEdit = null,
}) => {
  const queryClient = useQueryClient();
  const isEditMode = Boolean(transactiontoEdit);

  const [amount, setAmount] = useState("");
  const [type, setType] = useState("expense");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [transactionDate, setTransactionDate] = useState(
    new Date().toISOString(),
  );

  const [error, setError] = useState("");

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: () => listCategories(),
    enabled: isOpen,
  });

  const availableCategories = useMemo(() => {
    return categories.filter((category) => category.type == type);
  }, [categories, type]);

  const selectedCategory = useMemo(() => {
    return categories.find((category) => category.id == categoryId || null);
  }, [categories, categoryId]);
  const resetForm = () => {
    setAmount("");
    setCategoryId("");
    setDescription("");
    setType("expense");
    setError("");

    const now = new Date().toISOString();
    const foemattedNow = now.slice(0, 10);
    setTransactionDate(foemattedNow);
  };

  useEffect(() => {
    if (!isOpen) return;

    if (transactiontoEdit) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setType(transactiontoEdit.type || "expense");
      setAmount(
        transactiontoEdit.amount ? String(transactiontoEdit.amount) : "",
      );
      setCategoryId(transactiontoEdit.category_id || "");
      setDescription(transactiontoEdit.description || "");

      if (transactiontoEdit.transaction_date) {
        const date = new Date(transactiontoEdit.transaction_date);
        const formattedDate = date.toISOString().slice(0, 10);
        setTransactionDate(formattedDate);
      }
    } else {
      resetForm();
    }
  }, [isOpen, transactiontoEdit]);

  const handleTypeChange = (newType) => {
    setType(newType);
    const matching = categories.filter((c) => c.type === newType);
    setCategoryId(matching.length > 0 ? matching[0].id : "");
  };

  const handleClose = () => {
    (resetForm(), onClose());
  };

  const extractErrorMessage = (err, fallback) => {
    const detail = err.response?.data?.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail) && detail.length > 0) {
      return detail[0].msg || fallback;
    }
    return fallback;
  };

  const createMutation = useMutation({
    mutationFn: (payload) => createTransaction(payload),
    onSuccess: async () => {
      (await queryClient.invalidateQueries({ queryKey: ["transactions"] }),
        await queryClient.invalidateQueries({
          queryKey: ["reports", "summary"],
        }),
        handleClose());
    },
    onError: (err) => {
      setError(extractErrorMessage(err, "Failed to record transactions"));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ transaction_id, payload }) =>
      updateTransaction({ transaction_id, payload }),
    onSuccess: async () => {
      (await queryClient.invalidateQueries({ queryKey: ["transactions"] }),
        await queryClient.invalidateQueries({
          queryKey: ["reports", "summary"],
        }),
        handleClose());
    },
    onError: (err) => {
      setError(extractErrorMessage(err, "Failed to update transactions"));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (transactionId) =>
      deleteTransaction({ transaction_id: transactionId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["reports", "summary"] });
      handleClose();
    },
    onError: (err) => {
      setError(err.response?.data?.detail || "Failed to delete transaction.");
    },
  });

  const handleDelete = () => {
    if (!transactiontoEdit) return;
    if (window.confirm("Are you sure you want to delete this transaction?")) {
      deleteMutation.mutate(transactiontoEdit.id);
    }
  };

  const isPending =
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setError("Please enter a valid amount greater than 0.");
      return;
    }

    if (!categoryId) {
      setError("Please select a category.");
      return;
    }

    if (!transactionDate) {
      setError("Please select a transaction date and time.");
      return;
    }

    const payload = {
      amount: numericAmount,
      type,
      category_id: categoryId,
      transaction_date: new Date(transactionDate).toISOString(),
      description: description.trim() || "",
    };

    if (isEditMode) {
      updateMutation.mutate({
        transaction_id: transactiontoEdit.id,
        payload,
      });
    } else {
      createMutation.mutate(payload);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/95 p-6 shadow-2xl backdrop-blur-md">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div className="flex flex-col gap-0.5">
            <span className="text-xl font-medium text-emerald-400">
              {isEditMode ? "Edit Transaction" : "Create Transaction"}
            </span>
            <p className="text-xs text-slate-500">
              {!isEditMode
                ? "Make a transaction entry"
                : "Update transaction detail."}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200"
          >
            <X size={20} />
          </button>
        </div>
        <div className="mt-4 rounded-xl border border-slate-800/80 bg-slate-950/40 p-3.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Live Preview
          </span>
          <div className="mt-2 flex items-center justify-between rounded-lg border border-slate-800/60 bg-slate-900/80 p-3">
            <div className="flex min-w-0 items-center gap-3">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all"
                style={{
                  backgroundColor: `${selectedCategory?.color || "#64748B"}20`,
                  color: selectedCategory?.color || "#64748B",
                }}
              >
                <CategoryIcon
                  name={selectedCategory?.icon || "Tag"}
                  size={20}
                />
              </div>
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-medium text-slate-200">
                  {selectedCategory?.name || "Select Category"}
                </span>
                <span className="truncate text-xs text-slate-500">
                  {description.trim() || "No description provided"}
                </span>
              </div>
            </div>

            <div className="ml-4 flex shrink-0 flex-col items-end">
              <span
                className={`text-base font-bold tracking-tight ${
                  type === "income" ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {type === "income" ? "+" : "-"}₹
                {amount ? parseFloat(amount).toFixed(2) : "0.00"}
              </span>
              <span className="text-[11px] text-slate-500">
                {transactionDate ? transactionDate : "Now"}
              </span>
            </div>
          </div>
        </div>
        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4 ">
          <div className="grid grid-cols-2 gap-2 rounded-xl border border-slate-800 bg-slate-950/60 p-1">
            <button
              type="button"
              onClick={() => handleTypeChange("expense")}
              className={`flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold capitalize transition-all ${
                type === "expense"
                  ? "border border-rose-500/30 bg-rose-500/20 text-rose-400 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <ArrowDownLeft size={16} />
              Expense
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange("income")}
              className={`flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold capitalize transition-all ${
                type === "income"
                  ? "border border-emerald-500/30 bg-emerald-500/20 text-emerald-400 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <ArrowUpRight size={16} />
              Income
            </button>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Amount (INR ₹)
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-sm font-semibold text-slate-400">
                <IndianRupeeIcon size={18}></IndianRupeeIcon>
              </span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                required
                maxLength={50}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 pl-9 pr-3 py-2.5 text-sm text-slate-100 placeholder-slate-600 transition-colors focus:border-emerald-500/70 focus:outline-none focus:ring-1 focus:ring-emerald-500/70"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Select Category
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-slate-500">
                <Tag size={18} />
              </span>

              <select
                required
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                name="category"
                className="w-full rounded-lg border border-slate-800 bg-slate-950 py-2.5 pl-9 pr-8 text-sm text-slate-100 focus:border-emerald-500/70 focus:outline-none focus:ring-1 focus:ring-emerald-500/70"
              >
                <option value="" disabled>
                  Select a category
                </option>
                {availableCategories.map((category) => (
                  <option
                    key={category.id}
                    value={category.id}
                    className="bg-slate-900 text-slate-100"
                  >
                    {category.name}{" "}
                  </option>
                ))}
              </select>
            </div>
            {availableCategories.length === 0 && (
              <span className="text-[11px] text-amber-500/80">
                No {type} categories found. Add one in the Categories tab first.
              </span>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Transaction Date
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-slate-500">
                <Calendar size={18} />
              </span>
              <input
                type="date"
                required
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
                style={{ colorScheme: "dark" }}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 py-2.5 pl-9 pr-3 text-sm text-slate-100 focus:border-emerald-500/70 focus:outline-none focus:ring-1 focus:ring-emerald-500/70"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Description (Optional)
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-slate-500">
                <FileText size={18} />
              </span>
              <input
                type="text"
                maxLength={255}
                placeholder="e.g. Grocery store run, Monthly payout"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 py-2.5 pl-9 pr-3 text-sm text-slate-100 placeholder-slate-600 focus:border-emerald-500/70 focus:outline-none focus:ring-1 focus:ring-emerald-500/70"
              />
            </div>
          </div>

          {/* Modal Actions */}
          <div className="mt-4 flex items-center justify-between border-t border-slate-800/80 pt-4">
            <div>
              {isEditMode && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isPending}
                  className="rounded-lg bg-rose-500/80 px-5 py-2 text-xs font-semibold text-slate-950 transition-colors hover:bg-rose-400/80 disabled:opacity-50"
                >
                  <span>{isPending ? "Deleting..." : "Delete"}</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleClose}
                disabled={isPending}
                className="rounded-lg px-4 py-2 text-xs font-medium text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending || availableCategories.length === 0}
                className="rounded-lg bg-emerald-500 px-5 py-2 text-xs font-semibold text-slate-950 transition-colors hover:bg-emerald-400 disabled:opacity-50"
              >
                {isPending
                  ? isEditMode
                    ? "Saving..."
                    : "Recording..."
                  : isEditMode
                    ? "Save Changes"
                    : "Record Transaction"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
