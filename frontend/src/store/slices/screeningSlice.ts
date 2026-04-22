import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { getScreeningResults } from "@/lib/api";
import { mockCandidateScores } from "@/lib/mockData";
import type { CandidateScore } from "@/types";

export interface ScreeningState {
  selectedCandidateIds: string[];
  results: CandidateScore[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error?: string;
}

const initialState: ScreeningState = {
  selectedCandidateIds: [],
  results: mockCandidateScores,
  status: "idle",
};

export const fetchScreeningResults = createAsyncThunk(
  "screening/fetchResults",
  async (jobId: string) => {
    return await getScreeningResults(jobId);
  },
);

const screeningSlice = createSlice({
  name: "screening",
  initialState,
  reducers: {
    toggleSelectedCandidate(state, action: PayloadAction<string>) {
      const id = action.payload;
      if (state.selectedCandidateIds.includes(id)) {
        state.selectedCandidateIds = state.selectedCandidateIds.filter((x) => x !== id);
      } else {
        state.selectedCandidateIds = [...state.selectedCandidateIds, id];
      }
    },
    clearSelection(state) {
      state.selectedCandidateIds = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchScreeningResults.pending, (state) => {
        state.status = "loading";
        state.error = undefined;
      })
      .addCase(fetchScreeningResults.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.results = action.payload;
      })
      .addCase(fetchScreeningResults.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message ?? "Failed to load results";
      });
  },
});

export const { toggleSelectedCandidate, clearSelection } = screeningSlice.actions;
export default screeningSlice.reducer;

