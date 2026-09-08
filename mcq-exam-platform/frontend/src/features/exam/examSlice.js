import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  exams: [],
  currentExam: null,
  questions: [],
  loading: false,
  error: null,
};

const examSlice = createSlice({
  name: 'exam',
  initialState,
  reducers: {
    clearCurrentExam: (state) => {
      state.currentExam = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addMatcher(
        (action) => action.type.startsWith('exam/') && action.type.endsWith('/rejected'),
        (state, action) => {
          state.error = action.payload;
        }
      );
  },
});

export const { clearCurrentExam } = examSlice.actions;
export default examSlice.reducer;
