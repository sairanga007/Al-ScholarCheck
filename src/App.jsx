import React, { useState, useEffect } from 'react';
import { 
  Sparkles, History, GraduationCap, Award, AlertCircle, 
  CheckCircle, LogOut, LayoutDashboard, UserCheck,
  Bell, Globe, Layers, Briefcase 
} from 'lucide-react';
import StudentForm from './components/StudentForm';
import ResultsView from './components/ResultsView';
import HistoryView from './components/HistoryView';
import LoginView from './components/LoginView';
import DashboardView from './components/DashboardView';
import ProfileView from './components/ProfileView';

// Import New Advanced Feature Components
import CompareView from './components/CompareView';
import TrackerView from './components/TrackerView';
import CollegeBundleView from './components/CollegeBundleView';
import { translations } from './utils/translate';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [lang, setLang] = useState('en');
  
  const [loading, setLoading] = useState(false);
  const [currentResult, setCurrentResult] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showNotifDrop, setShowNotifDrop] = useState(false);
  const [toast, setToast] = useState(null);
  const [submissionToDelete, setSubmissionToDelete] = useState(null);



  const t = translations[lang] || translations.en;



  // Initialize session state
  useEffect(() => {
    const savedUser = localStorage.getItem('scholarsphere_user');
    const savedToken = localStorage.getItem('scholarsphere_token');
    const savedLang = localStorage.getItem('scholarsphere_lang');
    
    if (savedLang) {
      setLang(savedLang);
    }
    if (savedUser && savedToken) {
      setUser(JSON.parse(savedUser));
      setToken(savedToken);
      setActiveTab('dashboard');
    } else {
      setActiveTab('login');
    }
  }, []);

  // Fetch history and notifications when token is available
  const fetchNotifications = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/notifications', {
        headers: { 'Authorization': token }
      });
      if (res.ok) {
        const list = await res.json();
        setNotifications(list);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchHistory();
      fetchNotifications();
    }
  }, [token, activeTab]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  const handleLoginSuccess = (userData, sessionToken) => {
    setUser(userData);
    setToken(sessionToken);
    localStorage.setItem('scholarsphere_user', JSON.stringify(userData));
    localStorage.setItem('scholarsphere_token', sessionToken);
    setActiveTab('dashboard');
    showToast(`Welcome back, ${userData.name}!`);
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('scholarsphere_user');
    localStorage.removeItem('scholarsphere_token');
    setActiveTab('login');
    setCurrentResult(null);
    setSubmissions([]);
    setNotifications([]);
    showToast('Signed out successfully.');
  };

  const handleProfileUpdate = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('scholarsphere_user', JSON.stringify(updatedUser));
  };

  const fetchHistory = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/history', {
        headers: { 'Authorization': token }
      });
      if (res.ok) {
        const data = await res.json();
        setSubmissions(data);
      } else {
        console.error('Failed to load history');
      }
    } catch (err) {
      console.error('Network connection error fetching history:', err);
    }
  };

  const handleCheckEligibility = async (formData) => {
    setLoading(true);
    setCurrentResult(null);
    try {
      const res = await fetch('/api/check-eligibility', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': token || ''
        },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        const data = await res.json();
        setCurrentResult(data);
        showToast('Eligibility checking completed.');
        fetchHistory();
        fetchNotifications();
      } else {
        const errData = await res.json();
        showToast(errData.error || 'Check failed', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error connecting to checker service.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSubmission = (id) => {
    setSubmissionToDelete(id);
  };

  const confirmDeleteSubmission = async () => {
    if (!submissionToDelete) return;
    const id = submissionToDelete;
    try {
      const res = await fetch(`/api/history/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setSubmissions(prev => prev.filter(sub => sub.id !== id));
        showToast('Report deleted.');
        if (currentResult && currentResult.id === id) {
          setCurrentResult(null);
        }
      } else {
        showToast('Failed to delete.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error removing report.', 'error');
    } finally {
      setSubmissionToDelete(null);
    }
  };

  const handleViewDetails = (submission) => {
    setCurrentResult({
      id: submission.id,
      name: submission.name,
      income: submission.income,
      marks: submission.marks,
      category: submission.category,
      courseYear: submission.course_year,
      scholarships: submission.result_json,
      isMock: submission.isMock || false,
      created_at: submission.created_at
    });
    setActiveTab('checker');
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  let badgesCount = 0;
  try {
    badgesCount = JSON.parse(user?.badges_json || '[]').length;
  } catch (e) {
    badgesCount = 0;
  }

  // Auth shield
  if (activeTab === 'login' || !user) {
    return (
      <div className="min-h-screen bg-background flex flex-col font-sans">
        <header className="bg-white border-b border-surface-variant shadow-sm z-40 sticky">
          <div className="flex items-center px-container-margin h-16 w-full max-w-7xl mx-auto justify-between">
            <div className="flex items-center gap-4">
              <h1 className="font-headline-md text-headline-md font-bold text-primary tracking-tight">ScholarCheck</h1>
            </div>
          </div>
        </header>
        <main className="flex-grow flex items-center justify-center py-section-padding">
          <LoginView onLoginSuccess={handleLoginSuccess} />
        </main>
        <footer className="bg-white border-t border-outline-variant/30 py-6 text-center text-label-sm font-label-sm text-outline">
          © {new Date().getFullYear()} ScholarCheck. All rights reserved.
        </footer>
        {toast && (
          <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-lg bg-white text-on-surface border border-outline-variant/30 shadow-md text-body-md max-w-sm glass-ai">
            {toast.type === 'success' ? (
              <CheckCircle className="text-secondary shrink-0" size={18} />
            ) : (
              <AlertCircle className="text-error shrink-0" size={18} />
            )}
            <span>{toast.message}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans pb-24 md:pb-0">
      
      {/* Header */}
      <header className="no-print bg-white border-b border-surface-variant shadow-sm z-40 sticky top-0">
        <div className="flex items-center px-container-margin h-16 w-full max-w-7xl mx-auto justify-between gap-4">
          <div className="flex items-center gap-4 shrink-0">
            <h1 
              onClick={() => setActiveTab('dashboard')} 
              className="font-headline-md text-headline-md font-bold text-primary tracking-tight cursor-pointer"
            >
              ScholarCheck
            </h1>
          </div>

          {/* Gamification, Language, Notifications & Logout Controls */}
          <div className="flex items-center gap-3 ml-auto">
            
            {/* Language Selector Dropdown */}
            <div className="flex items-center gap-1 bg-surface-container border border-outline-variant/35 rounded-xl px-2 py-1">
              <Globe size={14} className="text-outline" />
              <select
                value={lang}
                onChange={(e) => {
                  setLang(e.target.value);
                  localStorage.setItem('scholarsphere_lang', e.target.value);
                  showToast(`Language switched successfully.`);
                }}
                className="bg-transparent text-xs font-bold outline-none text-primary cursor-pointer border-none py-0.5"
              >
                <option value="en">EN</option>
                <option value="te">TE</option>
                <option value="hi">HI</option>
                <option value="ta">TA</option>
              </select>
            </div>

            {/* Notification Bell Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifDrop(!showNotifDrop)}
                className="p-2 rounded-full bg-surface-container hover:bg-surface-container-high transition-colors text-primary relative"
                title="Notifications"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 bg-error text-white font-bold text-[8px] w-4 h-4 rounded-full flex items-center justify-center animate-bounce">
                    {unreadCount}
                  </span>
                )}
              </button>
              
              {showNotifDrop && (
                <div className="absolute right-0 mt-2.5 w-[290px] sm:w-[320px] bg-white border border-outline-variant/30 rounded-2xl shadow-xl z-50 p-4 space-y-3">
                  <div className="flex justify-between items-center border-b pb-2 border-outline-variant/10">
                    <h4 className="font-label-md text-label-md text-primary font-bold">{t.notificationCenter}</h4>
                    {unreadCount > 0 && (
                      <button 
                        onClick={async () => {
                          for (const n of notifications) {
                            if (!n.is_read) {
                              await fetch('/api/notifications/read', {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({ id: n.id })
                                                  });
                            }
                          }
                          showToast("All read.");
                          fetchNotifications();
                          setShowNotifDrop(false);
                        }}
                        className="text-[10px] font-bold text-secondary hover:underline"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {notifications.length === 0 ? (
                      <p className="text-center text-outline text-xs py-4">No notifications.</p>
                    ) : (
                      notifications.slice(0, 4).map((n, idx) => (
                        <div 
                          key={idx} 
                          onClick={async () => {
                            if (!n.is_read) {
                              await fetch('/api/notifications/read', {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({ id: n.id })
                                                  });
                              fetchNotifications();
                            }
                            setShowNotifDrop(false);
                            setActiveTab('tracker');
                          }}
                          className={`p-2.5 rounded-xl border text-xs cursor-pointer hover:bg-surface-container-low transition-all ${
                            n.is_read ? 'bg-surface-bright border-outline-variant/20 text-on-surface-variant' : 'bg-primary-container/10 border-secondary text-primary font-medium'
                          }`}
                        >
                          <p className="font-bold">{n.title}</p>
                          <p className="text-[10px] mt-0.5 leading-normal text-on-surface-variant">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                  
                  <button 
                    onClick={() => {
                      setShowNotifDrop(false);
                      setActiveTab('tracker');
                    }}
                    className="w-full text-center text-xs font-bold text-secondary hover:underline pt-2 border-t border-outline-variant/10 block"
                  >
                    View All Tracker
                  </button>
                </div>
              )}
            </div>

            {/* Logout button */}
            <button
              onClick={handleLogout}
              className="p-2 rounded-full bg-surface-container hover:bg-surface-container-high transition-colors text-primary"
              title="Sign Out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Horizontal Sub-navigation Bar */}
      <div className="no-print border-b border-outline-variant/20 bg-white shadow-xs">
        <div className="max-w-7xl mx-auto px-container-margin py-3 flex gap-2 overflow-x-auto whitespace-nowrap scrollbar-thin">
          {[
            { id: 'dashboard', label: t.dashboard, icon: LayoutDashboard },
            { id: 'checker', label: t.eligibilityForm, icon: Award },
            { id: 'compare', label: t.compare, icon: Layers },
            { id: 'tracker', label: t.tracker, icon: Briefcase },
            { id: 'bundle', label: t.bundle, icon: GraduationCap },
            { id: 'history', label: t.history, icon: History },
            { id: 'profile', label: t.profile, icon: UserCheck }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  if (tab.id === 'history') fetchHistory();
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-label-md font-label-md font-bold transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                <Icon size={15} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Body Content */}
      <main className="w-full max-w-7xl mx-auto px-container-margin py-section-padding space-y-stack-lg flex-grow">
        
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <DashboardView 
            user={user} 
            token={token} 
            showToast={showToast} 
            onRefreshHistory={fetchHistory} 
            onNavigate={setActiveTab}
          />
        )}

        {/* Compare Tool Tab */}
        {activeTab === 'compare' && (
          <CompareView 
            lang={lang}
          />
        )}

        {/* Scholarship Tracker Tab */}
        {activeTab === 'tracker' && (
          <TrackerView 
            token={token} 
            showToast={showToast} 
            lang={lang}
          />
        )}

        {/* College Bundle Tab */}
        {activeTab === 'bundle' && (
          <CollegeBundleView 
            user={user} 
            lang={lang}
          />
        )}

        {/* Checker Tab (Form & Manual Scan) */}
        {activeTab === 'checker' && (
          <div className="space-y-6">
            {currentResult ? (
              <ResultsView 
                result={currentResult} 
                user={user}
                onBack={() => setCurrentResult(null)} 
              />
            ) : (
              <div className="space-y-6">
                <div className="text-center max-w-2xl mx-auto">
                  <h2 className="font-display-lg text-display-lg text-primary">{t.eligibilityForm}</h2>
                  <p className="font-body-md text-body-md text-on-surface-variant mt-2">
                    Fill in candidate details below to scan eligible scholarship opportunities immediately.
                  </p>
                </div>
                <StudentForm onSubmit={handleCheckEligibility} loading={loading} />
              </div>
            )}
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <HistoryView
            submissions={submissions}
            onDelete={handleDeleteSubmission}
            onViewDetails={handleViewDetails}
            onRefresh={fetchHistory}
          />
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <ProfileView
            user={user}
            onProfileUpdate={handleProfileUpdate}
            showToast={showToast}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="no-print bg-white border-t border-outline-variant/30 py-6 text-center text-label-sm font-label-sm text-outline">
        <div className="max-w-7xl mx-auto px-container-margin text-center space-y-1">
          <p>© {new Date().getFullYear()} ScholarCheck. All rights reserved.</p>
          <p className="text-on-surface-variant font-medium">
            Advisor Portal: India College Navigator. Powered by GPT-4o.
          </p>
        </div>
      </footer>

      {/* Toast Banner */}
      {toast && (
        <div className="fixed bottom-20 md:bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-lg bg-white text-on-surface border border-outline-variant/30 shadow-md text-body-md max-w-sm glass-ai">
          {toast.type === 'success' ? (
            <CheckCircle className="text-secondary shrink-0" size={18} />
          ) : (
            <AlertCircle className="text-error shrink-0" size={18} />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      {submissionToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm no-print">
          <div className="bg-white border border-outline-variant/30 rounded-xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-3 text-error">
              <div className="p-2.5 bg-error-container/20 rounded-lg">
                <AlertCircle size={22} />
              </div>
              <h3 className="font-headline-md text-headline-md text-primary font-bold">Delete Report?</h3>
            </div>
            
            <p className="font-body-md text-body-md text-on-surface-variant">
              Are you sure you want to delete this scholarship assessment report from your history? This action cannot be undone.
            </p>
            
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setSubmissionToDelete(null)}
                className="bg-surface-container border border-outline-variant/40 text-on-surface hover:bg-surface-container-high px-4 py-2.5 rounded-lg transition-all duration-200 font-label-md text-label-md"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteSubmission}
                className="bg-error hover:bg-error/90 text-on-error px-4 py-2.5 rounded-lg transition-all duration-200 font-label-md text-label-md flex items-center gap-1.5 shadow-md"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}



    </div>
  );
}
