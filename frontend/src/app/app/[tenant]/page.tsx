'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Mail, Lock, ArrowRight, ShieldCheck, HelpCircle } from 'lucide-react';

export default function TenantLoginPage({ params }: { params: { tenant: string } }) {
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('token_type');
    }
  }, []);

  // Normalize tenant name for UI display
  const tenantDisplayName = params.tenant.toLowerCase() === 'msmc' || params.tenant.toLowerCase() === 'mountsinai'
    ? 'Mount Sinai Muslim Center'
    : `${params.tenant.charAt(0).toUpperCase() + params.tenant.slice(1)} Portal`;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setMessage({ type: 'error', text: 'Please fill in all mandatory fields.' });
      return;
    }
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Tenant-Subdomain': params.tenant
        },
        body: new URLSearchParams({
          username: email,
          password: password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setMessage({ type: 'error', text: errorData.detail || 'Login failed. Please check your credentials.' });
        return;
      }

      const data = await response.json();
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('token_type', data.token_type);
      
      setMessage({ type: 'success', text: 'Login successful! Redirecting...' });
      
      // Redirect to the dashboard
      setTimeout(() => {
        const isDirectPath = typeof window !== 'undefined' && window.location.pathname.startsWith('/app');
        window.location.href = isDirectPath ? `/app/${params.tenant}/dashboard` : `/dashboard`;
      }, 800);
    } catch (err) {
      setMessage({ type: 'error', text: 'Connection to server failed. Please try again later.' });
    }
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) {
      setMessage({ type: 'error', text: 'Please enter your email address.' });
      return;
    }
    setMessage({ type: 'success', text: 'Password reset link sent to your email.' });
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8 overflow-hidden bg-gradient-to-br from-emerald-950 via-teal-900 to-emerald-950">
      
      {/* Background Radial Glows */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-emerald-500/10 blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 rounded-full bg-yellow-500/5 blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md space-y-8 z-10">
        
        {/* Branding & Logo */}
        <div className="flex flex-col items-center text-center">
          <div className="relative p-4 mb-2 rounded-2xl bg-teal-950/40 border border-amber-500/20 shadow-[0_0_50px_-12px_rgba(245,158,11,0.15)] group hover:border-amber-500/40 transition-all duration-500">
            {/* Custom SVG Mosque Dome Logo */}
            <svg 
              className="w-16 h-16 text-amber-500 transition-transform duration-500 group-hover:scale-105" 
              viewBox="0 0 100 100" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Crescent Moon */}
              <path d="M50 5C50 5 52 9 49 12C46 15 42 13 42 13C42 13 47 16 50 14C53 12 52 8 52 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              {/* Spire */}
              <line x1="50" y1="14" x2="50" y2="22" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
              {/* Main Center Dome */}
              <path d="M50 22C43 22 34 32 34 45C34 58 34 85 34 85H66C66 85 66 58 66 45C66 32 57 22 50 22Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
              {/* Left Dome */}
              <path d="M34 45C29 45 22 52 22 62C22 72 22 85 22 85H34" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
              {/* Right Dome */}
              <path d="M66 45C71 45 78 52 78 62C78 72 78 85 78 85H66" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
              {/* Symmetrical Arch/Door details */}
              <path d="M44 85V65C44 61.7 46.7 59 50 59C53.3 59 56 61.7 56 65V85" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M26 85V72C26 70.3 27.3 69 29 69C30.7 69 32 70.3 32 72V85" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M68 85V72C68 70.3 69.3 69 71 69C72.7 69 74 70.3 74 72V85" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <div className="absolute inset-0 rounded-2xl bg-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          </div>
          
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl drop-shadow-sm font-serif">
            {tenantDisplayName}
          </h1>
          <p className="mt-2 text-sm text-emerald-300/80">
            {isForgotPassword ? 'Reset your portal credentials' : 'Sign in to access your membership'}
          </p>
        </div>

        {/* Form Container (Glassmorphic Card) */}
        <div className="bg-teal-950/30 backdrop-blur-xl border border-emerald-500/10 shadow-[0_20px_50px_rgba(0,0,0,0.3)] rounded-3xl p-8 sm:p-10 transition-all duration-300">
          
          {message && (
            <div className={`mb-6 p-4 rounded-xl text-sm border flex items-start gap-2 animate-fade-in ${
              message.type === 'success' 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200' 
                : 'bg-rose-500/10 border-rose-500/30 text-rose-200'
            }`}>
              <ShieldCheck className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{message.text}</span>
            </div>
          )}

          {!isForgotPassword ? (
            /* --- LOGIN FORM --- */
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-emerald-200 mb-1.5">
                    Username (Email) <span className="text-amber-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-emerald-400">
                      <Mail className="w-5 h-5" />
                    </div>
                    <input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="block w-full pl-11 pr-4 py-3 bg-teal-950/60 border border-emerald-800/40 rounded-xl text-white placeholder-emerald-700/60 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition-all text-sm"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label htmlFor="password" className="block text-sm font-medium text-emerald-200">
                      Password <span className="text-amber-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsForgotPassword(true);
                        setMessage(null);
                      }}
                      className="text-xs font-semibold text-amber-500 hover:text-amber-400 transition"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-emerald-400">
                      <Lock className="w-5 h-5" />
                    </div>
                    <input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="block w-full pl-11 pr-4 py-3 bg-teal-950/60 border border-emerald-800/40 rounded-xl text-white placeholder-emerald-700/60 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition-all text-sm"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-teal-950 font-bold text-sm rounded-xl shadow-lg shadow-amber-950/20 hover:shadow-amber-500/20 active:scale-[0.98] transition-all duration-150"
              >
                Sign In
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-center pt-2">
                <p className="text-xs text-emerald-300/60">
                  Don&apos;t have an account?{' '}
                  <Link
                    href="/signup"
                    className="font-bold text-amber-500 hover:text-amber-400 transition underline decoration-amber-500/30 underline-offset-4"
                  >
                    Sign up now
                  </Link>
                </p>
              </div>
            </form>
          ) : (
            /* --- FORGOT PASSWORD FORM --- */
            <form onSubmit={handleForgotPassword} className="space-y-6">
              <div className="space-y-4">
                <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl flex items-start gap-2.5 text-xs text-amber-200/90 leading-normal">
                  <HelpCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <span>Enter your registered email address below. We will send you instructions to reset your password.</span>
                </div>
                
                <div>
                  <label htmlFor="forgotEmail" className="block text-sm font-medium text-emerald-200 mb-1.5">
                    Email Address <span className="text-amber-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-emerald-400">
                      <Mail className="w-5 h-5" />
                    </div>
                    <input
                      id="forgotEmail"
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="block w-full pl-11 pr-4 py-3 bg-teal-950/60 border border-emerald-800/40 rounded-xl text-white placeholder-emerald-700/60 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition-all text-sm"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-teal-950 font-bold text-sm rounded-xl shadow-lg active:scale-[0.98] transition-all duration-150"
              >
                Send Reset Instructions
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPassword(false);
                    setMessage(null);
                  }}
                  className="text-xs font-bold text-emerald-400 hover:text-emerald-300 transition"
                >
                  Back to Sign In
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
