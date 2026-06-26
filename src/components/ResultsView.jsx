import React, { useState } from 'react';
import { Award, IndianRupee, ExternalLink, Printer, CheckCircle2, ChevronRight, AlertCircle, ArrowLeft, Mail, Sparkles, TrendingUp } from 'lucide-react';

const getCountdownDetails = (deadlineStr) => {
  if (!deadlineStr) return { status: 'Open', remainingDays: null, label: '⏳ Rolling Application basis' };
  
  const deadline = new Date(deadlineStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  deadline.setHours(0, 0, 0, 0);
  
  const diffTime = deadline - today;
  const remainingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (remainingDays < 0) {
    return {
      status: 'Closed',
      remainingDays,
      label: '❌ Application Closed'
    };
  } else if (remainingDays < 7) {
    return {
      status: 'Closing Soon',
      remainingDays,
      label: `⚠ Hurry! Only ${remainingDays} days remaining.`
    };
  } else {
    return {
      status: 'Open',
      remainingDays,
      label: `⏳ ${remainingDays} Days Remaining`
    };
  }
};

const formatDeadline = (dateStr) => {
  if (!dateStr) return 'Rolling Basis';
  const options = { day: 'numeric', month: 'long', year: 'numeric' };
  return new Date(dateStr).toLocaleDateString('en-US', options);
};

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
  
  // It's a descriptive text, let's map it
  const p = trimmed.toLowerCase();
  if (p.includes('l\'oréal') || p.includes('loreal')) return 'https://www.loreal.com/en/india/';
  if (p.includes('kotak')) return 'https://kotakeducation.org/';
  if (p.includes('reliance')) return 'https://www.reliancefoundation.org/';
  if (p.includes('hdfc')) return 'https://www.hdfcbank.com/';
  if (p.includes('minority') || p.includes('ministry of minority')) return 'https://scholarships.gov.in/';
  if (p.includes('higher education') || p.includes('government of india') || p.includes('govt of india') || p.includes('central sector')) return 'https://scholarships.gov.in/';
  if (p.includes('jindal')) return 'http://www.sitaramjindalfoundation.org/';
  if (p.includes('science and technology') || p.includes('kvpy') || p.includes('kishore vaigyanik')) return 'https://online-dst.gov.in/';
  
  // Fallback to searching Google for the link text
  return `https://www.google.com/search?q=${encodeURIComponent(trimmed)}`;
};

