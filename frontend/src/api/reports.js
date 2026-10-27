import { apiClient } from "./client";

const formattedToday = new Date().toISOString();

export const getSummary = async (
  startDate = "1970-01-01",
  endDate = formattedToday,
) => {
  const { data } = await apiClient.get("/reports/summary", {
    params: {
      start_date: startDate,
      end_date: endDate,
    },
  });

  return data;
};
