import { Outlet, NavLink } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navClass = ({ isActive }) =>
    `p-4 py-3 rounded-lg text-sm font-medium transition-colors 
  ${
    isActive
      ? "bg-emararld-500/10 text-emerald-400"
      : "text-slate-400 hover:text-slate-100 hover:bg-slate-800"
  }`;

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <aside className="w-64 border-r border-slate-800 bg-slate-900/50 p-6 flex flex-col justify-between">
        <div>
          <h2 className="text-2xl font-black tracking-wider text-emerald-400">
            FinTrack
          </h2>
          <nav className="mt-8 flex flex-col gap-2">
            <NavLink to="/" end className={navClass}>
              Dashboard
            </NavLink>
            <NavLink to="/transactions" className={navClass}>
              Transactions
            </NavLink>
            <NavLink to="/categories" className={navClass}>
              Categories
            </NavLink>
            <NavLink to="/budgets" className={navClass}>
              Budgets
            </NavLink>
            <NavLink to="/reports" className={navClass}>
              Reports
            </NavLink>
          </nav>
        </div>

        <div className="border-t border-slate-800 pt-4 flex items-center justify-between">
          <div className="text-xs text-slate-400 truncate max-w-35">
            {user?.email}
          </div>
          <button
            onClick={logout}
            className="text-xs text-red-400 hover:text-red-300 font-semibold"
          >
            Logout
          </button>
        </div>
      </aside>
      {/* Main Page Content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
