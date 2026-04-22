import { useQuery } from "@tanstack/react-query";
import { getCandidate, getCandidates } from "@/lib/api";

export function useCandidates() {
  return useQuery({
    queryKey: ["candidates"],
    queryFn: getCandidates,
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCandidate(id: string) {
  return useQuery({
    queryKey: ["candidate", id],
    queryFn: () => getCandidate(id),
    enabled: Boolean(id),
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });
}
