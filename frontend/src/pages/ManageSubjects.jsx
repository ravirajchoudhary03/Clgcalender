// Manage Subjects - Add/Edit subjects and their schedule
import React, { useState, useEffect } from 'react';
import api from '../services/api';

export const ManageSubjects = () => {
  const [subjects, setSubjects] = useState([]);
  const [formData, setFormData] = useState({ name: '', color: '#FF6B6B' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      const res = await api.get('/attendance/subjects');
      setSubjects(res.data || []);
    } catch (err) {
      setError('Failed to fetch subjects');
    }
  };

  const handleAddSubject = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setLoading(true);
    try {
      await api.post('/attendance/subject', {
        name: formData.name,
        color: formData.color,
        totalClasses: 0,
        classesAttended: 0
      });
      setFormData({ name: '', color: '#FF6B6B' });
      await fetchSubjects();
    } catch (err) {
      setError('Failed to add subject');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSubject = async (id) => {
    if (window.confirm('Delete this subject?')) {
      try {
        await api.delete(`/attendance/subject/${id}`);
        await fetchSubjects();
      } catch (err) {
        setError('Failed to delete subject');
      }
    }
  };

  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#F38181', '#AA96DA', '#FCBAD3', '#FFD93D', '#6BCB77'];

  return (
    <div className="p-8 bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">📚 Manage Subjects</h1>

        {error && <div className="bg-red-900 text-red-200 p-4 rounded mb-6">{error}</div>}

        {/* Add Subject Form */}
        <div className="bg-gray-800 bg-opacity-60 border border-gray-700 rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Add New Subject</h2>
          <form onSubmit={handleAddSubject} className="space-y-4">
            <div>
              <label className="text-white text-sm font-semibold mb-2 block">Subject Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Data Structures, Web Development"
                className="w-full bg-gray-700 text-white rounded px-4 py-2 border border-gray-600 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-white text-sm font-semibold mb-2 block">Color</label>
              <div className="flex gap-3 flex-wrap">
                {colors.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData({ ...formData, color })}
                    className={`w-10 h-10 rounded cursor-pointer transition border-2 ${formData.color === color ? 'border-white' : 'border-transparent'
                      }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded transition disabled:opacity-50"
            >
              {loading ? 'Adding...' : '➕ Add Subject'}
            </button>
          </form>
        </div>

        {/* Subjects List */}
        <div className="bg-gray-800 bg-opacity-60 border border-gray-700 rounded-lg p-6">
          <h2 className="text-2xl font-bold text-white mb-4">Your Subjects ({subjects.length})</h2>

          {subjects.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No subjects added yet. Add one to get started!</p>
          ) : (
            <div className="space-y-3">
              {subjects.map(subject => (
                <div key={subject._id} className="bg-gray-700 bg-opacity-50 rounded p-4 flex items-center justify-between border border-gray-600">
                  <div className="flex items-center gap-4">
                    <div
                      className="w-6 h-6 rounded-full"
                      style={{ backgroundColor: subject.color || '#FF6B6B' }}
                    ></div>
                    <div>
                      <p className="text-white font-semibold">{subject.name}</p>
                      <p className="text-gray-400 text-sm">
                        {subject.classes_attended || 0} / {subject.total_classes || 0} classes attended
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-green-400 font-bold text-lg">
                      {subject.total_classes > 0 ? Math.round((subject.classes_attended / subject.total_classes) * 100) : 0}%
                    </p>
                    <button
                      onClick={() => handleDeleteSubject(subject._id)}
                      className="text-red-400 hover:text-red-300 text-sm mt-1 transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
