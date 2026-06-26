import React, { useState, useEffect } from 'react';
import { Sparkles, Calendar, Award, IndianRupee, Layers } from 'lucide-react';
import { translations } from '../utils/translate';

const defaultScholarships = [
  {
    id: "1",
    scholarship_name: "National Scholarship Portal",
    minimum_marks: 50,
    income_limit: 200000,
    category: "Minority",
    deadline: "2026-08-25",
    description: "Central sector scheme providing support of 50 thousand to meritorious minority students."
  },
  {
    id: "2",
    scholarship_name: "Telangana ePASS Post Matric Scholarship (SC/ST)",
    minimum_marks: 60,
    income_limit: 200000,
    category: "SC",
    deadline: "2026-06-29",
    description: "Full tuition fee reimbursement and 15 thousand maintenance allowance for SC/ST category students in Telangana."
  },
  {
    id: "3",
    scholarship_name: "Telangana ePASS Post Matric Scholarship (BC/EBC/Minority)",
    minimum_marks: 55,
    income_limit: 150000,
    category: "OBC",
    deadline: "2026-07-20",
    description: "Partial or full fee reimbursement of 10 thousand for BC/OBC students in Telangana."
  },
  {
    id: "4",
    scholarship_name: "Dr. Ambedkar Post Matric Scholarship for SC Students",
    minimum_marks: 50,
    income_limit: 250000,
    category: "SC",
    deadline: "2026-08-30",
    description: "Centrally sponsored scheme for post-matric studies of SC students, offering 25 thousand and maintenance."
  },
  {
    id: "5",
    scholarship_name: "Vidyadhan Scholarship (Sarojini Damodaran Foundation)",
    minimum_marks: 75,
    income_limit: 200000,
    category: "General",
    deadline: "2026-06-10",
    description: "Private scholarship supporting meritorious students from low-income families with 10 thousand support."
  }
];

