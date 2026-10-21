import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);
    console.log(formData);

    try {
      console.log(formData);
      await login(formData.email, formData.password);
      navigate("/");
    } catch (err) {
      const message =
        err.response?.data?.detail ||
        "Failed to login. Please check your network. ";
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 text-slate-100  ">
      <div className="w-full max-w-md rounded-xl bg-slate-800 p-8 shadow-lg ">
        <h2 className="text-2xl font-bold text-emerald-400">Login</h2>
        {errorMessage && (
          <div className="mt-3 rounded-lg border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-400">
            {errorMessage}
          </div>
        )}
        <form onSubmit={handleSubmit} className="mt-3 flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label htmlFor="email" className="mr-1 text-emerald-400">
              Email
            </label>
            <input
              name="email"
              type="email"
              autoComplete="email"
              aria-label="email"
              id="email"
              required
              placeholder="johnDoe@example.com"
              value={formData.email}
              onChange={handleChange}
              className="email border-2 border-slate-600 bg-slate-700 rounded-md pl-1 placeholder:text-sm focus:outline-0 focus:border-slate-500"
            />
          </div>

          <div className="flex flex-col">
            <label htmlFor="password" className="mr-1 text-emerald-400">
              Password
            </label>
            <input
              name="password"
              type="password"
              autoComplete="password"
              aria-label="password"
              id="password"
              required
              value={formData.password}
              onChange={handleChange}
              className="email border-2 border-slate-600 bg-slate-700 rounded-md pl-1 placeholder:text-sm focus:outline-0 focus:border-slate-500"
            />
          </div>
          <div>
            <button
              type="submit"
              aria-label="Submit"
              disabled={isSubmitting}
              className="ml-1 mt-3 border rounded-md bg-slate-500 text-md p-1 border-slate-600 cursor-pointer"
            >
              {isSubmitting ? "Logging in..." : "Login"}
            </button>
            <Link
              to="/register"
              className="mt-4 ml-2 inline-block text-sm text-emerald-400 underline"
            >
              New to fintrack? Go to Register
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
