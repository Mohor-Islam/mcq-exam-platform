import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = '/api/exams';

// ================== Basic Thunks ==================
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

// TeacherDashboard এর জন্য alias - এটাই main fix
export const fetchMyExams = createAsyncThunk(
  'exam/fetchMyExams',
  async (_, { rejectWithValue }) => {
    try {
      // তোমার backend যদি /my-exams হয়, তাহলে নিচের লাইন change করো
      const response = await axios.get(`${API_URL}/my`);
      return response.data;
    } catch (error) {
      // fallback - যদি /my route না থাকে, সব exam-ই return করবে
      try {
        const res2 = await axios.get(API_URL);
        return res2.data;
      } catch {
        return rejectWithValue(error.response?.data?.message || 'Failed to fetch my exams');
      }
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

// ================== ExamEditor এর জন্য নতুন Thunks ==================
export const updateExamSettings = createAsyncThunk(
  'exam/updateExamSettings',
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`${API_URL}/${id}`, payload);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update settings');
    }
  }
);

export const publishExam = createAsyncThunk(
  'exam/publishExam',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/${id}/publish`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to publish');
    }
  }
);

export const setResourceLink = createAsyncThunk(
  'exam/setResourceLink',
  async ({ id, link }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`${API_URL}/${id}/resource`, { link });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to set link');
    }
  }
);

export const uploadResourcePdf = createAsyncThunk(
  'exam/uploadResourcePdf',
  async ({ id, formData }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/${id}/resource/pdf`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to upload pdf');
    }
  }
);

export const removeResource = createAsyncThunk(
  'exam/removeResource',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.delete(`${API_URL}/${id}/resource`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to remove resource');
    }
  }
);

// Questions
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

// ExamEditor.jsx তোমার call করছে {questionId, payload} দিয়ে
export const updateQuestion = createAsyncThunk(
  'exam/updateQuestion',
  async ({ questionId, payload, examId, questionData }, { rejectWithValue }) => {
    try {
      const finalId = questionId || payload?._id;
      const finalData = payload || questionData;
      // backend যদি /questions/:id হয়
      const url = examId? `${API_URL}/${examId}/questions/${questionId}` : `${API_URL}/questions/${questionId}`;
      const response = await axios.put(url, finalData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update question');
    }
  }
);

export const deleteQuestion = createAsyncThunk(
  'exam/deleteQuestion',
  async (questionIdOrObj, { rejectWithValue }) => {
    try {
      const qId = typeof questionIdOrObj === 'string'? questionIdOrObj : questionIdOrObj.questionId;
      const examId = questionIdOrObj?.examId;
      const url = examId? `${API_URL}/${examId}/questions/${qId}` : `${API_URL}/questions/${qId}`;
      await axios.delete(url);
      return qId;
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
  shareLink: null,
  loading: false,
  error: null,
};

const examSlice = createSlice({
  name: 'exam',
  initialState,
  reducers: {
    clearCurrentExam: (state) => {
      state.currentExam = null;
      state.questions = [];
      state.shareLink = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
     .addCase(fetchExams.pending, (state) => { state.loading = true; state.error = null; })
     .addCase(fetchExams.fulfilled, (state, action) => { state.loading = false; state.exams = action.payload; })
     .addCase(fetchMyExams.pending, (state) => { state.loading = true; })
     .addCase(fetchMyExams.fulfilled, (state, action) => { state.loading = false; state.exams = action.payload; })
     .addCase(fetchExamById.pending, (state) => { state.loading = true; state.error = null; })
     .addCase(fetchExamById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentExam = action.payload.exam || action.payload;
        state.questions = action.payload.questions || action.payload.exam?.questions || [];
        state.shareLink = action.payload.shareLink || null;
      })
     .addCase(createExam.fulfilled, (state, action) => { state.exams.push(action.payload); })
     .addCase(updateExam.fulfilled, (state, action) => {
        const idx = state.exams.findIndex((e) => e._id === action.payload._id);
        if (idx!== -1) state.exams[idx] = action.payload;
        if (state.currentExam && state.currentExam._id === action.payload._id) state.currentExam = action.payload;
      })
     .addCase(deleteExam.fulfilled, (state, action) => { state.exams = state.exams.filter((e) => e._id!== action.payload); })
     .addCase(updateExamSettings.fulfilled, (state, action) => { state.currentExam = action.payload.exam || action.payload; })
     .addCase(publishExam.fulfilled, (state, action) => {
        state.currentExam = action.payload.exam || action.payload;
        state.shareLink = action.payload.shareLink || action.payload.link || state.shareLink;
      })
     .addCase(setResourceLink.fulfilled, (state, action) => { state.currentExam = action.payload.exam || action.payload; })
     .addCase(uploadResourcePdf.fulfilled, (state, action) => { state.currentExam = action.payload.exam || action.payload; })
     .addCase(removeResource.fulfilled, (state, action) => { state.currentExam = action.payload.exam || action.payload; })
     .addCase(addQuestion.fulfilled, (state, action) => { state.questions.push(action.payload); })
     .addCase(updateQuestion.fulfilled, (state, action) => {
        const idx = state.questions.findIndex((q) => q._id === action.payload._id);
        if (idx!== -1) state.questions[idx] = action.payload;
      })
     .addCase(deleteQuestion.fulfilled, (state, action) => { state.questions = state.questions.filter((q) => q._id!== action.payload); })
     .addMatcher(
        (action) => action.type.startsWith('exam/') && action.type.endsWith('/rejected'),
        (state, action) => { state.loading = false; state.error = action.payload || 'An error occurred'; }
      );
  },
});

export const { clearCurrentExam, clearError } = examSlice.actions;
export default examSlice.reducer;
