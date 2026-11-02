export const Card = ({ title, value, colorClass, icon: Icon }) => {
  return (
    <div className="relative overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60 p-6 shadow-sm backdrop-blur-sm transition-all duration-200 hover:border-slate-700 hover:bg-slate-900/80">
      <div className="flex items-center justify-between">
        <span className={`text-xl font-medium ${colorClass}`}>{title}</span>
        {Icon && (
          <div className={`rounded-lg p-2.5 ${colorClass}`}>
            <Icon size={20} />
          </div>
        )}
      </div>
      <div className="mt-4">
        <h3 className="text-2xl font-bold tracking-tight text-slate-100">
          {value}
        </h3>
      </div>
    </div>
  );
};
