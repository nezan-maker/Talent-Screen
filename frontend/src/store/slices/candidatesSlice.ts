import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { getCandidates } from "@/lib/api";
import type { Candidate } from "@/types";

export interface CandidatesState {
  items: Candidate[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error?: string;
}

const initialState: CandidatesState = {
  items: [],
  status: "idle",
};

export const fetchCandidates = createAsyncThunk("candidates/fetchCandidates", async () => {
  return await getCandidates();
});

const candidatesSlice = createSlice({
  name: "candidates",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCandidates.pending, (state) => {
        state.status = "loading";
        state.error = undefined;
      })
      .addCase(fetchCandidates.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchCandidates.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message ?? "Failed to load candidates";
      });
  },
});

export default candidatesSlice.reducer;
