// ================== pages/student/StudentResult.jsx ==================
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import axiosClient from '../../api/axiosClient';
import { resetAttempt } from '../../features/attempt/attemptSlice';

export default function StudentResult() {
  const { result, attemptId } = useSelector((s) => s.attempt);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => { if (!result) navigate('/'); }, [result, navigate]);

  const handleDownload = async () => {
    const res = await axiosClient.get(`/attempts/${attemptId}/download-pdf`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'result.pdf');
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  if (!result) return null;

  return (
    <div className="max-w-md mx-auto mt-16 bg-white dark:bg-gray-800 p-8 rounded-2xl shadow text-center">
      <h2 className="text-xl font-bold mb-4 dark:text-white">🎉 পরীক্ষা জমা হয়েছে!</h2>

      {result.showInstantly ? (
        <div className="space-y-2 mb-6">
          <p className="text-3xl font-bold text-primary-600">{result.obtainedMarks} নম্বর</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            সঠিক: {result.totalCorrect} | ভুল: {result.totalWrong} | স্কিপ: {result.totalSkipped}
          </p>
        </div>
      ) : (
        <p className="text-gray-500 dark:text-gray-400 mb-6">শিক্ষক রেজাল্ট পরে প্রকাশ করবেন।</p>
      )}

      <button onClick={handleDownload} className="w-full bg-primary-600 text-white py-2 rounded-lg font-medium mb-3">
        📄 সঠিক উত্তরসহ PDF ডাউনলোড করো
      </button>
      <button onClick={() => { dispatch(resetAttempt()); navigate('/'); }} className="text-sm text-gray-500">
        হোমে ফিরে যাও
      </button>
    </div>
  );
}
