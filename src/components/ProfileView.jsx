import React, { useState, useEffect } from 'react';
import { User, IndianRupee, GraduationCap, Award, BookOpen, UserCheck, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ProfileView({ user, onProfileUpdate, showToast }) {
  const [formData, setFormData] = useState({
    name: user.name || '',
    marks: user.marks || '',
    stream: user.stream || '',
    home_state: user.home_state || '',
    income: user.income || '',
    category: user.category || '',
    gender: user.gender || '',
    course_year: user.course_year || ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const streams = ['Engineering', 'Medical', 'Science', 'Commerce', 'Arts'];
  const categories = [
    { value: 'General', label: 'General / Open' },
    { value: 'OBC', label: 'OBC (Other Backward Classes)' },
    { value: 'SC', label: 'SC (Scheduled Caste)' },
    { value: 'ST', label: 'ST (Scheduled Tribe)' },
    { value: 'EWS', label: 'EWS (Economically Weaker Section)' },
    { value: 'Minority', label: 'Minority (Muslim, Christian, etc.)' }
  ];
  const genders = ['Male', 'Female', 'Other'];
  const states = [
    'Telangana', 'Andhra Pradesh', 'Karnataka', 'Maharashtra',
    'Tamil Nadu', 'Kerala', 'Delhi', 'Gujarat', 'Rajasthan', 'Others'
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.stream || !formData.home_state || !formData.category || !formData.gender) {
      setError('Please fill in all profile fields.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/profile/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          marks: parseFloat(formData.marks) || 0,
          income: parseFloat(formData.income) || 0
        })
      });

      const data = await res.json();
      if (res.ok) {
        onProfileUpdate(data.user);
        showToast('Profile parameters saved successfully.');
      } else {
        setError(data.error || 'Failed to update profile.');
      }
    } catch (err) {
      console.error(err);
      setError('Connection error. Could not update profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-white border border-outline-variant/30 rounded-xl p-6 md:p-8 shadow-sm">

      {/* Title */}
      <div className="mb-6 border-b border-outline-variant/30 pb-4 flex items-center gap-3">
        <div className="bg-primary-container p-2.5 rounded-lg text-primary shadow-sm">
          <UserCheck size={24} />
        </div>
        <div>
          <h2 className="font-headline-md text-headline-md font-bold text-primary leading-none">Student Profile Manager</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">Configure profile parameters for the AI Scholarship Advisor</p>
        </div>
      </div>

      {error && (
        <div className="mb-5 bg-error-container/10 border border-error/20 text-error px-4 py-3 rounded-lg flex items-start gap-2.5 font-label-sm text-label-sm">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Profile Editor Form */}
      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Full Name */}
        <div>
          <label className="block font-label-md text-label-md text-on-surface mb-1.5">
            Full Name
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-outline">
              <User size={18} />
            </span>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., Sai Kumar"
              className="w-full h-12 pl-11 pr-4 rounded-lg border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-body-md text-body-md bg-surface-bright text-on-surface"
              required
            />
          </div>
        </div>

        {/* Double Column Layouts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Gender */}
          <div>
            <label className="block font-label-md text-label-md text-on-surface mb-1.5">
              Gender
            </label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className="w-full h-12 px-4 rounded-lg border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-body-md text-body-md bg-surface-bright text-on-surface appearance-none"
              required
            >
              <option value="">Select Gender</option>
              {genders.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>

          {/* Social Category */}
          <div>
            <label className="block font-label-md text-label-md text-on-surface mb-1.5">
              Social Category
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full h-12 px-4 rounded-lg border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-body-md text-body-md bg-surface-bright text-on-surface appearance-none"
              required
            >
              <option value="">Select Category</option>
              {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Stream */}
          <div>
            <label className="block font-label-md text-label-md text-on-surface mb-1.5">
              Academic Stream
            </label>
            <select
              name="stream"
              value={formData.stream}
              onChange={handleChange}
              className="w-full h-12 px-4 rounded-lg border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-body-md text-body-md bg-surface-bright text-on-surface appearance-none"
              required
            >
              <option value="">Select Stream</option>
              {streams.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Home State */}
          <div>
            <label className="block font-label-md text-label-md text-on-surface mb-1.5">
              Home State
            </label>
            <select
              name="home_state"
              value={formData.home_state}
              onChange={handleChange}
              className="w-full h-12 px-4 rounded-lg border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-body-md text-body-md bg-surface-bright text-on-surface appearance-none"
              required
            >
              <option value="">Select State</option>
              {states.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Annual Family Income */}
          <div>
            <label className="block font-label-md text-label-md text-on-surface mb-1.5 flex items-center gap-1">
              Annual Family Income (INR)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-outline">
                <IndianRupee size={18} />
              </span>
              <input
                type="number"
                name="income"
                value={formData.income}
                onChange={handleChange}
                placeholder="e.g., 200000"
                className="w-full h-12 pl-11 pr-4 rounded-lg border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-body-md text-body-md bg-surface-bright text-on-surface"
                min="0"
                required
              />
            </div>
          </div>

          {/* Academic Marks */}
          <div>
            <label className="block font-label-md text-label-md text-on-surface mb-1.5 flex items-center gap-1">
              Academic Marks (Percentage)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-outline">
                <Award size={18} />
              </span>
              <input
                type="number"
                name="marks"
                value={formData.marks}
                onChange={handleChange}
                placeholder="e.g., 85"
                className="w-full h-12 pl-11 pr-4 rounded-lg border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-body-md text-body-md bg-surface-bright text-on-surface"
                min="0"
                max="100"
                step="0.01"
                required
              />
            </div>
          </div>
        </div>

        {/* Course Year */}
        <div>
          <label className="block font-label-md text-label-md text-on-surface mb-1.5 flex items-center gap-1">
            Course & Year of Study
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-outline">
              <BookOpen size={18} />
            </span>
            <input
              type="text"
              name="course_year"
              value={formData.course_year}
              onChange={handleChange}
              placeholder="e.g., B.Tech 2nd Year, Class 12"
              className="w-full h-12 pl-11 pr-4 rounded-lg border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-body-md text-body-md bg-surface-bright text-on-surface"
              required
            />
          </div>
        </div>

        {/* Save Button */}
        <button
          type="submit"
          disabled={saving}
          className="w-full bg-primary text-on-primary h-12 rounded-lg font-label-md text-label-md hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 shadow-md mt-6 disabled:opacity-50"
        >
          {saving ? 'Saving changes...' : 'Save Profile Parameters'}
        </button>

      </form>
    </div>
  );
}
