// ================== features/exam/examSlice.js ==================
// Teacher সাইডের Exam CRUD, সেটিংস, রেজাল্ট ম্যানেজ করার slice
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosClient from '../../api/axiosClient';

export const deleteExam = createAsyncThunk('exam/deleteExam', async (examId, { rejectWithValue }) => {
  try {
    await axiosClient.delete(`/exams/${examId}`);
    return examId;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'ডিলিট ব্যর্থ হয়েছে');
  }
});

export const setResourceLink = createAsyncThunk('exam/setResourceLink', async ({ id, link }, { rejectWithValue }) => {
  try {
    const { data } = await axiosClient.put(`/exams/${id}/resource-link`, { link });
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'সেভ করা যায়নি');
  }
});

export const uploadResourcePdf = createAsyncThunk('exam/uploadResourcePdf', async ({ id, formData }, { rejectWithValue }) => {
  try {
    const { data } = await axiosClient.post(`/exams/${id}/resource-pdf`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'আপলোড ব্যর্থ হয়েছে');
  }
});

export const removeResource = createAsyncThunk('exam/removeResource', async (id, { rejectWithValue }) => {
  try {
    const { data } = await axiosClient.delete(`/exams/${id}/resource`);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const uploadExamPdf = createAsyncThunk('exam/uploadPdf', async (formData, { rejectWithValue }) => {
  try {
    const { data } = await axiosClient.post('/exams/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'আপলোড ব্যর্থ হয়েছে');
  }
});

export const fetchMyExams = createAsyncThunk('exam/fetchMy', async (_, { rejectWithValue }) => {
  try {
    const { data } = await axiosClient.get('/exams');
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const fetchExamById = createAsyncThunk('exam/fetchById', async (id, { rejectWithValue }) => {
  try {
    const { data } = await axiosClient.get(`/exams/${id}`);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const updateExamSettings = createAsyncThunk(
  'exam/updateSettings',
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      const { data } = await axiosClient.put(`/exams/${id}/settings`, payload);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message);
    }
  }
);

export const publishExam = createAsyncThunk('exam/publish', async (id, { rejectWithValue }) => {
  try {
    const { data } = await axiosClient.post(`/exams/${id}/publish`);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const fetchExamResults = createAsyncThunk('exam/fetchResults', async (id, { rejectWithValue }) => {
  try {
    const { data } = await axiosClient.get(`/exams/${id}/results`);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const deleteQuestion = createAsyncThunk('exam/deleteQuestion', async (questionId, { rejectWithValue }) => {
  try {
    await axiosClient.delete(`/exams/questions/${questionId}`);
    return questionId;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const updateQuestion = createAsyncThunk(
  'exam/updateQuestion',
  async ({ questionId, payload }, { rejectWithValue }) => {
    try {
      const { data } = await axiosClient.put(`/exams/questions/${questionId}`, payload);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message);
    }
  }
);

const examSlice = createSlice({
  name: 'exam',
  initialState: {
    myExams: [],
    currentExam: null,
    questions: [],
    results: [],
        resultsDisabledMessage: null,
    shareLink: null,
    status: 'idle',
    error: null,
  },
  reducers: {
    clearCurrentExam: (state) => {
      state.currentExam = null;
      state.questions = [];
      state.shareLink = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(uploadExamPdf.fulfilled, (state, action) => {
        state.currentExam = action.payload.exam;
      })
      .addCase(fetchMyExams.fulfilled, (state, action) => {
        state.myExams = action.payload;
      })
      .addCase(fetchExamById.fulfilled, (state, action) => {
        state.currentExam = action.payload.exam;
        state.questions = action.payload.questions;
      })
      .addCase(updateExamSettings.fulfilled, (state, action) => {
        state.currentExam = action.payload;
      })
      .addCase(publishExam.fulfilled, (state, action) => {
        state.currentExam = action.payload.exam;
        state.shareLink = action.payload.shareLink;
      })
           .addCase(fetchExamResults.fulfilled, (state, action) => {
        if (Array.isArray(action.payload)) {
          state.results = action.payload;
          state.resultsDisabledMessage = null;
        } else {
          state.results = [];
          state.resultsDisabledMessage = action.payload.message;
        }
      })
      })
      .addCase(deleteExam.fulfilled, (state, action) => {
        state.myExams = state.myExams.filter((e) => e._id !== action.payload);
      })
      .addCase(setResourceLink.fulfilled, (state, action) => {
        state.currentExam = action.payload;
      })
      .addCase(uploadResourcePdf.fulfilled, (state, action) => {
        state.currentExam = action.payload;
      })
      .addCase(removeResource.fulfilled, (state, action) => {
        state.currentExam = action.payload;
      })
      .addCase(deleteQuestion.fulfilled, (state, action) => {
        state.questions = state.questions.filter((q) => q._id !== action.payload);
      })
      .addCase(updateQuestion.fulfilled, (state, action) => {
        const idx = state.questions.findIndex((q) => q._id === action.payload._id);
        if (idx !== -1) state.questions[idx] = action.payload;
      })
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
