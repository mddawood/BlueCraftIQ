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
  AlertCircle,
  Home
} from 'lucide-react';

export default function TenantSignupPage({ params }: { params: { tenant: string } }) {
  const [step, setStep] = useState(1);
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Normalize tenant name for display
  const tenantDisplayName = params.tenant.toLowerCase() === 'msmc' || params.tenant.toLowerCase() === 'mountsinai'
    ? 'Mount Sinai Muslim Center'
    : `${params.tenant.charAt(0).toUpperCase() + params.tenant.slice(1)} Portal`;

  const validateStep1 = () => {
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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
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
    if (errors[name]) {
      setErrors(prev => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
  };

  const handleNextStep1 = (e: React.MouseEvent) => {
    e.preventDefault();
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handleBackToStep1 = (e: React.MouseEvent) => {
    e.preventDefault();
    setStep(1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep2()) return;

    setIsSubmitting(true);
    setErrors({});

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-Subdomain': params.tenant
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          first_name: formData.firstName,
          middle_name: formData.middleName || null,
          last_name: formData.lastName,
          mobile: formData.mobile,
          street_address: formData.streetAddress,
          city: formData.city,
          state: formData.state
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        setErrors({ api: errorData.detail || 'Registration failed' });
        setIsSubmitting(false);
        return;
      }

      setStep(3); // Navigate to success confirmation
    } catch (err) {
      setErrors({ api: 'Unable to connect to the server. Please ensure the backend is running.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-16 sm:px-6 lg:px-8 overflow-hidden bg-gradient-to-br from-emerald-950 via-teal-900 to-emerald-950">
      
      {/* Background Radial Glows */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-emerald-500/10 blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 rounded-full bg-yellow-500/5 blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-2xl space-y-6 z-10">
        
        {/* Navigation & Branding */}
        {step < 3 && (
          <div className="flex flex-col items-center text-center">
            <Link 
              href="/"
              className="group flex items-center gap-2 text-xs font-bold text-emerald-400 hover:text-amber-500 mb-4 transition self-start md:self-center"
            >
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
              Back to login
            </Link>
            
            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl drop-shadow-sm font-serif">
              Join {tenantDisplayName}
            </h1>
            <p className="mt-1.5 text-sm text-emerald-300/80">
              Create your account to purchase and manage your membership
            </p>
          </div>
        )}

        {/* Form Container (Glassmorphic Card) */}
        <div className="relative bg-teal-950/30 backdrop-blur-xl border border-emerald-500/10 shadow-[0_20px_50px_rgba(0,0,0,0.3)] rounded-3xl p-6 sm:p-10 transition-all duration-300">
          
          {/* HOME Button at top right inside the card */}
          <div className="absolute top-6 right-6 z-20">
            <Link
              href="/"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs tracking-wider rounded-lg uppercase transition border border-emerald-500/20 active:scale-[0.98]"
            >
              <Home className="w-3.5 h-3.5" />
              Home
            </Link>
          </div>

          {/* Dome Logo Centered inside Card */}
          <div className="flex flex-col items-center text-center mb-6 pt-2">
            <div className="relative p-3 mb-2 rounded-xl bg-teal-950/40 border border-amber-500/10 shadow-[0_0_30px_-12px_rgba(245,158,11,0.15)]">
              {/* Custom SVG Mosque Dome Logo */}
              <svg 
                className="w-12 h-12 text-amber-500" 
                viewBox="0 0 100 100" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M50 5C50 5 52 9 49 12C46 15 42 13 42 13C42 13 47 16 50 14C53 12 52 8 52 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <line x1="50" y1="14" x2="50" y2="22" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                <path d="M50 22C43 22 34 32 34 45C34 58 34 85 34 85H66C66 85 66 58 66 45C66 32 57 22 50 22Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                <path d="M34 45C29 45 22 52 22 62C22 72 22 85 22 85H34" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                <path d="M66 45C71 45 78 52 78 62C78 72 78 85 78 85H66" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                <path d="M44 85V65C44 61.7 46.7 59 50 59C53.3 59 56 61.7 56 65V85" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <path d="M26 85V72C26 70.3 27.3 69 29 69C30.7 69 32 70.3 32 72V85" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M68 85V72C68 70.3 69.3 69 71 69C72.7 69 74 70.3 74 72V85" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="text-sm font-semibold tracking-wide text-amber-500/90 font-serif">
              {tenantDisplayName}
            </span>
          </div>

          {/* Errors display */}
          {Object.keys(errors).length > 0 && (
            <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-sm text-rose-200 flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block mb-0.5">Please correct the errors:</span>
                <ul className="list-disc pl-4 space-y-0.5 text-xs text-rose-300/80">
                  {Object.values(errors).map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {step === 1 && (
            /* --- STEP 1: PERSONAL & CONTACT INFORMATION --- */
            <form onSubmit={(e) => e.preventDefault()} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                
                <div className="md:col-span-2 border-b border-emerald-500/10 pb-1 mt-1">
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
                      className={`block w-full pl-9 pr-3 py-2 bg-teal-950/60 border ${
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
                      className="block w-full pl-9 pr-3 py-2 bg-teal-950/60 border border-emerald-800/40 rounded-xl text-white placeholder-emerald-700/60 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition-all text-sm"
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
                      className={`block w-full pl-9 pr-3 py-2 bg-teal-950/60 border ${
                        errors.lastName ? 'border-rose-500 focus:ring-rose-500/30' : 'border-emerald-800/40 focus:ring-amber-500/40'
                      } rounded-xl text-white placeholder-emerald-700/60 focus:outline-none focus:ring-2 focus:border-amber-500 transition-all text-sm`}
                    />
                  </div>
                </div>

                <div className="md:col-span-2 border-b border-emerald-500/10 pb-1 mt-2">
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
                      className={`block w-full pl-9 pr-3 py-2 bg-teal-950/60 border ${
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
                      className={`block w-full pl-9 pr-3 py-2 bg-teal-950/60 border ${
                        errors.mobile ? 'border-rose-500 focus:ring-rose-500/30' : 'border-emerald-800/40 focus:ring-amber-500/40'
                      } rounded-xl text-white placeholder-emerald-700/60 focus:outline-none focus:ring-2 focus:border-amber-500 transition-all text-sm`}
                    />
                  </div>
                </div>

                <div className="md:col-span-2 border-b border-emerald-500/10 pb-1 mt-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-amber-500/80">Address Details</h3>
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
                      className={`block w-full pl-9 pr-3 py-2 bg-teal-950/60 border ${
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
                      className={`block w-full pl-9 pr-3 py-2 bg-teal-950/60 border ${
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
                      className={`block w-full pl-9 pr-3 py-2 bg-teal-950/60 border ${
                        errors.state ? 'border-rose-500 focus:ring-rose-500/30' : 'border-emerald-800/40 focus:ring-amber-500/40'
                      } rounded-xl text-white placeholder-emerald-700/60 focus:outline-none focus:ring-2 focus:border-amber-500 transition-all text-sm`}
                    />
                  </div>
                </div>

              </div>

              {/* Continue Button */}
              <div className="pt-4">
                <button
                  type="button"
                  onClick={handleNextStep1}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-teal-950 font-bold text-sm rounded-xl shadow-lg active:scale-[0.98] transition-all duration-150"
                >
                  Continue
                </button>
              </div>

              <div className="text-center pt-1">
                <p className="text-xs text-emerald-300/60">
                  Already have an account?{' '}
                  <Link
                    href="/"
                    className="font-bold text-amber-500 hover:text-amber-400 transition underline decoration-amber-500/30 underline-offset-4"
                  >
                    Sign in here
                  </Link>
                </p>
              </div>
            </form>
          )}

          {step === 2 && (
            /* --- STEP 2: PASSWORD CREATION --- */
            <form onSubmit={handleSubmit} className="space-y-6 max-w-md mx-auto">
              
              <div className="text-center space-y-2">
                <h2 className="text-lg font-bold text-white font-serif">Create Password</h2>
                <p className="text-xs text-emerald-300/80 leading-relaxed">
                  Please create a password that will be required to sign-in. Password must be at least 8 characters long.
                </p>
              </div>

              <div className="space-y-4 pt-2">
                <div>
                  <label htmlFor="password" className="block text-xs font-medium text-emerald-200 mb-1">
                    Create Password <span className="text-amber-500">*</span>
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
                    Repeat Password <span className="text-amber-500">*</span>
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

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={handleBackToStep1}
                  className="flex-1 px-4 py-3 bg-teal-950/40 hover:bg-teal-950/60 text-emerald-300 border border-emerald-500/20 font-bold text-sm rounded-xl transition active:scale-[0.98]"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-teal-950 font-bold text-sm rounded-xl shadow-lg active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Registering...' : 'Next'}
                </button>
              </div>
            </form>
          )}

          {step === 3 && (
            /* --- STEP 3: REGISTRATION SUCCESS CONFIRMATION --- */
            <div className="text-center py-6 space-y-5 max-w-md mx-auto animate-fade-in">
              <div className="inline-flex p-3 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mb-1">
                <Check className="w-8 h-8" />
              </div>
              
              <h2 className="text-2xl font-bold text-white font-serif">Thank You!</h2>
              <p className="text-base font-semibold text-emerald-300 leading-snug">
                Your registration has been completed.
              </p>
              
              <div className="space-y-3 pt-2 text-xs text-emerald-200/80 leading-relaxed border-t border-emerald-500/10">
                <p>
                  Please click on the <span className="font-bold text-amber-400">Home</span> tab on the top right of this screen to proceed.
                </p>
                <p>
                  At the Home screen, you will be required to enter your username (email address) and password.
                </p>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
