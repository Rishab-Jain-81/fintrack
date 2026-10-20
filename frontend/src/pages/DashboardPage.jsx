import { useAuth } from "../hooks/useAuth";

export default function DashboardPage() {
  const { user, logout } = useAuth();

  return (
    <div className="p-8 text-slate-100">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-emerald-400">Dashboard</h1>
        <button
          onClick={logout}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold hover:bg-red-700"
        >
          Logout
        </button>
      </div>
      <p className="mt-4 text-slate-400">
        Welcome back,{" "}
        <span className="font-semibold text-slate-200">
          {user?.full_name || user?.email}
        </span>
      </p>
    </div>
  );
}
