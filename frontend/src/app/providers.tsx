"use client";

import { Provider } from "react-redux";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { AppToaster } from "@/components/ui/AppToaster";
import { store } from "@/store";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/Tooltip";

const queryClient = new QueryClient();

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <Provider store={store}>
        <ThemeProvider>
          <TooltipProvider>
            {children}
            <AppToaster />
          </TooltipProvider>
        </ThemeProvider>
      </Provider>
    </QueryClientProvider>
  );
}

