import React, { useState, useEffect } from 'react';
import { Briefcase, ArrowRight, Star, RefreshCw, Plus, CheckCircle, Clock } from 'lucide-react';
import { translations } from '../utils/translate';

const defaultScholarships = [
  { scholarship_name: "National Scholarship Portal" },
  { scholarship_name: "Telangana ePASS Post Matric Scholarship (SC/ST)" },
  { scholarship_name: "Telangana ePASS Post Matric Scholarship (BC/EBC/Minority)" },
  { scholarship_name: "Dr. Ambedkar Post Matric Scholarship for SC Students" },
  { scholarship_name: "Vidyadhan Scholarship (Sarojini Damodaran Foundation)" },
  { scholarship_name: "HDFC Bank Badhte Kadam Scholarship" }
];

const defaultTracked = [
  { scholarship_name: "National Scholarship Portal", status: "SAVED" },
  { scholarship_name: "Telangana ePASS Post Matric Scholarship (SC/ST)", status: "APPLIED" },
  { scholarship_name: "HDFC Bank Badhte Kadam Scholarship", status: "UNDER_REVIEW" },
  { scholarship_name: "Vidyadhan Scholarship (Sarojini Damodaran Foundation)", status: "APPROVED" }
];

export default function TrackerView({ token, showToast, lang }) {
  const [tracked, setTracked] = useState(defaultTracked);
  const [allScholarships, setAllScholarships] = useState(defaultScholarships);
  const [newScholarshipToAdd, setNewScholarshipToAdd] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const t = translations[lang || 'en'];

  const columns = [
    { id: 'SAVED', title: t.saved, color: 'border-t-blue-500 bg-blue-50/30' },
    { id: 'APPLIED', title: t.applied, color: 'border-t-amber-500 bg-amber-50/30' },
    { id: 'UNDER_REVIEW', title: t.underReview, color: 'border-t-sky-500 bg-sky-50/30' },
    { id: 'APPROVED', title: t.approved, color: 'border-t-emerald-500 bg-emerald-50/30' },
    { id: 'REJECTED', title: t.rejected, color: 'border-t-rose-500 bg-rose-50/30' }
  ];

  const fetchTrackerData = async () => {
    setLoading(true);
    try {
      const resTracked = await fetch('/api/tracker', {
        headers: { 'Authorization': token }
      });
      const resAll = await fetch('/api/scholarships');
      if (resTracked.ok && resAll.ok) {
        const trackedData = await resTracked.json();
        const allData = await resAll.json();
        setTracked(trackedData);
        setAllScholarships(allData);
      }
    } catch (err) {
      console.error('Tracker fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchTrackerData();
    } else {
      setLoading(false);
    }
  }, [token]);

  const handleUpdateStatus = async (scholarshipName, newStatus) => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/tracker/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify({ scholarshipName, status: newStatus })
      });
      if (res.ok) {
        showToast(`Moved "${scholarshipName}" to ${newStatus.replace('_', ' ')}.`);
        fetchTrackerData();
      } else {
        showToast('Failed to update tracking status.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error updating status.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddScholarship = async (e) => {
    e.preventDefault();
    if (!newScholarshipToAdd) return;
    const name = newScholarshipToAdd;
    setNewScholarshipToAdd('');
    await handleUpdateStatus(name, 'SAVED');
  };

  return (
    <div className="space-y-6">
      
      {/* Title & Add Bar */}
      <div className="bg-white border border-outline-variant/35 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="font-display-lg text-display-lg text-primary flex items-center gap-2">
            <Briefcase size={28} className="text-secondary" /> {t.tracker}
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Manage your applications pipelines. Choose a status to update.
          </p>
        </div>

        {/* Add scholarship tracker form */}
        <form onSubmit={handleAddScholarship} className="flex items-center gap-2 shrink-0">
          <select
            value={newScholarshipToAdd}
            onChange={(e) => setNewScholarshipToAdd(e.target.value)}
            className="h-11 px-3 rounded-lg border border-outline-variant focus:border-primary outline-none font-body-md bg-surface-bright text-on-surface w-[200px] sm:w-[260px]"
          >
            <option value="">-- Add Scholarship --</option>
            {allScholarships.map((s, idx) => (
              <option key={idx} value={s.scholarship_name} disabled={tracked.find(t => t.scholarship_name === s.scholarship_name)}>
                {s.scholarship_name}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={!newScholarshipToAdd || actionLoading}
            className="bg-primary hover:bg-primary/95 text-on-primary h-11 px-4 rounded-lg font-label-md text-label-md flex items-center gap-1.5 shadow-sm disabled:opacity-50 transition-colors"
          >
            <Plus size={16} /> Add
          </button>
        </form>
      </div>

      {/* Kanban Board columns */}
      {loading ? (
        <div className="bg-white border border-outline-variant/25 rounded-2xl p-12 text-center text-outline">
          <RefreshCw className="animate-spin mx-auto mb-2 text-secondary" size={24} />
          Loading tracked applications...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto pb-4">
          
          {columns.map((col) => {
            const items = tracked.filter(t => t.status === col.id);
            return (
              <div 
                key={col.id} 
                className={`border-t-4 border border-outline-variant/25 rounded-2xl p-4 min-h-[380px] flex flex-col space-y-4 ${col.color}`}
              >
                {/* Column Header */}
                <div className="flex justify-between items-center border-b pb-2 border-outline-variant/15">
                  <h4 className="font-label-md text-label-md text-primary font-bold">{col.title}</h4>
                  <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-0.5 rounded-full">
                    {items.length}
                  </span>
                </div>

                {/* Column Items */}
                <div className="flex-grow space-y-3 overflow-y-auto max-h-[480px] pr-1">
                  {items.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center text-outline/65 py-8 text-[11px] font-medium">
                      No applications here
                    </div>
                  ) : (
                    items.map((item, idx) => (
                      <div 
                        key={idx} 
                        className="bg-white border border-outline-variant/30 rounded-xl p-3 shadow-xs hover:shadow-md transition-shadow space-y-3 border-l-2 border-l-secondary"
                      >
                        <p className="font-label-sm text-label-sm text-primary font-bold leading-tight break-words">
                          {item.scholarship_name}
                        </p>
                        
                        {/* Status Mover Selector */}
                        <div className="space-y-1">
                          <label className="text-[9px] uppercase tracking-wider text-outline font-semibold">Move to:</label>
                          <select
                            value={item.status}
                            onChange={(e) => handleUpdateStatus(item.scholarship_name, e.target.value)}
                            disabled={actionLoading}
                            className="w-full text-xs font-semibold bg-surface-container border border-outline-variant/35 rounded-lg py-1 px-1.5 outline-none text-primary cursor-pointer"
                          >
                            {columns.map(c => (
                              <option key={c.id} value={c.id}>{c.title}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ))
                  )}
                </div>

              </div>
            );
          })}

        </div>
      )}

    </div>
  );
}
