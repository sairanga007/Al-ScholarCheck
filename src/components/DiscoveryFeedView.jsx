import React, { useState, useEffect } from 'react';
import { Sparkles, TrendingUp, Zap, Clock, Star, Award, CheckCircle2, AlertCircle } from 'lucide-react';
import { translations } from '../utils/translate';

export default function DiscoveryFeedView({ user, lang, onNavigate }) {
  const [allScholarships, setAllScholarships] = useState([]);
  const [loading, setLoading] = useState(true);
  const t = translations[lang || 'en'];

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/scholarships');
        if (res.ok) {
          const data = await res.json();
          setAllScholarships(data);
        }
      } catch (err) {
        console.error('Error fetching discovery feed:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Calculate Profile Completion %
  const fields = ['name', 'marks', 'stream', 'home_state', 'income', 'category', 'gender', 'course_year'];
  const filledFields = fields.filter(f => user && user[f] !== undefined && user[f] !== '' && user[f] !== 0);
  const completionPercentage = Math.round((filledFields.length / fields.length) * 100);

  // Parse badges
  let badgesList = [];
  try {
    badgesList = JSON.parse(user?.badges_json || '[]');
  } catch (e) {
    badgesList = [];
  }

  // Filter scholarships
  // 1. Trending (mock condition: name contains 'epass', 'central' or 'l\'oréal')
  const trending = allScholarships.filter(s => 
    s.scholarship_name.toLowerCase().includes('epass') || 
    s.scholarship_name.toLowerCase().includes('central') ||
    s.scholarship_name.toLowerCase().includes('l\'oréal') ||
    s.scholarship_name.toLowerCase().includes('kotak')
  ).slice(0, 3);

  // 2. Newly launched (deadlines furthest in the future)
  const newlyLaunched = [...allScholarships]
    .sort((a, b) => new Date(b.deadline || '') - new Date(a.deadline || ''))
    .slice(0, 3);

  // 3. Recommended for you (fully matching category or marks)
  const recommended = allScholarships.filter(s => {
    if (!user) return false;
    const userCat = (user.category || '').toLowerCase();
    const scCat = (s.category || '').toLowerCase();
    const userMarks = parseFloat(user.marks) || 0;
    const sMarks = s.minimum_marks || 0;
    const userIncome = parseFloat(user.income) || 0;
    const sIncome = s.income_limit || Infinity;

    return (scCat === 'general' || scCat === userCat) && userMarks >= sMarks && userIncome <= sIncome;
  }).slice(0, 3);

  // Safe fallback if recommended is empty
  const recommendedList = recommended.length > 0 ? recommended : allScholarships.slice(0, 3);

  return (
    <div className="space-y-8">
      {/* Top Gamification Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Profile Completion Meter */}
        <div className="bg-white border border-outline-variant/30 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="font-label-md text-label-md text-primary font-bold">{t.profileCompletion}</h4>
            <span className="text-secondary font-bold text-headline-md">{completionPercentage}%</span>
          </div>
          <div className="w-full bg-surface-container rounded-full h-3">
            <div 
              className="bg-secondary h-3 rounded-full transition-all duration-500" 
              style={{ width: `${completionPercentage}%` }}
            ></div>
          </div>
          <p className="text-label-sm text-on-surface-variant font-medium">
            {completionPercentage === 100 
              ? 'Awesome! Your profile is fully optimized for AI reviews.' 
              : 'Complete your profile parameter details to unlock all matching recommendations.'}
          </p>
          {completionPercentage < 100 && (
            <button 
              onClick={() => onNavigate('profile')}
              className="text-label-sm font-bold text-secondary hover:underline flex items-center gap-1"
            >
              Complete Profile Parameters →
            </button>
          )}
        </div>

        {/* Daily Streak Indicator */}
        <div className="bg-white border border-outline-variant/30 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl border border-amber-200 animate-pulse">
            <Zap size={32} fill="currentColor" />
          </div>
          <div className="space-y-1">
            <h4 className="font-label-sm text-label-sm text-on-surface-variant font-semibold">{t.streaks}</h4>
            <p className="font-display-lg text-display-lg text-primary font-extrabold flex items-baseline gap-1">
              {user?.streak_count || 1}
              <span className="text-body-md text-outline font-normal">{t.activeDays}</span>
            </p>
            <p className="text-label-sm text-outline font-medium">Log in daily to maintain your milestone score!</p>
          </div>
        </div>

        {/* Badges Earned */}
        <div className="bg-white border border-outline-variant/30 rounded-2xl p-5 shadow-sm space-y-3">
          <h4 className="font-label-md text-label-md text-primary font-bold flex items-center gap-1.5">
            <Award size={18} className="text-secondary" /> {t.badges} ({badgesList.length})
          </h4>
          {badgesList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-2 text-center text-outline">
              <p className="text-label-sm font-medium">No digital badges earned yet.</p>
              <p className="text-[10px] mt-0.5">Complete form assessments or maintain streaks to earn badges.</p>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-3 pt-1">
              {badgesList.map((badge, idx) => (
                <div 
                  key={idx} 
                  className="flex flex-col items-center justify-center p-2 rounded-xl bg-surface-container border border-outline-variant/30 hover:scale-105 transition-transform"
                  title={`${badge.name}: ${badge.desc} (Earned ${badge.date})`}
                >
                  <span className="text-xl">🏆</span>
                  <span className="text-[9px] font-bold text-primary truncate w-full text-center mt-1">{badge.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Discovery Feed Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recommended for Profile Column */}
        <div className="bg-white border border-outline-variant/20 rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="font-headline-md text-headline-md text-primary font-bold flex items-center gap-2 border-b pb-3 border-outline-variant/20">
            <Sparkles size={20} className="text-secondary" /> {t.recommended}
          </h3>
          {loading ? (
            <div className="py-12 text-center text-outline">Loading suggestions...</div>
          ) : (
            <div className="space-y-4">
              {recommendedList.map((s, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-outline-variant/30 bg-surface-container-low hover:border-secondary transition-all space-y-2">
                  <h4 className="font-label-md text-label-md text-primary font-bold leading-snug">{s.scholarship_name}</h4>
                  <div className="flex justify-between items-center text-label-sm text-on-surface-variant font-medium">
                    <span>Award: <strong className="text-secondary">₹{(s.description.match(/\d+/) ? s.description.match(/\d+/)[0] + 'K' : 'Varies')}</strong></span>
                    <span>Min Marks: <strong>{s.minimum_marks}%</strong></span>
                  </div>
                  <div className="flex justify-between items-center pt-1.5 border-t border-outline-variant/10 text-[11px] font-semibold text-outline">
                    <span>Limit: ₹{s.income_limit ? s.income_limit.toLocaleString() : 'N/A'}</span>
                    <span className="text-primary">Deadline: {s.deadline}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Trending Scholarships Column */}
        <div className="bg-white border border-outline-variant/20 rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="font-headline-md text-headline-md text-primary font-bold flex items-center gap-2 border-b pb-3 border-outline-variant/20">
            <TrendingUp size={20} className="text-amber-500" /> {t.trending}
          </h3>
          {loading ? (
            <div className="py-12 text-center text-outline">Loading suggestions...</div>
          ) : (
            <div className="space-y-4">
              {trending.map((s, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-outline-variant/30 bg-surface-container-low hover:border-amber-500 transition-all space-y-2">
                  <h4 className="font-label-md text-label-md text-primary font-bold leading-snug">{s.scholarship_name}</h4>
                  <div className="flex justify-between items-center text-label-sm text-on-surface-variant font-medium">
                    <span>Category: <strong>{s.category}</strong></span>
                    <span>Min Marks: <strong>{s.minimum_marks}%</strong></span>
                  </div>
                  <div className="flex justify-between items-center pt-1.5 border-t border-outline-variant/10 text-[11px] font-semibold text-outline">
                    <span>Limit: ₹{s.income_limit ? s.income_limit.toLocaleString() : 'N/A'}</span>
                    <span className="text-primary">Deadline: {s.deadline}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* New Opportunities Column */}
        <div className="bg-white border border-outline-variant/20 rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="font-headline-md text-headline-md text-primary font-bold flex items-center gap-2 border-b pb-3 border-outline-variant/20">
            <Clock size={20} className="text-sky-500" /> {t.newOpportunities}
          </h3>
          {loading ? (
            <div className="py-12 text-center text-outline">Loading suggestions...</div>
          ) : (
            <div className="space-y-4">
              {newlyLaunched.map((s, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-outline-variant/30 bg-surface-container-low hover:border-sky-500 transition-all space-y-2">
                  <h4 className="font-label-md text-label-md text-primary font-bold leading-snug">{s.scholarship_name}</h4>
                  <div className="flex justify-between items-center text-label-sm text-on-surface-variant font-medium">
                    <span>Category: <strong>{s.category}</strong></span>
                    <span>Min Marks: <strong>{s.minimum_marks}%</strong></span>
                  </div>
                  <div className="flex justify-between items-center pt-1.5 border-t border-outline-variant/10 text-[11px] font-semibold text-outline">
                    <span>Limit: ₹{s.income_limit ? s.income_limit.toLocaleString() : 'N/A'}</span>
                    <span className="text-primary">Deadline: {s.deadline}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
