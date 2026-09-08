import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = '/api/exams';

// ================== FETCH ==================
export const fetchExams = createAsyncThunk('exam/fetchExams', async (_, { rejectWithValue }) => {
  try { const res = await axios.get(API_URL); return res.data; }
  catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed'); }
});

export const fetchMyExams = createAsyncThunk('exam/fetchMyExams', async (_, { rejectWithValue }) => {
  try { const res = await axios.get(`${API_URL}/my`); return res.data; }
  catch (e) {
    try { const res2 = await axios.get(API_URL); return res2.data; }
    catch { return rejectWithValue(e.response?.data?.message || 'Failed'); }
  }
});

export const fetchExamById = createAsyncThunk('exam/fetchExamById', async (id, { rejectWithValue }) => {
  try { const res = await axios.get(`${API_URL}/${id}`); return res.data; }
  catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed'); }
});

// ================== CRUD ==================
export const createExam = createAsyncThunk('exam/createExam', async (examData, { rejectWithValue }) => {
  try { const res = await axios.post(API_URL, examData); return res.data; }
  catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed'); }
});

export const updateExam = createAsyncThunk('exam/updateExam', async ({ id, examData }, { rejectWithValue }) => {
  try { const res = await axios.put(`${API_URL}/${id}`, examData); return res.data; }
  catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed'); }
});

export const deleteExam = createAsyncThunk('exam/deleteExam', async (id, { rejectWithValue }) => {
  try { await axios.delete(`${API_URL}/${id}`); return id; }
  catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed'); }
});

// ================== ExamEditor Needs ==================
export const updateExamSettings = createAsyncThunk('exam/updateExamSettings', async ({ id, payload }, { rejectWithValue }) => {
  try { const res = await axios.put(`${API_URL}/${id}`, payload); return res.data; }
  catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed'); }
});

export const publishExam = createAsyncThunk('exam/publishExam', async (id, { rejectWithValue }) => {
  try { const res = await axios.post(`${API_URL}/${id}/publish`); return res.data; }
  catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed'); }
});

export const setResourceLink = createAsyncThunk('exam/setResourceLink', async ({ id, link }, { rejectWithValue }) => {
  try { const res = await axios.put(`${API_URL}/${id}/resource`, { link }); return res.data; }
  catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed'); }
});

export const uploadResourcePdf = createAsyncThunk('exam/uploadResourcePdf', async ({ id, formData }, { rejectWithValue }) => {
  try { const res = await axios.post(`${API_URL}/${id}/resource/pdf`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }); return res.data; }
  catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed'); }
});

export const removeResource = createAsyncThunk('exam/removeResource', async (id, { rejectWithValue }) => {
  try { const res = await axios.delete(`${API_URL}/${id}/resource`); return res.data; }
  catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed'); }
});

// ================== UploadExam.jsx Needs - এটাই এখন error দিচ্ছে ==================
export const uploadExamPdf = createAsyncThunk('exam/uploadExamPdf', async (formData, { rejectWithValue }) => {
  try {
    // তোমার UploadExam.jsx যদি FormData পাঠায়
    const payload = formData instanceof FormData? formData : (() => { const fd = new FormData(); Object.entries(formData).forEach(([k,v])=>fd.append(k,v)); return fd; })();
    const res = await axios.post(`${API_URL}/upload/pdf`, payload, { headers: { 'Content-Type': 'multipart/form-data' } });
    return res.data;
  } catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed to upload exam pdf'); }
});

// যাতে পুরনো নামেও কাজ করে
export const uploadExam = uploadExamPdf;

// ================== Questions ==================
export const addQuestion = createAsyncThunk('exam/addQuestion', async ({ examId, questionData }, { rejectWithValue }) => {
  try { const res = await axios.post(`${API_URL}/${examId}/questions`, questionData); return res.data; }
  catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed'); }
});

export const updateQuestion = createAsyncThunk('exam/updateQuestion', async (arg, { rejectWithValue }) => {
  try {
    const qId = arg.questionId || arg._id;
    const data = arg.payload || arg.questionData;
    const url = arg.examId? `${API_URL}/${arg.examId}/questions/${qId}` : `${API_URL}/questions/${qId}`;
    const res = await axios.put(url, data); return res.data;
  } catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed'); }
});

export const deleteQuestion = createAsyncThunk('exam/deleteQuestion', async (arg, { rejectWithValue }) => {
  try {
    const qId = typeof arg === 'string'? arg : arg.questionId;
    const url = arg?.examId? `${API_URL}/${arg.examId}/questions/${qId}` : `${API_URL}/questions/${qId}`;
    await axios.delete(url); return qId;
  } catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed'); }
});

const initialState = { exams: [], currentExam: null, questions: [], shareLink: null, loading: false, error: null };

const examSlice = createSlice({
  name: 'exam',
  initialState,
  reducers: {
    clearCurrentExam: (state) => { state.currentExam = null; state.questions = []; state.shareLink = null; },
    clearError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
     .addCase(fetchExams.fulfilled, (s,a)=>{s.exams=a.payload;})
     .addCase(fetchMyExams.fulfilled, (s,a)=>{s.exams=a.payload;})
     .addCase(fetchExamById.fulfilled, (s,a)=>{s.currentExam=a.payload.exam||a.payload; s.questions=a.payload.questions||a.payload.exam?.questions||[]; s.shareLink=a.payload.shareLink||null;})
     .addCase(createExam.fulfilled, (s,a)=>{s.exams.push(a.payload);})
     .addCase(updateExam.fulfilled, (s,a)=>{ const i=s.exams.findIndex(e=>e._id===a.payload._id); if(i!==-1)s.exams[i]=a.payload; })
     .addCase(deleteExam.fulfilled, (s,a)=>{s.exams=s.exams.filter(e=>e._id!==a.payload);})
     .addCase(updateExamSettings.fulfilled, (s,a)=>{s.currentExam=a.payload.exam||a.payload;})
     .addCase(publishExam.fulfilled, (s,a)=>{s.currentExam=a.payload.exam||a.payload; s.shareLink=a.payload.shareLink||a.payload.link||s.shareLink;})
     .addCase(setResourceLink.fulfilled, (s,a)=>{s.currentExam=a.payload.exam||a.payload;})
     .addCase(uploadResourcePdf.fulfilled, (s,a)=>{s.currentExam=a.payload.exam||a.payload;})
     .addCase(removeResource.fulfilled, (s,a)=>{s.currentExam=a.payload.exam||a.payload;})
     .addCase(uploadExamPdf.fulfilled, (s,a)=>{if(a.payload.exam) s.exams.push(a.payload.exam);})
     .addCase(addQuestion.fulfilled, (s,a)=>{s.questions.push(a.payload);})
     .addCase(updateQuestion.fulfilled, (s,a)=>{const i=s.questions.findIndex(q=>q._id===a.payload._id); if(i!==-1)s.questions[i]=a.payload;})
     .addCase(deleteQuestion.fulfilled, (s,a)=>{s.questions=s.questions.filter(q=>q._id!==a.payload);})
     .addMatcher(a=>a.type.startsWith('exam/')&&a.type.endsWith('/rejected'), (s,a)=>{s.loading=false; s.error=a.payload;});
  },
});

export const { clearCurrentExam, clearError } = examSlice.actions;
export default examSlice.reducer;
