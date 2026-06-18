import React, { useState } from 'react';
import { Mail, Lock, User, GraduationCap, ArrowRight, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';

export default function LoginView({ onLoginSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password || (!isLogin && !formData.name)) {
      setError('Please fill out all fields.');
      return;
    }

    setLoading(true);
    setError(null);

    const url = isLogin ? '/api/auth/login' : '/api/auth/register';

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (res.ok) {
        onLoginSuccess(data.user, data.token);
      } else {
        setError(data.error || 'Authentication failed. Please verify credentials.');
      }
    } catch (err) {
      console.error(err);
      setError('Connection to server failed. Please ensure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-outline-variant/30 rounded-xl p-6 md:p-8 shadow-sm transition-all duration-300">

        {/* Logo and Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex p-3 bg-primary-container text-on-primary-container rounded-lg shadow-sm mb-3">
            <GraduationCap size={32} strokeWidth={2} />
          </div>
          <h2 className="font-headline-lg text-headline-lg font-bold text-primary tracking-tight">
            {isLogin ? 'Student Sign In' : 'Create Account'}
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            {isLogin
              ? 'Access ScholarCheck Dashboard'
              : 'Join to scan & track your scholarship criteria'
            }
          </p>
        </div>

        {/* Error Callout */}
        {error && (
          <div className="mb-5 bg-error-container/10 border border-error/20 text-error px-4 py-3 rounded-lg flex items-start gap-2.5 font-label-sm text-label-sm">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Name Field (Only on Register) */}
          {!isLogin && (
            <div>
              <label className="block font-label-md text-label-md text-on-surface mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-outline">
                  <User size={18} />
                </span>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g., Sai Kumar"
                  className="w-full h-12 pl-10 pr-4 rounded-lg border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-body-md text-body-md bg-surface-bright text-on-surface"
                  required
                />
              </div>
            </div>
          )}

          {/* Email Field */}
          <div>
            <label className="block font-label-md text-label-md text-on-surface mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-outline">
                <Mail size={18} />
              </span>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="student@example.com"
                className="w-full h-12 pl-10 pr-4 rounded-lg border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-body-md text-body-md bg-surface-bright text-on-surface"
                required
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label className="block font-label-md text-label-md text-on-surface mb-1.5">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-outline">
                <Lock size={18} />
              </span>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full h-12 pl-10 pr-4 rounded-lg border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-body-md text-body-md bg-surface-bright text-on-surface"
                required
              />
            </div>
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-on-primary h-12 rounded-lg font-label-md text-label-md hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 shadow-md mt-6 disabled:opacity-50"
          >
            {loading ? (
              <svg className="animate-spin h-5 w-5 text-on-primary" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <>
                {isLogin ? 'Sign In' : 'Create Account'} <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Toggle Mode Footer */}
        <div className="text-center mt-6 pt-5 border-t border-outline-variant/30">
          <p className="font-label-sm text-label-sm text-on-surface-variant mb-1">
            {isLogin ? "Don't have a profile account?" : 'Already registered your account?'}
          </p>
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
            }}
            className="font-label-md text-label-md text-secondary hover:underline font-bold transition-all"
          >
            {isLogin ? 'Register New Student Profile' : 'Sign in to Existing Profile'}
          </button>
        </div>

      </div>
    </div>
  );
}
