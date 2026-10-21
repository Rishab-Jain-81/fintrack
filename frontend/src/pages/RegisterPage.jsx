import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
  });
  const [confPassword, setConfpaasword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleConfPassword = (e) => setConfpaasword(e.target.value);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      if (formData.password !== confPassword) {
        const message = "Passwords do not match";
        setErrorMessage(message);
      } else {
        await register(formData);
        navigate("/login");
      }
    } catch (err) {
      const rawDetail = err.response?.data?.detail;
      let message = "Failed to register. Please try again.";

      if (typeof rawDetail === "string") {
        message = rawDetail;
      } else if (Array.isArray(rawDetail) && rawDetail.length > 0) {
        message = rawDetail[0]?.msg || message;
      }
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 text-slate-100  ">
      <div className="w-full max-w-md rounded-xl bg-slate-800 p-8 shadow-lg ">
        <h2 className="text-2xl font-bold text-emerald-400">Create Account</h2>
        {errorMessage && (
          <div className="mt-3 rounded-lg border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-400">
            {errorMessage}
          </div>
        )}
        <form onSubmit={handleSubmit} className="mt-3 flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label htmlFor="fullname" className="mr-1 text-emerald-400">
              Full Name
            </label>
            <input
              name="full_name"
              type="text"
              aria-label="Full Name"
              id="fullname"
              placeholder="John Doe"
              value={formData.full_name}
              onChange={handleChange}
              className=" border-2 border-slate-600 bg-slate-700 rounded-md pl-1 placeholder:text-sm focus:outline-0 focus:border-slate-500"
            />
          </div>

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
              className=" border-2 border-slate-600 bg-slate-700 rounded-md pl-1 placeholder:text-sm focus:outline-0 focus:border-slate-500"
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
            <p className=" text-xs text-slate-500">
              Password must be of 8 characters(0-9, a-z, A-Z,and !,@,# are
              allowed).
            </p>
          </div>
          <div className="flex flex-col">
            <label htmlFor="conf-password" className="mr-1 text-emerald-400">
              Confirm Password
            </label>
            <input
              name="conf-password"
              type="password"
              aria-label="confirm password"
              id="conf-password"
              required
              minLength="8"
              value={confPassword}
              onChange={handleConfPassword}
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
              {isSubmitting ? "Creating account..." : "Create Account"}
            </button>
            <Link
              to="/login"
              className="mt-4 ml-2 inline-block text-sm text-emerald-400 underline"
            >
              Already have an account? Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
