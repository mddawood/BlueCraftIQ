export default function TenantAdminDashboard({ params }: { params: { tenant: string } }) {
  return (
    <div className="space-y-6">
      <div className="bg-white px-4 py-5 border-b border-gray-200 sm:px-6 rounded-lg shadow-sm">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          Admin Dashboard for {params.tenant}
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Manage your integrations and view member statistics.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Salesforce Integration Card */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h4 className="text-lg font-medium text-gray-900 mb-4">Salesforce Integration</h4>
            <p className="text-sm text-gray-500 mb-6">
              Connect your own Salesforce org to sync member data automatically.
            </p>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 w-full transition flex items-center justify-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24"><path d="M19.4 8.7c-.2-3.1-2.9-5.6-6.1-5.6-2.6 0-4.9 1.6-5.8 3.9-3.1.2-5.5 2.8-5.5 6 0 3.3 2.7 6 6 6h11c2.8 0 5-2.2 5-5 0-2.6-2.1-4.8-4.6-5.3zM14 17H8c-2.2 0-4-1.8-4-4 0-2.1 1.6-3.8 3.7-4l.5-.1.2-.5c.6-1.8 2.2-3 4.1-3 2.5 0 4.5 1.9 4.9 4.3l.1.5.5.1c1.7.3 3 1.8 3 3.6 0 2-1.7 3.6-3.8 3.6h-.2z"/></svg>
              Connect Salesforce
            </button>
          </div>
        </div>

        {/* Stripe Connect Card */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h4 className="text-lg font-medium text-gray-900 mb-4">Stripe Payments</h4>
            <p className="text-sm text-gray-500 mb-6">
              Connect your Stripe account to start receiving membership payments directly.
            </p>
            <button className="bg-[#635BFF] text-white px-4 py-2 rounded-md font-medium hover:bg-[#4B45C6] w-full transition flex items-center justify-center">
              Connect Stripe
            </button>
          </div>
        </div>
      </div>
      
      {/* Members List Placeholder */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md mt-8">
        <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Members</h3>
        </div>
        <ul className="divide-y divide-gray-200">
          <li className="px-4 py-4 sm:px-6 text-sm text-gray-500 text-center">
            No members found. Share your checkout link to get started!
          </li>
        </ul>
      </div>
    </div>
  );
}
