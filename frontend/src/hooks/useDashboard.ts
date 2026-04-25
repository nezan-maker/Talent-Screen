import { useQuery } from "@tanstack/react-query";
import { getDashboardOverview, getDashboardStats } from "@/lib/api";

export function useDashboardOverview() {
  return useQuery({
    queryKey: ["dashboardOverview"],
    queryFn: getDashboardOverview,
    retry: 1,
    staleTime: 10 * 1000,
  });
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboardStats"],
    queryFn: getDashboardStats,
    retry: 1,
    staleTime: 10 * 1000,
  });
}
