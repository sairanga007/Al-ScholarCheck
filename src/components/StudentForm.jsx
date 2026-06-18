import React, { useState } from 'react';
import { User, IndianRupee, GraduationCap, Award, BookOpen, Sparkles, AlertCircle } from 'lucide-react';

export default function StudentForm({ onSubmit, loading }) {
  const [formData, setFormData] = useState({
    name: '',
    income: '',
    marks: '',
    category: '',
    courseYear: ''
  });

  const [errors, setErrors] = useState({});

  const categories = [
    { value: 'General', label: 'General / Open' },
    { value: 'OBC', label: 'OBC (Other Backward Classes)' },
    { value: 'SC', label: 'SC (Scheduled Caste)' },
    { value: 'ST', label: 'ST (Scheduled Tribe)' },
    { value: 'EWS', label: 'EWS (Economically Weaker Section)' },
    { value: 'Minority', label: 'Minority (Muslim, Christian, etc.)' }
  ];

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Full name is required';
    
    if (!formData.income) {
      newErrors.income = 'Annual family income is required';
    } else if (parseFloat(formData.income) < 0) {
      newErrors.income = 'Income cannot be negative';
    }

    if (!formData.marks) {
      newErrors.marks = 'Academic marks are required';
    } else {
      const marksVal = parseFloat(formData.marks);
      if (marksVal < 0 || marksVal > 100) {
        newErrors.marks = 'Marks must be a percentage between 0 and 100';
      }
    }

    if (!formData.category) newErrors.category = 'Please select a social category';
    if (!formData.courseYear.trim()) newErrors.courseYear = 'Please enter your current course and year';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSubmit({
        ...formData,
        income: parseFloat(formData.income),
        marks: parseFloat(formData.marks)
      });
    }
  };

  return (
    <div className="bg-white border border-outline-variant/30 rounded-xl p-6 md:p-8 shadow-sm max-w-2xl mx-auto transition-all duration-300">
      <div className="mb-6 text-center">
        <div className="inline-flex p-3 bg-primary-container text-on-primary-container rounded-lg mb-3">
          <Sparkles size={28} />
        </div>
        <h2 className="font-headline-lg text-headline-lg font-bold text-primary tracking-tight">Eligibility Assessment</h2>
        <p className="font-body-md text-body-md text-on-surface-variant mt-1">
          Fill in candidate details below to scan eligible state and institutional scholarships.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Name */}
        <div>
          <label className="block font-label-md text-label-md text-on-surface mb-1.5 flex items-center gap-1.5">
            <User size={16} className="text-secondary" /> Full Name
          </label>
          <div className="relative">
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., Sai Kumar"
              className={`w-full h-12 px-4 rounded-lg border ${
                errors.name ? 'border-error' : 'border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary'
              } outline-none transition-all font-body-md text-body-md bg-surface-bright text-on-surface`}
            />
          </div>
          {errors.name && (
            <p className="text-error font-label-sm text-label-sm mt-1 flex items-center gap-1">
              <AlertCircle size={12} /> {errors.name}
            </p>
          )}
        </div>

        {/* Two column layouts for Income and Marks */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Family Income */}
          <div>
            <label className="block font-label-md text-label-md text-on-surface mb-1.5 flex items-center gap-1.5">
              <IndianRupee size={16} className="text-secondary" /> Annual Family Income (INR)
            </label>
            <div className="relative">
              <input
                type="number"
                name="income"
                value={formData.income}
                onChange={handleChange}
                placeholder="e.g., 120000"
                min="0"
                className={`w-full h-12 px-4 rounded-lg border ${
                  errors.income ? 'border-error' : 'border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary'
                } outline-none transition-all font-body-md text-body-md bg-surface-bright text-on-surface`}
              />
            </div>
            {errors.income && (
              <p className="text-error font-label-sm text-label-sm mt-1 flex items-center gap-1">
                <AlertCircle size={12} /> {errors.income}
              </p>
            )}
          </div>

          {/* Academic Marks */}
          <div>
            <label className="block font-label-md text-label-md text-on-surface mb-1.5 flex items-center gap-1.5">
              <Award size={16} className="text-secondary" /> Academic Marks (Percentage)
            </label>
            <div className="relative">
              <input
                type="number"
                name="marks"
                value={formData.marks}
                onChange={handleChange}
                placeholder="e.g., 85"
                min="0"
                max="100"
                step="0.01"
                className={`w-full h-12 px-4 rounded-lg border ${
                  errors.marks ? 'border-error' : 'border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary'
                } outline-none transition-all font-body-md text-body-md bg-surface-bright text-on-surface`}
              />
            </div>
            {errors.marks && (
              <p className="text-error font-label-sm text-label-sm mt-1 flex items-center gap-1">
                <AlertCircle size={12} /> {errors.marks}
              </p>
            )}
          </div>
        </div>

        {/* Category & Course */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Category */}
          <div>
            <label className="block font-label-md text-label-md text-on-surface mb-1.5 flex items-center gap-1.5">
              <GraduationCap size={16} className="text-secondary" /> Social Category
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className={`w-full h-12 px-4 rounded-lg border ${
                errors.category ? 'border-error' : 'border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary'
              } outline-none transition-all font-body-md text-body-md bg-surface-bright text-on-surface appearance-none`}
            >
              <option value="">Select Category</option>
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
            {errors.category && (
              <p className="text-error font-label-sm text-label-sm mt-1 flex items-center gap-1">
                <AlertCircle size={12} /> {errors.category}
              </p>
            )}
          </div>

          {/* Course and Year */}
          <div>
            <label className="block font-label-md text-label-md text-on-surface mb-1.5 flex items-center gap-1.5">
              <BookOpen size={16} className="text-secondary" /> Course & Year of Study
            </label>
            <input
              type="text"
              name="courseYear"
              value={formData.courseYear}
              onChange={handleChange}
              placeholder="e.g., B.Tech 2nd Year"
              className={`w-full h-12 px-4 rounded-lg border ${
                errors.courseYear ? 'border-error' : 'border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary'
              } outline-none transition-all font-body-md text-body-md bg-surface-bright text-on-surface`}
            />
            {errors.courseYear && (
              <p className="text-error font-label-sm text-label-sm mt-1 flex items-center gap-1">
                <AlertCircle size={12} /> {errors.courseYear}
              </p>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full mt-4 bg-primary text-on-primary h-12 px-8 rounded-lg font-label-md text-label-md hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-on-primary" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Consulting AI Engine...
            </>
          ) : (
            <>
              <Sparkles size={18} /> Find Matches
            </>
          )}
        </button>
      </form>
    </div>
  );
}
