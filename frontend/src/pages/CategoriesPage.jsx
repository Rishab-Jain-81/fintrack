import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, AlertCircle, Pencil } from "lucide-react";
import { listCategories, deleteCategory } from "../api/category";
import { CategoryIcon } from "../components/category/CategoryIcon";
import { CategoryModal } from "../components/category/CategoryModal";

export default function CategoriesPage() {
  const [selectedType, setSelectedType] = useState("expense");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionError, setActionError] = useState("");
  const [editingCategory, setEditingCategory] = useState(null);

  const queryClient = useQueryClient();

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["categories", selectedType],
    queryFn: () => listCategories(selectedType),
  });

  const customCategories = categories.filter(
    (category) => category.user_id !== null,
  );
  const systemCategories = categories.filter(
    (category) => category.user_id == null,
  );

  const deleteMutation = useMutation({
    mutationFn: (categoryId) => deleteCategory({ categoryId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["reports", "summary"] });
      setActionError("");
    },
    onError: (err) => {
      setActionError(
        err.response?.data?.detail || "Failed to delete category.",
      );
    },
  });

  const handleDelete = (categoryId) => {
    if (window.confirm("Are you sure you want to delete this category?")) {
      deleteMutation.mutate(categoryId);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 md:p-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex flex-col gap-0.5">
          <h1 className="text-3xl font-bold tracking-tight text-slate-100">
            Categories
          </h1>
          <p className=" text-slate-500">
            Manage expense and income classifications
          </p>
        </div>
      </div>

      {actionError && (
        <div className="flex items-center justify-between rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400">
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

      <div className="relative grid grid-cols-2 w-full mx-auto items-center gap-1.5 rounded-3xl border border-slate-800 bg-slate-900/60 p-1">
        <div className="absolute left-1/2 top-1/2  -translate-x-1/2 -translate-y-1/2 h-8 w-px bg-slate-600" />
        {["expense", "income"].map((type) => {
          const isActive = selectedType === type;
          return (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`rounded-lg w-full mx-auto col-span-1 px-5 py-2 sm:px-6.5 sm:py-2.5 sm:text-lg text-sm font-medium capitalize transition-all  ${type == "expense" ? "rounded-l-3xl" : "rounded-r-3xl"} ${
                isActive
                  ? "bg-slate-800 text-slate-100 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              } `}
            >
              {type}
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="">
          <div className="relative overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60 p-6 shadow-sm backdrop-blur-sm transition-all duration-200  hover:bg-slate-900/80">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <div
                  key={index}
                  className="h-28 animate-pulse rounded-xl border border-slate-800/60 bg-slate-800/50"
                />
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="relative overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60 p-6 shadow-sm backdrop-blur-sm transition-all duration-200  hover:bg-slate-900/80 ">
          <button
            onClick={() => {
              (setIsModalOpen(true), setEditingCategory(null));
            }}
            className="group absolute top-5 right-6 inline-flex items-center justify-center gap-2 rounded-3xl sm:rounded-xl bg-slate-400/50 p-1 sm:px-2 sm:py-1.5 text-xs text-slate-950 transition-colors hover:bg-slate-400 hover:text-black font-bold"
            title="Add Category"
          >
            <span className="hidden group-hover:inline group-hover:pl-1 sm:inline">
              Add Category
            </span>
            <Plus size={28} />
          </button>

          {customCategories.length == 0 ? (
            <div></div>
          ) : (
            <div>
              <header>
                <h2 className="text-2xl text-slate-400 font-semibold pb-3">
                  Custom Categories
                </h2>
              </header>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {customCategories.map((category) => {
                  return (
                    <div
                      key={category.id}
                      className="group relative flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-900/60 p-4 shadow-sm backdrop-blur-sm transition-all duration-200 hover:border-slate-700 hover:bg-slate-900/80"
                    >
                      <div className="flex items-start align-middle justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105"
                            style={{
                              backgroundColor: `${category.color || "#10B981"}20`,
                              color: category.color || "#10B981",
                            }}
                          >
                            <CategoryIcon name={category.icon} size={20} />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="truncate font-medium text-slate-200">
                              {category.name}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col mt-1 h-8 justify-center">
                          <button
                            onClick={() => {
                              (setIsModalOpen(true),
                                setEditingCategory(category));
                            }}
                            className="group/edit relative flex gap-2 rounded-lg p-1.5 items-center text-slate-500 opacity-0 transition-all hover:bg-emerald-500/10 hover:text-emerald-400 group-hover:opacity-100 disabled:opacity-50"
                            title="Edit Category"
                          >
                            <Pencil size={18} />
                            <span className="absolute left-full mr-2 hidden group-hover/edit:inline group-hover/edit:pl-1 text-xs">
                              Edit
                            </span>
                          </button>
                          <button
                            onClick={() => handleDelete(category.id)}
                            disabled={deleteMutation.isPending}
                            className="group/delete relative flex gap-2 rounded-lg p-1.5 text-slate-500 opacity-0 transition-all hover:bg-rose-500/10 hover:text-rose-400 group-hover:opacity-100 disabled:opacity-50"
                            title="Delete Category"
                          >
                            <span className="absolute left-full mr-2 hidden group-hover/delete:inline group-hover/delete:pl-1 text-xs">
                              Delete
                            </span>
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="h-px w-full mx-auto bg-slate-600 mt-8 mb-6"></div>
            </div>
          )}
          <div>
            <header>
              <h2 className="text-2xl text-slate-400 font-semibold pb-3">
                Default Categories
              </h2>
            </header>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {systemCategories.map((category) => {
                return (
                  <div
                    key={category.id}
                    className="group relative flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-900/60 p-4 shadow-sm backdrop-blur-sm transition-all duration-200 hover:border-slate-700 hover:bg-slate-900/80"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105"
                          style={{
                            backgroundColor: `${category.color || "#10B981"}20`,
                            color: category.color || "#10B981",
                          }}
                        >
                          <CategoryIcon name={category.icon} size={20} />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="truncate font-medium text-slate-200">
                            {category.name}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
      <CategoryModal
        isOpen={isModalOpen}
        onClose={() => {
          (setIsModalOpen(false), setEditingCategory(null));
        }}
        categoryToEdit={editingCategory}
      />
    </div>
  );
}
