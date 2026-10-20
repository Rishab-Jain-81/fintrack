import { Link } from "react-router-dom";

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 text-slate-100  ">
      <div className="w-full max-w-md rounded-xl bg-slate-800 p-8 shadow-lg ">
        <h2 className="text-2xl font-bold text-emerald-400">
          Register Placeholder
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          Registeration from will live here
        </p>
        <Link
          to="/login"
          className="mt-4 inline-block text-sm text-emerald-400 underline"
        >
          Already have an account? Login
        </Link>
      </div>
    </div>
  );
}
