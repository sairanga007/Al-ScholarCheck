import React from 'react';
import { Award, IndianRupee, ExternalLink, Printer, CheckCircle2, ChevronRight, AlertCircle, ArrowLeft } from 'lucide-react';

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

export default function ResultsView({ result, onBack }) {
  const { name, income, marks, category, courseYear, scholarships, isMock, created_at } = result;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back Button (Hidden on Print) */}
      <div className="no-print flex justify-between items-center">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors duration-200 group font-label-md text-label-md"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Back to Eligibility Form
        </button>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 bg-white border border-outline-variant/40 text-primary px-4 py-2 rounded-lg hover:bg-surface-container-low transition-all duration-200 font-label-md text-label-md font-semibold shadow-sm"
        >
          <Printer size={16} />
          Print / Save PDF Report
        </button>
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
            Qualified Schemes ({scholarships.length})
          </h3>

          {scholarships.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-outline-variant/40 rounded-lg">
              <p className="font-body-lg text-body-lg text-on-surface-variant">No eligibility schemes matched for this profile currently.</p>
              <p className="font-body-md text-body-md text-outline mt-1">Please try modifying input parameters or verify criteria requirements.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {scholarships.map((scheme, idx) => (
                <div 
                  key={idx} 
                  className="bg-white rounded-xl shadow-sm border border-outline-variant/30 hover:shadow-md transition-shadow relative pt-8 pb-6 px-6 gap-4 relative overflow-hidden"
                >
                  <div className="h-2 w-full bg-secondary absolute top-0 left-0"></div>

                  <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-headline-md text-headline-md text-primary font-bold flex items-start gap-2 pr-10">
                        <span className="flex items-center justify-center bg-primary-container text-primary w-6 h-6 rounded-full text-xs font-semibold shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span className="break-words">{scheme.name}</span>
                      </h4>
                      <div className="mt-3 flex items-start gap-2 font-body-md text-body-md text-on-surface-variant">
                        <CheckCircle2 size={16} className="text-secondary shrink-0 mt-0.5" />
                        <p className="break-words">
                          <span className="font-semibold text-on-surface">Matched Criteria:</span> {scheme.eligibility_criteria_met}
                        </p>
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
                      className="no-print inline-flex items-center gap-1.5 text-secondary hover:underline font-bold self-end sm:self-auto transition-colors"
                    >
                      Official Application Link <ExternalLink size={12} />
                    </a>
                    {/* Printable application url */}
                    <span className="hidden print:inline text-secondary italic">
                      Portal: {getSafeApplicationLink(scheme.application_link)}
                    </span>
                  </div>
                </div>
              ))}
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
