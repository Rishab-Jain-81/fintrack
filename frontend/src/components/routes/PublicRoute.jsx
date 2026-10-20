import { useAuth } from "../../hooks/useAuth";
import { Navigate, Outlet } from "react-router-dom";
import { RotatingLines } from "react-loader-spinner";

export const PublicRoute = () => {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900">
        <RotatingLines
          visible={true}
          height="64"
          width="64"
          color="#10b981"
          strokeWidth="4"
          animationDuration="0.75"
          ariaLabel="rotating-lines-loading"
        />
      </div>
    );
  }
  if (isAuthenticated) {
    return <Navigate replace to="/" />;
  }
  return <Outlet />;
};
