import { useState, useMemo } from "react";
import { ResponsiveContainer, PieChart, Pie, Sector } from "recharts";
import { PieChart as PieChartIcon } from "lucide-react";
import { formatCurrency } from "../../utility/formatFunctions";
const fallbackPalette = [
  "#FF006E",
  "#8338EC",
  "#3A86FF",
  "#FFBE0B",
  "#FB5607",
  "#00F5D4",
  "#e8ff2a",
  "#FF70A6",
];

export const CategoryChartCard = ({ data = [] }) => {
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);

  const { sanitizedData, totalExpense } = useMemo(() => {
    if (!Array.isArray(data) || data.length === 0) {
      return { sanitizedData: [], totalExpense: 0 };
    }

    const cleaned = data.map((item, index) => ({
      ...item,
      amount: Number(item.amount || 0),
      percentage: Number(item.percentage || 0),
      fill:
        item.category_color || fallbackPalette[index % fallbackPalette.length],
    }));

    const total = cleaned.reduce((acc, curr) => acc + curr.amount, 0);

    return { sanitizedData: cleaned, totalExpense: total };
  }, [data]);

  const activeItem = sanitizedData.find(
    (item) => item.category_id === selectedCategoryId,
  );

  const displayAmount = activeItem ? activeItem.amount : totalExpense;
  const displayLabel = activeItem ? activeItem.category_name : "Total Expenses";
  const displayPercentage = activeItem
    ? ((activeItem.amount / totalExpense) * 100).toFixed(1)
    : null;

  // Custom Sector renderer passed to the `shape` prop (v3 standard)
  const renderCustomSector = (props) => {
    const isSelected = props.category_id === selectedCategoryId;

    // Expand the outer radius if this specific slice is clicked/active
    const adjustedOuterRadius = isSelected
      ? props.outerRadius + 8
      : props.outerRadius;
    const adjustedInnerRadius = isSelected
      ? props.innerRadius - 3
      : props.innerRadius;

    return (
      <Sector
        {...props}
        innerRadius={adjustedInnerRadius}
        outerRadius={adjustedOuterRadius}
        cornerRadius={5}
        stroke="#0f172a"
        strokeWidth={isSelected ? 3 : 1}
      />
    );
  };

  return (
    <div className="relative overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60 p-6 shadow-sm backdrop-blur-sm transition-all duration-200 hover:border-slate-700 hover:bg-slate-900/80">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
        <div className="flex flex-col gap-0.5">
          <span className="text-xl font-medium text-emerald-400">
            Expense Breakdown
          </span>
          <p className="text-xs text-slate-500">Distribution by Category</p>
        </div>

        <div className="rounded-lg bg-emerald-500/10 p-2.5 text-emerald-400">
          <PieChartIcon size={20} />
        </div>
      </div>
      <div className="relative mt-4 flex h-80 w-full items-center justify-center">
        {sanitizedData.length == 0 || totalExpense == 0 ? (
          <div className="flex h-full w-full flex-col items-center justify-center rounded-lg border border-dashed border-slate-800/80 bg-slate-950/30 p-6 text-center">
            <div className="rounded-full bg-slate-800/60 p-3 text-slate-500">
              <PieChartIcon size={28} />
            </div>
            <h3 className="mt-3 text-sm font-medium text-slate-300">
              No Expense Data Found
            </h3>
            <p className="mt-1 max-w-xs text-xs text-slate-500">
              There are no recorded expenses to display a category breakdown.
            </p>
          </div>
        ) : (
          <div className="relative mt-2 flex h-80 w-full items-center justify-center outline-none [&_*:focus]:outline-none [&_svg]:outline-none">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sanitizedData}
                  dataKey="amount"
                  nameKey="category_name"
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={105}
                  paddingAngle={4}
                  stroke="none"
                  shape={renderCustomSector}
                  onClick={(entry) =>
                    setSelectedCategoryId((prev) =>
                      prev === entry.category_id ? null : entry.category_id,
                    )
                  }
                  className="cursor-pointer outline-none"
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
              {activeItem && (
                <span
                  className="mb-1.5 h-2 w-2 rounded-full transition-colors duration-200"
                  style={{ backgroundColor: activeItem.fill }}
                />
              )}

              <span className="max-w-35 truncate text-xs font-medium uppercase tracking-wider text-slate-400">
                {displayLabel}
              </span>

              <span className="mt-0.5 text-xl font-bold tracking-tight text-slate-100">
                {formatCurrency(displayAmount)}
              </span>

              {displayPercentage ? (
                <span className="mt-1 rounded-full bg-slate-800/80 px-2 py-0.5 text-[11px] font-medium text-emerald-400">
                  {displayPercentage}% of total
                </span>
              ) : (
                <span className="mt-1 text-[11px] text-slate-500">
                  Overall Spending
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
