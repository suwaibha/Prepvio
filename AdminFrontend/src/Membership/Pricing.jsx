import React, { useState } from 'react';
import { 
  Home, 
  ChevronRight, 
  MessageSquare,
  Users,
  CheckCircle
} from 'lucide-react';

// --- Mock Data ---
const monthlyPlans = [
  {
    name: "Lite",
    price: "$0",
    period: "User",
    icon: <Users className="w-8 h-8 text-blue-600" />,
    features: [
      "Free domains", "CDN Integration", "Advanced Settings", "10,000 unique users", "2000 items", ".....................", ".....................", ".....................", ".....................", "....................."
    ],
    isCurrent: true
  },
  {
    name: "Standard",
    price: "$9",
    period: "Month",
    icon: <Users className="w-8 h-8 text-gray-700" />,
    features: [
      "Free domains", "CDN Integration", "Advanced Settings", "10,000 unique users", "2000 items", ".....................", ".....................", ".....................", ".....................", "....................."
    ],
    isCurrent: false
  },
  {
    name: "Standard",
    price: "$36",
    period: "Month",
    icon: <Users className="w-8 h-8 text-gray-700" />,
    features: [
      "Free domains", "CDN Integration", "Advanced Settings", "10,000 unique users", "2000 items", "API Access", ".....................", ".....................", ".....................", "....................."
    ],
    isCurrent: false
  },
  {
    name: "Enterprise",
    price: "$69",
    period: "Month",
    icon: <Users className="w-8 h-8 text-gray-700" />,
    features: [
      "Free domains", "CDN Integration", "Advanced Settings", "10,000 unique users", "2000 items", "API Access", "Setup personalization", "Upload special data", "Advanced Features"
    ],
    isCurrent: false
  }
];

const annualPlans = [
  {
    name: "Lite",
    price: "$120",
    period: "User",
    icon: <Users className="w-8 h-8 text-blue-600" />,
    features: [
      "Free domains", "CDN Integration", "Advanced Settings", "10,000 unique users", "2000 items", ".....................", ".....................", ".....................", ".....................", "....................."
    ],
    isCurrent: true
  },
  {
    name: "Standard",
    price: "$99",
    period: "User",
    icon: <Users className="w-8 h-8 text-gray-700" />,
    features: [
      "Free domains", "CDN Integration", "Advanced Settings", "10,000 unique users", "2000 items", ".....................", ".....................", ".....................", ".....................", "....................."
    ],
    isCurrent: false
  },
  {
    name: "Standard",
    price: "$1236",
    period: "User",
    icon: <Users className="w-8 h-8 text-gray-700" />,
    features: [
      "Free domains", "CDN Integration", "Advanced Settings", "10,000 unique users", "2000 items", "API Access", "Setup personalization", ".....................", ".....................", "....................."
    ],
    isCurrent: false
  },
  {
    name: "Enterprise",
    price: "$3469",
    period: "User",
    icon: <Users className="w-8 h-8 text-gray-700" />,
    features: [
      "Free domains", "CDN Integration", "Advanced Settings", "10,000 unique users", "2000 items", "API Access", "Setup personalization", "Upload special data", "Advanced Features"
    ],
    isCurrent: false
  }
];

// --- Glass Card Component ---
// Reusable component for the glassmorphism effect, modified slightly for pricing cards
const GlassCard = ({ children, className = "", isCurrent = false }) => (
  <div 
    className={`flex flex-col rounded-2xl shadow-lg border border-white/20 overflow-hidden ${className} ${isCurrent ? 'bg-blue-50' : 'bg-white/30 backdrop-blur-lg'}`}
  >
    {children}
  </div>
);

