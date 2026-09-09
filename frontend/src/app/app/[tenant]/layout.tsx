'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function TenantLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: { tenant: string };
}) {
  const pathname = usePathname();
  
  // Detect if current route has its own standalone layout (auth & custom dashboard)
  const isCustomLayoutPage = 
    pathname === '/' ||
    pathname === '/signup' ||
    pathname === '/dashboard' ||
    pathname === `/app/${params.tenant}` || 
    pathname === `/app/${params.tenant}/` ||
    pathname === `/app/${params.tenant}/signup` ||
    pathname === `/app/${params.tenant}/signup/` ||
    pathname === `/app/${params.tenant}/dashboard` ||
    pathname === `/app/${params.tenant}/dashboard/`;

  if (isCustomLayoutPage) {
    return (
      <div className="min-h-screen bg-emerald-950 text-gray-100 font-sans">
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <span className="text-xl font-bold text-indigo-600">
                  {params.tenant.toUpperCase()} Portal
                </span>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link href={`/app/${params.tenant}/dashboard`} className="border-indigo-500 text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Dashboard
                </Link>
                <Link href={`/app/${params.tenant}/checkout`} className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Membership Plans
                </Link>
                <Link href={`/app/${params.tenant}/admin`} className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Tenant Admin
                </Link>
              </div>
            </div>
            <div className="flex items-center">
              <Link href={`/app/${params.tenant}`} className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 transition">
                Sign Out
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
