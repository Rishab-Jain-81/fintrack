import { Link } from "react-router-dom";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 text-slate-100  ">
      <div className="w-full max-w-md rounded-xl bg-slate-800 p-8 shadow-lg ">
        <h2 className="text-2xl font-bold text-emerald-400">
          Login Placeholder
        </h2>
        <p className="mt-2 text-sm text-slate-400">Login from will live here</p>
        <Link
          to="/register"
          className="mt-4 inline-block text-sm text-emerald-400 underline"
        >
          Go to Register
        </Link>
      </div>
    </div>
  );
}
