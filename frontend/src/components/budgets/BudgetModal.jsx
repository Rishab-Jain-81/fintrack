import { useEffect, useState } from "react";
import { listCategories } from "../../api/category";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createBudget, deleteBudget, updateBudget } from "../../api/budgets";
import { AlertCircle, Calendar, IndianRupeeIcon, Tag, X } from "lucide-react";

export const BudgetModal = ({ isOpen, onClose, budgetToEdit }) => {
  const isEditMode = Boolean(budgetToEdit);

  const [amount, setAmount] = useState("");
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [categoryId, setCategoryId] = useState("");

  const [error, setError] = useState("");

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: () => listCategories("expense"),
    enabled: isOpen,
  });

  const resetForm = () => {
    setAmount("");
    setCategoryId("");
    setMonth(new Date().getMonth() + 1);
    setYear(new Date().getFullYear());
    setError("");
  };

  const inputMonthYear = `${year}-${String(month).padStart(2, "0")}`;

  const handleInputChange = (e) => {
    const val = e.target.value;
    if (!val) return;
    const [year, month] = val.split("-").map(Number);
    setYear(year);
    setMonth(month);
  };

  useEffect(() => {
    if (!isOpen) return;
    if (budgetToEdit) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAmount(budgetToEdit.amount ? String(budgetToEdit.amount) : "");
      setMonth(budgetToEdit.month);
      setYear(budgetToEdit.year);
    } else {
      resetForm();
    }
  }, [isOpen, budgetToEdit]);

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

  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (payload) => createBudget(payload),
    onSuccess: async () => {
      (await queryClient.invalidateQueries({ queryKey: ["budgets"] }),
        handleClose());
    },
    onError: (err) => {
      setError(extractErrorMessage(err, "Failed to create Budget"));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ budget_id, payload }) =>
      updateBudget({ budget_id, payload }),
    onSuccess: async () => {
      (await queryClient.invalidateQueries({ queryKey: ["budgets"] }),
        handleClose());
    },
    onError: (err) => {
      setError(extractErrorMessage(err, "Failed to update budget"));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (budget_id) => deleteBudget(budget_id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      handleClose();
    },
    onError: (err) => {
      setError(err.response?.data?.detail || "Failed to delete budget.");
    },
  });

  const handleDelete = () => {
    if (!budgetToEdit) return;
    if (window.confirm("Are you sure you want to delete this budget?")) {
      deleteMutation.mutate(budgetToEdit.id);
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

    if (!isEditMode && !categoryId) {
      setError("Please select a category.");
      return;
    }

    if (!month || !year) {
      setError("Please select a month to set budget.");
      return;
    }
    const payload = {
      amount: numericAmount,
      month: month,
      year: year,
    };

    if (isEditMode) {
      updateMutation.mutate({
        budget_id: budgetToEdit.id,
        payload,
      });
    } else {
      createMutation.mutate({ ...payload, category_id: categoryId });
    }
  };
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/95 p-6 shadow-2xl backdrop-blur-md">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div className="flex flex-col gap-0.5">
            <span className="text-xl font-medium text-emerald-400">
              {isEditMode ? "Edit Budget" : "Create Budget"}
            </span>
            <p className="text-xs text-slate-500">
              {!isEditMode
                ? "Set a Budget to limit expenses"
                : "Update Budget details."}
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
        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}
        <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4 ">
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
            <div className="flex flex-col gap-1.5" hidden={isEditMode}>
              <label className="text-xs font-medium uppercase tracking-wider text-slate-400">
                Select Category
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-slate-500">
                  <Tag size={18} />
                </span>

                <select
                  required={!isEditMode}
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  name="category"
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 py-2.5 pl-9 pr-8 text-sm text-slate-100 focus:border-emerald-500/70 focus:outline-none focus:ring-1 focus:ring-emerald-500/70"
                >
                  <option value="" disabled>
                    Select a category
                  </option>
                  {categories.map((category) => (
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
              {categories.length === 0 && (
                <span className="text-[11px] text-amber-500/80">
                  No categories found. Add one in the Categories tab first.
                </span>
              )}
            </div>
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
                type="month"
                required
                value={inputMonthYear}
                onChange={(e) => handleInputChange(e)}
                style={{ colorScheme: "dark" }}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 py-2.5 pl-9 pr-3 text-sm text-slate-100 focus:border-emerald-500/70 focus:outline-none focus:ring-1 focus:ring-emerald-500/70"
              />
            </div>
          </div>
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
                disabled={isPending}
                className="rounded-lg bg-emerald-500 px-5 py-2 text-xs font-semibold text-slate-950 transition-colors hover:bg-emerald-400 disabled:opacity-50"
              >
                {isPending
                  ? isEditMode
                    ? "Saving..."
                    : "Creating..."
                  : isEditMode
                    ? "Save Changes"
                    : "Create Budget"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
