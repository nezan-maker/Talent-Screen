import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { UiState } from "@/types";

const initialState: UiState = {
  sidebarCollapsed: false,
  isGlobalLoading: false,
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setSidebarCollapsed(state, action: PayloadAction<boolean>) {
      state.sidebarCollapsed = action.payload;
    },
    setGlobalLoading(state, action: PayloadAction<boolean>) {
      state.isGlobalLoading = action.payload;
    },
  },
});

export const { setSidebarCollapsed, setGlobalLoading } = uiSlice.actions;
export default uiSlice.reducer;
