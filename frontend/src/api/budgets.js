import { apiClient } from "./client";

export const listBudgets = async ({ month, year }) => {
  const { data } = await apiClient.get("/budgets", {
    params: { month, year },
  });
  return data;
};

export const createBudget = async (payload) => {
  const { data } = await apiClient.post("/budgets", payload);
  return data;
};

export const updateBudget = async ({ budget_id, payload }) => {
  const { data } = await apiClient.patch(`/budgets/${budget_id}`, payload);
  return data;
};

export const deleteBudget = async (budget_id) => {
  const { data } = await apiClient.delete(`/budgets/${budget_id}`);
  return data;
};
