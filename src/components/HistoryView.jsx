import React, { useState } from 'react';
import { Calendar, User, Search, Trash2, ChevronRight, FileText, IndianRupee, ArrowLeft, RefreshCw } from 'lucide-react';

export default function HistoryView({ submissions, onDelete, onViewDetails, onRefresh }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = submissions.filter(sub => 
    sub.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sub.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sub.course_year.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString) => {
    try {
      const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
      return new Date(dateString).toLocaleDateString('en-IN', options);
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-display-lg text-display-lg text-primary">Assessment History</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">Review, delete or reprint previously generated scholarship reports.</p>
        </div>
        
        {/* Refresh button */}
        <button
          onClick={onRefresh}
          className="flex items-center gap-1.5 self-start sm:self-auto bg-white border border-outline-variant/40 text-primary px-3.5 py-2 rounded-lg hover:bg-surface-container-low transition-all duration-200 font-label-md text-label-md"
        >
          <RefreshCw size={15} />
          Sync
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-outline">
          <Search size={18} />
        </span>
        <input
          type="text"
          placeholder="Search history by student name, category, or course..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full h-12 pl-11 pr-4 rounded-lg border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-body-md text-body-md bg-surface-bright text-on-surface"
        />
      </div>

      {/* History Grid/List */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-outline-variant/30 rounded-xl py-12 text-center shadow-sm">
          <FileText size={48} className="mx-auto text-outline mb-3" />
          <p className="font-body-lg text-body-lg text-on-surface-variant font-medium">No submission logs found</p>
          <p className="font-body-md text-body-md text-outline mt-1">
            {searchTerm ? 'No results matched your search term.' : 'New submissions will automatically show up here.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-outline-variant/30 overflow-hidden divide-y divide-outline-variant/20">
          {filtered.map((sub) => {
            const numScholarships = sub.result_json?.length || 0;
            return (
              <div
                key={sub.id}
                className="p-5 hover:bg-surface-container-low transition-colors duration-200 flex flex-col md:flex-row md:items-center justify-between gap-4 group cursor-pointer"
              >
                {/* Profile Overview */}
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 bg-primary-container text-primary rounded-lg group-hover:scale-105 transition-transform">
                      <User size={16} />
                    </span>
                    <h3 className="font-label-md text-label-md text-primary font-bold">
                      {sub.name}
                    </h3>
                    <span className="text-xs px-2.5 py-0.5 bg-surface-container border border-outline-variant/40 text-on-surface-variant rounded-full font-semibold">
                      {sub.category}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-on-surface-variant">
                    <span className="flex items-center gap-1">
                      <Calendar size={13} className="text-secondary" />
                      {formatDate(sub.created_at)}
                    </span>
                    <span>•</span>
                    <span>Course: <strong className="text-on-surface font-semibold">{sub.course_year}</strong></span>
                    <span>•</span>
                    <span>Marks: <strong className="text-on-surface font-semibold">{sub.marks}%</strong></span>
                    <span>•</span>
                    <span>Income: <strong className="text-on-surface font-semibold">₹{parseFloat(sub.income).toLocaleString()}</strong></span>
                  </div>
                </div>

                {/* Status and Action Buttons */}
                <div className="flex items-center justify-between md:justify-end gap-3.5 border-t border-outline-variant/10 md:border-t-0 pt-3 md:pt-0">
                  <div className="text-left md:text-right shrink-0">
                    <p className="font-label-sm text-label-sm text-on-surface-variant font-medium">Matched Schemes</p>
                    <p className="font-headline-md text-headline-md text-secondary font-bold flex items-center md:justify-end gap-0.5 mt-0.5">
                      {numScholarships > 0 ? (
                        <>
                          {numScholarships} eligible
                        </>
                      ) : (
                        <span className="text-outline font-normal">None matched</span>
                      )}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* View Details Button */}
                    <button
                      onClick={() => onViewDetails(sub)}
                      className="bg-surface-container-low text-primary hover:bg-primary hover:text-on-primary p-2.5 rounded-lg border border-outline-variant/40 hover:border-primary transition-all duration-200 font-label-md text-label-md font-semibold flex items-center gap-1 group/btn"
                      title="View full report"
                    >
                      <FileText size={15} />
                      <span className="hidden sm:inline">Details</span>
                      <ChevronRight size={14} className="group-hover/btn:translate-x-0.5 transition-transform" />
                    </button>

                    {/* Delete Button */}
                    <button
                      onClick={() => onDelete(sub.id)}
                      className="bg-error-container/10 text-error hover:bg-error hover:text-on-error p-2.5 rounded-lg border border-error/20 transition-all duration-200 font-label-md text-label-md font-semibold flex items-center gap-1"
                      title="Delete record"
                    >
                      <Trash2 size={15} />
                      <span className="hidden sm:inline">Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
