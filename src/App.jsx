import React, { useState, useEffect } from 'react';
import { Sparkles, History, Info, GraduationCap, Award, BookOpen, AlertCircle, CheckCircle, LogOut, LayoutDashboard, UserCheck } from 'lucide-react';
import StudentForm from './components/StudentForm';
import ResultsView from './components/ResultsView';
import HistoryView from './components/HistoryView';
import LoginView from './components/LoginView';
import DashboardView from './components/DashboardView';
import ProfileView from './components/ProfileView';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [currentResult, setCurrentResult] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [toast, setToast] = useState(null);
  const [submissionToDelete, setSubmissionToDelete] = useState(null);

  // Initialize session state
  useEffect(() => {
    const savedUser = localStorage.getItem('scholarsphere_user');
    const savedToken = localStorage.getItem('scholarsphere_token');
    
    if (savedUser && savedToken) {
      setUser(JSON.parse(savedUser));
      setToken(savedToken);
      setActiveTab('dashboard');
    } else {
      setActiveTab('login');
    }
  }, []);

  // Fetch history when user logins or changes tabs
  useEffect(() => {
    if (token) {
      fetchHistory();
    }
  }, [token]);

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
        <div className="flex items-center px-container-margin h-16 w-full max-w-7xl mx-auto justify-between">
          <div className="flex items-center gap-4">
            <h1 className="font-headline-md text-headline-md font-bold text-primary tracking-tight">ScholarCheck</h1>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden md:flex gap-8 h-full items-center">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`font-label-md text-label-md flex items-center justify-center h-16 px-1 transition-all duration-200 border-b-2 ${
                activeTab === 'dashboard'
                  ? 'text-primary border-primary font-bold'
                  : 'text-on-surface-variant border-transparent hover:text-primary'
              }`}
            >
              Dashboard
            </button>

            <button
              onClick={() => setActiveTab('checker')}
              className={`font-label-md text-label-md flex items-center justify-center h-16 px-1 transition-all duration-200 border-b-2 ${
                activeTab === 'checker'
                  ? 'text-primary border-primary font-bold'
                  : 'text-on-surface-variant border-transparent hover:text-primary'
              }`}
            >
              Eligibility Form
            </button>

            <button
              onClick={() => {
                setActiveTab('history');
                fetchHistory();
              }}
              className={`font-label-md text-label-md flex items-center justify-center h-16 px-1 transition-all duration-200 border-b-2 ${
                activeTab === 'history'
                  ? 'text-primary border-primary font-bold'
                  : 'text-on-surface-variant border-transparent hover:text-primary'
              }`}
            >
              History
            </button>

            <button
              onClick={() => setActiveTab('profile')}
              className={`font-label-md text-label-md flex items-center justify-center h-16 px-1 transition-all duration-200 border-b-2 ${
                activeTab === 'profile'
                  ? 'text-primary border-primary font-bold'
                  : 'text-on-surface-variant border-transparent hover:text-primary'
              }`}
            >
              My Profile
            </button>

            <span className="h-6 w-px bg-outline-variant" />

            {/* Logout button */}
            <button
              onClick={handleLogout}
              className="p-2 rounded-full bg-surface-container-low hover:bg-surface-container-high transition-colors text-primary"
              title="Sign Out"
            >
              <LogOut size={16} />
            </button>
          </nav>

          {/* Desktop profile status or simple logout */}
          <div className="flex md:hidden items-center gap-2">
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

      {/* Main Body */}
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

        {/* Checker Tab (Form & Manual Scan) */}
        {activeTab === 'checker' && (
          <div className="space-y-6">
            {currentResult ? (
              <ResultsView 
                result={currentResult} 
                onBack={() => setCurrentResult(null)} 
              />
            ) : (
              <div className="space-y-6">
                <div className="text-center max-w-2xl mx-auto">
                  <h2 className="font-display-lg text-display-lg text-primary">Quick Eligibility Check</h2>
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

      {/* Mobile Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 py-3 bg-white border-t border-surface-variant shadow-lg md:hidden">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center justify-center px-4 py-1 rounded-xl transition-all duration-200 ${
            activeTab === 'dashboard'
              ? 'bg-primary-container text-on-primary-container'
              : 'text-on-surface-variant hover:bg-surface-container-low'
          }`}
        >
          <LayoutDashboard size={18} />
          <span className="font-label-sm text-[10px] mt-0.5 font-semibold">Dashboard</span>
        </button>

        <button
          onClick={() => setActiveTab('checker')}
          className={`flex flex-col items-center justify-center px-4 py-1 rounded-xl transition-all duration-200 ${
            activeTab === 'checker'
              ? 'bg-primary-container text-on-primary-container'
              : 'text-on-surface-variant hover:bg-surface-container-low'
          }`}
        >
          <Sparkles size={18} />
          <span className="font-label-sm text-[10px] mt-0.5 font-semibold">Checker</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('history');
            fetchHistory();
          }}
          className={`flex flex-col items-center justify-center px-4 py-1 rounded-xl transition-all duration-200 ${
            activeTab === 'history'
              ? 'bg-primary-container text-on-primary-container'
              : 'text-on-surface-variant hover:bg-surface-container-low'
          }`}
        >
          <History size={18} />
          <span className="font-label-sm text-[10px] mt-0.5 font-semibold">History</span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`flex flex-col items-center justify-center px-4 py-1 rounded-xl transition-all duration-200 ${
            activeTab === 'profile'
              ? 'bg-primary-container text-on-primary-container'
              : 'text-on-surface-variant hover:bg-surface-container-low'
          }`}
        >
          <UserCheck size={18} />
          <span className="font-label-sm text-[10px] mt-0.5 font-semibold">Profile</span>
        </button>
      </nav>

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
