import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { getJobs } from "@/lib/api";
import type { Job } from "@/types";

export interface JobsState {
  items: Job[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error?: string;
}

const initialState: JobsState = {
  items: [],
  status: "idle",
};

export const fetchJobs = createAsyncThunk("jobs/fetchJobs", async () => {
  return await getJobs();
});

const jobsSlice = createSlice({
  name: "jobs",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchJobs.pending, (state) => {
        state.status = "loading";
        state.error = undefined;
      })
      .addCase(fetchJobs.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchJobs.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message ?? "Failed to load jobs";
      });
  },
});

export default jobsSlice.reducer;
