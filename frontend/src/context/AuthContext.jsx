/* eslint-disable react-refresh/only-export-components */

import { useEffect, createContext, useState } from "react";
import { apiClient, setAccessToken } from "../api/client";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data } = await apiClient.post("/auth/refresh");
        setAccessToken(data.access_token);

        const UserRes = await apiClient.get("/auth/me");
        setUser(UserRes.data);
      } catch {
        setAccessToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    const handleSessionExpired = () => {
      setUser(null);
      setAccessToken(null);
    };

    checkSession();

    window.addEventListener("auth:session-expired", handleSessionExpired);

    return () => {
      window.removeEventListener("auth:session-expired", handleSessionExpired);
    };
  }, []);

  const login = async (email, password) => {
    const formData = new URLSearchParams({
      username: email,
      password: password,
    });

    const { data } = await apiClient.post("/auth/login", formData, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
    setAccessToken(data.access_token);

    const userRes = await apiClient.get("/auth/me");
    setUser(userRes.data);

    return userRes.data;
  };

  const register = async (formData) => {
    const res = await apiClient.post("/auth/register", formData);
    return res.data;
  };

  const logout = async () => {
    try {
      await apiClient.post("/auth/logout");
    } finally {
      setUser(null);
      setAccessToken(null);
    }
  };

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
