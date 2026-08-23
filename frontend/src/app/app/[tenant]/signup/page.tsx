'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  User, 
  MapPin, 
  Phone, 
  Mail, 
  Lock, 
  ArrowLeft, 
  Check, 
  AlertCircle 
} from 'lucide-react';

export default function TenantSignupPage({ params }: { params: { tenant: string } }) {
  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    streetAddress: '',
    city: '',
    state: '',
    mobile: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  // Normalize tenant name for display
  const tenantDisplayName = params.tenant.toLowerCase() === 'msmc' || params.tenant.toLowerCase() === 'mountsinai'
    ? 'Mount Sinai Muslim Center'
    : `${params.tenant.charAt(0).toUpperCase() + params.tenant.slice(1)} Portal`;

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.streetAddress.trim()) newErrors.streetAddress = 'Street address is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.state.trim()) newErrors.state = 'State is required';
    
    if (!formData.mobile.trim()) {
      newErrors.mobile = 'Mobile number is required';
    } else if (!/^\+?[\d\s-]{7,15}$/.test(formData.mobile.trim())) {
      newErrors.mobile = 'Invalid mobile number format';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email.trim())) {
      newErrors.email = 'Invalid email address format';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear validation error when user types
    if (errors[name]) {
      setErrors(prev => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      setSuccess(true);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-16 sm:px-6 lg:px-8 overflow-hidden bg-gradient-to-br from-emerald-950 via-teal-900 to-emerald-950">
      
      {/* Background Radial Glows */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-emerald-500/10 blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 rounded-full bg-yellow-500/5 blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-2xl space-y-8 z-10">
        
        {/* Navigation & Branding */}
        <div className="flex flex-col items-center text-center">
          <Link 
            href={`/app/${params.tenant}`}
            className="group flex items-center gap-2 text-xs font-bold text-emerald-400 hover:text-amber-500 mb-6 transition self-start md:self-center"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
            Back to login
          </Link>
          
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl drop-shadow-sm font-serif">
            Join {tenantDisplayName}
          </h1>
          <p className="mt-2 text-sm text-emerald-300/80">
            Create your account to purchase and manage your membership
          </p>
        </div>

        {/* Form Container (Glassmorphic Card) */}
        <div className="bg-teal-950/30 backdrop-blur-xl border border-emerald-500/10 shadow-[0_20px_50px_rgba(0,0,0,0.3)] rounded-3xl p-6 sm:p-10 transition-all duration-300">
          
          {success ? (
            /* --- SUCCESS STATE --- */
            <div className="text-center py-8 space-y-4">
              <div className="inline-flex p-3 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mb-2">
                <Check className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-white">Registration Complete!</h2>
              <p className="text-emerald-200/80 max-w-md mx-auto text-sm">
                Your membership portal account has been successfully registered. You can now sign in using your email and password.
              </p>
              <div className="pt-4">
                <Link
                  href={`/app/${params.tenant}`}
                  className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-teal-950 font-bold rounded-xl transition"
                >
                  Sign In to Your Account
                </Link>
              </div>
            </div>
          ) : (
            /* --- SIGN UP FORM --- */
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {Object.keys(errors).length > 0 && (
                <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-sm text-rose-200 flex items-start gap-2.5">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block mb-0.5">Please correct the errors in the form:</span>
                    <ul className="list-disc pl-4 space-y-0.5 text-xs text-rose-300/80">
                      {Object.values(errors).map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* 2-Column Grid for Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                
                {/* --- PERSONAL SECTION --- */}
                <div className="md:col-span-2 border-b border-emerald-500/10 pb-2 mt-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-amber-500/80">Personal Information</h3>
                </div>

                <div>
                  <label htmlFor="firstName" className="block text-xs font-medium text-emerald-200 mb-1">
                    First Name <span className="text-amber-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-emerald-500">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      id="firstName"
                      name="firstName"
                      type="text"
                      value={formData.firstName}
                      onChange={handleChange}
                      placeholder="John"
                      className={`block w-full pl-9 pr-3 py-2.5 bg-teal-950/60 border ${
                        errors.firstName ? 'border-rose-500 focus:ring-rose-500/30' : 'border-emerald-800/40 focus:ring-amber-500/40'
                      } rounded-xl text-white placeholder-emerald-700/60 focus:outline-none focus:ring-2 focus:border-amber-500 transition-all text-sm`}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="middleName" className="block text-xs font-medium text-emerald-200 mb-1">
                    Middle Name <span className="text-emerald-400/40">(Optional)</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-emerald-500">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      id="middleName"
                      name="middleName"
                      type="text"
                      value={formData.middleName}
                      onChange={handleChange}
                      placeholder="Robert"
                      className="block w-full pl-9 pr-3 py-2.5 bg-teal-950/60 border border-emerald-800/40 rounded-xl text-white placeholder-emerald-700/60 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition-all text-sm"
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="lastName" className="block text-xs font-medium text-emerald-200 mb-1">
                    Last Name <span className="text-amber-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-emerald-500">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      id="lastName"
                      name="lastName"
                      type="text"
                      value={formData.lastName}
                      onChange={handleChange}
                      placeholder="Doe"
                      className={`block w-full pl-9 pr-3 py-2.5 bg-teal-950/60 border ${
                        errors.lastName ? 'border-rose-500 focus:ring-rose-500/30' : 'border-emerald-800/40 focus:ring-amber-500/40'
                      } rounded-xl text-white placeholder-emerald-700/60 focus:outline-none focus:ring-2 focus:border-amber-500 transition-all text-sm`}
                    />
                  </div>
                </div>

                {/* --- CONTACT SECTION --- */}
                <div className="md:col-span-2 border-b border-emerald-500/10 pb-2 mt-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-amber-500/80">Contact Details</h3>
                </div>

                <div>
                  <label htmlFor="email" className="block text-xs font-medium text-emerald-200 mb-1">
                    Email Address <span className="text-amber-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-emerald-500">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="john.doe@example.com"
                      className={`block w-full pl-9 pr-3 py-2.5 bg-teal-950/60 border ${
                        errors.email ? 'border-rose-500 focus:ring-rose-500/30' : 'border-emerald-800/40 focus:ring-amber-500/40'
                      } rounded-xl text-white placeholder-emerald-700/60 focus:outline-none focus:ring-2 focus:border-amber-500 transition-all text-sm`}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="mobile" className="block text-xs font-medium text-emerald-200 mb-1">
                    Mobile Number <span className="text-amber-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-emerald-500">
                      <Phone className="w-4 h-4" />
                    </div>
                    <input
                      id="mobile"
                      name="mobile"
                      type="tel"
                      value={formData.mobile}
                      onChange={handleChange}
                      placeholder="+1 (555) 019-2834"
                      className={`block w-full pl-9 pr-3 py-2.5 bg-teal-950/60 border ${
                        errors.mobile ? 'border-rose-500 focus:ring-rose-500/30' : 'border-emerald-800/40 focus:ring-amber-500/40'
                      } rounded-xl text-white placeholder-emerald-700/60 focus:outline-none focus:ring-2 focus:border-amber-500 transition-all text-sm`}
                    />
                  </div>
                </div>

                {/* --- ADDRESS SECTION --- */}
                <div className="md:col-span-2 border-b border-emerald-500/10 pb-2 mt-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-amber-500/80">Address details</h3>
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="streetAddress" className="block text-xs font-medium text-emerald-200 mb-1">
                    Street Address <span className="text-amber-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-emerald-500">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <input
                      id="streetAddress"
                      name="streetAddress"
                      type="text"
                      value={formData.streetAddress}
                      onChange={handleChange}
                      placeholder="123 Main St, Apt 4B"
                      className={`block w-full pl-9 pr-3 py-2.5 bg-teal-950/60 border ${
                        errors.streetAddress ? 'border-rose-500 focus:ring-rose-500/30' : 'border-emerald-800/40 focus:ring-amber-500/40'
                      } rounded-xl text-white placeholder-emerald-700/60 focus:outline-none focus:ring-2 focus:border-amber-500 transition-all text-sm`}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="city" className="block text-xs font-medium text-emerald-200 mb-1">
                    City <span className="text-amber-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-emerald-500">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <input
                      id="city"
                      name="city"
                      type="text"
                      value={formData.city}
                      onChange={handleChange}
                      placeholder="New York"
                      className={`block w-full pl-9 pr-3 py-2.5 bg-teal-950/60 border ${
                        errors.city ? 'border-rose-500 focus:ring-rose-500/30' : 'border-emerald-800/40 focus:ring-amber-500/40'
                      } rounded-xl text-white placeholder-emerald-700/60 focus:outline-none focus:ring-2 focus:border-amber-500 transition-all text-sm`}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="state" className="block text-xs font-medium text-emerald-200 mb-1">
                    State <span className="text-amber-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-emerald-500">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <input
                      id="state"
                      name="state"
                      type="text"
                      value={formData.state}
                      onChange={handleChange}
                      placeholder="NY"
                      className={`block w-full pl-9 pr-3 py-2.5 bg-teal-950/60 border ${
                        errors.state ? 'border-rose-500 focus:ring-rose-500/30' : 'border-emerald-800/40 focus:ring-amber-500/40'
                      } rounded-xl text-white placeholder-emerald-700/60 focus:outline-none focus:ring-2 focus:border-amber-500 transition-all text-sm`}
                    />
                  </div>
                </div>

                {/* --- SECURITY SECTION --- */}
                <div className="md:col-span-2 border-b border-emerald-500/10 pb-2 mt-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-amber-500/80">Account Security</h3>
                </div>

                <div>
                  <label htmlFor="password" className="block text-xs font-medium text-emerald-200 mb-1">
                    Password <span className="text-amber-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-emerald-500">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className={`block w-full pl-9 pr-3 py-2.5 bg-teal-950/60 border ${
                        errors.password ? 'border-rose-500 focus:ring-rose-500/30' : 'border-emerald-800/40 focus:ring-amber-500/40'
                      } rounded-xl text-white placeholder-emerald-700/60 focus:outline-none focus:ring-2 focus:border-amber-500 transition-all text-sm`}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-xs font-medium text-emerald-200 mb-1">
                    Confirm Password <span className="text-amber-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-emerald-500">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className={`block w-full pl-9 pr-3 py-2.5 bg-teal-950/60 border ${
                        errors.confirmPassword ? 'border-rose-500 focus:ring-rose-500/30' : 'border-emerald-800/40 focus:ring-amber-500/40'
                      } rounded-xl text-white placeholder-emerald-700/60 focus:outline-none focus:ring-2 focus:border-amber-500 transition-all text-sm`}
                    />
                  </div>
                </div>

              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-teal-950 font-bold text-sm rounded-xl shadow-lg active:scale-[0.98] transition-all duration-150"
                >
                  Create Account
                </button>
              </div>

              <div className="text-center pt-2">
                <p className="text-xs text-emerald-300/60">
                  Already have an account?{' '}
                  <Link
                    href={`/app/${params.tenant}`}
                    className="font-bold text-amber-500 hover:text-amber-400 transition underline decoration-amber-500/30 underline-offset-4"
                  >
                    Sign in here
                  </Link>
                </p>
              </div>

            </form>
          )}

        </div>

      </div>
    </div>
  );
}
