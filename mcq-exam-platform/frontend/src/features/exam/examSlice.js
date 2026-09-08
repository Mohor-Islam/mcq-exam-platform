import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = '/api/exams';

// Async Thunks
export const fetchExams = createAsyncThunk(
  'exam/fetchExams',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(API_URL);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch exams');
    }
  }
);

export const fetchExamById = createAsyncThunk(
  'exam/fetchExamById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/${id}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch exam');
    }
  }
);

export const createExam = createAsyncThunk(
  'exam/createExam',
  async (examData, { rejectWithValue }) => {
    try {
      const response = await axios.post(API_URL, examData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create exam');
    }
  }
);

export const updateExam = createAsyncThunk(
  'exam/updateExam',
  async ({ id, examData }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`${API_URL}/${id}`, examData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update exam');
    }
  }
);

export const deleteExam = createAsyncThunk(
  'exam/deleteExam',
  async (id, { rejectWithValue }) => {
    try {
      await axios.delete(`${API_URL}/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete exam');
    }
  }
);

export const addQuestion = createAsyncThunk(
  'exam/addQuestion',
  async ({ examId, questionData }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/${examId}/questions`, questionData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add question');
    }
  }
);

export const updateQuestion = createAsyncThunk(
  'exam/updateQuestion',
  async ({ examId, questionId, questionData }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`${API_URL}/${examId}/questions/${questionId}`, questionData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update question');
    }
  }
);

export const deleteQuestion = createAsyncThunk(
  'exam/deleteQuestion',
  async ({ examId, questionId }, { rejectWithValue }) => {
    try {
      await axios.delete(`${API_URL}/${examId}/questions/${questionId}`);
      return questionId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete question');
    }
  }
);

// Initial State
const initialState = {
  exams: [],
  currentExam: null,
  questions: [],
  loading: false,
  error: null,
};

// Exam Slice
const examSlice = createSlice({
  name: 'exam',
  initialState,
  reducers: {
    clearCurrentExam: (state) => {
      state.currentExam = null;
      state.questions = [];
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchExams.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchExams.fulfilled, (state, action) => {
        state.loading = false;
        state.exams = action.payload;
      })
      .addCase(fetchExamById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchExamById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentExam = action.payload;
        state.questions = action.payload.questions || [];
      })
      .addCase(createExam.fulfilled, (state, action) => {
        state.exams.push(action.payload);
      })
      .addCase(updateExam.fulfilled, (state, action) => {
        const index = state.exams.findIndex((e) => e._id === action.payload._id);
        if (index !== -1) {
          state.exams[index] = action.payload;
        }
        if (state.currentExam && state.currentExam._id === action.payload._id) {
          state.currentExam = action.payload;
        }
      })
      .addCase(deleteExam.fulfilled, (state, action) => {
        state.exams = state.exams.filter((e) => e._id !== action.payload);
      })
      .addCase(addQuestion.fulfilled, (state, action) => {
        state.questions.push(action.payload);
      })
      .addCase(updateQuestion.fulfilled, (state, action) => {
        const idx = state.questions.findIndex((q) => q._id === action.payload._id);
        if (idx !== -1) {
          state.questions[idx] = action.payload;
        }
      })
      .addCase(deleteQuestion.fulfilled, (state, action) => {
        state.questions = state.questions.filter((q) => q._id !== action.payload);
      })
      .addMatcher(
        (action) => action.type.startsWith('exam/') && action.type.endsWith('/rejected'),
        (state, action) => {
          state.loading = false;
          state.error = action.payload || 'An error occurred';
        }
      );
  },
});

export const { clearCurrentExam, clearError } = examSlice.actions;
export default examSlice.reducer;
