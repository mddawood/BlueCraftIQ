export default function CheckoutPage({ params }: { params: { tenant: string } }) {
  const plans = [
    { name: 'Basic Member', price: '$10/mo', description: 'Access to standard community features.' },
    { name: 'Premium Member', price: '$25/mo', description: 'Access to premium events and directories.' }
  ];

  return (
    <div className="max-w-4xl mx-auto py-12">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
          Membership Plans
        </h2>
        <p className="mt-4 text-lg text-gray-500">
          Support {params.tenant} by becoming a member today.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
        {plans.map((plan) => (
          <div key={plan.name} className="border border-gray-200 rounded-lg shadow-sm divide-y divide-gray-200 bg-white">
            <div className="p-6">
              <h3 className="text-2xl font-semibold text-gray-900">{plan.name}</h3>
              <p className="mt-4 text-gray-500">{plan.description}</p>
              <p className="mt-8">
                <span className="text-4xl font-extrabold text-gray-900">{plan.price}</span>
              </p>
              <button
                className="mt-8 block w-full bg-indigo-600 border border-transparent rounded-md py-3 px-4 text-center font-medium text-white hover:bg-indigo-700"
              >
                Subscribe with Stripe
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