// --- Breadcrumbs Component ---
const Breadcrumbs = () => (
  <nav className="flex items-center text-sm text-gray-100 mb-6" aria-label="Breadcrumb">
    <ol className="inline-flex items-center space-x-1 md:space-x-2">
      <li className="inline-flex items-center">
        <a href="#" className="inline-flex items-center text-gray-100 hover:text-white">
          <Home className="w-4 h-4 mr-2" />
          Home
        </a>
      </li>
      <li>
        <div className="flex items-center">
          <ChevronRight className="w-4 h-4" />
          <a href="#" className="ml-1 text-gray-100 hover:text-white md:ml-2">Applications</a>
        </div>
      </li>
      <li aria-current="page">
        <div className="flex items-center">
          <ChevronRight className="w-4 h-4" />
          <span className="ml-1 text-gray-300 md:ml-2">Plans</span>
        </div>
      </li>
    </ol>
  </nav>
);

// --- Toggle Switch Component ---
const BillingToggle = ({ billingCycle, onToggle }) => (
  <div className="flex items-center justify-center space-x-4">
    <span className={`font-semibold ${billingCycle === 'annual' ? 'text-white' : 'text-gray-300'}`}>
      Annual
    </span>
    <button
      onClick={onToggle}
      className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors duration-300 focus:outline-none ${billingCycle === 'monthly' ? 'bg-indigo-600' : 'bg-gray-400'}`}
    >
      <span
        className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-300 ${billingCycle === 'monthly' ? 'translate-x-6' : 'translate-x-1'}`}
      />
    </button>
    <span className={`font-semibold ${billingCycle === 'monthly' ? 'text-white' : 'text-gray-300'}`}>
      Monthly
    </span>
  </div>
);

// --- Pricing Card Component ---
const PricingCard = ({ plan }) => (
  <GlassCard isCurrent={plan.isCurrent}>
    {/* Card Header */}
    <div className={`p-6 ${plan.isCurrent ? 'bg-blue-100' : 'bg-transparent'}`}>
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
          <p className="text-4xl font-bold text-gray-900 mt-2">{plan.price}</p>
          <span className="text-sm text-gray-600">/{plan.period}</span>
        </div>
        {plan.icon}
      </div>
    </div>
    
    {/* Card Body - Features */}
    <div className="p-6 flex-grow">
      <ul className="space-y-2">
        {plan.features.map((feature, index) => (
          <li key={index} className="flex items-center gap-2 text-sm text-gray-700">
            <CheckCircle className={`w-4 h-4 ${plan.isCurrent ? 'text-blue-500' : 'text-green-500'}`} />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
    </div>
    
    {/* Card Footer - Button */}
    <div className="p-6 mt-auto">
      <hr className="border-t border-white/30 mb-6" />
      <button
        className={`w-full py-3 rounded-lg font-semibold shadow-md transition-all duration-300 ${
          plan.isCurrent 
          ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
          : 'bg-white/50 text-gray-800 hover:bg-white/80'
        }`}
      >
        {plan.isCurrent ? 'Current Plan' : 'Upgrade Plan'}
      </button>
    </div>
  </GlassCard>
);

// --- Main App Component ---
export default function Pricing() {
  const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' or 'annual'

  const appStyle = {
    backgroundImage: "linear-gradient(to right top, #ff6b6b, #ffb347, #ffe780, #ffccb3, #ff8c8c)",
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    minHeight: '100vh',
  };

  const plansToShow = billingCycle === 'monthly' ? monthlyPlans : annualPlans;

  return (
    <div style={appStyle} className="font-inter min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <Breadcrumbs />
        
        <div className="flex flex-col items-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-6">Plans</h1>
          <BillingToggle 
            billingCycle={billingCycle} 
            onToggle={() => setBillingCycle(prev => prev === 'monthly' ? 'annual' : 'monthly')} 
          />
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plansToShow.map((plan) => (
            <PricingCard key={plan.name + plan.price} plan={plan} />
          ))}
        </div>

      </div>
      
      {/* Placeholder for the purple button in the corner */}
      <button className="fixed bottom-6 right-6 bg-indigo-600 text-white p-4 rounded-full shadow-lg hover:bg-indigo-700 transition-all">
          <MessageSquare className="w-6 h-6" />
      </button>
    </div>
  );
}