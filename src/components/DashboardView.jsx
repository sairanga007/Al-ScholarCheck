import React, { useState } from 'react';
import {
  Sparkles, Award, IndianRupee, BookOpen, UserCheck,
  ArrowRight, ShieldAlert, Calendar, CheckCircle2,
  AlertCircle, Printer, ArrowLeft, RefreshCw, ExternalLink, TrendingUp
} from 'lucide-react';

const getSafeApplicationLink = (link) => {
  if (!link) return 'https://scholarships.gov.in';
  
  const trimmed = link.trim();
  // If it's already a valid http/https URL with no spaces, return it
  if (trimmed.startsWith('http') && !trimmed.includes(' ')) {
    return trimmed;
  }
  
  // Check if it's localhost or IP address (usually http)
  if (trimmed.startsWith('localhost') || trimmed.startsWith('127.0.0.1')) {
    return `http://${trimmed}`;
  }
  
  // Check if it's a domain/link without protocol
  if (!trimmed.includes(' ') && trimmed.includes('.')) {
    return `https://${trimmed}`;
  }
  
  // Fallback to searching Google for the link text
  return `https://www.google.com/search?q=${encodeURIComponent(trimmed)}`;
};

export default function DashboardView({ user, token, showToast, onRefreshHistory, onNavigate }) {
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState(null);
  const [isMock, setIsMock] = useState(false);

  const handleConsultAdvisor = async () => {
    // Check if profile parameters are complete
    if (!user.stream || !user.home_state || !user.category || !user.gender) {
      showToast('Please complete your profile parameters first.', 'error');
      return;
    }

    setLoading(true);
    setRecommendations(null);

    try {
      const res = await fetch('/api/advisor/recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        }
      });

      const data = await res.json();
      if (res.ok) {
        setRecommendations(data.recommendations);
        setIsMock(data.isMock);
        showToast('AI Advisor assessment completed.');
        if (onRefreshHistory) onRefreshHistory();
      } else {
        showToast(data.error || 'Failed to fetch recommendations', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error connecting to AI Advisor service.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeStyles = (status) => {
    const s = status.toLowerCase();
    if (s === 'open') {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    } else if (s === 'closing soon') {
      return 'bg-amber-50 text-amber-700 border-amber-200';
    } else if (s === 'coming soon') {
      return 'bg-sky-50 text-sky-700 border-sky-200';
    } else {
      return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getTypeTagStyles = (tag) => {
    return 'bg-surface-container border border-outline-variant/40 text-on-surface-variant hover:text-primary transition-colors';
  };

  const handlePrint = () => {
    window.print();
  };

  const isProfileComplete = user.stream && user.home_state && user.category && user.gender;

  return (
    <div className="max-w-6xl mx-auto space-y-8">

      {/* 1. Dashboard Overview State */}
      {!recommendations && !loading && (
        <div className="space-y-8">
          {/* Welcome Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h2 className="font-display-lg text-display-lg text-primary md:hidden">Welcome Back</h2>
              <h2 className="font-display-lg text-display-lg text-primary hidden md:block">Welcome Back, {user.name}</h2>
              <p className="font-body-lg text-body-lg text-on-surface-variant mt-2">Let's find the best financial aid opportunities for you today.</p>
            </div>

            {/* Profile Check status */}
            <div className="shrink-0 flex items-center gap-3 bg-white border border-outline-variant/30 p-4 rounded-xl shadow-sm">
              <div className={`p-2 rounded-full ${isProfileComplete ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                {isProfileComplete ? <CheckCircle2 size={24} /> : <ShieldAlert size={24} />}
              </div>
              <div>
                <p className="font-label-sm text-label-sm text-on-surface-variant font-semibold">Profile Parameters</p>
                <p className="font-label-md text-label-md font-bold text-primary mt-0.5">
                  {isProfileComplete ? 'Fully Configured' : 'Incomplete / Missing'}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-grid-gutter">
            <div className="bg-white border border-outline-variant/30 rounded-xl p-5 space-y-2 shadow-sm">
              <p className="font-label-sm text-label-sm text-on-surface-variant font-medium uppercase tracking-wider flex items-center gap-1.5">
                <Award size={14} className="text-secondary" /> Academic Marks
              </p>
              <p className="font-display-lg text-display-lg text-primary">{user.marks ? `${user.marks}%` : 'Not Set'}</p>
            </div>

            <div className="bg-white border border-outline-variant/30 rounded-xl p-5 space-y-2 shadow-sm">
              <p className="font-label-sm text-label-sm text-on-surface-variant font-medium uppercase tracking-wider flex items-center gap-1.5">
                <IndianRupee size={14} className="text-secondary" /> Family Income
              </p>
              <p className="font-display-lg text-display-lg text-primary">{user.income ? `₹${parseFloat(user.income).toLocaleString()}` : 'Not Set'}</p>
            </div>

            <div className="bg-white border border-outline-variant/30 rounded-xl p-5 space-y-2 shadow-sm">
              <p className="font-label-sm text-label-sm text-on-surface-variant font-medium uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen size={14} className="text-secondary" /> Stream / Branch
              </p>
              <p className="font-display-lg text-display-lg text-primary truncate">{user.stream || 'Not Set'}</p>
            </div>

            <div className="bg-white border border-outline-variant/30 rounded-xl p-5 space-y-2 shadow-sm">
              <p className="font-label-sm text-label-sm text-on-surface-variant font-medium uppercase tracking-wider flex items-center gap-1.5">
                <UserCheck size={14} className="text-secondary" /> Category & Gender
              </p>
              <p className="font-display-lg text-display-lg text-primary truncate">{user.category ? `${user.category} (${user.gender})` : 'Not Set'}</p>
            </div>
          </div>

          {/* AI Advisor Callout Box */}
          <div className="bg-white border border-outline-variant/30 rounded-xl p-6 md:p-8 shadow-sm flex flex-col items-center text-center space-y-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-tertiary/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
            <div className="p-3 bg-tertiary-container/10 text-tertiary rounded-lg ai-gradient-bg">
              <Sparkles size={32} />
            </div>
            <div className="max-w-xl space-y-2">
              <h3 className="font-headline-lg text-headline-lg font-bold text-primary">Ask the AI Scholarship Advisor</h3>
              <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                Consult the **India College Navigator Advisor** engine. We will run an automated audit on your specific academic marks, stream, income, category, and state to compile 3-5 highly relevant, vetted scholarships.
              </p>
            </div>

            {!isProfileComplete ? (
              <div className="bg-error-container/10 border border-error/20 text-error rounded-lg py-3 px-6 font-label-sm text-label-sm flex items-center gap-2 max-w-md">
                <AlertCircle size={16} className="shrink-0" />
                <span>You must complete your details on the <strong>Profile tab</strong> before you can run the AI Advisor.</span>
              </div>
            ) : (
              <button
                onClick={handleConsultAdvisor}
                className="bg-primary text-on-primary h-12 px-8 rounded-lg font-label-md text-label-md hover:bg-primary/90 transition-colors flex items-center gap-2 shadow-md"
              >
                Launch Consultation Check <ArrowRight size={16} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* 2. Loading State */}
      {loading && (
        <div className="bg-white border border-outline-variant/30 rounded-xl p-8 md:p-12 text-center space-y-6 shadow-sm">
          <div className="flex justify-center">
            <svg className="animate-spin h-10 w-10 text-primary" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <div className="space-y-2">
            <h3 className="font-headline-md text-headline-md text-primary font-bold">Consulting AI Advisor Engine...</h3>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-sm mx-auto">
              Analyzing marks, checking state codes ({user.home_state}), reviewing gender quotas ({user.gender}), and evaluating category matches ({user.category}).
            </p>
          </div>
        </div>
      )}

      {/* 3. Recommendations Result State */}
      {recommendations && !loading && (
        <div className="space-y-6">
          {/* Header Action Bar */}
          <div className="no-print flex justify-between items-center">
            <button
              onClick={() => setRecommendations(null)}
              className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors font-label-md text-label-md font-medium"
            >
              <ArrowLeft size={16} />
              Back to Dashboard
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 bg-white border border-outline-variant/40 text-primary px-4 py-2 rounded-lg hover:bg-surface-container-low transition-all font-label-md text-label-md font-semibold shadow-sm"
            >
              <Printer size={16} />
              Print Advisor Report
            </button>
          </div>

          {/* Printable recommendations layout */}
          <div className="print-card bg-white border border-outline-variant/30 rounded-xl p-6 md:p-8 shadow-sm">

            {/* Printable Institutional Header */}
            <div className="hidden print:block text-center border-b pb-6 mb-6 border-outline-variant/35">
              <h1 className="text-2xl font-bold text-primary uppercase">ScholarCheck Report</h1>
              <h2 className="text-lg font-semibold text-secondary">AI Scholarship Advisor recommendations</h2>
              <p className="text-xs text-on-surface-variant mt-1">Platform: India College Navigator</p>
            </div>

            {/* AI Advisor Intro Banner */}
            <div className="mb-8 border-b border-outline-variant/30 pb-5">
              <div className="flex items-center gap-3">
                <span className="p-2.5 bg-primary-container text-primary rounded-lg shrink-0 shadow-sm">
                  <Sparkles size={22} />
                </span>
                <div>
                  <h3 className="font-headline-md text-headline-md font-bold text-primary">
                    Advisor Recommendations for {user.name}
                  </h3>
                  <p className="font-body-md text-body-md text-on-surface-variant mt-1">
                    Profile Audit: Stream: <strong>{user.stream}</strong> • Marks: <strong>{user.marks}%</strong> • Income: <strong>₹{parseFloat(user.income).toLocaleString()}</strong> • Category: <strong>{user.category}</strong>
                  </p>
                </div>
              </div>

            </div>

            {/* Recommendations List Grid */}
            <div className="grid grid-cols-1 gap-6">
              {recommendations.map((scheme, idx) => {
                const score = scheme.match_score !== undefined ? scheme.match_score : 100;
                return (
                  <div
                    key={idx}
                    className="bg-white rounded-xl shadow-sm border border-outline-variant/30 overflow-hidden flex flex-col hover:shadow-md transition-shadow relative pt-8 pb-6 px-6 gap-4"
                  >
                    <div className={`h-2 w-full absolute top-0 left-0 ${
                      score >= 90 ? 'bg-secondary' :
                      score >= 70 ? 'bg-amber-500' : 'bg-rose-500'
                    }`}></div>
                    
                    {/* Row 1: Badges, Name and Provider */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          {/* Match Score Badge */}
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                            score >= 90 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            score >= 70 ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            'bg-rose-50 text-rose-700 border-rose-200'
                          }`}>
                            {score}% Match
                          </span>

                          {/* Success Chance Badge */}
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                            scheme.success_chance === 'High' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            scheme.success_chance === 'Medium' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            'bg-rose-50 text-rose-700 border-rose-200'
                          }`}>
                            Chances: {scheme.success_chance || 'High'}
                          </span>

                          {/* Status Badge */}
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getStatusBadgeStyles(scheme.status)}`}>
                            {scheme.status}
                          </span>

                          {/* Type Tags */}
                          {scheme.type_tags && scheme.type_tags.map((tag, tIdx) => (
                            <span key={tIdx} className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${getTypeTagStyles(tag)}`}>
                              {tag}
                            </span>
                          ))}
                        </div>

                        <h4 className="font-headline-md text-headline-md text-primary font-bold mt-1 pr-20">
                          {scheme.name}
                        </h4>
                        <p className="font-label-sm text-label-sm text-outline mt-1 font-medium">
                          Provider: {scheme.provider}
                        </p>
                      </div>

                      {/* Financial Breakdown (Right Top) */}
                      <div className="shrink-0 flex flex-col sm:items-end bg-surface-container border border-outline-variant/40 px-3.5 py-2.5 rounded-lg">
                        <span className="text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">Award Amount</span>
                        <span className="font-display-lg text-display-lg text-primary flex items-center gap-0.5 font-bold">
                          {(!scheme.award_amount.includes('₹') && !/[a-zA-Z]/.test(scheme.award_amount)) && <IndianRupee size={16} />}
                          {scheme.award_amount}
                        </span>
                      </div>
                    </div>

                    {/* Row 2: Stream Fit & Key Eligibility Box */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-surface-container-low p-4 rounded-lg text-body-md border border-outline-variant/10">
                      <div>
                        <p className="font-label-sm text-label-sm text-on-surface-variant font-semibold mb-1">Key Eligibility Criteria</p>
                        <p className="text-on-surface leading-relaxed">{scheme.key_eligibility}</p>
                      </div>
                      <div>
                        <p className="font-label-sm text-label-sm text-on-surface-variant font-semibold mb-1">Stream Compatibility</p>
                        <p className="text-on-surface leading-relaxed">{scheme.stream_fit}</p>
                      </div>
                    </div>

                    {/* Row 3: Justification Highlight */}
                    <div className="bg-surface-container-low p-4 rounded-lg mt-auto glass-ai border border-white/40">
                      <p className="font-label-sm text-label-sm text-tertiary uppercase tracking-wider mb-1 flex items-center gap-1 font-bold">
                        <Sparkles size={14} className="text-tertiary animate-pulse" /> Why you qualify
                      </p>
                      <p className="font-body-md text-body-md text-on-surface-variant italic">
                        "{scheme.justification}"
                      </p>
                    </div>

                    {/* Row 4: Profile Optimizer Suggestions */}
                    {scheme.optimizations && scheme.optimizations.length > 0 && (
                      <div className="bg-surface-container-low p-4 rounded-lg border border-outline-variant/10">
                        <p className="font-label-sm text-label-sm text-secondary uppercase tracking-wider mb-2 flex items-center gap-1 font-bold">
                          <TrendingUp size={14} className="text-secondary" /> AI Profile Optimizer Suggestions
                        </p>
                        <ul className="space-y-1.5">
                          {scheme.optimizations.map((opt, oIdx) => (
                            <li key={oIdx} className="flex items-start gap-2 text-body-md text-on-surface-variant font-medium">
                              <span className="text-secondary shrink-0 font-bold">✓</span>
                              <span>{opt}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Footer Card Row */}
                    <div className="pt-3 border-t border-outline-variant/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 font-label-sm text-label-sm text-on-surface-variant">
                      <span className="font-semibold text-[10px] uppercase tracking-wider text-outline">
                        India College Navigator Platform
                      </span>
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1 text-primary font-bold">
                          <Calendar size={13} className="text-secondary" />
                          Deadline: {scheme.deadline}
                        </span>
                        {scheme.application_link && (
                          <a
                            href={getSafeApplicationLink(scheme.application_link)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="no-print inline-flex items-center gap-1 text-secondary hover:underline font-bold"
                          >
                            Apply Now <ExternalLink size={12} />
                          </a>
                        )}
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>

            {/* Printable stamp lines */}
            <div className="hidden print:flex justify-between items-center mt-12 pt-8 border-t border-outline-variant/35">
              <p className="text-[10px] text-outline">ScholarCheck Assessment Engine</p>
              <div className="text-center">
                <div className="w-40 border-b border-outline h-8"></div>
                <p className="text-[10px] text-outline mt-1 font-semibold">Authorized Signature / Stamp</p>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
