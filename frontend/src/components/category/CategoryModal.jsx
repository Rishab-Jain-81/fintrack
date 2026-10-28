import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X, AlertCircle } from "lucide-react";
import { createCategory, updateCategory } from "../../api/category";
import { categoryIconNames } from "../../utility/category/categoryIconCatalog";
import { CategoryIcon } from "./CategoryIcon";
import "lucide-react";

const colorPalette = [
  "#06B6D4",
  "#8338EC",
  "#3A86FF",
  "#FFBE0B",
  "#FB5607",
  "#00F5D4",
  "#e8ff2a",
  "#FF70A6",
];

export const CategoryModal = ({ isOpen, onClose, categoryToEdit }) => {
  const [name, setName] = useState("");
  const [type, setType] = useState("expense");
  const [color, setColor] = useState("#06B6D4");
  const [icon, setIcon] = useState("utensils");
  const [error, setError] = useState("");
  const isEditMode = Boolean(categoryToEdit);

  const resetForm = () => {
    setName("");
    setType("expense");
    setColor("#06B6D4");
    setIcon("other");
    setError("");
  };
  const handleClose = () => {
    resetForm();
    onClose();
  };

  useEffect(() => {
    if (categoryToEdit && isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setName(categoryToEdit.name || "");
      setIcon(categoryToEdit.icon || "other");
      setColor(categoryToEdit.color || "#06B6D4");
      setType(categoryToEdit.type || "expense");
    } else {
      resetForm();
    }
  }, [categoryToEdit, isOpen]);

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
    mutationFn: () => createCategory({ name: name.trim(), type, icon, color }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["categories"] });
      handleClose();
    },
    onError: (err) => {
      setError(extractErrorMessage(err, "Failed to create category"));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ categoryId, payload }) =>
      updateCategory({
        categoryId,
        payload,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["categories"] });
      handleClose();
    },
    onError: (err) => {
      setError(extractErrorMessage(err, "Failed to update category"));
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Category name is required.");
      return;
    }
    if (!isEditMode) {
      createMutation.mutate({
        name: name.trim(),
        type,
        color,
        icon,
      });
    }
    if (isEditMode) {
      updateMutation.mutate({
        categoryId: categoryToEdit.id,
        payload: { name: name.trim(), type, icon, color },
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/95 p-6 shadow-2xl backdrop-blur-md">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div className="flex flex-col gap-0.5">
            <span className="text-xl font-medium text-emerald-400">
              {isEditMode ? "Edit Category" : "Create Category"}
            </span>
            <p className="text-xs text-slate-500">
              {!isEditMode
                ? "Create a custom category to make transaction classification easier."
                : "Change your custom category."}
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
        <div className="mt-4 flex items-center justify-between rounded-xl border border-slate-800/80 bg-slate-950/40 p-3.5">
          <div className="flex items-center gap-3">
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors duration-200"
              style={{
                backgroundColor: `${color}20`,
                color: color,
              }}
            >
              <CategoryIcon name={icon} size={22} />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="truncate text-base font-medium text-slate-200">
                {name.trim() || "Category Name"}
              </span>
              <span className="text-xs text-slate-500">Live preview</span>
            </div>
          </div>
          <span
            className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide uppercase ${
              type === "income"
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
            }`}
          >
            {type}
          </span>
        </div>
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-2.5 text-xs text-rose-400">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Category Name
            </label>
            <input
              type="text"
              required
              maxLength={50}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Groceries, Freelancing"
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-600 transition-colors focus:border-emerald-500/70 focus:outline-none focus:ring-1 focus:ring-emerald-500/70"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Category Type
            </label>
            <div className="grid grid-cols-2 gap-2 rounded-lg border border-slate-800/80 bg-slate-950/60 p-1">
              <button
                type="button"
                onClick={() => setType("expense")}
                className={`rounded-md py-1.5 text-xs font-medium transition-all ${
                  type === "expense"
                    ? "bg-rose-500/20 text-rose-400 border border-rose-500/30 shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Expense
              </button>
              <button
                type="button"
                onClick={() => setType("income")}
                className={`rounded-md py-1.5 text-xs font-medium transition-all ${
                  type === "income"
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Income
              </button>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Accent Color
            </label>
            <div className="flex flex-wrap items-center gap-2.5 rounded-lg border border-slate-800/80 bg-slate-950/40 p-2.5">
              {colorPalette.map((swatchColor) => {
                const isSelected = color === swatchColor;
                return (
                  <button
                    key={swatchColor}
                    type="button"
                    onClick={() => setColor(swatchColor)}
                    className="relative flex h-7 w-7 items-center justify-center rounded-full transition-transform hover:scale-110"
                    style={{ backgroundColor: swatchColor }}
                  >
                    {isSelected && (
                      <span className="h-2 w-2 rounded-full bg-slate-950 shadow-sm" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Select Icon
            </label>
            <div className="grid max-h-36 grid-cols-6 gap-2 overflow-y-auto rounded-lg border border-slate-800 bg-slate-950/60 p-2.5">
              {categoryIconNames.map((iconName) => {
                const isSelected = icon === iconName;
                return (
                  <button
                    key={iconName}
                    type="button"
                    onClick={() => setIcon(iconName)}
                    className={`flex h-10 w-10 items-center justify-center rounded-lg transition-all ${
                      isSelected
                        ? "border border-emerald-500/70 bg-emerald-500/20 text-emerald-400 shadow-sm"
                        : "border border-transparent bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:bg-slate-850 hover:text-slate-200"
                    }`}
                  >
                    <CategoryIcon name={iconName} size={18} />
                  </button>
                );
              })}
            </div>
          </div>
          <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-800/80 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={createMutation.isPending || updateMutation.isPending}
              className="rounded-lg px-4 py-2 text-xs font-medium text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="rounded-lg bg-emerald-500 px-5 py-2 text-xs font-semibold text-slate-950 transition-colors hover:bg-emerald-400 disabled:opacity-50"
            >
              {isEditMode
                ? updateMutation.isPending
                  ? "Saving..."
                  : "Save Changes"
                : createMutation.isPending
                  ? "Creating..."
                  : "Create Category"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