export default function ResultsView({ result, user, onBack }) {
  const { name, income, marks, category, courseYear, scholarships, isMock, created_at } = result;

  const [exportLoading, setExportLoading] = useState(false);

  const handleExportPDF = async () => {
    setExportLoading(true);
    try {
      const response = await fetch('/api/export-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          studentName: name,
          income,
          marks,
          category,
          courseYear,
          scholarships
        })
      });
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ScholarCheck_Report_${name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      } else {
        alert('Failed to export PDF report.');
      }
    } catch (err) {
      console.error(err);
      alert('Error exporting PDF report.');
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back Button (Hidden on Print) */}
      <div className="no-print flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors duration-200 group font-label-md text-label-md"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Back to Eligibility Form
        </button>
        <div className="flex gap-3">
          <button
            onClick={handleExportPDF}
            disabled={exportLoading}
            className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-lg hover:bg-primary/95 transition-all duration-200 font-label-md text-label-md font-bold shadow-sm disabled:opacity-50"
          >
            {exportLoading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Exporting...
              </>
            ) : (
              <>
                <ExternalLink size={16} />
                Export to PDF
              </>
            )}
          </button>
        </div>
      </div>

      {/* Printable Report Document wrapper */}
      <div className="print-card bg-white border border-outline-variant/30 rounded-xl p-6 md:p-8 shadow-sm">
        
        {/* Printable Only Header */}
        <div className="hidden print:block text-center border-b pb-6 mb-6 border-outline-variant/35">
          <h1 className="text-2xl font-bold text-primary tracking-wide uppercase">ScholarCheck Report</h1>
          <h2 className="text-xl font-semibold text-secondary mt-1">Eligibility Assessment Summary</h2>
          <p className="text-xs text-on-surface-variant mt-1">Report Generated on: {new Date(created_at).toLocaleDateString()} at {new Date(created_at).toLocaleTimeString()}</p>
        </div>

        {/* Student Profile Overview */}
        <div className="mb-8 bg-surface-container-low border border-outline-variant/30 rounded-lg p-5 md:p-6">
          <h3 className="font-headline-md text-headline-md font-bold text-primary border-b border-outline-variant/20 pb-2.5 mb-4">
            Candidate Profile Summary
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6 text-body-md">
            <div>
              <p className="font-label-sm text-label-sm text-on-surface-variant font-medium">Candidate Name</p>
              <p className="font-body-md text-body-md text-on-surface font-semibold mt-0.5">{name}</p>
            </div>
            <div>
              <p className="font-label-sm text-label-sm text-on-surface-variant font-medium">Annual Family Income</p>
              <p className="font-body-md text-body-md text-on-surface font-semibold mt-0.5">₹{parseFloat(income).toLocaleString()}</p>
            </div>
            <div>
              <p className="font-label-sm text-label-sm text-on-surface-variant font-medium">Academic Marks</p>
              <p className="font-body-md text-body-md text-on-surface font-semibold mt-0.5">{marks}%</p>
            </div>
            <div>
              <p className="font-label-sm text-label-sm text-on-surface-variant font-medium">Social Category</p>
              <p className="font-body-md text-body-md text-on-surface font-semibold mt-0.5">{category}</p>
            </div>
            <div className="col-span-2 md:col-span-2">
              <p className="font-label-sm text-label-sm text-on-surface-variant font-medium">Course & Year</p>
              <p className="font-body-md text-body-md text-on-surface font-semibold mt-0.5">{courseYear}</p>
            </div>
          </div>
        </div>

        {/* Scholarships List */}
        <div>
          <h3 className="font-headline-lg text-headline-lg font-bold text-primary mb-5 flex items-center gap-2">
            <CheckCircle2 className="text-secondary" />
            Scholarships Scan Results ({scholarships.length})
          </h3>

          {scholarships.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-outline-variant/40 rounded-lg">
              <p className="font-body-lg text-body-lg text-on-surface-variant">No eligibility schemes matched for this profile currently.</p>
              <p className="font-body-md text-body-md text-outline mt-1">Please try modifying input parameters or verify criteria requirements.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {scholarships.map((scheme, idx) => {
                const countdown = getCountdownDetails(scheme.deadline);
                const score = scheme.match_score !== undefined ? scheme.match_score : 100;
                return (
                  <div 
                    key={idx} 
                    className="bg-white rounded-xl shadow-sm border border-outline-variant/30 hover:shadow-md transition-shadow relative pt-8 pb-6 px-6 gap-4 overflow-hidden flex flex-col"
                  >
                    <div className={`h-2 w-full absolute top-0 left-0 ${
                      score >= 90 ? 'bg-secondary' :
                      score >= 70 ? 'bg-amber-500' : 'bg-rose-500'
                    }`}></div>

                    <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                      <div className="flex-1 min-w-0">
                        {/* Tags / Scores row */}
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                            score >= 90 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            score >= 70 ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            'bg-rose-50 text-rose-700 border-rose-200'
                          }`}>
                            {score}% Match Score
                          </span>

                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                            scheme.success_chance === 'High' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            scheme.success_chance === 'Medium' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            'bg-rose-50 text-rose-700 border-rose-200'
                          }`}>
                            Chances: {scheme.success_chance || 'High'}
                          </span>

                          {countdown.status && (
                            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                              countdown.status === 'Closed' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                              countdown.status === 'Closing Soon' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                              'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}>
                              {countdown.status}
                            </span>
                          )}
                        </div>

                        <h4 className="font-headline-md text-headline-md text-primary font-bold flex items-start gap-2 pr-10">
                          <span className="flex items-center justify-center bg-primary-container text-primary w-6 h-6 rounded-full text-xs font-semibold shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <span className="break-words">{scheme.name}</span>
                        </h4>
                        
                        {/* Justification Box */}
                        <div className="mt-4 p-4 rounded-lg bg-surface-container-low border border-outline-variant/10 glass-ai">
                          <p className="font-label-sm text-label-sm text-tertiary uppercase tracking-wider mb-1 flex items-center gap-1 font-bold">
                            <Sparkles size={14} className="text-tertiary" /> AI Assessment Justification
                          </p>
                          <p className="font-body-md text-body-md text-on-surface-variant italic">
                            "{scheme.justification || scheme.eligibility_criteria_met}"
                          </p>
                        </div>

                        {/* Profile Optimizer Suggestions */}
                        {scheme.optimizations && scheme.optimizations.length > 0 && (
                          <div className="mt-4 p-4 rounded-lg bg-surface-container-low border border-outline-variant/10">
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

                        {/* Extra Deadline & Countdown Section */}
                        <div className="mt-4 grid grid-cols-2 gap-4 border-t border-outline-variant/15 pt-3.5 my-3 font-body-md text-body-md">
                          <div>
                            <span className="text-[10px] text-on-surface-variant font-semibold uppercase tracking-wider block">Eligibility Status</span>
                            <span className={`font-bold flex items-center gap-1.5 mt-0.5 ${
                              score >= 90 ? 'text-emerald-700' :
                              score >= 70 ? 'text-amber-700' : 'text-rose-700'
                            }`}>
                              {score >= 90 ? 'Eligible ✅' : 'Narrowly Missed ⚠️'}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-on-surface-variant font-semibold uppercase tracking-wider block">Deadline</span>
                            <span className="font-semibold text-on-surface mt-0.5 block">
                              {formatDeadline(scheme.deadline)}
                            </span>
                          </div>
                        </div>

                        {/* Remaining Countdown Notification */}
                        <div className="mb-2">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-label-md font-label-md border ${
                            countdown.status === 'Closed' ? 'bg-error-container/20 text-error border-error/20' :
                            countdown.status === 'Closing Soon' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                            'bg-emerald-50 text-emerald-800 border-emerald-100'
                          }`}>
                            {countdown.label}
                          </span>
                        </div>
                      </div>
                      
                      <div className="mt-2 md:mt-0 flex flex-col md:items-end md:text-right md:max-w-[45%]">
                        <span className="text-[10px] text-on-surface-variant font-semibold uppercase tracking-wider">Award Amount</span>
                        <span className="font-display-lg text-display-lg text-primary flex items-start gap-1 flex-wrap md:justify-end break-words font-bold">
                          {(!scheme.amount.toString().includes('₹') && !/[a-zA-Z]/.test(scheme.amount.toString())) && (
                            <IndianRupee size={16} className="shrink-0 mt-1" />
                          )}
                          <span>{scheme.amount}</span>
                        </span>
                      </div>
                    </div>

                    {/* Apply Link & Action */}
                    <div className="mt-5 pt-4 border-t border-outline-variant/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 font-label-sm text-label-sm text-on-surface-variant">
                      <span className="text-[10px] uppercase text-outline tracking-wider font-semibold">
                        ScholarCheck Assessment Portal
                      </span>
                      <a
                        href={getSafeApplicationLink(scheme.application_link)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`no-print inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border font-bold text-label-md font-label-md shadow-sm transition-all duration-200 ${
                          countdown.status === 'Closed'
                            ? 'bg-slate-100 text-slate-400 border-slate-200 pointer-events-none'
                            : 'bg-secondary text-white border-secondary hover:bg-secondary/95 hover:shadow-md'
                        }`}
                      >
                        Apply Now <ExternalLink size={14} />
                      </a>
                      {/* Printable application url */}
                      <span className="hidden print:inline text-secondary italic">
                        Portal: {getSafeApplicationLink(scheme.application_link)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Printable Only Signature Line */}
        <div className="hidden print:flex justify-between items-center mt-12 pt-8 border-t border-outline-variant/35">
          <div>
            <p className="text-[10px] text-outline">ScholarCheck Assessment Engine</p>
          </div>
          <div className="text-center">
            <div className="w-40 border-b border-outline h-8"></div>
            <p className="text-[10px] text-outline mt-1 font-semibold">Authorized Signature / Stamp</p>
          </div>
        </div>

      </div>
    </div>
  );
}
