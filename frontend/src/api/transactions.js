import { apiClient } from "./client";

export const getTransactions = async (limit = 5) => {
  const { data } = await apiClient.get("/transactions", {
    params: {
      limit: limit,
    },
  });
  return data;
};
