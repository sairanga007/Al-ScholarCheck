import React, { useState, useEffect } from 'react';
import { Calendar, Bell, CheckSquare, Clock, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { translations } from '../utils/translate';

export default function TimelineView({ token, showToast, lang }) {
  const [allScholarships, setAllScholarships] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [todos, setTodos] = useState([
    { id: 1, text: "Renew and verify Family Income Certificate at Meeseva office", done: false },
    { id: 2, text: "Get Class 12 official marks memo attested by principal", done: true },
    { id: 3, text: "Ensure bank account is Aadhaar seeded / mapped to NPCI", done: false },
    { id: 4, text: "Prepare scholarship statement of purpose (SOP) draft", done: false },
    { id: 5, text: "Gather SC/ST/BC caste verification certificate ID", done: false }
  ]);

  const t = translations[lang || 'en'];

  const fetchTimelineData = async () => {
    try {
      const resSch = await fetch('/api/scholarships');
      const resNotif = await fetch('/api/notifications', {
        headers: { 'Authorization': token }
      });
      if (resSch.ok && resNotif.ok) {
        const schData = await resSch.json();
        const notifData = await resNotif.json();
        setAllScholarships(schData);
        setNotifications(notifData);
      }
    } catch (err) {
      console.error('Error fetching timeline data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchTimelineData();
    }
  }, [token]);

  const handleToggleTodo = (id) => {
    setTodos(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
    showToast("Action status updated.");
  };

  const handleMarkAllRead = async () => {
    try {
      // Mark all read in backend
      for (const n of notifications) {
        if (!n.is_read) {
          await fetch('/api/notifications/read', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: n.id })
          });
        }
      }
      showToast("All notifications marked as read.");
      fetchTimelineData();
    } catch (err) {
      console.error(err);
    }
  };

  // Sort scholarships by upcoming deadline
  const sortedScholarships = [...allScholarships]
    .filter(s => s.deadline)
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* 1. Deadlines Calendar List (Left Column) */}
      <div className="bg-white border border-outline-variant/35 rounded-2xl p-5 shadow-sm space-y-4 lg:col-span-2">
        <h3 className="font-headline-md text-headline-md text-primary font-bold flex items-center gap-2 border-b pb-3 border-outline-variant/20">
          <Calendar size={22} className="text-secondary" /> {t.upcomingDeadlines}
        </h3>
        
        {loading ? (
          <div className="py-12 text-center text-outline">
            <RefreshCw className="animate-spin mx-auto mb-2 text-secondary" size={24} />
            Loading calendar...
          </div>
        ) : (
          <div className="relative border-l border-outline-variant/40 pl-6 ml-3 space-y-6 py-2">
            {sortedScholarships.map((s, idx) => {
              const deadlineDate = new Date(s.deadline);
              const daysLeft = Math.ceil((deadlineDate - new Date().setHours(0,0,0,0)) / (1000 * 60 * 60 * 24));
              const isClosed = daysLeft < 0;

              return (
                <div key={idx} className="relative">
                  {/* Bullet Node */}
                  <span className={`absolute -left-[31px] top-1 w-4 h-4 rounded-full border-2 bg-white ${
                    isClosed ? 'border-rose-500' : daysLeft <= 10 ? 'border-amber-500 animate-pulse' : 'border-emerald-500'
                  }`} />
                  
                  {/* Timeline Card Content */}
                  <div className="p-4 rounded-xl border border-outline-variant/30 bg-surface-bright flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:shadow-sm transition-shadow">
                    <div>
                      <h4 className="font-label-md text-label-md text-primary font-bold">{s.scholarship_name}</h4>
                      <p className="text-label-sm text-outline mt-1 font-medium">Category: {s.category} • Target Score: {s.minimum_marks}%+</p>
                    </div>
                    <div className="shrink-0 text-left sm:text-right">
                      <p className="font-semibold text-error font-body-md">
                        {deadlineDate.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                      <p className={`text-[10px] uppercase font-bold tracking-wider mt-0.5 ${
                        isClosed ? 'text-rose-600' : daysLeft <= 10 ? 'text-amber-600' : 'text-emerald-600'
                      }`}>
                        {isClosed ? 'Closed' : `${daysLeft} Days Remaining`}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Right Column: Actions Checklist & Notification Center */}
      <div className="space-y-6">
        
        {/* 2. Actions Checklist widget */}
        <div className="bg-white border border-outline-variant/35 rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="font-headline-md text-headline-md text-primary font-bold flex items-center gap-2 border-b pb-3 border-outline-variant/20">
            <CheckSquare size={20} className="text-secondary" /> {t.actionsChecklist}
          </h3>
          <div className="space-y-3">
            {todos.map(todo => (
              <div 
                key={todo.id} 
                onClick={() => handleToggleTodo(todo.id)}
                className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-surface-container-low cursor-pointer transition-colors"
              >
                <input 
                  type="checkbox" 
                  checked={todo.done}
                  readOnly
                  className="rounded text-secondary focus:ring-secondary mt-1 cursor-pointer shrink-0" 
                />
                <span className={`text-body-md text-on-surface-variant font-medium ${
                  todo.done ? 'line-through text-outline' : ''
                }`}>
                  {todo.text}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 3. AI Notification Center log */}
        <div className="bg-white border border-outline-variant/35 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b pb-3 border-outline-variant/20">
            <h3 className="font-headline-md text-headline-md text-primary font-bold flex items-center gap-2">
              <Bell size={20} className="text-secondary" /> {t.notificationCenter}
            </h3>
            {notifications.some(n => !n.is_read) && (
              <button 
                onClick={handleMarkAllRead}
                className="text-[10px] font-bold text-secondary hover:underline"
              >
                {t.markAllRead}
              </button>
            )}
          </div>

          {loading ? (
            <div className="text-center text-outline py-6 text-label-sm">Loading alerts...</div>
          ) : notifications.length === 0 ? (
            <div className="text-center text-outline py-8 text-label-sm font-medium">
              {t.noNotifications}
            </div>
          ) : (
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {notifications.map((n, idx) => (
                <div 
                  key={idx} 
                  className={`p-3 rounded-xl border transition-all text-body-md ${
                    n.is_read 
                      ? 'bg-surface-bright border-outline-variant/20 text-on-surface-variant' 
                      : 'bg-primary-container/10 border-secondary text-primary font-medium'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <p className="font-bold text-label-md text-primary">{n.title}</p>
                    {!n.is_read && <span className="w-1.5 h-1.5 rounded-full bg-secondary shrink-0 mt-1"></span>}
                  </div>
                  <p className="text-label-sm mt-1 text-on-surface-variant leading-normal">{n.message}</p>
                  <p className="text-[9px] text-outline mt-1.5 font-semibold">
                    {new Date(n.created_at).toLocaleDateString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
