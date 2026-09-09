'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  ShieldCheck, 
  Calendar, 
  CreditCard, 
  LogOut, 
  Award, 
  CheckCircle2, 
  ArrowUpRight, 
  Bell, 
  Sparkles,
  RefreshCw,
  QrCode
} from 'lucide-react';

interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  middle_name?: string | null;
  last_name: string;
  mobile: string;
  street_address: string;
  city: string;
  state: string;
  is_active: boolean;
  is_superuser: boolean;
  created_at: string;
}

export default function TenantDashboardPage({ params }: { params: { tenant: string } }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Normalize tenant display name
  const tenantDisplayName = params.tenant.toLowerCase() === 'msmc' || params.tenant.toLowerCase() === 'mountsinai'
    ? 'Mount Sinai Muslim Center'
    : `${params.tenant.charAt(0).toUpperCase() + params.tenant.slice(1)} Portal`;

  const getLoginUrl = () => {
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/app')) {
      return `/app/${params.tenant}`;
    }
    return '/';
  };

  const getCheckoutUrl = () => {
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/app')) {
      return `/app/${params.tenant}/checkout`;
    }
    return '/checkout';
  };

  const handleSignOut = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('token_type');
      window.location.href = getLoginUrl();
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) {
        window.location.href = getLoginUrl();
        return;
      }

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/auth/me`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'X-Tenant-Subdomain': params.tenant,
            },
          }
        );

        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem('token');
          window.location.href = getLoginUrl();
          return;
        }

        if (!response.ok) {
          throw new Error('Failed to load user profile');
        }

        const data = await response.json();
        setUser(data);
      } catch (err: any) {
        setError(err.message || 'Unable to connect to the backend server.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [params.tenant]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-teal-900 to-emerald-950 flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl border-4 border-amber-500/20 border-t-amber-500 animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-amber-400 animate-pulse" />
            </div>
          </div>
          <p className="text-emerald-200 text-sm font-medium tracking-wide">Loading your membership portal...</p>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-teal-900 to-emerald-950 flex flex-col items-center justify-center p-4">
        <div className="bg-teal-950/40 border border-rose-500/30 rounded-3xl p-8 max-w-md w-full text-center backdrop-blur-xl shadow-2xl space-y-4">
          <div className="p-3 bg-rose-500/10 text-rose-400 rounded-2xl inline-block border border-rose-500/20">
            <RefreshCw className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white font-serif">Session Issue</h2>
          <p className="text-sm text-emerald-200/80">{error || 'Could not load your account information.'}</p>
          <div className="pt-2 flex gap-3 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-semibold transition"
            >
              Retry
            </button>
            <button
              onClick={handleSignOut}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-teal-950 rounded-xl text-xs font-bold transition"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  const fullName = [user.first_name, user.middle_name, user.last_name].filter(Boolean).join(' ');
  const memberSinceYear = user.created_at ? new Date(user.created_at).getFullYear() : new Date().getFullYear();

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-teal-900 to-emerald-950 text-white selection:bg-amber-500 selection:text-teal-950">
      
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 bg-teal-950/70 backdrop-blur-xl border-b border-emerald-500/15 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20">
            {/* Logo and Brand */}
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-teal-900/60 border border-amber-500/30 text-amber-500 shadow-md">
                <svg className="w-7 h-7" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M50 5C50 5 52 9 49 12C46 15 42 13 42 13C42 13 47 16 50 14C53 12 52 8 52 8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                  <line x1="50" y1="14" x2="50" y2="22" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                  <path d="M50 22C43 22 34 32 34 45C34 58 34 85 34 85H66C66 85 66 58 66 45C66 32 57 22 50 22Z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round"/>
                  <path d="M44 85V65C44 61.7 46.7 59 50 59C53.3 59 56 61.7 56 65V85" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                </svg>
              </div>
              <div>
                <span className="text-base sm:text-lg font-extrabold tracking-tight font-serif text-white block">
                  {tenantDisplayName}
                </span>
                <span className="text-[11px] text-emerald-300/80 font-medium">Member Portal</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 sm:gap-4">
              <Link
                href={getCheckoutUrl()}
                className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold transition"
              >
                <Award className="w-4 h-4" />
                Membership Plans
              </Link>
              
              <button
                onClick={handleSignOut}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-900/80 hover:bg-rose-950/80 text-emerald-200 hover:text-rose-200 border border-emerald-500/20 hover:border-rose-500/30 text-xs font-semibold transition"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Welcome Banner */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-teal-950/80 via-emerald-900/60 to-teal-950/80 border border-amber-500/20 p-6 sm:p-10 shadow-2xl backdrop-blur-xl">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 rounded-full bg-amber-500/10 blur-[60px] pointer-events-none"></div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                Active Community Member
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold font-serif text-white tracking-tight">
                Assalamu Alaikum, {user.first_name || 'Member'}!
              </h1>
              <p className="text-sm sm:text-base text-emerald-200/80 max-w-2xl">
                Welcome to your member portal. Manage your profile, membership tiers, donations, and access center amenities.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="p-4 rounded-2xl bg-teal-950/70 border border-emerald-500/20 text-center min-w-[120px]">
                <div className="text-xs text-emerald-300/70 uppercase tracking-wider font-semibold">Status</div>
                <div className="text-base font-bold text-emerald-400 flex items-center justify-center gap-1 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" /> Active
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-teal-950/70 border border-emerald-500/20 text-center min-w-[120px]">
                <div className="text-xs text-emerald-300/70 uppercase tracking-wider font-semibold">Member Since</div>
                <div className="text-base font-bold text-amber-400 mt-0.5">{memberSinceYear}</div>
              </div>
            </div>
          </div>
        </section>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Column 1 & 2: Profile & Membership Overview */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Account Details Card */}
            <section className="bg-teal-950/40 rounded-3xl border border-emerald-500/15 p-6 sm:p-8 backdrop-blur-xl shadow-lg space-y-6">
              <div className="flex items-center justify-between border-b border-emerald-500/15 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white font-serif">Personal Information</h2>
                    <p className="text-xs text-emerald-300/70">Verified contact and address details</p>
                  </div>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-medium">
                  Verified
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-teal-950/50 border border-emerald-500/10 space-y-1">
                  <span className="text-xs font-semibold text-emerald-300/60 uppercase tracking-wider flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-amber-400" /> Full Name
                  </span>
                  <p className="text-sm font-semibold text-white">{fullName}</p>
                </div>

                <div className="p-4 rounded-2xl bg-teal-950/50 border border-emerald-500/10 space-y-1">
                  <span className="text-xs font-semibold text-emerald-300/60 uppercase tracking-wider flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-amber-400" /> Email Address
                  </span>
                  <p className="text-sm font-semibold text-white break-all">{user.email}</p>
                </div>

                <div className="p-4 rounded-2xl bg-teal-950/50 border border-emerald-500/10 space-y-1">
                  <span className="text-xs font-semibold text-emerald-300/60 uppercase tracking-wider flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-amber-400" /> Phone Number
                  </span>
                  <p className="text-sm font-semibold text-white">{user.mobile || 'Not provided'}</p>
                </div>

                <div className="p-4 rounded-2xl bg-teal-950/50 border border-emerald-500/10 space-y-1">
                  <span className="text-xs font-semibold text-emerald-300/60 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-400" /> Role & Permissions
                  </span>
                  <p className="text-sm font-semibold text-white">
                    {user.is_superuser ? 'Super Administrator' : 'General Member'}
                  </p>
                </div>

                <div className="sm:col-span-2 p-4 rounded-2xl bg-teal-950/50 border border-emerald-500/10 space-y-1">
                  <span className="text-xs font-semibold text-emerald-300/60 uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-amber-400" /> Registered Address
                  </span>
                  <p className="text-sm font-semibold text-white">
                    {user.street_address ? `${user.street_address}, ${user.city}, ${user.state}` : 'No address on file'}
                  </p>
                </div>
              </div>
            </section>

            {/* Community & Announcements Card */}
            <section className="bg-teal-950/40 rounded-3xl border border-emerald-500/15 p-6 sm:p-8 backdrop-blur-xl shadow-lg space-y-4">
              <div className="flex items-center justify-between border-b border-emerald-500/15 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                    <Bell className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white font-serif">Community Announcements</h2>
                    <p className="text-xs text-emerald-300/70">Updates and notices from {tenantDisplayName}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="p-4 rounded-2xl bg-teal-950/60 border border-emerald-500/10 hover:border-amber-500/30 transition flex items-start gap-4">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 shrink-0 mt-0.5">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-white">Weekly Jummah Prayer Schedule</h3>
                    <p className="text-xs text-emerald-200/80">
                      1st Khutbah at 1:15 PM & 2nd Khutbah at 2:15 PM. Please arrive 15 minutes early for parking.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-teal-950/60 border border-emerald-500/10 hover:border-amber-500/30 transition flex items-start gap-4">
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 shrink-0 mt-0.5">
                    <Award className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-white">Annual Community Membership Drive</h3>
                    <p className="text-xs text-emerald-200/80">
                      Support our expansion project. Enroll in a monthly or annual supporter tier to receive member benefits.
                    </p>
                  </div>
                </div>
              </div>
            </section>

          </div>

          {/* Column 3: Digital Membership Card & Tier Info */}
          <div className="space-y-8">
            
            {/* Digital Membership Pass */}
            <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-600 via-yellow-600 to-amber-700 p-6 shadow-2xl text-teal-950 border border-yellow-300/40">
              <div className="absolute top-0 right-0 -mr-6 -mt-6 w-32 h-32 bg-white/20 rounded-full blur-2xl pointer-events-none"></div>
              
              <div className="flex justify-between items-start mb-6">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-teal-950/70">
                    Official Member Pass
                  </span>
                  <h3 className="text-base font-extrabold font-serif text-teal-950 mt-0.5">
                    {tenantDisplayName}
                  </h3>
                </div>
                <div className="p-2 bg-teal-950 text-amber-400 rounded-xl shadow-md">
                  <QrCode className="w-5 h-5" />
                </div>
              </div>

              <div className="space-y-3 my-6">
                <div>
                  <span className="text-[10px] uppercase font-bold text-teal-950/70 tracking-wider">Member Name</span>
                  <div className="text-sm font-extrabold text-teal-950">{fullName}</div>
                </div>
                <div className="flex justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-teal-950/70 tracking-wider">Tier</span>
                    <div className="text-xs font-bold text-teal-950">Standard Member</div>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-teal-950/70 tracking-wider">Member ID</span>
                    <div className="text-xs font-bold text-teal-950">#{user.id.slice(0, 8).toUpperCase()}</div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-teal-950/15 flex items-center justify-between text-xs font-bold text-teal-950">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Good Standing
                </span>
                <span>Active 2026</span>
              </div>
            </section>

            {/* Quick Actions Card */}
            <section className="bg-teal-950/40 rounded-3xl border border-emerald-500/15 p-6 backdrop-blur-xl shadow-lg space-y-4">
              <h3 className="text-sm font-bold text-white font-serif uppercase tracking-wider text-amber-500/90">
                Quick Actions
              </h3>

              <div className="space-y-2.5">
                <Link
                  href={getCheckoutUrl()}
                  className="w-full flex items-center justify-between p-3.5 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-teal-950 rounded-xl font-bold text-xs transition shadow-md active:scale-[0.98]"
                >
                  <span className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    Manage / Upgrade Membership
                  </span>
                  <ArrowUpRight className="w-4 h-4" />
                </Link>

                <button
                  onClick={() => alert('Member pass download feature is in progress.')}
                  className="w-full flex items-center justify-between p-3.5 bg-teal-900/60 hover:bg-teal-900/90 text-emerald-200 rounded-xl font-semibold text-xs border border-emerald-500/20 transition active:scale-[0.98]"
                >
                  <span className="flex items-center gap-2">
                    <QrCode className="w-4 h-4 text-amber-400" />
                    Download Digital Card
                  </span>
                  <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                </button>
              </div>
            </section>

          </div>

        </div>

      </main>

    </div>
  );
}
