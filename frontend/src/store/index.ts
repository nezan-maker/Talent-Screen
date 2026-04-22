import { configureStore } from "@reduxjs/toolkit";
import jobsReducer from "@/store/slices/jobsSlice";
import candidatesReducer from "@/store/slices/candidatesSlice";
import screeningReducer from "@/store/slices/screeningSlice";
import uiReducer from "@/store/slices/uiSlice";

export const store = configureStore({
  reducer: {
    jobs: jobsReducer,
    candidates: candidatesReducer,
    screening: screeningReducer,
    ui: uiReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

