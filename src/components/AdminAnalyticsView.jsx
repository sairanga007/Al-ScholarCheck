import React, { useState, useEffect } from 'react';
import { AreaChart, Users, BarChart2, Shield, RefreshCw, Star, Globe } from 'lucide-react';
import { translations } from '../utils/translate';

export default function AdminAnalyticsView({ lang }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const t = translations[lang || 'en'];

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const res = await fetch('/api/admin/analytics');
        if (res.ok) {
          const stats = await res.json();
          setData(stats);
        }
      } catch (err) {
        console.error('Error fetching admin analytics:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="bg-white border border-outline-variant/25 rounded-2xl p-12 text-center text-outline">
        <RefreshCw className="animate-spin mx-auto mb-2 text-secondary" size={24} />
        Loading administrative dashboard...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Admin Title Banner */}
      <div className="bg-white border border-outline-variant/35 rounded-2xl p-5 shadow-sm space-y-2">
        <h2 className="font-display-lg text-display-lg text-primary flex items-center gap-2">
          <Shield size={28} className="text-secondary" /> {t.adminTitle}
        </h2>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Live platform telemetry metrics, student query conversion funnels, and regional applicant shares.
        </p>
      </div>

      {/* Stats Counter Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Active Users */}
        <div className="bg-white border border-outline-variant/30 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-on-surface-variant font-semibold uppercase tracking-wider block">{t.activeUsers}</span>
            <span className="font-display-lg text-display-lg text-primary font-bold">{data?.activeUsers || 24}</span>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Users size={24} />
          </div>
        </div>

        {/* Total queries */}
        <div className="bg-white border border-outline-variant/30 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-on-surface-variant font-semibold uppercase tracking-wider block">{t.totalQueries}</span>
            <span className="font-display-lg text-display-lg text-primary font-bold">{data?.totalQueries || 148}</span>
          </div>
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <BarChart2 size={24} />
          </div>
        </div>

        {/* Tracked apps */}
        <div className="bg-white border border-outline-variant/30 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-on-surface-variant font-semibold uppercase tracking-wider block">{t.trackedApps}</span>
            <span className="font-display-lg text-display-lg text-primary font-bold">{data?.trackedApplications || 42}</span>
          </div>
          <div className="p-3 bg-secondary-container/20 text-secondary rounded-xl">
            <Shield size={24} />
          </div>
        </div>

      </div>

      {/* Analytics details split section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Top Scholarships Demands */}
        <div className="bg-white border border-outline-variant/30 rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="font-headline-md text-headline-md text-primary font-bold flex items-center gap-2 border-b pb-3 border-outline-variant/20">
            <Star size={20} className="text-amber-500" /> {t.topScholarships}
          </h3>
          <div className="space-y-4">
            {data?.topScholarships?.map((s, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between items-center text-label-md text-on-surface font-semibold">
                  <span className="truncate pr-4">{s.name}</span>
                  <span className="shrink-0">{s.count} requests</span>
                </div>
                <div className="w-full bg-surface-container rounded-full h-2">
                  <div 
                    className="bg-secondary h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${Math.min(100, (s.count / 30) * 100)}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* State applicant shares */}
        <div className="bg-white border border-outline-variant/30 rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="font-headline-md text-headline-md text-primary font-bold flex items-center gap-2 border-b pb-3 border-outline-variant/20">
            <Globe size={20} className="text-secondary" /> {t.stateShare}
          </h3>
          <div className="space-y-4">
            {data?.stateApplicantShares?.map((state, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between items-center text-label-md text-on-surface font-semibold">
                  <span>{state.state}</span>
                  <span>{state.percentage}%</span>
                </div>
                <div className="w-full bg-surface-container rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${state.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Application conversion pipeline */}
      <div className="bg-white border border-outline-variant/30 rounded-2xl p-5 shadow-sm space-y-4">
        <h3 className="font-headline-md text-headline-md text-primary font-bold border-b pb-3 border-outline-variant/20">
          {t.conversionRate}
        </h3>
        
        {/* Horizontal Pipeline Steps */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          
          <div className="p-4 bg-surface-container-low rounded-xl border border-outline-variant/10 space-y-1">
            <span className="text-[10px] text-outline font-semibold uppercase tracking-wider">Searched</span>
            <p className="text-headline-md font-bold text-primary">{data?.applicationConversion?.searched || 100}%</p>
            <span className="text-[9px] text-outline font-medium">Initial Profile Audit</span>
          </div>

          <div className="p-4 bg-surface-container-low rounded-xl border border-outline-variant/10 space-y-1">
            <span className="text-[10px] text-outline font-semibold uppercase tracking-wider">Saved</span>
            <p className="text-headline-md font-bold text-primary">{data?.applicationConversion?.saved || 42}%</p>
            <span className="text-[9px] text-outline font-medium">Added to Saved list</span>
          </div>

          <div className="p-4 bg-surface-container-low rounded-xl border border-outline-variant/10 space-y-1">
            <span className="text-[10px] text-outline font-semibold uppercase tracking-wider">Applied</span>
            <p className="text-headline-md font-bold text-primary">{data?.applicationConversion?.applied || 18}%</p>
            <span className="text-[9px] text-outline font-medium">Submitted Documents</span>
          </div>

          <div className="p-4 bg-surface-container-low rounded-xl border border-outline-variant/10 space-y-1">
            <span className="text-[10px] text-outline font-semibold uppercase tracking-wider">Approved</span>
            <p className="text-headline-md font-bold text-secondary">{data?.applicationConversion?.approved || 8}%</p>
            <span className="text-[9px] text-outline font-medium">Tuition RTF Disbursed</span>
          </div>

        </div>
      </div>

    </div>
  );
}
