'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Building, 
  ShieldAlert, 
  Activity, 
  Settings, 
  UserCheck, 
  Lock, 
  CheckCircle, 
  XCircle,
  RefreshCw,
  Search,
  ExternalLink,
  ChevronRight,
  TrendingUp
} from 'lucide-react';

interface TenantData {
  id: string;
  name: string;
  subdomain: string;
  plan: string;
  status: string;
  rate_limit_per_minute: number;
  is_active: boolean;
  created_at: string;
  usage_count: number;
}

interface UsageEvent {
  id: string;
  path: string;
  method: string;
  status_code: number;
  timestamp: string;
}

interface TenantDetails extends TenantData {
  usage_events: UsageEvent[];
}

export default function SuperAdminDashboard() {
  const [tenants, setTenants] = useState<TenantData[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<TenantDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

  // 1. Authenticate and fetch tenants
  useEffect(() => {
    const fetchAdminData = async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) {
        setAuthError('Authentication required. Please log in first.');
        setLoading(false);
        return;
      }

      try {
        // Verify current user is super admin
        const meRes = await fetch(`${API_URL}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!meRes.ok) throw new Error('Failed to verify user profile');
        const profile = await meRes.json();
        setCurrentUser(profile);

        if (!profile.is_super_admin) {
          setAuthError('Access Denied. You do not have super-admin privileges.');
          setLoading(false);
          return;
        }

        // Fetch tenants list
        const tenantsRes = await fetch(`${API_URL}/admin/tenants`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!tenantsRes.ok) throw new Error('Failed to load tenants data');
        const data = await tenantsRes.json();
        setTenants(data);
      } catch (err: any) {
        setError(err.message || 'An error occurred while loading data.');
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, []);

  // 2. Fetch details for a specific tenant
  const handleSelectTenant = async (tenantId: string) => {
    setDetailsLoading(true);
    setError(null);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/admin/tenants/${tenantId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error('Failed to load tenant details');
      const data = await res.json();
      setSelectedTenant(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load details.');
    } finally {
      setDetailsLoading(false);
    }
  };

  // 3. Suspend / Reactivate tenant
  const handleUpdateStatus = async (tenantId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'active' ? 'suspended' : 'active';
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/admin/tenants/${tenantId}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: nextStatus })
      });
      if (!res.ok) throw new Error('Failed to update tenant status');
      const updated = await res.json();
      
      // Update local lists
      setTenants(prev => prev.map(t => t.id === tenantId ? { ...t, status: nextStatus, is_active: nextStatus === 'active' } : t));
      if (selectedTenant && selectedTenant.id === tenantId) {
        setSelectedTenant(prev => prev ? { ...prev, status: nextStatus, is_active: nextStatus === 'active' } : null);
      }
      setSuccessMessage(`Tenant status updated to ${nextStatus.toUpperCase()} successfully.`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update status.');
    }
  };

  // 4. Change plan
  const handleUpdatePlan = async (tenantId: string, nextPlan: string) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/admin/tenants/${tenantId}/plan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ plan: nextPlan })
      });
      if (!res.ok) throw new Error('Failed to update plan');
      const updated = await res.json();
      
      // Update local lists
      setTenants(prev => prev.map(t => t.id === tenantId ? { ...t, plan: nextPlan, rate_limit_per_minute: updated.rate_limit_per_minute } : t));
      if (selectedTenant && selectedTenant.id === tenantId) {
        setSelectedTenant(prev => prev ? { ...prev, plan: nextPlan, rate_limit_per_minute: updated.rate_limit_per_minute } : null);
      }
      setSuccessMessage(`Plan updated to ${nextPlan.toUpperCase()} successfully.`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update plan.');
    }
  };

  // 5. Impersonate Tenant
  const handleImpersonate = async (tenantId: string, subdomain: string) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/admin/tenants/${tenantId}/impersonate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Impersonation failed');
      }
      const data = await res.json();
      
      // Save support token in localStorage
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('token_type', data.token_type);
      
      setSuccessMessage('Impersonation token generated. Redirecting to tenant dashboard...');
      
      // Redirect to tenant subdomain dashboard
      setTimeout(() => {
        const protocol = window.location.protocol;
        // In local development, rewrite subdomain
        window.location.href = `${protocol}//${subdomain}.localhost:3000/dashboard`;
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Impersonation failed.');
    }
  };

  // Filter tenants by search query
  const filteredTenants = tenants.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.subdomain.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4 text-slate-200">
          <RefreshCw className="w-10 h-10 animate-spin text-teal-400" />
          <p className="text-sm font-medium tracking-wide">Loading Admin Panel...</p>
        </div>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 text-center">
        <div className="max-w-md w-full bg-slate-900 border border-rose-500/30 rounded-3xl p-8 space-y-6 shadow-2xl">
          <div className="p-4 bg-rose-500/10 text-rose-400 rounded-2xl inline-block border border-rose-500/20">
            <Lock className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-white font-serif">Unauthorized</h2>
          <p className="text-sm text-slate-400">{authError}</p>
          <div className="pt-2">
            <Link 
              href="/"
              className="px-6 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-xl text-sm font-bold transition inline-block"
            >
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-slate-900/60 backdrop-blur-md border-b border-slate-800 px-6 py-4 sticky top-0 z-30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-teal-500/10 rounded-xl border border-teal-500/20">
            <Settings className="w-6 h-6 text-teal-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white font-serif">SaaS Administrator Panel</h1>
            <p className="text-xs text-slate-400">Global System Management</p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs bg-slate-800/40 border border-slate-700/50 px-4 py-2 rounded-2xl">
          <UserCheck className="w-4 h-4 text-teal-400" />
          <span className="text-slate-300 font-medium">{currentUser?.email} (Super Admin)</span>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Tenants List Column */}
        <div className="lg:col-span-2 space-y-6 flex flex-col">
          {/* Messages */}
          {successMessage && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-300 text-sm flex items-center gap-2">
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}
          {error && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-300 text-sm flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search tenants by name or subdomain..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-900/60 border border-slate-800 focus:border-teal-500/50 rounded-2xl focus:outline-none text-sm transition"
            />
          </div>

          {/* Tenants Card Table */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl overflow-hidden flex-1 shadow-xl">
            <div className="px-6 py-4 border-b border-slate-800/80 bg-slate-900/20 flex justify-between items-center">
              <h2 className="text-sm font-semibold tracking-wider uppercase text-slate-400">All Tenants ({filteredTenants.length})</h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800/60 text-slate-400 text-xs font-semibold">
                    <th className="px-6 py-4">Organization</th>
                    <th className="px-6 py-4">Plan</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Usage</th>
                    <th className="px-6 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40 text-sm">
                  {filteredTenants.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                        No tenants matched your query.
                      </td>
                    </tr>
                  ) : (
                    filteredTenants.map(tenant => (
                      <tr 
                        key={tenant.id}
                        onClick={() => handleSelectTenant(tenant.id)}
                        className={`hover:bg-slate-900/50 cursor-pointer transition ${selectedTenant?.id === tenant.id ? 'bg-slate-900/40' : ''}`}
                      >
                        <td className="px-6 py-4">
                          <div className="font-semibold text-white">{tenant.name}</div>
                          <div className="text-xs text-slate-400">{tenant.subdomain}.localhost:3000</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold capitalize ${
                            tenant.plan === 'enterprise' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                            tenant.plan === 'pro' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                            'bg-slate-800 text-slate-400 border border-slate-700/50'
                          }`}>
                            {tenant.plan}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`flex items-center gap-1.5 text-xs font-semibold ${
                            tenant.status === 'active' ? 'text-emerald-400' : 'text-rose-400'
                          }`}>
                            {tenant.status === 'active' ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                            <span className="capitalize">{tenant.status}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="font-semibold">{tenant.usage_count}</div>
                          <div className="text-[10px] text-slate-400">requests</div>
                        </td>
                        <td className="px-6 py-4 text-right text-slate-500">
                          <ChevronRight className="w-4 h-4 ml-auto" />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Tenant Details Panel */}
        <div className="lg:col-span-1 space-y-6">
          {selectedTenant ? (
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 shadow-xl space-y-6 sticky top-24">
              {/* Header Details */}
              <div className="flex justify-between items-start border-b border-slate-800/80 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-white font-serif">{selectedTenant.name}</h2>
                  <p className="text-xs text-slate-400">{selectedTenant.subdomain}.localhost:3000</p>
                </div>
                <div className="p-2 bg-slate-800/40 rounded-xl">
                  <Building className="w-5 h-5 text-teal-400" />
                </div>
              </div>

              {/* Quick info grid */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="bg-slate-850 p-3 rounded-2xl border border-slate-800/50">
                  <div className="text-slate-400 mb-0.5">Rate Limit</div>
                  <div className="font-semibold text-white">
                    {selectedTenant.rate_limit_per_minute >= 1000000 ? 'Unlimited' : `${selectedTenant.rate_limit_per_minute} req/min`}
                  </div>
                </div>
                <div className="bg-slate-850 p-3 rounded-2xl border border-slate-800/50">
                  <div className="text-slate-400 mb-0.5">Created Date</div>
                  <div className="font-semibold text-white">
                    {new Date(selectedTenant.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* Actions panel */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Actions</h3>
                
                {/* Change plan */}
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase tracking-wide mb-1 font-semibold">Change Subscription Plan</label>
                  <select
                    value={selectedTenant.plan}
                    onChange={e => handleUpdatePlan(selectedTenant.id, e.target.value)}
                    className="w-full px-3 py-2 bg-slate-850 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-teal-500/50 transition cursor-pointer"
                  >
                    <option value="free">Free Plan</option>
                    <option value="pro">Pro Plan</option>
                    <option value="enterprise">Enterprise Plan</option>
                  </select>
                </div>

                {/* Suspend / Reactivate */}
                <button
                  onClick={() => handleUpdateStatus(selectedTenant.id, selectedTenant.status)}
                  className={`w-full py-2.5 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 border ${
                    selectedTenant.status === 'active' 
                      ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/20' 
                      : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/20'
                  }`}
                >
                  <ShieldAlert className="w-4 h-4" />
                  {selectedTenant.status === 'active' ? 'Suspend Organization' : 'Reactivate Organization'}
                </button>

                {/* Impersonate */}
                <button
                  onClick={() => handleImpersonate(selectedTenant.id, selectedTenant.subdomain)}
                  className="w-full py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 active:scale-[0.98]"
                >
                  <ExternalLink className="w-4 h-4" />
                  Impersonate Organization
                </button>
              </div>

              {/* Usage events logs */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-teal-400" />
                    Recent Activity Logs
                  </h3>
                  {detailsLoading && <RefreshCw className="w-3 h-3 animate-spin text-teal-400" />}
                </div>

                <div className="max-h-48 overflow-y-auto space-y-2 pr-1.5 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
                  {selectedTenant.usage_events.length === 0 ? (
                    <div className="text-[11px] text-slate-500 text-center py-6">
                      No recent activity events logged.
                    </div>
                  ) : (
                    selectedTenant.usage_events.map(event => (
                      <div key={event.id} className="bg-slate-850/60 border border-slate-800/40 p-2.5 rounded-xl flex items-center justify-between text-[11px]">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className={`font-bold px-1.5 py-0.5 rounded text-[9px] ${
                              event.method === 'POST' ? 'bg-amber-500/10 text-amber-400' :
                              event.method === 'DELETE' ? 'bg-rose-500/10 text-rose-400' :
                              'bg-teal-500/10 text-teal-400'
                            }`}>{event.method}</span>
                            <span className="text-slate-300 font-mono font-medium truncate max-w-[120px]">{event.path}</span>
                          </div>
                          <div className="text-[9px] text-slate-500 mt-1">
                            {new Date(event.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                        <div>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            event.status_code >= 400 ? 'bg-rose-500/10 text-rose-400' :
                            event.status_code >= 300 ? 'bg-slate-800 text-slate-400' :
                            'bg-emerald-500/10 text-emerald-400'
                          }`}>{event.status_code}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          ) : (
            <div className="bg-slate-900/20 border border-slate-800/60 border-dashed rounded-3xl p-8 text-center text-slate-500 h-64 flex flex-col items-center justify-center gap-3">
              <Building className="w-8 h-8 text-slate-600" />
              <div>
                <div className="font-semibold text-slate-400 text-sm">No Organization Selected</div>
                <div className="text-xs text-slate-500 mt-0.5">Click any tenant from the list to view usage logs and run management operations.</div>
              </div>
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
