import { apiClient } from "./client";

export const listCategories = async (type) => {
  const params = type === "income" || type === "expense" ? { type } : {};

  const { data } = await apiClient.get("/categories", { params });
  return data;
};

export const createCategory = async ({ name, type, icon, color }) => {
  const payload = {
    name: name,
    type: type,
    icon: icon,
    color: color,
  };

  const { data } = await apiClient.post("/categories", payload);

  return data;
};

export const updateCategory = async ({ categoryId, payload }) => {
  const { data } = await apiClient.patch(`/categories/${categoryId}`, payload);

  return data;
};

export const deleteCategory = async ({ categoryId }) => {
  const { data } = await apiClient.delete(`/categories/${categoryId}`);

  return data;
};
