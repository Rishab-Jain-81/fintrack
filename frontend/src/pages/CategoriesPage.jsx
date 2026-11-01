import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, AlertCircle } from "lucide-react";
import { listCategories } from "../api/category";
import { CategoryIcon } from "../components/category/CategoryIcon";
import { CategoryModal } from "../components/category/CategoryModal";

export default function CategoriesPage() {
  const [selectedType, setSelectedType] = useState("expense");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionError, setActionError] = useState("");
  const [editingCategory, setEditingCategory] = useState(null);

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

      {isLoading ? (
        <div className="relative overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60 p-6 shadow-sm backdrop-blur-sm transition-all duration-200  hover:bg-slate-900/80 w-full sm:max-w-[80%] lg:max-w-[70%] mx-auto">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
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
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {customCategories.map((category) => {
                  return (
                    <button
                      key={category.id}
                      onClick={() => {
                        (setIsModalOpen(true), setEditingCategory(category));
                      }}
                      className="w-full text-left"
                    >
                      <div className="group relative flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-900/60 p-4 shadow-sm backdrop-blur-sm transition-all duration-200 hover:border-slate-700 hover:bg-slate-900/80">
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
                        </div>
                      </div>
                    </button>
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
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
