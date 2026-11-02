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

export const triggerExportCsv = async ({
  start_date = "1970-01-01",
  end_date = formattedToday,
}) => {
  const { data } = await apiClient.post("/reports/export", null, {
    params: { start_date, end_date },
  });
  return data;
};

export const checkExportStatus = async (taskId) => {
  const response = await apiClient.get(`/reports/export/${taskId}`, {
    responseType: "blob",
  });

  const contentType = response.headers["content-type"] || "";

  if (contentType.includes("application/json")) {
    const text = await response.data.text();
    return { isReady: false, ...JSON.parse(text) };
  }

  return {
    isReady: true,
    blob: response.data,
    filename: `transactions_export_${taskId.slice(0, 8)}.csv`,
  };
};
