import { ReceiptText } from "lucide-react";
import { Link } from "react-router-dom";
import { formatCurrency, formatDate } from "../../utility/formatFunctions";
import { ArrowRight } from "lucide-react";
import { CategoryIcon } from "../category/CategoryIcon";

export const RecentTransactionsCard = ({ data = [] }) => {
  const sanitizedData = data.map((transaction) => ({
    ...transaction,
    amount: formatCurrency(transaction.amount),
    transaction_date: formatDate(transaction.transaction_date),
  }));
  return (
    <div className="relative overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60 p-6 shadow-sm backdrop-blur-sm transition-all duration-200 hover:border-slate-700 hover:bg-slate-900/80">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
        <span className="text-xl font-medium text-emerald-400">
          Recent Transactions
        </span>
        <ReceiptText size={28}></ReceiptText>
      </div>
      <div className="mt-4">
        {sanitizedData.length === 0 ? (
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
        ) : (
          sanitizedData.map((transaction) => {
            return (
              <div key={transaction.id} className="py-1.5">
                <div className="flex items-center justify-between py-3.5 px-3.5 transition-colors duration-150 hover:bg-slate-800/20 bg-slate-800/40 rounded-lg">
                  <div className="flex items-center gap-2 min-w-0 ">
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                      style={{
                        backgroundColor: `${transaction.category.color || "#10B981"}20`,
                        color: transaction.category.color || "#10B981",
                      }}
                    >
                      <CategoryIcon
                        name={transaction.category.icon}
                        size={20}
                      />
                    </div>

                    <div className="flex flex-col min-w-0">
                      <span className="truncate text-lg font-medium text-slate-200">
                        {transaction.category.name}
                      </span>
                      <span className="text-sm text-slate-500">
                        {transaction.description || "Transaction"}
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
                      {transaction.amount}
                    </span>
                    <span className="text-xs text-slate-500">
                      {transaction.transaction_date}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
      <div className="mt-6 border-t border-slate-800/80 pt-4">
        <Link
          to="/transactions"
          className="group flex items-center justify-center gap-1.5 text-xs font-medium text-slate-400 transition-colors hover:text-emerald-400"
        >
          <span>View all transactions</span>
          <ArrowRight
            size={14}
            className="transition-transform duration-150 group-hover:translate-x-1"
          />
        </Link>
      </div>
    </div>
  );
};
