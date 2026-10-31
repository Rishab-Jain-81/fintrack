import { apiClient } from "./client";

export const getTransactions = async (params = {}) => {
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(
      // eslint-disable-next-line no-unused-vars
      ([_, value]) => value !== null && value !== undefined && value !== "",
    ),
  );

  const { data } = await apiClient.get("/transactions", {
    params: cleanParams,
  });
  return data;
};

export const createTransaction = async ({
  amount,
  type,
  description,
  transaction_date,
  category_id,
}) => {
  const payload = {
    amount: amount,
    type: type,
    description: description,
    transaction_date: transaction_date,
    category_id: category_id,
  };
  const { data } = await apiClient.post("/transactions", payload);
  return data;
};

export const updateTransaction = async ({ transaction_id, payload }) => {
  const { data } = await apiClient.patch(
    `/transactions/${transaction_id}`,
    payload,
  );
  return data;
};

export const deleteTransaction = async ({ transaction_id }) => {
  const { data } = await apiClient.delete(`/transactions/${transaction_id}`);
  return data;
};
