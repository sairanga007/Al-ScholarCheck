import React, { useState, useEffect } from 'react';
import { BookOpen, GraduationCap, RefreshCw, Star, Info, ExternalLink } from 'lucide-react';
import { translations } from '../utils/translate';

export default function CollegeBundleView({ user, lang }) {
  const [colleges, setColleges] = useState([]);
  const [streamFilter, setStreamFilter] = useState(user?.stream || 'Engineering');
  const [stateFilter, setStateFilter] = useState(user?.home_state || 'Telangana');
  const [loading, setLoading] = useState(true);

  const t = translations[lang || 'en'];

  const streamsList = ['Engineering', 'Medical', 'Science', 'Commerce', 'Arts'];
  const statesList = [
    'Telangana', 'Andhra Pradesh', 'Karnataka', 'Maharashtra',
    'Tamil Nadu', 'Kerala', 'Delhi', 'Gujarat', 'Rajasthan', 'Others'
  ];

  const fetchCollegeBundles = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/colleges/bundle?stream=${encodeURIComponent(streamFilter)}&state=${encodeURIComponent(stateFilter)}`);
      if (res.ok) {
        const data = await res.json();
        setColleges(data);
      }
    } catch (err) {
      console.error('Error fetching college bundles:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollegeBundles();
  }, [streamFilter, stateFilter]);

  return (
    <div className="space-y-6">
      
      {/* Search Header Filters */}
      <div className="bg-white border border-outline-variant/35 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="space-y-1">
          <h2 className="font-display-lg text-display-lg text-primary flex items-center gap-2">
            <GraduationCap size={28} className="text-secondary" /> {t.collegeBundleTitle}
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant">
            {t.collegeBundleDesc}
          </p>
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <div className="space-y-1">
            <label className="block font-label-sm text-label-sm text-on-surface font-semibold">{t.stream}</label>
            <select
              value={streamFilter}
              onChange={(e) => setStreamFilter(e.target.value)}
              className="w-full h-11 px-3 rounded-lg border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none font-body-md bg-surface-bright text-on-surface"
            >
              {streamsList.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="space-y-1">
            <label className="block font-label-sm text-label-sm text-on-surface font-semibold">{t.homeState}</label>
            <select
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              className="w-full h-11 px-3 rounded-lg border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none font-body-md bg-surface-bright text-on-surface"
            >
              {statesList.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* College List Result */}
      {loading ? (
        <div className="bg-white border border-outline-variant/25 rounded-2xl p-12 text-center text-outline">
          <RefreshCw className="animate-spin mx-auto mb-2 text-secondary" size={24} />
          Loading college matching bundles...
        </div>
      ) : colleges.length === 0 ? (
        <div className="bg-white border border-outline-variant/20 rounded-2xl p-12 text-center text-outline font-medium text-body-md">
          No matching institutions found for this stream and state code.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {colleges.map((college, idx) => (
            <div key={idx} className="bg-white border border-outline-variant/30 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col space-y-4">
              
              {/* College Title Block */}
              <div className="space-y-1">
                <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-full border border-outline-variant/40 text-secondary-container bg-secondary/10`}>
                  {college.type} Institute
                </span>
                <h4 className="font-headline-md text-headline-md text-primary font-bold">{college.name}</h4>
                <p className="text-label-sm text-outline font-medium">{college.state} • {college.stream} Branch</p>
              </div>

              {/* Fee and Scholarship matching cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-surface-bright border border-outline-variant/10 p-3 rounded-xl">
                <div>
                  <span className="text-[10px] text-on-surface-variant font-semibold uppercase tracking-wider block">Estimated Fee</span>
                  <span className="font-bold text-primary font-body-lg block mt-0.5">{college.fees}</span>
                </div>
                <div>
                  <span className="text-[10px] text-on-surface-variant font-semibold uppercase tracking-wider block">Eligible Schemes</span>
                  <span className="font-bold text-secondary font-body-lg block mt-0.5">{college.scholarships?.length || 0} matched</span>
                </div>
              </div>

              {/* Matching Scholarships list */}
              <div className="space-y-2 flex-grow">
                <span className="text-[10px] text-on-surface-variant font-semibold uppercase tracking-wider block">{t.eligibleScholarships}:</span>
                <div className="space-y-1.5">
                  {college.scholarships?.map((sName, sIdx) => (
                    <div key={sIdx} className="flex items-center justify-between text-body-md text-on-surface-variant bg-surface-container-low px-3 py-2 rounded-lg border border-outline-variant/10 font-medium">
                      <span className="truncate pr-4">{sName}</span>
                      <a 
                        href="https://scholarships.gov.in"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-secondary hover:underline flex items-center gap-0.5 shrink-0 text-xs font-bold"
                      >
                        Info <ExternalLink size={12} />
                      </a>
                    </div>
                  ))}
                </div>
              </div>



            </div>
          ))}
        </div>
      )}

    </div>
  );
}
