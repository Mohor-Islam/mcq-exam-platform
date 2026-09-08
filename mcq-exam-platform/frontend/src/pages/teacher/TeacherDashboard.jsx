// ================== pages/teacher/TeacherDashboard.jsx ==================
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchMyExams } from '../../features/exam/examSlice';

const statusColor = { draft: 'bg-gray-200 text-gray-700', published: 'bg-green-100 text-green-700', closed: 'bg-red-100 text-red-700' };

export default function TeacherDashboard() {
  const dispatch = useDispatch();
  const { myExams } = useSelector((s) => s.exam);
  const { user } = useSelector((s) => s.auth);

  useEffect(() => { dispatch(fetchMyExams()); }, [dispatch]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold dark:text-white">স্বাগতম, {user?.name} 👋</h1>
        <Link to="/teacher/upload" className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium">
          + নতুন পরীক্ষা (PDF আপলোড)
        </Link>
      </div>

      {myExams.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">এখনো কোনো পরীক্ষা তৈরি করোনি।</p>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {myExams.map((exam) => (
            <div key={exam._id} className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border dark:border-gray-700">
              <div className="flex justify-between items-start">
                <h3 className="font-semibold text-lg dark:text-white">{exam.title}</h3>
                <span className={`text-xs px-2 py-1 rounded-full ${statusColor[exam.status]}`}>{exam.status}</span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                সময়: {exam.settings.totalTimeMinutes} মিনিট | মার্কস/প্রশ্ন: {exam.settings.marksPerQuestion}
              </p>
              <div className="flex gap-3 mt-4 text-sm">
                <Link to={`/teacher/exam/${exam._id}`} className="text-primary-600 font-medium">এডিট / সেটিংস</Link>
                <Link to={`/teacher/exam/${exam._id}/results`} className="text-primary-600 font-medium">রেজাল্ট</Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