export default function CompareView({ lang }) {
  const [allScholarships, setAllScholarships] = useState(defaultScholarships);
  const [slot1, setSlot1] = useState('1');
  const [slot2, setSlot2] = useState('2');
  const [slot3, setSlot3] = useState('3');
  const [loading, setLoading] = useState(true);

  const t = translations[lang || 'en'];

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/scholarships');
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) {
            setAllScholarships(data);
            setSlot1(data[0]?.id?.toString() || '1');
            setSlot2(data[1]?.id?.toString() || '2');
            setSlot3(data[2]?.id?.toString() || '3');
          }
        }
      } catch (err) {
        console.error('Error fetching scholarships for comparison:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const getDetails = (id) => {
    if (!id) return null;
    return allScholarships.find(s => s.id.toString() === id.toString());
  };

  const s1 = getDetails(slot1);
  const s2 = getDetails(slot2);
  const s3 = getDetails(slot3);

  const columns = [s1, s2, s3].filter(Boolean);

  return (
    <div className="bg-white border border-outline-variant/35 rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
      
      {/* Title */}
      <div className="space-y-1.5 pb-4 border-b border-outline-variant/20">
        <h2 className="font-display-lg text-display-lg text-primary flex items-center gap-2">
          <Layers size={28} className="text-secondary" /> {t.compareTitle}
        </h2>
        <p className="font-body-md text-body-md text-on-surface-variant">
          {t.compareDesc}
        </p>
      </div>

      {/* Selectors Dropdowns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
        
        {/* Selector 1 */}
        <div className="space-y-1.5">
          <label className="block font-label-sm text-label-sm text-on-surface font-semibold">{t.selectScholarship} 1</label>
          <select 
            value={slot1} 
            onChange={(e) => setSlot1(e.target.value)}
            className="w-full h-11 px-3.5 rounded-lg border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none font-body-md bg-surface-bright text-on-surface"
          >
            <option value="">-- Select Scholarship --</option>
            {allScholarships.map(s => (
              <option key={s.id} value={s.id} disabled={s.id.toString() === slot2 || s.id.toString() === slot3}>
                {s.scholarship_name}
              </option>
            ))}
          </select>
        </div>

        {/* Selector 2 */}
        <div className="space-y-1.5">
          <label className="block font-label-sm text-label-sm text-on-surface font-semibold">{t.selectScholarship} 2</label>
          <select 
            value={slot2} 
            onChange={(e) => setSlot2(e.target.value)}
            className="w-full h-11 px-3.5 rounded-lg border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none font-body-md bg-surface-bright text-on-surface"
          >
            <option value="">-- Select Scholarship --</option>
            {allScholarships.map(s => (
              <option key={s.id} value={s.id} disabled={s.id.toString() === slot1 || s.id.toString() === slot3}>
                {s.scholarship_name}
              </option>
            ))}
          </select>
        </div>

        {/* Selector 3 */}
        <div className="space-y-1.5">
          <label className="block font-label-sm text-label-sm text-on-surface font-semibold">{t.selectScholarship} 3</label>
          <select 
            value={slot3} 
            onChange={(e) => setSlot3(e.target.value)}
            className="w-full h-11 px-3.5 rounded-lg border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none font-body-md bg-surface-bright text-on-surface"
          >
            <option value="">-- Select Scholarship --</option>
            {allScholarships.map(s => (
              <option key={s.id} value={s.id} disabled={s.id.toString() === slot1 || s.id.toString() === slot2}>
                {s.scholarship_name}
              </option>
            ))}
          </select>
        </div>

      </div>

      {/* Comparisons Table */}
      {columns.length === 0 ? (
        <div className="py-20 text-center border-2 border-dashed border-outline-variant/30 rounded-xl">
          <Layers className="mx-auto text-outline/50 mb-3" size={48} />
          <p className="font-body-md text-body-md text-on-surface-variant">Please choose at least one scholarship above to compare.</p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-outline-variant/20 rounded-xl">
          <table className="w-full border-collapse text-left font-body-md text-body-md">
            <thead>
              <tr className="bg-surface-container border-b border-outline-variant/20">
                <th className="p-4 font-bold text-primary w-[200px]">{t.scholarship}</th>
                {columns.map((col, i) => (
                  <th key={i} className="p-4 font-bold text-primary border-l border-outline-variant/20">
                    {col.scholarship_name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10 text-on-surface-variant">
              
              {/* Amount Row */}
              <tr>
                <td className="p-4 font-bold text-on-surface flex items-center gap-1.5">
                  <IndianRupee size={16} className="text-secondary" /> {t.amount}
                </td>
                {columns.map((col, i) => (
                  <td key={i} className="p-4 border-l border-outline-variant/20 font-semibold text-secondary">
                    {col.description.match(/\d+/) ? `₹${col.description.match(/\d+/)[0]},000/year` : 'Varies (Tuition Fee Reimbursement)'}
                  </td>
                ))}
              </tr>

              {/* Eligibility Criteria Row */}
              <tr>
                <td className="p-4 font-bold text-on-surface flex items-center gap-1.5">
                  <Award size={16} className="text-secondary" /> {t.eligibility}
                </td>
                {columns.map((col, i) => (
                  <td key={i} className="p-4 border-l border-outline-variant/20 space-y-1">
                    <p>• Min Academic Marks: <strong>{col.minimum_marks}%</strong></p>
                    <p>• Max Annual Income: <strong>₹{col.income_limit ? col.income_limit.toLocaleString() : 'No Limit'}</strong></p>
                    <p>• Category Required: <strong>{col.category}</strong></p>
                  </td>
                ))}
              </tr>

              {/* Deadline Row */}
              <tr>
                <td className="p-4 font-bold text-on-surface flex items-center gap-1.5">
                  <Calendar size={16} className="text-secondary" /> {t.deadline}
                </td>
                {columns.map((col, i) => (
                  <td key={i} className="p-4 border-l border-outline-variant/20 font-medium text-error">
                    {col.deadline ? new Date(col.deadline).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Rolling basis'}
                  </td>
                ))}
              </tr>

              {/* Benefits / Description Row */}
              <tr>
                <td className="p-4 font-bold text-on-surface flex items-center gap-1.5">
                  <Sparkles size={16} className="text-secondary" /> {t.benefits}
                </td>
                {columns.map((col, i) => (
                  <td key={i} className="p-4 border-l border-outline-variant/20 leading-relaxed font-medium">
                    {col.description}
                  </td>
                ))}
              </tr>

            </tbody>
          </table>
        </div>
      )}

    </div>
  );
}
