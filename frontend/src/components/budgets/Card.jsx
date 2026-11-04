import { formatCurrency } from "../../utility/formatFunctions";

export const Card = ({ title, amount, colorClass }) => {
  const formattedAmount = formatCurrency(amount);
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3 shadow-sm backdrop-blur-sm transition-all duration-200 hover:border-slate-700 hover:bg-slate-900/80">
      <div className="flex flex-wrap justify-between gap-1">
        <span className={`text-lg font-medium truncate ${colorClass || ""}`}>
          {title}
        </span>
        <span className="text-2xl font-bold tracking-tight text-slate-100">
          {formattedAmount}
        </span>
      </div>
    </div>
  );
};
